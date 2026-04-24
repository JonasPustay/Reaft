import {
  STORAGE_KEY,
  CONDITION_COLORS,
  ICON_OPTIONS,
} from "../../src/constants/buildings";

describe("STORAGE_KEY", () => {
  it("has the expected value", () => {
    expect(STORAGE_KEY).toBe("@reaft/buildings");
  });
});

describe("CONDITION_COLORS", () => {
  const EXPECTED_STATES = ["A", "B", "C", "D", "E", "F", "DEFAULT"];

  it("contains all condition states", () => {
    EXPECTED_STATES.forEach((state) => {
      expect(CONDITION_COLORS).toHaveProperty(state);
    });
  });

  it("each state has bg and color properties", () => {
    EXPECTED_STATES.forEach((state) => {
      expect(CONDITION_COLORS[state]).toMatchObject({
        bg: expect.any(String),
        color: expect.any(String),
      });
    });
  });

  it("each color value is a valid hex color", () => {
    const hexColorRegex = /^#[0-9a-fA-F]{3,8}$/;
    EXPECTED_STATES.forEach((state) => {
      expect(CONDITION_COLORS[state].bg).toMatch(hexColorRegex);
      expect(CONDITION_COLORS[state].color).toMatch(hexColorRegex);
    });
  });

  it("condition A (best) has a blue palette", () => {
    expect(CONDITION_COLORS.A.color).toBe("#0369a1");
  });

  it("condition F (worst) has a dark red palette", () => {
    expect(CONDITION_COLORS.F.color).toBe("#991b1b");
  });

  it("DEFAULT state exists as a fallback", () => {
    expect(CONDITION_COLORS.DEFAULT).toBeDefined();
  });

  it("states A through F have distinct bg colors", () => {
    const bgColors = ["A", "B", "C", "D", "E", "F"].map(
      (s) => CONDITION_COLORS[s].bg
    );
    const unique = new Set(bgColors);
    expect(unique.size).toBe(6);
  });
});

describe("ICON_OPTIONS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(ICON_OPTIONS)).toBe(true);
    expect(ICON_OPTIONS.length).toBeGreaterThan(0);
  });

  it("each option has labelKey, icon, and family properties", () => {
    ICON_OPTIONS.forEach((option) => {
      expect(option).toMatchObject({
        labelKey: expect.any(String),
        icon: expect.any(String),
        family: expect.any(String),
      });
    });
  });

  it("labelKeys are prefixed with iconOptions.", () => {
    ICON_OPTIONS.forEach((option) => {
      expect(option.labelKey).toMatch(/^iconOptions\./);
    });
  });

  it("contains expected building types", () => {
    const icons = ICON_OPTIONS.map((o) => o.icon);
    expect(icons).toContain("business");
    expect(icons).toContain("home");
    expect(icons).toContain("school");
  });

  it("icon families are valid icon set names", () => {
    const validFamilies = ["ionicons", "material-community", "material"];
    ICON_OPTIONS.forEach((option) => {
      expect(validFamilies).toContain(option.family);
    });
  });
});
