import { analyzeDefectPhotoWithGemini } from "../../src/services/defectAiService";

// ─── Helpers ────────────────────────────────────────────────────────────────

const PHOTO = "base64encodedphoto==";
const BUILDING = { latitude: 45.75, longitude: 4.83 };

/**
 * Wrap a JSON payload as a Gemini API response shape.
 */
const makeGeminiPayload = (analysisJson, usageMeta = {}) => ({
  candidates: [
    {
      content: {
        parts: [{ text: JSON.stringify(analysisJson) }],
      },
    },
  ],
  usageMetadata: {
    promptTokenCount: 100,
    candidatesTokenCount: 50,
    totalTokenCount: 150,
    thoughtsTokenCount: 0,
    ...usageMeta,
  },
});

const makeGeminiPayloadWithText = (text, usageMeta = {}) => ({
  candidates: [{ content: { parts: [{ text }] } }],
  usageMetadata: {
    promptTokenCount: 10,
    candidatesTokenCount: 5,
    totalTokenCount: 15,
    ...usageMeta,
  },
});

const mockFetchOk = (payload) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(payload),
    text: () => Promise.resolve(JSON.stringify(payload)),
  });
};

const mockFetchError = (status, body = "Internal Server Error") => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status,
    text: () => Promise.resolve(body),
  });
};

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── Missing inputs ──────────────────────────────────────────────────────────

describe("analyzeDefectPhotoWithGemini – input validation", () => {
  it("throws missing_photo_base64 when photoBase64 is absent", async () => {
    await expect(
      analyzeDefectPhotoWithGemini({
        photoBase64: null,
        mimeType: "image/jpeg",
        building: BUILDING,
      })
    ).rejects.toThrow("missing_photo_base64");
  });

  it("throws missing_photo_base64 when photoBase64 is empty string", async () => {
    await expect(
      analyzeDefectPhotoWithGemini({
        photoBase64: "",
        mimeType: "image/jpeg",
        building: BUILDING,
      })
    ).rejects.toThrow("missing_photo_base64");
  });
});

// ─── HTTP errors ─────────────────────────────────────────────────────────────

describe("analyzeDefectPhotoWithGemini – HTTP errors", () => {
  it("throws gemini_http_500 on server error", async () => {
    mockFetchError(500, "Internal Server Error");
    await expect(
      analyzeDefectPhotoWithGemini({ photoBase64: PHOTO, building: BUILDING })
    ).rejects.toThrow("gemini_http_500");
  });

  it("throws gemini_http_401 on unauthorized", async () => {
    mockFetchError(401, "Unauthorized");
    await expect(
      analyzeDefectPhotoWithGemini({ photoBase64: PHOTO, building: BUILDING })
    ).rejects.toThrow("gemini_http_401");
  });

  it("throws gemini_http_429 on rate limit", async () => {
    mockFetchError(429, "Rate limit exceeded");
    await expect(
      analyzeDefectPhotoWithGemini({ photoBase64: PHOTO, building: BUILDING })
    ).rejects.toThrow("gemini_http_429");
  });
});

// ─── No defect ───────────────────────────────────────────────────────────────

describe("analyzeDefectPhotoWithGemini – no defect detected", () => {
  it("returns hasDefect=false with null damage fields", async () => {
    mockFetchOk(
      makeGeminiPayload({
        has_defect: false,
        confidence: 0.95,
        summary: "No visible damage",
      })
    );

    const result = await analyzeDefectPhotoWithGemini({
      photoBase64: PHOTO,
      building: BUILDING,
    });

    expect(result.hasDefect).toBe(false);
    expect(result.damageState).toBeNull();
    expect(result.damageType).toBeNull();
    expect(result.estimatedRepairCostEur).toBeNull();
    expect(result.confidence).toBe(0.95);
    expect(result.summary).toBe("No visible damage");
  });

  it('handles has_defect as string "false"', async () => {
    mockFetchOk(
      makeGeminiPayload({ has_defect: "false", confidence: 0.9, summary: "" })
    );
    const result = await analyzeDefectPhotoWithGemini({
      photoBase64: PHOTO,
      building: BUILDING,
    });
    expect(result.hasDefect).toBe(false);
  });

  it("handles has_defect as number 0", async () => {
    mockFetchOk(
      makeGeminiPayload({ has_defect: 0, confidence: 0.8, summary: "" })
    );
    const result = await analyzeDefectPhotoWithGemini({
      photoBase64: PHOTO,
      building: BUILDING,
    });
    expect(result.hasDefect).toBe(false);
  });
});

