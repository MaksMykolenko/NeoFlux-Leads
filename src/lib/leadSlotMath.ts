export function calculateLeadSlotGrant({
  wanted,
  used,
  limit,
}: {
  wanted: number;
  used: number;
  limit: number;
}): { granted: number; remainingBefore: number; limitReached: boolean } {
  if (wanted <= 0) {
    return { granted: 0, remainingBefore: 0, limitReached: false };
  }
  if (limit === Number.POSITIVE_INFINITY) {
    return {
      granted: wanted,
      remainingBefore: Number.POSITIVE_INFINITY,
      limitReached: false,
    };
  }
  const remainingBefore = Math.max(0, limit - Math.max(0, used));
  const granted = Math.min(wanted, remainingBefore);
  return {
    granted,
    remainingBefore,
    limitReached: granted < wanted,
  };
}

export function consumeLeadSlot(remaining: number): {
  allowed: boolean;
  remaining: number;
} {
  if (remaining <= 0) return { allowed: false, remaining };
  if (remaining === Number.POSITIVE_INFINITY) {
    return { allowed: true, remaining };
  }
  return { allowed: true, remaining: remaining - 1 };
}
