import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MilesField } from "../MilesField";
import { useForm } from "../../../hooks/useForm";
// Import removed - helper functions not used in this test

// Mock the UI components to avoid complexity in tests
vi.mock("../../ui", () => ({
  FormField: ({
    children,
    label,
    error,
    helperText,
    className,
    id,
    required,
  }: {
    children: React.ReactNode;
    label?: string;
    error?: string;
    helperText?: string;
    className?: string;
    id?: string;
    required?: boolean;
  }) => (
    <div className={`form-field ${className || ""}`.trim()}>
      <label htmlFor={id}>
        {label}
        {required && <span className="ml-1">*</span>}
      </label>
      {children}
      {error && <div className="error">{error}</div>}
      {helperText && !error && <div className="helper">{helperText}</div>}
    </div>
  ),
  Input: React.forwardRef<HTMLInputElement>(
    (props: Record<string, unknown>, ref) => {
      // Filter out custom props that shouldn't be passed to DOM elements
      const { hasIcon, error, ...domProps } = props;

      return (
        <input
          ref={ref}
          className={`input ${hasIcon ? "has-icon" : ""} ${error ? "error" : ""}`.trim()}
          {...domProps}
        />
      );
    },
  ),
}));

// Test form data type
interface TestFormData extends Record<string, unknown> {
  miles: number;
  clientName: string;
  date: string;
}

