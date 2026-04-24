/**
 * RevenueCat service tests.
 *
 * Because `isIos` is evaluated at module load time (const isIos = Platform.OS === "ios"),
 * each describe block that needs a specific platform uses jest.resetModules() +
 * jest.doMock() to force a fresh module load with the right Platform.OS value.
 */

const MOCK_PURCHASES = {
  setLogLevel: jest.fn(),
  configure: jest.fn(),
  getOfferings: jest
    .fn()
    .mockResolvedValue({ current: { availablePackages: [] } }),
  getCustomerInfo: jest
    .fn()
    .mockResolvedValue({ entitlements: { active: {} } }),
  purchasePackage: jest.fn().mockResolvedValue({ customerInfo: {} }),
  restorePurchases: jest.fn().mockResolvedValue({ customerInfo: {} }),
  logIn: jest.fn().mockResolvedValue({ customerInfo: {} }),
  logOut: jest.fn().mockResolvedValue({ customerInfo: {} }),
};

// ─── Non-iOS (Android) ───────────────────────────────────────────────────────

describe("RevenueCat on Android", () => {
  let RevenueCat;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock("react-native", () => ({ Platform: { OS: "android" } }));
    jest.doMock("react-native-purchases", () => ({
      __esModule: true,
      default: MOCK_PURCHASES,
      LOG_LEVEL: { DEBUG: 0, INFO: 1 },
    }));
    RevenueCat = require("../../src/services/RevenueCat").default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("configure returns unsupported_platform", () => {
    const result = RevenueCat.configure();
    expect(result).toEqual({
      configured: false,
      reason: "unsupported_platform",
    });
  });

  it("getOfferings returns null", async () => {
    expect(await RevenueCat.getOfferings()).toBeNull();
  });

  it("getCustomerInfo returns null", async () => {
    expect(await RevenueCat.getCustomerInfo()).toBeNull();
  });

  it("purchasePackage returns null", async () => {
    expect(await RevenueCat.purchasePackage({})).toBeNull();
  });

  it("restore returns null", async () => {
    expect(await RevenueCat.restore()).toBeNull();
  });

  it("logIn returns null", async () => {
    expect(await RevenueCat.logIn("user123")).toBeNull();
  });

  it("logOut returns null", async () => {
    expect(await RevenueCat.logOut()).toBeNull();
  });

  it("does not call Purchases.configure", () => {
    RevenueCat.configure({ userId: "u1" });
    expect(MOCK_PURCHASES.configure).not.toHaveBeenCalled();
  });
});

// ─── iOS – configure ─────────────────────────────────────────────────────────

describe("RevenueCat on iOS – configure()", () => {
  let RevenueCat;
  const Purchases = { ...MOCK_PURCHASES };

  beforeEach(() => {
    jest.resetModules();
    jest.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    jest.doMock("react-native-purchases", () => ({
      __esModule: true,
      default: Purchases,
      LOG_LEVEL: { DEBUG: 0 },
    }));
    // Reset mock call history
    Object.values(Purchases).forEach((fn) => {
      if (typeof fn.mockClear === "function") fn.mockClear();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns { configured: true } on successful init", () => {
    RevenueCat = require("../../src/services/RevenueCat").default;
    const result = RevenueCat.configure({ userId: "user-42", debug: false });
    expect(result).toEqual({ configured: true });
    expect(Purchases.configure).toHaveBeenCalledWith({
      apiKey: "test-revenuecat-key-ios",
      appUserID: "user-42",
    });
  });

  it("returns alreadyConfigured:true when called twice", () => {
    RevenueCat = require("../../src/services/RevenueCat").default;
    RevenueCat.configure({ debug: false });
    const second = RevenueCat.configure({ debug: false });
    expect(second).toEqual({ configured: true, alreadyConfigured: true });
    expect(Purchases.configure).toHaveBeenCalledTimes(1);
  });

  it("sets debug log level when debug=true", () => {
    RevenueCat = require("../../src/services/RevenueCat").default;
    RevenueCat.configure({ debug: true });
    expect(Purchases.setLogLevel).toHaveBeenCalledWith(0);
  });

  it("does not set log level when debug=false", () => {
    RevenueCat = require("../../src/services/RevenueCat").default;
    RevenueCat.configure({ debug: false });
    expect(Purchases.setLogLevel).not.toHaveBeenCalled();
  });

  it("passes undefined as appUserID when userId is not provided", () => {
    RevenueCat = require("../../src/services/RevenueCat").default;
    RevenueCat.configure({ debug: false });
    expect(Purchases.configure).toHaveBeenCalledWith(
      expect.objectContaining({ appUserID: undefined }),
    );
  });
});

// ─── iOS – missing API key ───────────────────────────────────────────────────

describe("RevenueCat on iOS – missing API key", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    jest.doMock("react-native-purchases", () => ({
      __esModule: true,
      default: MOCK_PURCHASES,
      LOG_LEVEL: { DEBUG: 0 },
    }));
    jest.doMock("@env", () => ({
      GEMINI_PROXY_URL: "https://proxy.example.com",
      REVENUECAT_API_KEY_IOS: "",
    }));
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it("returns missing_api_key reason", () => {
    const RevenueCat = require("../../src/services/RevenueCat").default;
    const result = RevenueCat.configure({ debug: false });
    expect(result).toEqual({ configured: false, reason: "missing_api_key" });
  });

  it("logs a console warning about the missing key", () => {
    const RevenueCat = require("../../src/services/RevenueCat").default;
    RevenueCat.configure({ debug: false });
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("REVENUECAT_API_KEY_IOS"),
    );
  });
});

// ─── iOS – async operations ──────────────────────────────────────────────────

describe("RevenueCat on iOS – async operations", () => {
  let RevenueCat;
  const Purchases = { ...MOCK_PURCHASES };

  beforeEach(() => {
    jest.resetModules();
    jest.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    jest.doMock("react-native-purchases", () => ({
      __esModule: true,
      default: Purchases,
      LOG_LEVEL: { DEBUG: 0 },
    }));
    Object.values(Purchases).forEach((fn) => {
      if (typeof fn.mockClear === "function") fn.mockClear();
    });
    RevenueCat = require("../../src/services/RevenueCat").default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("getOfferings delegates to Purchases.getOfferings", async () => {
    await RevenueCat.getOfferings();
    expect(Purchases.getOfferings).toHaveBeenCalledTimes(1);
  });

  it("getCustomerInfo delegates to Purchases.getCustomerInfo", async () => {
    await RevenueCat.getCustomerInfo();
    expect(Purchases.getCustomerInfo).toHaveBeenCalledTimes(1);
  });

  it("purchasePackage delegates to Purchases.purchasePackage with the package", async () => {
    const mockPackage = { identifier: "monthly" };
    await RevenueCat.purchasePackage(mockPackage);
    expect(Purchases.purchasePackage).toHaveBeenCalledWith(mockPackage);
  });

  it("restore delegates to Purchases.restorePurchases", async () => {
    await RevenueCat.restore();
    expect(Purchases.restorePurchases).toHaveBeenCalledTimes(1);
  });

  it("logIn delegates to Purchases.logIn with userId", async () => {
    await RevenueCat.logIn("user-99");
    expect(Purchases.logIn).toHaveBeenCalledWith("user-99");
  });

  it("logOut delegates to Purchases.logOut", async () => {
    await RevenueCat.logOut();
    expect(Purchases.logOut).toHaveBeenCalledTimes(1);
  });
});
