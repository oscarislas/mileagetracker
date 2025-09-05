import { describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  renderHook,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateField } from "../DateField";
import { useForm } from "../../../hooks/useForm";

// Mock the UI components using standardized mocks
vi.mock("../../ui", async () => {
  const { createMockFormField, createMockInput } = await import(
    "../../../test/utils/mockComponents.tsx"
  );

  return {
    FormField: createMockFormField(),
    Input: createMockInput(),
  };
});

// Mock Date.now for consistent testing
const mockDate = new Date("2024-01-15T10:30:00Z");
vi.setSystemTime(mockDate);

// Test form data type
interface TestFormData extends Record<string, unknown> {
  date: string;
  clientName: string;
  miles: number;
}

// Helper component props interface
interface DateFieldTestComponentProps {
  label?: string;
  required?: boolean;
  helperText?: string;
  className?: string;
  id?: string;
  defaultToToday?: boolean;
  [key: string]: unknown;
}

// Helper component to test DateField with form
const DateFieldTestComponent = (props: DateFieldTestComponentProps) => {
  const form = useForm<TestFormData>({
    initialData: {
      date: "",
      clientName: "",
      miles: 0,
    },
  });

  return <DateField form={form} fieldName="date" {...props} />;
};

describe("DateField", () => {
  describe("Rendering", () => {
    it("should render with default props", () => {
      render(<DateFieldTestComponent />);

      expect(screen.getByTestId("mock-input")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Select date")).toBeInTheDocument();

      const input = screen.getByTestId("mock-input");
      expect(input).toHaveAttribute("type", "date");
    });

    it("should render with custom props", () => {
      render(
        <DateFieldTestComponent
          label="Trip Date"
          required={true}
          helperText="When did this trip occur?"
          className="custom-date-field"
        />,
      );

      expect(screen.getByTestId("mock-input")).toBeInTheDocument();
      expect(screen.getByText("When did this trip occur?")).toBeInTheDocument();
      expect(document.querySelector(".custom-date-field")).toBeInTheDocument();
    });

    it("should generate proper field ID", () => {
      render(<DateFieldTestComponent />);

      const input = screen.getByTestId("mock-input");
      expect(input).toHaveAttribute("id", "date-input");
    });

    it("should use custom ID when provided", () => {
      render(<DateFieldTestComponent id="trip-date-field" />);

      const input = screen.getByTestId("mock-input");
      expect(input).toHaveAttribute("id", "trip-date-field");
    });

    it("should show helper tip when no custom helper text and no error", () => {
      render(<DateFieldTestComponent />);

      expect(
        screen.getByText("💡 Select the date when this occurred"),
      ).toBeInTheDocument();
    });

    it("should not show helper tip when custom helper text is provided", () => {
      render(<DateFieldTestComponent helperText="Custom helper" />);

      expect(screen.getByText("Custom helper")).toBeInTheDocument();
      expect(
        screen.queryByText("💡 Select the date when this occurred"),
      ).not.toBeInTheDocument();
    });
  });

  describe("User Interaction", () => {
    it("should update form data when user selects a date", async () => {
      const user = userEvent.setup();

      // Use renderHook to properly manage the form state
      const { result } = renderHook(() =>
        useForm<TestFormData>({
          initialData: {
            date: "",
            clientName: "",
            miles: 0,
          },
        }),
      );

      render(<DateField form={result.current} fieldName="date" />);

      const input = screen.getByTestId("mock-input");
      await user.type(input, "2024-03-15");

      expect(result.current.data.date).toBe("2024-03-15");
    });
  });

  describe("Default to Today Feature", () => {
    it("should set today's date on focus when defaultToToday is true and field is empty", () => {
      const { result } = renderHook(() =>
        useForm<TestFormData>({
          initialData: {
            date: "",
            clientName: "",
            miles: 0,
          },
        }),
      );

      render(
        <DateField
          form={result.current}
          fieldName="date"
          defaultToToday={true}
        />,
      );

      const input = screen.getByTestId("mock-input");
      fireEvent.focus(input);

      const expectedDate = mockDate.toISOString().split("T")[0]; // "2024-01-15"
      expect(result.current.data.date).toBe(expectedDate);
    });

    it("should not set today's date on focus when defaultToToday is false", () => {
      const { result } = renderHook(() =>
        useForm<TestFormData>({
          initialData: {
            date: "",
            clientName: "",
            miles: 0,
          },
        }),
      );

      render(
        <DateField
          form={result.current}
          fieldName="date"
          defaultToToday={false}
        />,
      );

      const input = screen.getByTestId("mock-input");
      fireEvent.focus(input);

      expect(result.current.data.date).toBe("");
    });

    it("should not override existing date value on focus", () => {
      const { result } = renderHook(() =>
        useForm<TestFormData>({
          initialData: {
            date: "2024-03-01",
            clientName: "",
            miles: 0,
          },
        }),
      );

      render(
        <DateField
          form={result.current}
          fieldName="date"
          defaultToToday={true}
        />,
      );

      const input = screen.getByTestId("mock-input");
      fireEvent.focus(input);

      expect(result.current.data.date).toBe("2024-03-01");
    });
  });

  describe("Error Handling", () => {
    it("should display error messages", () => {
      const { result } = renderHook(() =>
        useForm<TestFormData>({
          initialData: {
            date: "",
            clientName: "",
            miles: 0,
          },
        }),
      );

      act(() => {
        result.current.setErrors({ date: "Date is required" });
      });

      render(<DateField form={result.current} fieldName="date" />);

      expect(screen.getByText("Date is required")).toBeInTheDocument();
    });

    it("should apply error styling when field has error", () => {
      const { result } = renderHook(() =>
        useForm<TestFormData>({
          initialData: {
            date: "",
            clientName: "",
            miles: 0,
          },
        }),
      );

      act(() => {
        result.current.setErrors({ date: "Invalid date" });
      });

      render(<DateField form={result.current} fieldName="date" />);

      const input = screen.getByTestId("mock-input");
      expect(input).toHaveClass("error");
    });
  });

  describe("Accessibility", () => {
    it("should have proper accessibility attributes", () => {
      render(<DateFieldTestComponent required />);

      const input = screen.getByTestId("mock-input");
      expect(input).toHaveAttribute("id", "date-input");
      expect(input).toHaveAttribute("type", "date");
      expect(input).toBeInTheDocument();
    });

    it("should have hasIcon attribute for proper styling", () => {
      render(<DateFieldTestComponent />);

      const input = screen.getByTestId("mock-input");
      expect(input).toHaveClass("has-icon");
    });
  });

  describe("Date Utils", () => {
    it("should get today's date in correct format", () => {
      const { result } = renderHook(() =>
        useForm<TestFormData>({
          initialData: {
            date: "",
            clientName: "",
            miles: 0,
          },
        }),
      );

      render(
        <DateField
          form={result.current}
          fieldName="date"
          defaultToToday={true}
        />,
      );

      const input = screen.getByTestId("mock-input");
      fireEvent.focus(input);

      // Should be in YYYY-MM-DD format
      const dateValue = result.current.data.date;
      expect(dateValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(dateValue).toBe("2024-01-15");
    });
  });
});
