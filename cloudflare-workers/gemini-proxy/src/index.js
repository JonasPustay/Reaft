const DEFAULT_MODEL = "gemini-2.5-flash";

const jsonResponse = (status, payload, corsHeaders) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders,
    },
  });

const getCorsHeaders = (origin) => ({
  "access-control-allow-origin": origin || "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
  "access-control-max-age": "86400",
});

const toFiniteNumberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildPrompt = ({ latitude, longitude }) => `
Tu es un expert en inspection de batiments.
Analyse la photo fournie et les informations du bâtiment et retourne uniquement du JSON valide.

Contexte batiment:
- latitude: ${typeof latitude === "number" ? latitude : "inconnue"}
- longitude: ${typeof longitude === "number" ? longitude : "inconnue"}

Schema JSON attendu:
{
  "has_defect": boolean,
  "damage_state": "A" | "B" | "C" | "D" | "E" | "F" | null,
  "damage_type": "moisissure" | "fissure" | "esthetique" | "infiltration" | "corrosion" | "structurel" | "autre" | null,
  "estimated_repair_cost_eur": number | null,
  "confidence": number,
  "summary": string
}

Regles:
- has_defect = false si aucun defaut visible.
- Si has_defect = false alors damage_state, damage_type et estimated_repair_cost_eur doivent etre null.
- Si has_defect = true, renseigne damage_state, damage_type et estimated_repair_cost_eur.
- estimated_repair_cost_eur doit etre un nombre >= 0 en EUR.
- Le calcul de estimated_repair_cost_eur doit prendre en compte la position geographique (latitude/longitude) pour ne pas avoir le même prix selon le pays/la ville
- confidence entre 0 et 1.
- summary doit etre court (une phrase max).
- N'ajoute aucun texte hors JSON.
`;

const buildGeminiPayload = ({ photoBase64, mimeType, building }) => {
  const latitude = toFiniteNumberOrNull(building?.latitude);
  const longitude = toFiniteNumberOrNull(building?.longitude);
  const prompt = buildPrompt({ latitude, longitude });

  return {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type:
                typeof mimeType === "string" && mimeType.trim().length > 0
                  ? mimeType.trim()
                  : "image/jpeg",
              data: photoBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
    },
  };
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method !== "POST") {
      return jsonResponse(
        405,
        { error: "method_not_allowed", message: "Use POST /analyze." },
        corsHeaders,
      );
    }

    if (url.pathname !== "/analyze") {
      return jsonResponse(
        404,
        { error: "not_found", message: "Endpoint not found." },
        corsHeaders,
      );
    }

    if (!env.GEMINI_API_KEY) {
      return jsonResponse(
        500,
        {
          error: "missing_server_secret",
          message: "GEMINI_API_KEY secret is missing in Worker environment.",
        },
        corsHeaders,
      );
    }

    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return jsonResponse(
        400,
        { error: "invalid_json", message: "Request body must be valid JSON." },
        corsHeaders,
      );
    }

    const photoBase64 =
      typeof requestBody?.photoBase64 === "string"
        ? requestBody.photoBase64.trim()
        : "";
    if (!photoBase64) {
      return jsonResponse(
        400,
        {
          error: "invalid_payload",
          message: "The `photoBase64` field is required.",
        },
        corsHeaders,
      );
    }

    const model = `${env.DEFAULT_GEMINI_MODEL || DEFAULT_MODEL}`.trim() || DEFAULT_MODEL;
    const upstreamBody = buildGeminiPayload({
      photoBase64,
      mimeType: requestBody?.mimeType,
      building: requestBody?.building,
    });
    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent` +
      `?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

    const upstreamResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(upstreamBody),
    });

    const responseText = await upstreamResponse.text();
    return new Response(responseText, {
      status: upstreamResponse.status,
      headers: {
        "content-type":
          upstreamResponse.headers.get("content-type") ||
          "application/json; charset=utf-8",
        ...corsHeaders,
      },
    });
  },
};
