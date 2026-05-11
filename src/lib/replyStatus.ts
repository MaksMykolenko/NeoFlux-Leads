export const REPLY_STATUSES = [
  "No Reply",
  "Replied",
  "Interested",
  "Bounced",
] as const;

export type ReplyStatus = (typeof REPLY_STATUSES)[number];

export function isReplyStatus(value: string): value is ReplyStatus {
  return (REPLY_STATUSES as readonly string[]).includes(value);
}