// ─── Defect detected ─────────────────────────────────────────────────────────

describe("analyzeDefectPhotoWithGemini – defect detected", () => {
  it("returns full analysis on valid payload", async () => {
    mockFetchOk(
      makeGeminiPayload({
        has_defect: true,
        damage_state: "C",
        damage_type: "fissure",
        estimated_repair_cost_eur: 500,
        confidence: 0.87,
        summary: "Fissure longitudinale visible sur le mur est.",
      })
    );

    const result = await analyzeDefectPhotoWithGemini({
      photoBase64: PHOTO,
      mimeType: "image/jpeg",
      building: BUILDING,
    });

    expect(result.hasDefect).toBe(true);
    expect(result.damageState).toBe("C");
    expect(result.damageType).toBe("fissure");
    expect(result.estimatedRepairCostEur).toBe(500);
    expect(result.confidence).toBe(0.87);
    expect(result.summary).toBe(
      "Fissure longitudinale visible sur le mur est."
    );
    expect(result.model).toBeDefined();
    expect(result.usage).toBeDefined();
  });

  it("normalizes lowercase damage_state to uppercase", async () => {
    mockFetchOk(
      makeGeminiPayload({
        has_defect: true,
        damage_state: "d",
        damage_type: "corrosion",
        estimated_repair_cost_eur: 1200,
        confidence: 0.7,
        summary: "",
      })
    );
    const result = await analyzeDefectPhotoWithGemini({
      photoBase64: PHOTO,
      building: BUILDING,
    });
    expect(result.damageState).toBe("D");
  });

  it("extracts letter from verbose damage_state string", async () => {
    mockFetchOk(
      makeGeminiPayload({
        has_defect: true,
        damage_state: "State B - minor damage",
        damage_type: "esthetique",
        estimated_repair_cost_eur: 200,
        confidence: 0.6,
        summary: "",
      })
    );
    const result = await analyzeDefectPhotoWithGemini({
      photoBase64: PHOTO,
      building: BUILDING,
    });
    expect(result.damageState).toBe("B");
  });

  it("normalizes repair cost from comma-separated string", async () => {
    mockFetchOk(
      makeGeminiPayload({
        has_defect: true,
        damage_state: "E",
        damage_type: "infiltration",
        estimated_repair_cost_eur: "1,500",
        confidence: 0.9,
        summary: "",
      })
    );
    const result = await analyzeDefectPhotoWithGemini({
      photoBase64: PHOTO,
      building: BUILDING,
    });
    expect(result.estimatedRepairCostEur).toBe(1500);
  });

  it("normalizes confidence from percentage (0-100) to (0-1)", async () => {
    mockFetchOk(
      makeGeminiPayload({
        has_defect: true,
        damage_state: "A",
        damage_type: "moisissure",
        estimated_repair_cost_eur: 300,
        confidence: 85,
        summary: "",
      })
    );
    const result = await analyzeDefectPhotoWithGemini({
      photoBase64: PHOTO,
      building: BUILDING,
    });
    expect(result.confidence).toBe(0.85);
  });

  it('handles has_defect as string "true"', async () => {
    mockFetchOk(
      makeGeminiPayload({
        has_defect: "true",
        damage_state: "F",
        damage_type: "structurel",
        estimated_repair_cost_eur: 10000,
        confidence: 0.99,
        summary: "Structural failure.",
      })
    );
    const result = await analyzeDefectPhotoWithGemini({
      photoBase64: PHOTO,
      building: BUILDING,
    });
    expect(result.hasDefect).toBe(true);
    expect(result.damageState).toBe("F");
  });

  it("handles camelCase field names (damageState, damageType, etc.)", async () => {
    mockFetchOk(
      makeGeminiPayload({
        hasDefect: true,
        damageState: "B",
        damageType: "autre",
        estimatedRepairCostEur: 750,
        confidence: 0.72,
        summary: "Misc damage.",
      })
    );
    const result = await analyzeDefectPhotoWithGemini({
      photoBase64: PHOTO,
      building: BUILDING,
    });
    expect(result.damageState).toBe("B");
    expect(result.damageType).toBe("autre");
    expect(result.estimatedRepairCostEur).toBe(750);
  });

  it("rounds float repair costs to integer", async () => {
    mockFetchOk(
      makeGeminiPayload({
        has_defect: true,
        damage_state: "C",
        damage_type: "fissure",
        estimated_repair_cost_eur: 499.7,
        confidence: 0.8,
        summary: "",
      })
    );
    const result = await analyzeDefectPhotoWithGemini({
      photoBase64: PHOTO,
      building: BUILDING,
    });
    expect(result.estimatedRepairCostEur).toBe(500);
  });

  it("truncates summary to 220 characters", async () => {
    const longSummary = "A".repeat(300);
    mockFetchOk(
      makeGeminiPayload({
        has_defect: false,
        confidence: 0.5,
        summary: longSummary,
      })
    );
    const result = await analyzeDefectPhotoWithGemini({
      photoBase64: PHOTO,
      building: BUILDING,
    });
    expect(result.summary.length).toBe(220);
  });
});

