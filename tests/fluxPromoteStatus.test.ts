import assert from "node:assert/strict";
import test from "node:test";
import { canDraftFluxPromoteMessage } from "../src/lib/promotion/status";

test("Do Not Contact blocks Flux Promote message drafting", () => {
  assert.equal(canDraftFluxPromoteMessage("Do not contact"), false);
  assert.equal(canDraftFluxPromoteMessage("New"), true);
  assert.equal(canDraftFluxPromoteMessage("Message drafted"), true);
});
