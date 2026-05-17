import assert from "node:assert/strict";
import test from "node:test";
import {
  DO_NOT_CONTACT_STATUS,
  pendingDeliveryLeadWhere,
  pendingDoNotContactLeadWhere,
} from "../src/lib/autopilotDeliveryGuards";

test("pending delivery query excludes do-not-contact leads", () => {
  assert.deepEqual(pendingDeliveryLeadWhere(), {
    pipelineStatus: "PENDING_DELIVERY",
    status: { not: DO_NOT_CONTACT_STATUS },
  });
});

test("DNC sweep query targets only pending do-not-contact leads", () => {
  assert.deepEqual(pendingDoNotContactLeadWhere(), {
    pipelineStatus: "PENDING_DELIVERY",
    status: DO_NOT_CONTACT_STATUS,
  });
});
