import assert from "node:assert/strict";
import test from "node:test";
import {
  claimReasonForDeliveryStatus,
  isClaimableDeliveryStatus,
} from "../src/lib/emailDeliveryState";

test("only draft and failed messages are claimable for sending", () => {
  assert.equal(isClaimableDeliveryStatus("DRAFT"), true);
  assert.equal(isClaimableDeliveryStatus("FAILED"), true);
  assert.equal(isClaimableDeliveryStatus("SENDING"), false);
  assert.equal(isClaimableDeliveryStatus("SENT"), false);
});

test("sent and in-flight messages are not sent twice", () => {
  assert.equal(claimReasonForDeliveryStatus("SENT"), "ALREADY_SENT");
  assert.equal(claimReasonForDeliveryStatus("SENDING"), "IN_FLIGHT");
  assert.equal(claimReasonForDeliveryStatus(null), "NOT_FOUND");
});