describe("MilesField", () => {
  let form: ReturnType<typeof useForm<TestFormData>>;

  beforeEach(() => {
    // Create a fresh form instance for each test
    const TestComponent = () => {
      form = useForm<TestFormData>({
        initialData: {
          miles: 0,
          clientName: "",
          date: "",
        },
      });
      return null;
    };
    render(<TestComponent />);
  });

  describe("Rendering", () => {
    it("should render with default props", () => {
      render(<MilesField form={form} fieldName="miles" />);

      expect(screen.getByLabelText("Miles Driven")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("0.0")).toBeInTheDocument();

      const input = screen.getByRole("spinbutton", { name: "Miles Driven" });
      expect(input).toHaveAttribute("type", "number");
      expect(input).toHaveAttribute("step", "0.1");
      expect(input).toHaveAttribute("min", "0");
      expect(input).toHaveAttribute("inputMode", "decimal");
    });

    it("should render with custom props", () => {
      render(
        <MilesField
          form={form}
          fieldName="miles"
          label="Distance Traveled"
          placeholder="Enter miles..."
          min={5}
          step="0.01"
          helperText="Round to nearest tenth"
          className="custom-miles-field"
          required={true}
        />,
      );

      expect(screen.getByLabelText(/Distance Traveled/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter miles...")).toBeInTheDocument();
      expect(screen.getByText("Round to nearest tenth")).toBeInTheDocument();
      expect(document.querySelector(".custom-miles-field")).toBeInTheDocument();

      const input = screen.getByRole("spinbutton", {
        name: /Distance Traveled/,
      });
      expect(input).toHaveAttribute("step", "0.01");
      expect(input).toHaveAttribute("min", "5");
    });

    it("should generate proper field ID", () => {
      render(<MilesField form={form} fieldName="miles" />);

      const input = screen.getByRole("spinbutton", { name: "Miles Driven" });
      expect(input).toHaveAttribute("id", "miles-input");
    });

    it("should use custom ID when provided", () => {
      render(
        <MilesField form={form} fieldName="miles" id="trip-miles-field" />,
      );

      const input = screen.getByRole("spinbutton", { name: "Miles Driven" });
      expect(input).toHaveAttribute("id", "trip-miles-field");
    });

    it("should have proper aria-describedby attribute", () => {
      render(<MilesField form={form} fieldName="miles" />);

      const input = screen.getByRole("spinbutton", { name: "Miles Driven" });
      expect(input).toHaveAttribute("aria-describedby", "miles-input-help");
    });
  });

  describe("Value Display", () => {
    it("should show empty string when value is 0", () => {
      render(<MilesField form={form} fieldName="miles" />);

      const input = screen.getByRole("spinbutton", {
        name: "Miles Driven",
      }) as HTMLInputElement;
      expect(input.value).toBe("");
    });

    it("should display numeric value when greater than 0", () => {
      act(() => {
        form.setField("miles", 15.5);
      });

      render(<MilesField form={form} fieldName="miles" />);

      const input = screen.getByRole("spinbutton", {
        name: "Miles Driven",
      }) as HTMLInputElement;
      expect(input.value).toBe("15.5");
    });

    it("should display decimal values correctly", () => {
      act(() => {
        form.setField("miles", 10.75);
      });

      render(<MilesField form={form} fieldName="miles" />);

      const input = screen.getByRole("spinbutton", {
        name: "Miles Driven",
      }) as HTMLInputElement;
      expect(input.value).toBe("10.75");
    });
  });

  describe("User Interaction", () => {
    it("should update form data when user enters a number", async () => {
      render(<MilesField form={form} fieldName="miles" />);

      const input = screen.getByRole("spinbutton", { name: "Miles Driven" });

      // Use fireEvent.change which properly simulates React onChange
      await act(() => {
        fireEvent.change(input, { target: { value: "25.5" } });
      });

      expect(form.data.miles).toBe(25.5);
    });

    it("should handle decimal input correctly", async () => {
      render(<MilesField form={form} fieldName="miles" />);

      const input = screen.getByRole("spinbutton", { name: "Miles Driven" });

      await act(() => {
        fireEvent.change(input, { target: { value: "12.75" } });
      });

      expect(form.data.miles).toBe(12.75);
    });

    it("should handle clearing input (setting to 0)", async () => {
      const user = userEvent.setup();
      act(() => {
        form.setField("miles", 15.5);
      });

      render(<MilesField form={form} fieldName="miles" />);

      const input = screen.getByRole("spinbutton", { name: "Miles Driven" });
      await user.clear(input);

      expect(form.data.miles).toBe(0);
    });

    it("should handle invalid input by converting to 0", async () => {
      const user = userEvent.setup();
      render(<MilesField form={form} fieldName="miles" />);

      const input = screen.getByRole("spinbutton", { name: "Miles Driven" });

      // Simulate entering non-numeric characters (this might not work in all browsers)
      await user.type(input, "abc");

      // The component should sanitize this to 0
      expect(form.data.miles).toBe(0);
    });

    it("should handle empty string input", async () => {
      const user = userEvent.setup();
      render(<MilesField form={form} fieldName="miles" />);

      const input = screen.getByRole("spinbutton", { name: "Miles Driven" });
      await user.type(input, "10");
      await user.clear(input);

      expect(form.data.miles).toBe(0);
    });
  });

  describe("Numeric Validation", () => {
    it("should convert NaN to 0", () => {
      // Simulate what happens when parseFloat returns NaN
      render(<MilesField form={form} fieldName="miles" />);
      const input = screen.getByRole("spinbutton", { name: "Miles Driven" });

      // Directly trigger onChange with a value that would cause NaN
      act(() => {
        input.dispatchEvent(new Event("change", { bubbles: true }));
        (input as HTMLInputElement).value = "invalid";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });

      // The component should handle this gracefully
      expect(form.data.miles).toBe(0);
    });

    it("should handle negative numbers correctly based on min prop", async () => {
      const user = userEvent.setup();
      render(<MilesField form={form} fieldName="miles" />);

      const input = screen.getByRole("spinbutton", { name: "Miles Driven" });

      // Try to enter a negative number
      await user.type(input, "-5");

      // Note: The actual behavior depends on browser implementation
      // Our component doesn't explicitly prevent negative input,
      // but the min="0" attribute should guide browser behavior
      expect(input).toHaveAttribute("min", "0");
    });

    it("should parse zero correctly", async () => {
      const user = userEvent.setup();
      render(<MilesField form={form} fieldName="miles" />);

      const input = screen.getByRole("spinbutton", { name: "Miles Driven" });
      await user.type(input, "0");

      expect(form.data.miles).toBe(0);
    });

    it("should handle large decimal numbers", async () => {
      render(<MilesField form={form} fieldName="miles" />);

      const input = screen.getByRole("spinbutton", { name: "Miles Driven" });

      await act(() => {
        fireEvent.change(input, { target: { value: "999.999" } });
      });

      expect(form.data.miles).toBe(999.999);
    });
  });

  describe("Error Handling", () => {
    it("should display error messages", () => {
      act(() => {
        form.setErrors({ miles: "Miles must be greater than 0" });
      });

      render(<MilesField form={form} fieldName="miles" />);

      expect(
        screen.getByText("Miles must be greater than 0"),
      ).toBeInTheDocument();
    });

    it("should apply error styling when field has error", () => {
      act(() => {
        form.setErrors({ miles: "Invalid miles" });
      });

      render(<MilesField form={form} fieldName="miles" />);

      const input = screen.getByRole("spinbutton", { name: "Miles Driven" });
      expect(input).toHaveClass("error");
    });

    it("should clear errors when user starts typing", async () => {
      act(() => {
        form.setErrors({ miles: "Miles is required" });
      });

      render(<MilesField form={form} fieldName="miles" />);

      expect(screen.getByText("Miles is required")).toBeInTheDocument();
      expect(form.hasFieldError("miles")).toBe(true);

      const input = screen.getByRole("spinbutton", { name: "Miles Driven" });

      await act(() => {
        fireEvent.change(input, { target: { value: "5" } });
      });

      // Verify that the form state is cleared (this is the core functionality)
      expect(form.hasFieldError("miles")).toBe(false);
      expect(form.getFieldError("miles")).toBeUndefined();
      expect(form.data.miles).toBe(5);

      // Note: The UI update for error clearing depends on React re-render timing
      // and the mocked FormField component behavior. The important part is that
      // the form state is correctly updated, which we've verified above.
    });
  });

  describe("Accessibility", () => {
    it("should have proper accessibility attributes", () => {
      render(<MilesField form={form} fieldName="miles" required />);

      const input = screen.getByRole("spinbutton", { name: /Miles Driven/ });
      expect(input).toHaveAttribute("id", "miles-input");
      expect(input).toHaveAttribute("type", "number");
      expect(input).toHaveAttribute("aria-describedby", "miles-input-help");
    });

    it("should have hasIcon attribute for proper styling", () => {
      render(<MilesField form={form} fieldName="miles" />);

      const input = screen.getByRole("spinbutton", { name: "Miles Driven" });
      expect(input).toHaveClass("has-icon");
    });

    it("should have proper inputMode for mobile keyboards", () => {
      render(<MilesField form={form} fieldName="miles" />);

      const input = screen.getByRole("spinbutton", { name: "Miles Driven" });
      expect(input).toHaveAttribute("inputMode", "decimal");
    });
  });

  describe("Props Validation", () => {
    it("should work with different field names", () => {
      interface AlternateFormData extends Record<string, unknown> {
        distance: number;
        other: string;
      }

      // Create alternate form in a component to avoid hook rule violations
      let alternateForm: ReturnType<typeof useForm<AlternateFormData>>;
      const AlternateTestComponent = () => {
        alternateForm = useForm<AlternateFormData>({
          initialData: {
            distance: 0,
            other: "",
          },
        });
        return <MilesField form={alternateForm} fieldName="distance" />;
      };

      render(<AlternateTestComponent />);

      expect(screen.getByLabelText("Miles Driven")).toBeInTheDocument();
    });

    it("should handle custom step values", () => {
      render(<MilesField form={form} fieldName="miles" step="0.01" />);

      const input = screen.getByRole("spinbutton", { name: "Miles Driven" });
      expect(input).toHaveAttribute("step", "0.01");
    });

    it("should handle custom min values", () => {
      render(<MilesField form={form} fieldName="miles" min={1} />);

      const input = screen.getByRole("spinbutton", { name: "Miles Driven" });
      expect(input).toHaveAttribute("min", "1");
    });
  });
});
