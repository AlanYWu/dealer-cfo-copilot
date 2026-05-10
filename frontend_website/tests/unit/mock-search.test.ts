import { describe, it, expect } from "vitest";
import { searchIndex } from "@/lib/rag/mock-search";
import type { WorkspaceIndex } from "@/lib/rag/indexer";

const INDEX: WorkspaceIndex = {
  d_1: {
    docId: "d_1",
    docName: "Ford_Manual.pdf",
    folder: "Ford",
    pages: 2,
    sizeBytes: 100,
    uploadedAt: "2026-04-16T00:00:00Z",
    relativePath: "Ford/Ford_Manual.pdf",
    pagesText: [
      "Chapter 1. Each technician has an hourly rate. Flat rate technicians are paid per booked hour.",
      "Unapplied labor is the amount of time you are paying for but not collecting from a customer.",
    ],
  },
  d_2: {
    docId: "d_2",
    docName: "GMC_Guide.pdf",
    folder: "GMC",
    pages: 1,
    sizeBytes: 100,
    uploadedAt: "2026-04-16T00:00:00Z",
    relativePath: "GMC/GMC_Guide.pdf",
    pagesText: [
      "This guide covers warranty rates and retention policies for GMC dealerships.",
    ],
  },
};

describe("mock-search", () => {
  it("returns quotes that contain all query terms", () => {
    const quotes = searchIndex(INDEX, "unapplied labor");
    expect(quotes.length).toBeGreaterThan(0);
    const top = quotes[0];
    expect(top.docId).toBe("d_1");
    expect(top.page).toBe(2);
    expect(top.text.toLowerCase()).toContain("unapplied");
  });

  it("includes contextBefore and contextAfter around the match", () => {
    const quotes = searchIndex(INDEX, "unapplied labor");
    expect(quotes[0].contextBefore).toBeDefined();
    expect(quotes[0].contextAfter).toBeDefined();
    expect(quotes[0].text.length).toBeLessThanOrEqual(500);
  });

  it("filters by scope.folders", () => {
    const ford = searchIndex(INDEX, "technician", { folders: ["Ford"] });
    expect(ford.every((q) => q.folder === "Ford")).toBe(true);

    const gmc = searchIndex(INDEX, "technician", { folders: ["GMC"] });
    expect(gmc.length).toBe(0);
  });

  it("filters by scope.docIds", () => {
    const quotes = searchIndex(INDEX, "rate", { docIds: ["d_2"] });
    expect(quotes.every((q) => q.docId === "d_2")).toBe(true);
  });

  it("returns quotes ranked by score descending", () => {
    const quotes = searchIndex(INDEX, "technician rate hourly");
    for (let i = 1; i < quotes.length; i++) {
      expect(quotes[i - 1].score).toBeGreaterThanOrEqual(quotes[i].score);
    }
  });

  it("returns an empty list when nothing matches", () => {
    expect(searchIndex(INDEX, "xylophone xyz12345")).toEqual([]);
  });
});
