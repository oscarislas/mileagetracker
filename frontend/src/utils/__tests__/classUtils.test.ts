import { cn } from "../classUtils";

describe("classUtils", () => {
  describe("cn", () => {
    it("should combine multiple classes", () => {
      expect(cn("class1", "class2", "class3")).toBe("class1 class2 class3");
    });

    it("should filter out falsy values", () => {
      expect(cn("class1", undefined, "class2", null, "class3", false)).toBe(
        "class1 class2 class3",
      );
    });

    it("should handle empty input", () => {
      expect(cn()).toBe("");
    });

    it("should handle only falsy values", () => {
      expect(cn(undefined, null, false)).toBe("");
    });

    it("should handle mixed truthy and falsy values", () => {
      const condition = false;
      expect(cn("active", condition && "hidden", "btn", null, undefined)).toBe(
        "active btn",
      );
    });
  });
});
