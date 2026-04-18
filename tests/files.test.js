import { describe, expect, it } from "vitest";
import { collectExtensionIds } from "../src/lib/files.js";

describe("collectExtensionIds", () => {
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
