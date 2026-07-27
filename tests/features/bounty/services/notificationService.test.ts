import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createNotification = vi.fn();
const checkNotificationMute = vi.fn();

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    createNotification: (...args: unknown[]) => createNotification(...args),
    checkNotificationMute: (...args: unknown[]) =>
      checkNotificationMute(...args),
  },
}));

import {
  notifyCommentLike,
  notifyCommentReply,
  notifyNewComment,
  notifyNewSubmission,
  notifySponsorApproved,
  notifySponsorRejected,
  notifySubmissionApproved,
  notifySubmissionRejected,
  shouldNotify,
} from "@/features/bounty/services/notificationService";

beforeEach(() => {
  createNotification.mockReset().mockResolvedValue({ notification: {} });
  checkNotificationMute.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("notifySubmissionApproved", () => {
  it("includes the reward amount and token when provided", async () => {
    await notifySubmissionApproved(
      "user-1",
      "bounty-1",
      "Build a Thing",
      100,
      "ALPH",
    );
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        type: "submission_accepted",
        message: expect.stringContaining("100 ALPH"),
        link: "/bounty/bounty-1",
      }),
    );
  });

  it("omits the reward sentence when amount/currency are missing", async () => {
    await notifySubmissionApproved("user-1", "bounty-1", "Build a Thing");
    const message = createNotification.mock.calls[0][0].message;
    expect(message).toBe(
      'Your submission for "Build a Thing" has been approved!',
    );
  });
});

describe("notifySubmissionRejected", () => {
  it("includes sponsor feedback when provided", async () => {
    await notifySubmissionRejected(
      "user-1",
      "bounty-1",
      "Build a Thing",
      "Missing tests",
    );
    const message = createNotification.mock.calls[0][0].message;
    expect(message).toContain("Feedback: Missing tests");
  });

  it("falls back to a generic message with no feedback", async () => {
    await notifySubmissionRejected("user-1", "bounty-1", "Build a Thing");
    const message = createNotification.mock.calls[0][0].message;
    expect(message).toBe('Your submission for "Build a Thing" was rejected.');
  });
});

describe("notifySponsorRejected", () => {
  it("includes a reason when provided, and a support pointer otherwise", async () => {
    await notifySponsorRejected("user-1", "Acme", "Incomplete profile");
    expect(createNotification.mock.calls[0][0].message).toContain(
      "Reason: Incomplete profile",
    );

    createNotification.mockClear();
    await notifySponsorRejected("user-1", "Acme");
    expect(createNotification.mock.calls[0][0].message).toContain(
      "contact support",
    );
  });
});

describe("notifySponsorApproved", () => {
  it("links to the sponsor dashboard", async () => {
    await notifySponsorApproved("user-1", "Acme");
    expect(createNotification.mock.calls[0][0].link).toBe(
      "/bounty/sponsor/dashboard",
    );
  });
});

describe("notifyNewSubmission", () => {
  it("includes the submitter name and a submission-scoped link when both are known", async () => {
    await notifyNewSubmission(
      "sponsor-1",
      "bounty-1",
      "Build a Thing",
      "alice",
      "sub-1",
    );
    const payload = createNotification.mock.calls[0][0];
    expect(payload.message).toContain("from alice");
    expect(payload.link).toBe("/bounty/sponsor/dashboard?submission=sub-1");
  });

  it("degrades gracefully when submitter/submission id are unknown", async () => {
    await notifyNewSubmission("sponsor-1", "bounty-1", "Build a Thing");
    const payload = createNotification.mock.calls[0][0];
    expect(payload.message).not.toContain("from");
    expect(payload.link).toBe("/bounty/sponsor/dashboard");
  });
});

describe("notifyCommentReply / notifyCommentLike / notifyNewComment", () => {
  it("credits the acting username when known", async () => {
    await notifyCommentReply("user-1", "bounty-1", "Build a Thing", "bob");
    expect(createNotification.mock.calls[0][0].message).toContain(
      "bob replied",
    );

    await notifyCommentLike("user-1", "bounty-1", "Build a Thing", "carol");
    expect(createNotification.mock.calls[1][0].message).toContain(
      "carol liked",
    );

    await notifyNewComment("sponsor-1", "bounty-1", "Build a Thing", "dave");
    expect(createNotification.mock.calls[2][0].message).toContain(
      "dave commented",
    );
  });

  it('falls back to "Someone" when the actor username is unknown', async () => {
    await notifyCommentReply("user-1", "bounty-1", "Build a Thing");
    expect(createNotification.mock.calls[0][0].message).toContain(
      "Someone replied",
    );
  });
});

describe("createNotification failure handling", () => {
  it("swallows apiClient errors instead of throwing (best-effort notifications)", async () => {
    createNotification.mockRejectedValueOnce(new Error("network down"));
    await expect(
      notifySubmissionApproved("user-1", "bounty-1", "Build a Thing"),
    ).resolves.toBeUndefined();
  });
});

describe("shouldNotify", () => {
  it("returns false when the user has muted the bounty", async () => {
    checkNotificationMute.mockResolvedValue({ muted: true });
    await expect(shouldNotify("user-1", "bounty-1", "comments")).resolves.toBe(
      false,
    );
  });

  it("returns true when the user has not muted the bounty", async () => {
    checkNotificationMute.mockResolvedValue({ muted: false });
    await expect(
      shouldNotify("user-1", "bounty-1", "submissions"),
    ).resolves.toBe(true);
  });

  it("defaults to true (send notifications) if the mute check itself fails", async () => {
    checkNotificationMute.mockRejectedValue(new Error("network down"));
    await expect(shouldNotify("user-1", "bounty-1", "comments")).resolves.toBe(
      true,
    );
  });
});
