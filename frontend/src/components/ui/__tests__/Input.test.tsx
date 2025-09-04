import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import Input from "../Input";

describe("Input", () => {
  it("renders with default props", () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
  });

  it("renders with error state", () => {
    render(<Input error placeholder="Enter text" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toHaveClass("border-ctp-red");
  });

  it("renders with normal state", () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toHaveClass("border-ctp-surface1");
  });

  it("renders different sizes", () => {
    const { rerender } = render(<Input size="sm" placeholder="Small" />);
    expect(screen.getByPlaceholderText("Small")).toHaveClass("py-2", "text-sm");

    rerender(<Input size="lg" placeholder="Large" />);
    expect(screen.getByPlaceholderText("Large")).toHaveClass("py-4", "text-lg");
  });

  it("adjusts padding when hasIcon is true", () => {
    render(<Input hasIcon placeholder="With icon" />);
    const input = screen.getByPlaceholderText("With icon");
    expect(input).toHaveClass("pl-10", "pr-4");
  });

  it("handles value changes", () => {
    const handleChange = vi.fn();
    render(<Input value="" onChange={handleChange} placeholder="Test input" />);

    const input = screen.getByPlaceholderText("Test input");
    fireEvent.change(input, { target: { value: "new value" } });

    expect(handleChange).toHaveBeenCalled();
  });

  it("can be disabled", () => {
    render(<Input disabled placeholder="Disabled input" />);
    const input = screen.getByPlaceholderText("Disabled input");
    expect(input).toBeDisabled();
    expect(input).toHaveClass(
      "disabled:opacity-50",
      "disabled:cursor-not-allowed",
    );
  });

  it("applies custom className", () => {
    render(<Input className="custom-class" placeholder="Custom" />);
    expect(screen.getByPlaceholderText("Custom")).toHaveClass("custom-class");
  });
});
