import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "../LoadingSpinner";

describe("LoadingSpinner", () => {
  describe("Rendering", () => {
    it("should render with default props", () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole("status");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute("aria-label", "Loading");
    });

    it("should render with loading text", () => {
      render(<LoadingSpinner text="Loading data..." />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveAttribute("aria-label", "Loading: Loading data...");
      expect(screen.getByText("Loading data...")).toBeInTheDocument();
    });

    it("should render with custom test ID", () => {
      render(<LoadingSpinner data-testid="custom-spinner" />);

      expect(screen.getByTestId("custom-spinner")).toBeInTheDocument();
    });
  });

  describe("Size variants", () => {
    it("should render small spinner", () => {
      render(<LoadingSpinner size="sm" />);

      const spinnerDiv = screen.getByRole("status").querySelector("div");
      expect(spinnerDiv).toHaveClass("h-4", "w-4");
    });

    it("should render medium spinner by default", () => {
      render(<LoadingSpinner />);

      const spinnerDiv = screen.getByRole("status").querySelector("div");
      expect(spinnerDiv).toHaveClass("h-5", "w-5");
    });

    it("should render large spinner", () => {
      render(<LoadingSpinner size="lg" />);

      const spinnerDiv = screen.getByRole("status").querySelector("div");
      expect(spinnerDiv).toHaveClass("h-6", "w-6");
    });

    it("should render extra large spinner", () => {
      render(<LoadingSpinner size="xl" />);

      const spinnerDiv = screen.getByRole("status").querySelector("div");
      expect(spinnerDiv).toHaveClass("h-8", "w-8");
    });
  });

  describe("Color variants", () => {
    it("should render white spinner by default", () => {
      render(<LoadingSpinner />);

      const spinnerDiv = screen.getByRole("status").querySelector("div");
      expect(spinnerDiv).toHaveClass("border-white", "border-t-transparent");
    });

    it("should render blue spinner", () => {
      render(<LoadingSpinner color="blue" />);

      const spinnerDiv = screen.getByRole("status").querySelector("div");
      expect(spinnerDiv).toHaveClass("border-ctp-blue/30", "border-t-ctp-blue");
    });

    it("should render current color spinner", () => {
      render(<LoadingSpinner color="current" />);

      const spinnerDiv = screen.getByRole("status").querySelector("div");
      expect(spinnerDiv).toHaveClass("border-current/30", "border-t-current");
    });
  });

  describe("Text styling", () => {
    it("should render white text by default", () => {
      render(<LoadingSpinner text="Loading..." />);

      const text = screen.getByText("Loading...");
      expect(text).toHaveClass("text-white");
    });

    it("should render blue text for blue color", () => {
      render(<LoadingSpinner text="Loading..." color="blue" />);

      const text = screen.getByText("Loading...");
      expect(text).toHaveClass("text-ctp-blue");
    });

    it("should render current color text", () => {
      render(<LoadingSpinner text="Loading..." color="current" />);

      const text = screen.getByText("Loading...");
      expect(text).toHaveClass("text-current");
    });
  });

  describe("Layout and styling", () => {
    it("should apply centered styling", () => {
      render(<LoadingSpinner centered />);

      const container = screen.getByRole("status");
      expect(container).toHaveClass("justify-center");
    });

    it("should apply custom className", () => {
      render(<LoadingSpinner className="custom-class" />);

      const container = screen.getByRole("status");
      expect(container).toHaveClass("custom-class");
    });

    it("should have proper accessibility attributes", () => {
      render(<LoadingSpinner text="Please wait" />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveAttribute("aria-live", "polite");
      expect(spinner).toHaveAttribute("aria-label", "Loading: Please wait");
    });
  });

  describe("Animation classes", () => {
    it("should have animate-spin class", () => {
      render(<LoadingSpinner />);

      const spinnerDiv = screen.getByRole("status").querySelector("div");
      expect(spinnerDiv).toHaveClass("animate-spin");
    });

    it("should have rounded-full class", () => {
      render(<LoadingSpinner />);

      const spinnerDiv = screen.getByRole("status").querySelector("div");
      expect(spinnerDiv).toHaveClass("rounded-full");
    });

    it("should have proper border classes", () => {
      render(<LoadingSpinner />);

      const spinnerDiv = screen.getByRole("status").querySelector("div");
      expect(spinnerDiv).toHaveClass("border-2");
    });
  });
});
