import { describe, expect, it } from "vitest";
import { collectExtensionIds } from "../src/lib/files.js";

/**
 * Unit tests for file helper behavior that does not require filesystem writes.
 */
describe("collectExtensionIds", () => {
  /**
   * Verifies extension ids remain unique even when group ids repeat.
   */
  it("deduplicates extension ids from multiple groups", () => {
    const extensions = collectExtensionIds([
      "general",
      "containers",
      "general",
    ]);

    expect(extensions).toContain("eamodio.gitlens");
    expect(extensions).toContain("ms-vscode-remote.remote-containers");
    expect(new Set(extensions).size).toBe(extensions.length);
  });
});
