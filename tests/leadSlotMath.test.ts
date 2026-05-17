import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateLeadSlotGrant,
  consumeLeadSlot,
} from "../src/lib/leadSlotMath";

test("lead slot grant never exceeds remaining plan limit", () => {
  assert.deepEqual(
    calculateLeadSlotGrant({ wanted: 12, used: 45, limit: 50 }),
    { granted: 5, remainingBefore: 5, limitReached: true },
  );
});

test("lead slot grant allows full wanted count when enough slots remain", () => {
  assert.deepEqual(
    calculateLeadSlotGrant({ wanted: 4, used: 10, limit: 50 }),
    { granted: 4, remainingBefore: 40, limitReached: false },
  );
});

test("universal save budget stops when remaining is exhausted", () => {
  let remaining = 2;
  const first = consumeLeadSlot(remaining);
  assert.equal(first.allowed, true);
  remaining = first.remaining;

  const second = consumeLeadSlot(remaining);
  assert.equal(second.allowed, true);
  remaining = second.remaining;

  const third = consumeLeadSlot(remaining);
  assert.deepEqual(third, { allowed: false, remaining: 0 });
});
