import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pkgStatus } from "../lib/pkg.js";
describe("pkg", () => {
  it("status", async () => assert.equal((await pkgStatus()).ok, true));
});
