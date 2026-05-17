import assert from "node:assert/strict";
import test from "node:test";
import { LeadMode, modeFromQuery, modeKeyFromMode } from "../src/lib/leadMode";

test("existing campaign mode query keys remain unchanged", () => {
  assert.equal(modeFromQuery(undefined), LeadMode.LOCAL);
  assert.equal(modeFromQuery("beats"), LeadMode.BEATS);
  assert.equal(modeFromQuery("universal"), LeadMode.UNIVERSAL);
  assert.equal(modeKeyFromMode(LeadMode.LOCAL), "local");
  assert.equal(modeKeyFromMode(LeadMode.BEATS), "beats");
  assert.equal(modeKeyFromMode(LeadMode.UNIVERSAL), "universal");
});