// ─── Invalid analysis payloads ───────────────────────────────────────────────

describe("analyzeDefectPhotoWithGemini – invalid analysis payload", () => {
  it("throws invalid_analysis_payload when damage_state is missing", async () => {
    mockFetchOk(
      makeGeminiPayload({
        has_defect: true,
        damage_type: "fissure",
        estimated_repair_cost_eur: 500,
        confidence: 0.8,
        summary: "",
      })
    );
    await expect(
      analyzeDefectPhotoWithGemini({ photoBase64: PHOTO, building: BUILDING })
    ).rejects.toThrow("invalid_analysis_payload");
  });

  it("throws invalid_analysis_payload when damage_type is unknown", async () => {
    mockFetchOk(
      makeGeminiPayload({
        has_defect: true,
        damage_state: "C",
        damage_type: "unknown_type",
        estimated_repair_cost_eur: 500,
        confidence: 0.8,
        summary: "",
      })
    );
    await expect(
      analyzeDefectPhotoWithGemini({ photoBase64: PHOTO, building: BUILDING })
    ).rejects.toThrow("invalid_analysis_payload");
  });

  it("throws invalid_analysis_payload when repair cost is negative", async () => {
    mockFetchOk(
      makeGeminiPayload({
        has_defect: true,
        damage_state: "D",
        damage_type: "corrosion",
        estimated_repair_cost_eur: -100,
        confidence: 0.8,
        summary: "",
      })
    );
    await expect(
      analyzeDefectPhotoWithGemini({ photoBase64: PHOTO, building: BUILDING })
    ).rejects.toThrow("invalid_analysis_payload");
  });

  it("throws invalid_analysis_payload when damage_state letter is out of A-F range", async () => {
    mockFetchOk(
      makeGeminiPayload({
        has_defect: true,
        damage_state: "G",
        damage_type: "fissure",
        estimated_repair_cost_eur: 500,
        confidence: 0.8,
        summary: "",
      })
    );
    await expect(
      analyzeDefectPhotoWithGemini({ photoBase64: PHOTO, building: BUILDING })
    ).rejects.toThrow("invalid_analysis_payload");
  });
});

// ─── JSON extraction from model text ─────────────────────────────────────────

