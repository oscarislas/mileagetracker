import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useForm } from "../useForm";

// Test form data types
interface TestFormData extends Record<string, unknown> {
  name: string;
  email: string;
  age: number;
  optional?: string;
}

interface SimpleFormData extends Record<string, unknown> {
  value: string;
}

describe("useForm", () => {
  const initialData: TestFormData = {
    name: "",
    email: "",
    age: 0,
  };

  describe("Initialization", () => {
    it("should initialize with provided data", () => {
      const { result } = renderHook(() =>
        useForm({
          initialData,
        }),
      );

      expect(result.current.data).toEqual(initialData);
      expect(result.current.errors).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isSubmitted).toBe(false);
      expect(result.current.isValid).toBe(true);
      expect(result.current.isDirty).toBe(false);
    });

    it("should initialize with custom initial data", () => {
      const customData: TestFormData = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
        optional: "test",
      };

      const { result } = renderHook(() =>
        useForm({
          initialData: customData,
        }),
      );

      expect(result.current.data).toEqual(customData);
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe("Field Management", () => {
    it("should update field value with setField", () => {
      const { result } = renderHook(() =>
        useForm({
          initialData,
        }),
      );

      act(() => {
        result.current.setField("name", "John Doe");
      });

      expect(result.current.data.name).toBe("John Doe");
      expect(result.current.isDirty).toBe(true);
    });

    it("should update field value with handleFieldChange", () => {
      const { result } = renderHook(() =>
        useForm({
          initialData,
        }),
      );

      act(() => {
        result.current.handleFieldChange("email", "john@example.com");
      });

      expect(result.current.data.email).toBe("john@example.com");
    });

    it("should update multiple fields with setData (object)", () => {
      const { result } = renderHook(() =>
        useForm({
          initialData,
        }),
      );

      act(() => {
        result.current.setData({
          name: "Jane Doe",
          age: 25,
        });
      });

      expect(result.current.data.name).toBe("Jane Doe");
      expect(result.current.data.age).toBe(25);
      expect(result.current.data.email).toBe(""); // should remain unchanged
    });

    it("should update data with setData (function)", () => {
      const { result } = renderHook(() =>
        useForm({
          initialData: { ...initialData, name: "John" },
        }),
      );

      act(() => {
        result.current.setData((prev) => ({
          ...prev,
          name: prev.name + " Doe",
          age: 30,
        }));
      });

      expect(result.current.data.name).toBe("John Doe");
      expect(result.current.data.age).toBe(30);
    });
  });

  describe("Error Management", () => {
    it("should set and get field errors", () => {
      const { result } = renderHook(() =>
        useForm({
          initialData,
        }),
      );

      act(() => {
        result.current.setErrors({
          name: "Name is required",
          email: "Invalid email format",
        });
      });

      expect(result.current.errors.name).toBe("Name is required");
      expect(result.current.errors.email).toBe("Invalid email format");
      expect(result.current.getFieldError("name")).toBe("Name is required");
      expect(result.current.hasFieldError("name")).toBe(true);
      expect(result.current.hasFieldError("age")).toBe(false);
    });

    it("should clear all errors", () => {
      const { result } = renderHook(() =>
        useForm({
          initialData,
        }),
      );

      act(() => {
        result.current.setErrors({
          name: "Name is required",
          email: "Invalid email format",
        });
      });

      expect(Object.keys(result.current.errors)).toHaveLength(2);

      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.errors).toEqual({});
    });

    it("should clear specific field error", () => {
      const { result } = renderHook(() =>
        useForm({
          initialData,
        }),
      );

      act(() => {
        result.current.setErrors({
          name: "Name is required",
          email: "Invalid email format",
        });
      });

      act(() => {
        result.current.clearFieldError("name");
      });

      expect(result.current.errors.name).toBeUndefined();
      expect(result.current.errors.email).toBe("Invalid email format");
    });

    it("should clear error when field value changes", () => {
      const { result } = renderHook(() =>
        useForm({
          initialData,
        }),
      );

      act(() => {
        result.current.setErrors({
          name: "Name is required",
        });
      });

      expect(result.current.getFieldError("name")).toBe("Name is required");

      act(() => {
        result.current.setField("name", "John");
      });

      expect(result.current.getFieldError("name")).toBeUndefined();
    });
  });

  describe("Form Validation", () => {
    const validationFunction = (data: TestFormData) => ({
      name: !data.name ? "Name is required" : undefined,
      email:
        !data.email || !data.email.includes("@")
          ? "Valid email is required"
          : undefined,
      age: data.age < 0 ? "Age must be positive" : undefined,
      optional: undefined, // Optional field
    });

    it("should validate form with validation function", () => {
      const { result } = renderHook(() =>
        useForm({
          initialData,
          validate: validationFunction,
        }),
      );

      let isValid: boolean = false;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.name).toBe("Name is required");
      expect(result.current.errors.email).toBe("Valid email is required");
    });

    it("should pass validation with valid data", () => {
      const validData: TestFormData = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };

      const { result } = renderHook(() =>
        useForm({
          initialData: validData,
          validate: validationFunction,
        }),
      );

      let isValid: boolean = false;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(true);
      expect(result.current.isValid).toBe(true);
      expect(Object.keys(result.current.errors)).toHaveLength(0);
    });

    it("should return true when no validation function provided", () => {
      const { result } = renderHook(() =>
        useForm({
          initialData,
        }),
      );

      let isValid: boolean = false;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(true);
      expect(result.current.isValid).toBe(true);
    });
  });

  describe("Form Submission", () => {
    it("should handle successful form submission", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const validData: TestFormData = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };

      const { result } = renderHook(() =>
        useForm({
          initialData: validData,
          validate: () => ({
            name: undefined,
            email: undefined,
            age: undefined,
            optional: undefined,
          }),
          onSubmit,
          resetOnSuccess: false, // Don't reset so we can check isSubmitted
        }),
      );

      let submitResult: boolean = false;
      await act(async () => {
        submitResult = await result.current.handleSubmit();
      });

      expect(submitResult).toBe(true);
      expect(onSubmit).toHaveBeenCalledWith(validData);
      expect(result.current.isSubmitted).toBe(true);
    });

    it("should prevent submission when validation fails", async () => {
      const onSubmit = vi.fn();

      const { result } = renderHook(() =>
        useForm({
          initialData,
          validate: () => ({
            name: "Name is required",
            email: "Email is required",
            age: undefined,
            optional: undefined,
          }),
          onSubmit,
        }),
      );

      let submitResult: boolean = false;
      await act(async () => {
        submitResult = await result.current.handleSubmit();
      });

      expect(submitResult).toBe(false);
      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.isSubmitted).toBe(true);
      expect(result.current.isValid).toBe(false);
    });

    it("should handle submission errors", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const onSubmit = vi.fn().mockRejectedValue(new Error("Network error"));
      const validData: TestFormData = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };

      const { result } = renderHook(() =>
        useForm({
          initialData: validData,
          validate: () => ({
            name: undefined,
            email: undefined,
            age: undefined,
            optional: undefined,
          }),
          onSubmit,
        }),
      );

      let submitResult: boolean = false;
      await act(async () => {
        submitResult = await result.current.handleSubmit();
      });

      expect(submitResult).toBe(false);
      expect(consoleError).toHaveBeenCalledWith(
        "Form submission error:",
        expect.any(Error),
      );
      expect(result.current.isSubmitting).toBe(false);

      consoleError.mockRestore();
    });

    it("should return true when no onSubmit provided", async () => {
      const validData: TestFormData = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };

      const { result } = renderHook(() =>
        useForm({
          initialData: validData,
        }),
      );

      let submitResult: boolean = false;
      await act(async () => {
        submitResult = await result.current.handleSubmit();
      });

      expect(submitResult).toBe(true);
    });
  });

  describe("Reset Functionality", () => {
    it("should reset form to initial state", () => {
      const { result } = renderHook(() =>
        useForm({
          initialData,
        }),
      );

      act(() => {
        result.current.setField("name", "John Doe");
        result.current.setErrors({ name: "Some error" });
      });

      expect(result.current.data.name).toBe("John Doe");
      expect(result.current.errors.name).toBe("Some error");

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toEqual(initialData);
      expect(result.current.errors).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isSubmitted).toBe(false);
      expect(result.current.isValid).toBe(true);
    });

    it("should reset after successful submission when resetOnSuccess is true", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const validData: TestFormData = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };

      const { result } = renderHook(() =>
        useForm({
          initialData,
          onSubmit,
          resetOnSuccess: true,
        }),
      );

      act(() => {
        result.current.setData(validData);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.data).toEqual(initialData);
    });

    it("should not reset after successful submission when resetOnSuccess is false", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const validData: TestFormData = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };

      const { result } = renderHook(() =>
        useForm({
          initialData,
          onSubmit,
          resetOnSuccess: false,
        }),
      );

      act(() => {
        result.current.setData(validData);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.data).toEqual(validData);
    });
  });

  describe("Dirty State", () => {
    it("should track dirty state correctly", () => {
      const { result } = renderHook(() =>
        useForm({
          initialData,
        }),
      );

      expect(result.current.isDirty).toBe(false);

      act(() => {
        result.current.setField("name", "John");
      });

      expect(result.current.isDirty).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isDirty).toBe(false);
    });

    it("should consider form clean when values match initial data", () => {
      const { result } = renderHook(() =>
        useForm({
          initialData,
        }),
      );

      act(() => {
        result.current.setField("name", "John");
      });

      expect(result.current.isDirty).toBe(true);

      act(() => {
        result.current.setField("name", "");
      });

      expect(result.current.isDirty).toBe(false);
    });
  });

  describe("Type Safety", () => {
    it("should work with different form data types", () => {
      const simpleInitialData: SimpleFormData = { value: "" };

      const { result } = renderHook(() =>
        useForm({
          initialData: simpleInitialData,
        }),
      );

      act(() => {
        result.current.setField("value", "test");
      });

      expect(result.current.data.value).toBe("test");
    });

    it("should maintain type safety for field names", () => {
      const { result } = renderHook(() =>
        useForm({
          initialData,
        }),
      );

      // These should be type-safe at compile time
      expect(result.current.getFieldError("name")).toBeUndefined();
      expect(result.current.hasFieldError("email")).toBe(false);

      act(() => {
        result.current.handleFieldChange("age", 25);
      });

      expect(result.current.data.age).toBe(25);
    });
  });
});
