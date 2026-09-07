import { describe, expect, it } from "vitest";
import { isValidProjectName, satisfiesCaretRange, toPackageName } from "./names.js";

describe("isValidProjectName", () => {
  it("accepts scoped and plain names", () => {
    expect(isValidProjectName("my-app")).toBe(true);
    expect(isValidProjectName("@acme/web")).toBe(true);
  });

  it("rejects empty and invalid names", () => {
    expect(isValidProjectName("")).toBe(false);
    expect(isValidProjectName("My App")).toBe(false);
    expect(isValidProjectName(".hidden")).toBe(false);
  });
});

describe("toPackageName", () => {
  it("normalizes mixed input", () => {
    expect(toPackageName("My App")).toBe("my-app");
  });
});

describe("satisfiesCaretRange", () => {
  it("matches caret ranges", () => {
    expect(satisfiesCaretRange("0.1.4", "^0.1.0")).toBe(true);
    expect(satisfiesCaretRange("0.2.0", "^0.1.0")).toBe(false);
    expect(satisfiesCaretRange("1.2.3", "^1.0.0")).toBe(true);
    expect(satisfiesCaretRange("2.0.0", "^1.0.0")).toBe(false);
  });
});
