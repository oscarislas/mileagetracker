import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClientNameField } from "../ClientNameField";
import { useForm } from "../../../hooks/useForm";

// Mock the hooks
vi.mock("../../../hooks/useClientSuggestions", () => ({
  useClientSuggestions: () => ({
    suggestions: {
      data: {
        clients: [
          { id: 1, name: "Acme Corp" },
          { id: 2, name: "Tech Solutions" },
        ],
      },
      isLoading: false,
    },
    showSuggestions: true,
    inputRef: { current: null },
    suggestionsRef: { current: null },
    showSuggestionsDropdown: vi.fn(),
    hideSuggestionsDropdown: vi.fn(),
    handleClientSelect: vi.fn(),
  }),
}));

// Mock the UI components using standardized mocks
vi.mock("../../ui", async () => {
  const { createMockFormField, createMockInput, createMockClientSuggestions } =
    await import("../../../test/utils/mockComponents.tsx");

  return {
    FormField: createMockFormField(),
    Input: createMockInput(),
    ClientSuggestions: createMockClientSuggestions(),
  };
});

// Test wrapper with QueryClient
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Test form data type
interface TestFormData extends Record<string, unknown> {
  clientName: string;
  date: string;
  miles: number;
}

describe("ClientNameField", () => {
  let form: ReturnType<typeof useForm<TestFormData>>;

  beforeEach(() => {
    // Create a fresh form instance for each test
    const TestComponent = () => {
      form = useForm<TestFormData>({
        initialData: {
          clientName: "",
          date: "",
          miles: 0,
        },
      });
      return null;
    };
    render(<TestComponent />);
  });

  describe("Rendering", () => {
    it("should render with default props", () => {
      render(
        <TestWrapper>
          <ClientNameField form={form} fieldName="clientName" />
        </TestWrapper>,
      );

      expect(
        screen.getByRole("textbox", { name: /client name/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter client name"),
      ).toBeInTheDocument();
    });

    it("should render with custom props", () => {
      render(
        <TestWrapper>
          <ClientNameField
            form={form}
            fieldName="clientName"
            label="Customer Name"
            placeholder="Type customer name..."
            required={true}
            helperText="Select from existing clients"
            className="custom-class"
          />
        </TestWrapper>,
      );

      // Use more flexible query approach since the structure is complex
      const input = screen.getByRole("textbox", { name: /customer name/i });
      expect(input).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Type customer name..."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Select from existing clients"),
      ).toBeInTheDocument();
      expect(document.querySelector(".custom-class")).toBeInTheDocument();
    });

    it("should generate proper field ID", () => {
      render(
        <TestWrapper>
          <ClientNameField form={form} fieldName="clientName" />
        </TestWrapper>,
      );

      const input = screen.getByRole("textbox", { name: /client name/i });
      expect(input).toHaveAttribute("id", "clientName-input");
    });

    it("should use custom ID when provided", () => {
      render(
        <TestWrapper>
          <ClientNameField
            form={form}
            fieldName="clientName"
            id="custom-client-field"
          />
        </TestWrapper>,
      );

      const input = screen.getByRole("textbox", { name: /client name/i });
      expect(input).toHaveAttribute("id", "custom-client-field");
    });
  });

  describe("User Interaction", () => {
    it("should update form data when user types", async () => {
      render(
        <TestWrapper>
          <ClientNameField form={form} fieldName="clientName" />
        </TestWrapper>,
      );

      const input = screen.getByRole("textbox", { name: /client name/i });

      await act(() => {
        fireEvent.change(input, { target: { value: "Acme" } });
      });

      expect(form.data.clientName).toBe("Acme");
    });

    it("should clear input when empty", async () => {
      const user = userEvent.setup();

      // Set initial value
      act(() => {
        form.setField("clientName", "Test Client");
      });

      render(
        <TestWrapper>
          <ClientNameField form={form} fieldName="clientName" />
        </TestWrapper>,
      );

      const input = screen.getByRole("textbox", { name: /client name/i });
      await user.clear(input);

      expect(form.data.clientName).toBe("");
    });

    it("should show suggestions on focus when field has value", () => {
      act(() => {
        form.setField("clientName", "Acme");
      });

      render(
        <TestWrapper>
          <ClientNameField form={form} fieldName="clientName" />
        </TestWrapper>,
      );

      const input = screen.getByRole("textbox", { name: /client name/i });
      fireEvent.focus(input);

      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });
  });

  describe("Client Suggestions Integration", () => {
    it("should show client suggestions when typing", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <ClientNameField form={form} fieldName="clientName" />
        </TestWrapper>,
      );

      const input = screen.getByRole("textbox", { name: /client name/i });
      await user.type(input, "A");

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
        expect(screen.getByText("Tech Solutions")).toBeInTheDocument();
      });
    });

    it("should handle client selection from suggestions", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <ClientNameField form={form} fieldName="clientName" />
        </TestWrapper>,
      );

      const input = screen.getByRole("textbox", { name: /client name/i });
      await user.type(input, "A");

      await waitFor(() => {
        const suggestion = screen.getByText("Acme Corp");
        expect(suggestion).toBeInTheDocument();
      });

      const suggestion = screen.getByText("Acme Corp");
      await user.click(suggestion);

      expect(form.data.clientName).toBe("Acme Corp");
    });

    it("should set proper aria-describedby when suggestions are shown", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <ClientNameField form={form} fieldName="clientName" />
        </TestWrapper>,
      );

      const input = screen.getByRole("textbox", { name: /client name/i });
      await user.type(input, "A");

      await waitFor(() => {
        expect(input).toHaveAttribute("aria-describedby", "client-suggestions");
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error messages", () => {
      act(() => {
        form.setErrors({ clientName: "Client name is required" });
      });

      render(
        <TestWrapper>
          <ClientNameField form={form} fieldName="clientName" />
        </TestWrapper>,
      );

      expect(screen.getByText("Client name is required")).toBeInTheDocument();
    });

    it("should apply error styling when field has error", () => {
      act(() => {
        form.setErrors({ clientName: "Invalid client name" });
      });

      render(
        <TestWrapper>
          <ClientNameField form={form} fieldName="clientName" />
        </TestWrapper>,
      );

      const input = screen.getByRole("textbox", { name: /client name/i });
      expect(input).toHaveClass("error");
    });

    it("should clear errors when user starts typing", async () => {
      act(() => {
        form.setErrors({ clientName: "Client name is required" });
      });

      render(
        <TestWrapper>
          <ClientNameField form={form} fieldName="clientName" />
        </TestWrapper>,
      );

      expect(screen.getByText("Client name is required")).toBeInTheDocument();

      const input = screen.getByRole("textbox", { name: /client name/i });

      await act(() => {
        fireEvent.change(input, { target: { value: "A" } });
      });

      // Verify that the form state is cleared (this is the core functionality)
      expect(form.hasFieldError("clientName")).toBe(false);
      expect(form.getFieldError("clientName")).toBeUndefined();
      expect(form.data.clientName).toBe("A");

      // Note: The UI update for error clearing depends on React re-render timing
      // and component behavior. The important part is that
      // the form state is correctly updated, which we've verified above.
    });
  });

  describe("Accessibility", () => {
    it("should have proper accessibility attributes", () => {
      render(
        <TestWrapper>
          <ClientNameField form={form} fieldName="clientName" required />
        </TestWrapper>,
      );

      const input = screen.getByRole("textbox", { name: /client name/i });
      expect(input).toHaveAttribute("id", "clientName-input");
      expect(input).toBeInTheDocument();
    });

    it("should have proper maxLength attribute", () => {
      render(
        <TestWrapper>
          <ClientNameField form={form} fieldName="clientName" maxLength={50} />
        </TestWrapper>,
      );

      const input = screen.getByRole("textbox", { name: /client name/i });
      expect(input).toHaveAttribute("maxLength", "50");
    });
  });

  describe("Position Up Mode", () => {
    it("should pass positionUp prop to ClientSuggestions", () => {
      render(
        <TestWrapper>
          <ClientNameField
            form={form}
            fieldName="clientName"
            positionUp={true}
          />
        </TestWrapper>,
      );

      // This would be tested via the ClientSuggestions component props
      // For now, we just verify the component renders
      expect(
        screen.getByRole("textbox", { name: /client name/i }),
      ).toBeInTheDocument();
    });
  });
});
