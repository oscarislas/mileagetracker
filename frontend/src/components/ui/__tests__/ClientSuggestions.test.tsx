import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ClientSuggestions } from "../ClientSuggestions";
import type { Client } from "../../../types";

describe("ClientSuggestions", () => {
  const mockClients: Client[] = [
    { id: "1", name: "Acme Corp", created_at: "2023-01-01T00:00:00Z", updated_at: "2023-01-01T00:00:00Z" },
    { id: "2", name: "Beta Inc", created_at: "2023-01-02T00:00:00Z", updated_at: "2023-01-02T00:00:00Z" },
    { id: "3", name: "Charlie LLC", created_at: "2023-01-03T00:00:00Z", updated_at: "2023-01-03T00:00:00Z" },
  ];

  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it("renders suggestions when show is true and clients are provided", () => {
    render(
      <ClientSuggestions
        clients={mockClients}
        show={true}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Inc")).toBeInTheDocument();
    expect(screen.getByText("Charlie LLC")).toBeInTheDocument();
  });

  it("does not render when show is false", () => {
    render(
      <ClientSuggestions
        clients={mockClients}
        show={false}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
  });

  it("calls onSelect when a suggestion is clicked", () => {
    render(
      <ClientSuggestions
        clients={mockClients}
        show={true}
        onSelect={mockOnSelect}
      />
    );

    fireEvent.click(screen.getByText("Acme Corp"));
    expect(mockOnSelect).toHaveBeenCalledWith("Acme Corp");
  });

  it("limits suggestions to maxItems", () => {
    render(
      <ClientSuggestions
        clients={mockClients}
        show={true}
        onSelect={mockOnSelect}
        maxItems={2}
      />
    );

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Inc")).toBeInTheDocument();
    expect(screen.queryByText("Charlie LLC")).not.toBeInTheDocument();
  });

  it("shows loading state when isLoading is true", () => {
    render(
      <ClientSuggestions
        clients={[]}
        show={true}
        onSelect={mockOnSelect}
        isLoading={true}
      />
    );

    expect(screen.getByText("Searching clients...")).toBeInTheDocument();
  });

  it("shows no results message when no clients are found", () => {
    render(
      <ClientSuggestions
        clients={[]}
        show={true}
        onSelect={mockOnSelect}
        noResultsMessage="Custom no results"
      />
    );

    expect(screen.getByText("Custom no results")).toBeInTheDocument();
    expect(screen.getByText("Try a different search term")).toBeInTheDocument();
  });

  it("highlights matching query text", () => {
    render(
      <ClientSuggestions
        clients={[mockClients[1]]} // Beta Inc
        show={true}
        onSelect={mockOnSelect}
        query="eta"
      />
    );

    const highlightedElement = screen.getByText("eta");
    expect(highlightedElement.tagName.toLowerCase()).toBe("mark");
    expect(highlightedElement).toHaveClass("bg-ctp-yellow/20", "text-ctp-yellow");
  });

  it("has proper accessibility attributes", () => {
    render(
      <ClientSuggestions
        clients={mockClients}
        show={true}
        onSelect={mockOnSelect}
      />
    );

    // Check for listbox role
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    
    // Check for option roles
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(mockClients.length);
    
    // Check aria-selected attributes
    options.forEach(option => {
      expect(option).toHaveAttribute("aria-selected", "false");
    });
  });

  it("shows Recent clients header when suggestions are available", () => {
    render(
      <ClientSuggestions
        clients={mockClients}
        show={true}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText("Recent clients")).toBeInTheDocument();
  });

  it("applies touch-friendly minimum height to suggestions", () => {
    render(
      <ClientSuggestions
        clients={mockClients}
        show={true}
        onSelect={mockOnSelect}
      />
    );

    const options = screen.getAllByRole("option");
    options.forEach(option => {
      expect(option).toHaveClass("min-h-[44px]");
    });
  });

  it("includes hover and focus states", () => {
    render(
      <ClientSuggestions
        clients={mockClients}
        show={true}
        onSelect={mockOnSelect}
      />
    );

    const firstOption = screen.getAllByRole("option")[0];
    expect(firstOption).toHaveClass(
      "hover:bg-ctp-surface1/50",
      "focus:bg-ctp-surface1/50",
      "focus:ring-2",
      "focus:ring-ctp-blue/50"
    );
  });

  it("has sufficient height to show 3 suggestions without scrolling", () => {
    const manyClients: Client[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i + 1),
      name: `Client ${i + 1}`,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z"
    }));

    render(
      <ClientSuggestions
        clients={manyClients}
        show={true}
        onSelect={mockOnSelect}
        maxItems={5} // Show all to test scrolling behavior
      />
    );

    // Check that the dropdown has the correct max-height for 3+ suggestions
    const dropdown = screen.getByRole("listbox");
    expect(dropdown).toHaveClass("max-h-[180px]");
    
    // Verify all 5 suggestions are rendered (will scroll after 3)
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(5);
    
    // Each option should have minimum touch-friendly height
    options.forEach(option => {
      expect(option).toHaveClass("min-h-[44px]");
    });
  });

  it("positions dropdown above input when positionUp is true", () => {
    render(
      <ClientSuggestions
        clients={mockClients}
        show={true}
        onSelect={mockOnSelect}
        positionUp={true}
      />
    );

    const dropdown = screen.getByRole("listbox");
    expect(dropdown).toHaveClass("bottom-full", "mb-2");
    expect(dropdown).not.toHaveClass("top-full", "mt-2");
  });

  it("positions dropdown below input by default", () => {
    render(
      <ClientSuggestions
        clients={mockClients}
        show={true}
        onSelect={mockOnSelect}
      />
    );

    const dropdown = screen.getByRole("listbox");
    expect(dropdown).toHaveClass("top-full", "mt-2");
    expect(dropdown).not.toHaveClass("bottom-full", "mb-2");
  });

  it("uses different animation for upward positioning", () => {
    const { rerender } = render(
      <ClientSuggestions
        clients={mockClients}
        show={true}
        onSelect={mockOnSelect}
        positionUp={false}
      />
    );

    let dropdown = screen.getByRole("listbox");
    expect(dropdown).toHaveClass("slide-in-from-top-2");

    rerender(
      <ClientSuggestions
        clients={mockClients}
        show={true}
        onSelect={mockOnSelect}
        positionUp={true}
      />
    );

    dropdown = screen.getByRole("listbox");
    expect(dropdown).toHaveClass("slide-in-from-bottom-2");
  });
});