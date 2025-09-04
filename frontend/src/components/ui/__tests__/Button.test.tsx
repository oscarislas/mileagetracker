import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { PlusIcon } from "@heroicons/react/24/outline";
import Button from "../Button";

describe("Button", () => {
  it("renders with default props", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it("renders different variants", () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-ctp-blue");

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-ctp-red");

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-ctp-surface1");
  });

  it("renders different sizes", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button")).toHaveClass("px-3", "py-2", "text-sm");

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button")).toHaveClass("px-6", "py-4", "text-base");
  });

  it("shows loading state", () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders with icon", () => {
    render(<Button icon={PlusIcon}>Add Item</Button>);
    const button = screen.getByRole("button");
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("renders full width when specified", () => {
    render(<Button fullWidth>Full Width</Button>);
    expect(screen.getByRole("button")).toHaveClass("w-full");
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });
});
