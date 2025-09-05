import { describe, it, expect } from "vitest";
import {
  createInputClasses,
  createSearchInputClasses,
  createSelectClasses,
  createCardClasses,
  createAlertClasses,
  createBadgeClasses,
  createLoadingSpinnerClasses,
  loadingSpinnerClasses,
  inputStyles,
  cardStyles,
  alertStyles,
  badgeStyles,
  textStyles,
} from "../styleUtils";

describe("styleUtils", () => {
  describe("loadingSpinnerClasses", () => {
    it("should have all size variants", () => {
      expect(loadingSpinnerClasses.sm).toContain("animate-spin");
      expect(loadingSpinnerClasses.sm).toContain("h-4 w-4");

      expect(loadingSpinnerClasses.md).toContain("animate-spin");
      expect(loadingSpinnerClasses.md).toContain("h-5 w-5");

      expect(loadingSpinnerClasses.lg).toContain("animate-spin");
      expect(loadingSpinnerClasses.lg).toContain("h-6 w-6");

      expect(loadingSpinnerClasses.xl).toContain("animate-spin");
      expect(loadingSpinnerClasses.xl).toContain("h-8 w-8");
    });
  });

  describe("inputStyles", () => {
    it("should have all required input style variants", () => {
      expect(inputStyles.base).toContain("w-full");
      expect(inputStyles.base).toContain("border");
      expect(inputStyles.base).toContain("rounded-lg");
      expect(inputStyles.base).toContain("focus:ring-2");
      expect(inputStyles.base).toContain("focus:ring-ctp-blue");

      expect(inputStyles.search).toContain("pl-9");
      expect(inputStyles.select).toContain("px-3");
      expect(inputStyles.error).toContain("border-ctp-red");
      expect(inputStyles.normal).toContain("border-ctp-surface1");
    });
  });

  describe("createInputClasses", () => {
    it("should create input classes without error", () => {
      const classes = createInputClasses(false);
      expect(classes).toContain("w-full");
      expect(classes).toContain("border-ctp-surface1");
      expect(classes).not.toContain("border-ctp-red");
    });

    it("should create input classes with error", () => {
      const classes = createInputClasses(true);
      expect(classes).toContain("w-full");
      expect(classes).toContain("border-ctp-red");
      expect(classes).not.toContain("border-ctp-surface1");
    });

    it("should include additional custom classes", () => {
      const classes = createInputClasses(false, "custom-class");
      expect(classes).toContain("custom-class");
    });
  });

  describe("createSearchInputClasses", () => {
    it("should create search input classes", () => {
      const classes = createSearchInputClasses();
      expect(classes).toContain("pl-9");
      expect(classes).toContain("pr-4");
      expect(classes).toContain("py-2");
    });

    it("should create search input classes with error state", () => {
      const classes = createSearchInputClasses(true);
      expect(classes).toContain("border-ctp-red");
    });
  });

  describe("createSelectClasses", () => {
    it("should create select classes", () => {
      const classes = createSelectClasses();
      expect(classes).toContain("px-3");
      expect(classes).toContain("py-2");
      expect(classes).toContain("text-sm");
    });
  });

  describe("createCardClasses", () => {
    it("should create basic card classes", () => {
      const classes = createCardClasses();
      expect(classes).toContain("bg-ctp-surface0");
      expect(classes).toContain("rounded-lg");
      expect(classes).toContain("p-4");
    });

    it("should create bordered card classes", () => {
      const classes = createCardClasses("bordered");
      expect(classes).toContain("border");
      expect(classes).toContain("border-ctp-surface1");
    });

    it("should create interactive card classes", () => {
      const classes = createCardClasses("interactive");
      expect(classes).toContain("hover:border-ctp-surface2");
      expect(classes).toContain("transition-all");
    });
  });

  describe("createAlertClasses", () => {
    it("should create error alert classes", () => {
      const classes = createAlertClasses("error");
      expect(classes).toContain("bg-ctp-red/10");
      expect(classes).toContain("border-ctp-red");
    });

    it("should create success alert classes", () => {
      const classes = createAlertClasses("success");
      expect(classes).toContain("bg-ctp-green/10");
      expect(classes).toContain("border-ctp-green");
    });

    it("should create warning alert classes", () => {
      const classes = createAlertClasses("warning");
      expect(classes).toContain("bg-ctp-yellow/10");
      expect(classes).toContain("border-ctp-yellow");
    });

    it("should create info alert classes", () => {
      const classes = createAlertClasses("info");
      expect(classes).toContain("bg-ctp-blue/10");
      expect(classes).toContain("border-ctp-blue");
    });
  });

  describe("createBadgeClasses", () => {
    it("should create neutral badge classes by default", () => {
      const classes = createBadgeClasses();
      expect(classes).toContain("bg-ctp-surface1");
      expect(classes).toContain("px-3");
      expect(classes).toContain("py-2");
    });

    it("should create primary badge classes", () => {
      const classes = createBadgeClasses("primary");
      expect(classes).toContain("bg-ctp-blue/10");
    });
  });

  describe("createLoadingSpinnerClasses", () => {
    it("should create default loading spinner classes", () => {
      const classes = createLoadingSpinnerClasses();
      expect(classes).toContain("animate-spin");
      expect(classes).toContain("h-5 w-5"); // default is 'md'
      expect(classes).toContain("border-white");
    });

    it("should create blue spinner classes", () => {
      const classes = createLoadingSpinnerClasses("md", "blue");
      expect(classes).toContain("border-ctp-blue/30");
      expect(classes).toContain("border-t-ctp-blue");
    });

    it("should create current color spinner classes", () => {
      const classes = createLoadingSpinnerClasses("sm", "current");
      expect(classes).toContain("border-current/30");
      expect(classes).toContain("border-t-current");
    });

    it("should create different sizes", () => {
      const sm = createLoadingSpinnerClasses("sm");
      const lg = createLoadingSpinnerClasses("lg");
      const xl = createLoadingSpinnerClasses("xl");

      expect(sm).toContain("h-4 w-4");
      expect(lg).toContain("h-6 w-6");
      expect(xl).toContain("h-8 w-8");
    });
  });

  describe("style constants", () => {
    it("should have all required card styles", () => {
      expect(cardStyles.base).toBeDefined();
      expect(cardStyles.bordered).toBeDefined();
      expect(cardStyles.elevated).toBeDefined();
      expect(cardStyles.interactive).toBeDefined();
      expect(cardStyles.compact).toBeDefined();
    });

    it("should have all required text styles", () => {
      expect(textStyles.error).toBeDefined();
      expect(textStyles.success).toBeDefined();
      expect(textStyles.muted).toBeDefined();
      expect(textStyles.helper).toBeDefined();
      expect(textStyles.headingLg).toBeDefined();
      expect(textStyles.headingMd).toBeDefined();
      expect(textStyles.headingSm).toBeDefined();
    });

    it("should have all required alert styles", () => {
      expect(alertStyles.error).toBeDefined();
      expect(alertStyles.success).toBeDefined();
      expect(alertStyles.warning).toBeDefined();
      expect(alertStyles.info).toBeDefined();
    });

    it("should have all required badge styles", () => {
      expect(badgeStyles.success).toBeDefined();
      expect(badgeStyles.error).toBeDefined();
      expect(badgeStyles.primary).toBeDefined();
      expect(badgeStyles.neutral).toBeDefined();
    });
  });
});
