import { GEMINI_PROXY_URL } from "@env";

export const GEMINI_MODEL_NAME = "gemini-2.5-flash";

const resolveGeminiProxyEndpoint = (rawValue) => {
  if (typeof rawValue !== "string") return "";
  const trimmed = rawValue.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    if (url.pathname === "" || url.pathname === "/") {
      url.pathname = "/analyze";
    } else if (url.pathname === "/analyze/") {
      url.pathname = "/analyze";
    }
    return url.toString();
  } catch {
    return trimmed;
  }
};

const GEMINI_PROXY_ENDPOINT = resolveGeminiProxyEndpoint(GEMINI_PROXY_URL);
const MODEL_PAID_PRICING_USD_PER_MILLION = {
  "gemini-2.5-flash-lite": {
    inputTextImageVideo: 0.1,
    output: 0.4,
  },
  "gemini-2.5-flash": {
    inputTextImageVideo: 0.3,
    inputAudio: 1.0,
    output: 2.5,
  },
  "gemini-3.1-flash-lite-preview": {
    inputTextImageVideo: 0.25,
    output: 1.5,
  },
};
const DAMAGE_STATES = ["A", "B", "C", "D", "E", "F"];
const DAMAGE_TYPES = new Set([
  "moisissure",
  "fissure",
  "esthetique",
  "infiltration",
  "corrosion",
  "structurel",
  "autre",
]);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeDamageState = (value) => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  if (DAMAGE_STATES.includes(normalized)) return normalized;
  const letterMatch = normalized.match(/\b[A-F]\b/);
  return letterMatch ? letterMatch[0] : null;
};

const normalizeDamageType = (value) => {
  if (typeof value !== "string") return null;
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return DAMAGE_TYPES.has(normalized) ? normalized : null;
};

const normalizeBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return false;
};

const normalizeRepairCost = (value) => {
  const parsed =
    typeof value === "string"
      ? Number.parseFloat(value.replace(/,/g, ""))
      : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed);
};

const normalizeConfidence = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0.5;
  if (parsed > 1 && parsed <= 100) {
    return Number((parsed / 100).toFixed(2));
  }
  return Number(clamp(parsed, 0, 1).toFixed(2));
};

const extractJsonFromText = (text) => {
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("empty_model_response");
  }

  const withoutFences = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const jsonBlockMatch = withoutFences.match(/\{[\s\S]*\}/);
  const jsonPayload = jsonBlockMatch?.[0] ?? withoutFences;
  return JSON.parse(jsonPayload);
};

const extractTextFromGeminiResponse = (payload) => {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    return "";
  }
  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("");
};

const toNonNegativeInteger = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed);
};

const resolveModelPaidPricing = (modelName) =>
  MODEL_PAID_PRICING_USD_PER_MILLION[modelName] ?? null;

const extractUsageMetrics = (payload, modelName) => {
  const usage = payload?.usageMetadata ?? {};
  const inputTokens = toNonNegativeInteger(usage?.promptTokenCount);
  const outputTokens = toNonNegativeInteger(usage?.candidatesTokenCount);
  const totalTokens = toNonNegativeInteger(usage?.totalTokenCount);
  const thoughtsTokens = toNonNegativeInteger(usage?.thoughtsTokenCount) ?? 0;
  const paidPricing = resolveModelPaidPricing(modelName);

  const inputCostUsd =
    inputTokens === null || !paidPricing
      ? null
      : (inputTokens / 1_000_000) * paidPricing.inputTextImageVideo;
  const outputCostUsd =
    outputTokens === null || !paidPricing
      ? null
      : (outputTokens / 1_000_000) * paidPricing.output;

  const estimatedTotalCostUsd =
    inputCostUsd === null || outputCostUsd === null
      ? null
      : inputCostUsd + outputCostUsd;

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    thoughtsTokens,
    inputCostUsd,
    outputCostUsd,
    estimatedTotalCostUsd,
    paidPricing,
  };
};

const logUsageMetrics = (usageMetrics) => {
  const formatUsd = (value) => (value === null ? "n/a" : value.toFixed(8));

  console.log(
    `[Gemini Usage] model=${GEMINI_MODEL_NAME} inputTokens=${usageMetrics.inputTokens ?? "n/a"} outputTokens=${usageMetrics.outputTokens ?? "n/a"} totalTokens=${usageMetrics.totalTokens ?? "n/a"} thoughtsTokens=${usageMetrics.thoughtsTokens ?? "n/a"} inputRatePerMTokUsd=${usageMetrics.paidPricing?.inputTextImageVideo ?? "n/a"} outputRatePerMTokUsd=${usageMetrics.paidPricing?.output ?? "n/a"} inputCostUsd=${formatUsd(usageMetrics.inputCostUsd)} outputCostUsd=${formatUsd(usageMetrics.outputCostUsd)} estimatedTotalCostUsd=${formatUsd(usageMetrics.estimatedTotalCostUsd)} tier=paid_estimate`,
  );
};

const logModelOutput = ({ modelText, parsedJson }) => {
  const rawOutput = typeof modelText === "string" ? modelText.trim() : "";
  const parsedOutput = (() => {
    try {
      return JSON.stringify(parsedJson);
    } catch {
      return "unserializable_json";
    }
  })();

  console.log(`[Gemini Output Raw] ${rawOutput}`);
  console.log(`[Gemini Output JSON] ${parsedOutput}`);
};

const normalizeAnalysis = (raw) => {
  const hasDefect = normalizeBoolean(raw?.has_defect ?? raw?.hasDefect);
  const confidence = normalizeConfidence(raw?.confidence);
  const summary =
    typeof raw?.summary === "string" ? raw.summary.trim().slice(0, 220) : "";

  if (!hasDefect) {
    return {
      hasDefect: false,
      damageState: null,
      damageType: null,
      estimatedRepairCostEur: null,
      confidence,
      summary,
    };
  }

  const damageState = normalizeDamageState(
    raw?.damage_state ?? raw?.damageState,
  );
  const damageType = normalizeDamageType(raw?.damage_type ?? raw?.damageType);
  const estimatedRepairCostEur = normalizeRepairCost(
    raw?.estimated_repair_cost_eur ?? raw?.estimatedRepairCostEur,
  );

  if (!damageState || !damageType || estimatedRepairCostEur === null) {
    throw new Error("invalid_analysis_payload");
  }

  return {
    hasDefect: true,
    damageState,
    damageType,
    estimatedRepairCostEur,
    confidence,
    summary,
  };
};

export async function analyzeDefectPhotoWithGemini({
  photoBase64,
  mimeType,
  building,
}) {
  if (!GEMINI_PROXY_ENDPOINT) {
    throw new Error("missing_ai_proxy_url");
  }
  if (!photoBase64) {
    throw new Error("missing_photo_base64");
  }

  const response = await fetch(GEMINI_PROXY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      photoBase64,
      mimeType: mimeType || "image/jpeg",
      building: {
        latitude: building?.latitude,
        longitude: building?.longitude,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`gemini_http_${response.status}:${errorText}`);
  }

  const payload = await response.json();
  const usageMetrics = extractUsageMetrics(payload, GEMINI_MODEL_NAME);
  logUsageMetrics(usageMetrics);

  const modelText = extractTextFromGeminiResponse(payload);
  const parsedJson = extractJsonFromText(modelText);
  logModelOutput({ modelText, parsedJson });
  const analysis = normalizeAnalysis(parsedJson);

  return {
    ...analysis,
    model: GEMINI_MODEL_NAME,
    usage: usageMetrics,
  };
}