describe("analyzeDefectPhotoWithGemini – JSON extraction", () => {
  it("extracts JSON wrapped in ```json markdown fence", async () => {
    const json = {
      has_defect: false,
      confidence: 0.9,
      summary: "Clean building",
    };
    const fencedText = "```json\n" + JSON.stringify(json) + "\n```";
    mockFetchOk(makeGeminiPayloadWithText(fencedText));

    const result = await analyzeDefectPhotoWithGemini({
      photoBase64: PHOTO,
      building: BUILDING,
    });
    expect(result.hasDefect).toBe(false);
    expect(result.confidence).toBe(0.9);
  });

  it("extracts JSON wrapped in plain ``` fence", async () => {
    const json = {
      has_defect: false,
      confidence: 0.75,
      summary: "",
    };
    const fencedText = "```\n" + JSON.stringify(json) + "\n```";
    mockFetchOk(makeGeminiPayloadWithText(fencedText));

    const result = await analyzeDefectPhotoWithGemini({
      photoBase64: PHOTO,
      building: BUILDING,
    });
    expect(result.hasDefect).toBe(false);
  });

  it("throws empty_model_response when model returns empty text", async () => {
    mockFetchOk(makeGeminiPayloadWithText(""));
    await expect(
      analyzeDefectPhotoWithGemini({ photoBase64: PHOTO, building: BUILDING })
    ).rejects.toThrow("empty_model_response");
  });

  it("throws SyntaxError when model returns unparseable text", async () => {
    mockFetchOk(makeGeminiPayloadWithText("not valid json at all"));
    await expect(
      analyzeDefectPhotoWithGemini({ photoBase64: PHOTO, building: BUILDING })
    ).rejects.toThrow();
  });
});

// ─── Usage metrics ───────────────────────────────────────────────────────────

describe("analyzeDefectPhotoWithGemini – usage metrics", () => {
  it("returns token counts in usage object", async () => {
    mockFetchOk(
      makeGeminiPayload(
        { has_defect: false, confidence: 0.9, summary: "" },
        {
          promptTokenCount: 200,
          candidatesTokenCount: 80,
          totalTokenCount: 280,
        }
      )
    );
    const result = await analyzeDefectPhotoWithGemini({
      photoBase64: PHOTO,
      building: BUILDING,
    });
    expect(result.usage.inputTokens).toBe(200);
    expect(result.usage.outputTokens).toBe(80);
    expect(result.usage.totalTokens).toBe(280);
  });

  it("returns estimated cost for gemini-2.5-flash", async () => {
    mockFetchOk(
      makeGeminiPayload(
        { has_defect: false, confidence: 0.9, summary: "" },
        { promptTokenCount: 1000000, candidatesTokenCount: 1000000 }
      )
    );
    const result = await analyzeDefectPhotoWithGemini({
      photoBase64: PHOTO,
      building: BUILDING,
    });
    // 1M input tokens at $0.3/M → $0.3 ; 1M output tokens at $2.5/M → $2.5
    expect(result.usage.inputCostUsd).toBeCloseTo(0.3, 5);
    expect(result.usage.outputCostUsd).toBeCloseTo(2.5, 5);
    expect(result.usage.estimatedTotalCostUsd).toBeCloseTo(2.8, 5);
  });

  it("returns null costs when usage metadata is missing", async () => {
    const payload = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  has_defect: false,
                  confidence: 0.5,
                  summary: "",
                }),
              },
            ],
          },
        },
      ],
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
      text: () => Promise.resolve(JSON.stringify(payload)),
    });

    const result = await analyzeDefectPhotoWithGemini({
      photoBase64: PHOTO,
      building: BUILDING,
    });
    expect(result.usage.inputCostUsd).toBeNull();
    expect(result.usage.outputCostUsd).toBeNull();
    expect(result.usage.estimatedTotalCostUsd).toBeNull();
  });
});

// ─── Fetch call shape ────────────────────────────────────────────────────────

describe("analyzeDefectPhotoWithGemini – fetch call", () => {
  it("sends a POST request with JSON body", async () => {
    mockFetchOk(
      makeGeminiPayload({ has_defect: false, confidence: 0.9, summary: "" })
    );
    await analyzeDefectPhotoWithGemini({
      photoBase64: PHOTO,
      mimeType: "image/png",
      building: BUILDING,
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain("/analyze");
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(options.body);
    expect(body.photoBase64).toBe(PHOTO);
    expect(body.mimeType).toBe("image/png");
    expect(body.building.latitude).toBe(BUILDING.latitude);
    expect(body.building.longitude).toBe(BUILDING.longitude);
  });

  it("defaults to image/jpeg mimeType when not provided", async () => {
    mockFetchOk(
      makeGeminiPayload({ has_defect: false, confidence: 0.5, summary: "" })
    );
    await analyzeDefectPhotoWithGemini({ photoBase64: PHOTO, building: BUILDING });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.mimeType).toBe("image/jpeg");
  });
});
