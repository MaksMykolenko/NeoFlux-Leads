import assert from "node:assert/strict";
import test from "node:test";
import {
  canUseFluxPromote,
  checkFluxPromoteAccess,
} from "../src/lib/promotion/access";

test("admin and owner can access Flux Promote", () => {
  assert.equal(canUseFluxPromote({ role: "ADMIN" }), true);
  assert.equal(canUseFluxPromote({ role: "OWNER" }), true);
  assert.equal(canUseFluxPromote({ role: "admin" }), true);
});

test("normal users cannot access Flux Promote", () => {
  assert.equal(canUseFluxPromote({ role: "USER" }), false);
  assert.equal(canUseFluxPromote(null), false);
  assert.deepEqual(checkFluxPromoteAccess({ role: "USER" }), {
    ok: false,
    status: 403,
    error: "FORBIDDEN",
  });
});
