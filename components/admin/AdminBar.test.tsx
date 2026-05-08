import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminBar } from "./AdminBar";

vi.mock("./AdminProvider", () => ({
  useAdmin: () => ({
    isEditing: true,
    previewing: false,
    togglePreview: vi.fn(),
  }),
}));

describe("AdminBar", () => {
  it("renders an EDITING pill when admin is editing", () => {
    render(<AdminBar />);
    expect(screen.getByText(/editing/i)).toBeInTheDocument();
  });

  it("renders View as visitor button", () => {
    render(<AdminBar />);
    expect(screen.getByRole("button", { name: /view as visitor/i })).toBeInTheDocument();
  });
});
