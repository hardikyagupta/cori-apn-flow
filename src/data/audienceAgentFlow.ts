import type { AdhocCondition } from "@/components/campaigns/campaign-creation/CampaignAudienceStep";
import type { FlowQuestion } from "@/data/pushCartFlow";

/**
 * Zeno builds an audience in conversation, from the wizard's docked chat.
 * The marketer states a business goal ("increase repeat purchases…"); Zeno
 * narrows it with a handful of questions, and the Audience step on the left
 * updates as the answers come in — first a draft, then a refined segment —
 * until the marketer applies it.
 */

/** Anything about growing repeat purchases / sales from existing customers. */
export function isAudienceGoalPrompt(message: string): boolean {
  const aboutExisting = /repeat\s+(purchase|buyer|customer|order)|existing\s+customers|returning\s+(customers|shoppers|buyers)|win\s*back/i.test(message);
  return aboutExisting && /sales|purchase|revenue|orders|buy/i.test(message);
}

// ---------------------------------------------------------------- questions

export const FOCUS_RECOVER = "Recover potentially lost purchases";

export const FOCUS_QUESTION: FlowQuestion = {
  id: "focus",
  title: "What would you like to focus on?",
  options: [
    FOCUS_RECOVER,
    "Encourage repeat purchases",
    "Re-engage inactive customers",
    "Explore other opportunities",
  ],
  required: true,
  confirmLabel: "Continue",
};

export const INTEREST_CART = "Added products to cart";
export const INTEREST_VIEWED = "Viewed products";
export const INTEREST_BOTH = "Both";

export const INTEREST_QUESTION: FlowQuestion = {
  id: "interest",
  title: "Which shoppers should we focus on?",
  options: [INTEREST_CART, INTEREST_VIEWED, INTEREST_BOTH],
  required: true,
  confirmLabel: "Continue",
};

const RECENCY_OPTIONS = ["In the last 24 hours", "In the last 3 days", "In the last 7 days"];

export function recencyQuestion(interest: string): FlowQuestion {
  const what =
    interest === INTEREST_VIEWED ? "viewed products" : interest === INTEREST_BOTH ? "shown interest" : "added products to their cart";
  return {
    id: "recency",
    title: `How recently should they have ${what}?`,
    options: RECENCY_OPTIONS,
    otherPlaceholder: "Custom time range (e.g. 14 days)",
    required: true,
    confirmLabel: "Continue",
  };
}

export const CHECKOUT_YES = "Yes, exclude them";

export const CHECKOUT_QUESTION: FlowQuestion = {
  id: "checkout",
  title: "Should we exclude users who have already completed checkout?",
  options: [CHECKOUT_YES, "No, include them"],
  required: true,
  confirmLabel: "Continue",
};

export const REACH_QUESTION: FlowQuestion = {
  id: "reach",
  title: "How should I balance reach and precision?",
  options: ["Tighter cut, highest intent", "Balanced", "Widest reachable audience"],
  otherPlaceholder: "Something else",
  required: true,
  confirmLabel: "Continue",
};

export const HOLDBACK_QUESTION: FlowQuestion = {
  id: "holdback",
  title: "Anyone I should hold back?",
  options: [
    "Recent purchasers",
    "Already in an active journey",
    "Contacted in the last 7 days",
    "Bounced or complained",
  ],
  otherPlaceholder: "Something else",
  multi: true,
  confirmLabel: "Continue",
};

export const APPLY_YES = "Apply audience";

export const APPLY_QUESTION: FlowQuestion = {
  id: "apply",
  title: "Would you like to apply this audience to your campaign?",
  options: [APPLY_YES, "Continue refining"],
  required: true,
  confirmLabel: "Continue",
};

// ------------------------------------------------------------------ the draft

export interface AudienceAgentState {
  focus?: string;
  interest?: string;
  recency?: string;
  excludeCheckout?: boolean;
  reach?: string;
  holdbacks?: string[];
}

/** A segment the agent has built, in the shape the wizard plots. */
export interface AudienceDraft {
  name: string;
  conditions: AdhocCondition[];
  reach: number;
  /** One line per rule, for the summary card. */
  include: string;
  excludes: { id: string; name: string; text: string; reach: number }[];
  strategy: string;
  /** The goal the audience was cut for, and why this cut suits it. */
  goal: string;
  why: string;
  /** Refined once the holdback question has been answered. */
  refined: boolean;
}

/** "In the last 24 hours" → { value: "1 day", label: "24 hours" } — the picker's own
 *  "N days" format, so the condition row reads like one typed by hand. */
function windowFor(recency: string): { value: string; label: string; short: string; reach: number } {
  if (/24\s*hours|1\s*day/i.test(recency)) return { value: "1 day", label: "24 hours", short: "Last 24 Hours", reach: 6_420 };
  if (/3\s*days/i.test(recency)) return { value: "3 days", label: "3 days", short: "Last 3 Days", reach: 14_860 };
  if (/7\s*days/i.test(recency)) return { value: "7 days", label: "7 days", short: "Last 7 Days", reach: 21_300 };
  const custom = recency.match(/(\d+)\s*(day|week|hour)s?/i);
  if (custom) {
    const n = Number(custom[1]);
    const unit = custom[2].toLowerCase();
    const days = unit === "week" ? n * 7 : unit === "hour" ? Math.max(1, Math.round(n / 24)) : n;
    const label = `${n} ${unit}${n === 1 ? "" : "s"}`;
    return { value: `${days} day${days === 1 ? "" : "s"}`, label, short: `Last ${label}`, reach: Math.min(40_000, 1_900 + days * 2_900) };
  }
  return { value: "30 days", label: "30 days", short: "Last 30 Days", reach: 9_000 };
}

const REACH_FACTOR: Record<string, number> = {
  "Tighter cut, highest intent": 0.6,
  Balanced: 1,
  "Widest reachable audience": 1.4,
};

const HOLDBACK_NAME: Record<string, { name: string; text: string; cut: number }> = {
  "Recent purchasers": { name: "Recent purchasers", text: "Meet any separately configured recent-purchaser exclusion criteria", cut: 0.06 },
  "Already in an active journey": { name: "Already in an active journey", text: "Are already in an active journey", cut: 0.09 },
  "Contacted in the last 7 days": { name: "Contacted in the last 7 days", text: "Have been contacted in the last 7 days", cut: 0.14 },
  "Bounced or complained": { name: "Bounced or complained", text: "Bounced or complained", cut: 0.02 },
};

/** What the marketer's picks add up to. Counts are illustrative until the
 *  real segment service sizes them. */
export function buildAudienceDraft(state: AudienceAgentState): AudienceDraft {
  const win = windowFor(state.recency ?? "");
  const interest = state.interest ?? INTEREST_CART;
  const verb = interest === INTEREST_VIEWED ? "Viewed products" : interest === INTEREST_BOTH ? "Viewed or added products" : "Added to cart";
  const phrase =
    interest === INTEREST_VIEWED
      ? "Viewed products"
      : interest === INTEREST_BOTH
        ? "Viewed products or added them to their cart"
        : "Added products to their cart";

  const conditions: AdhocCondition[] = [
    { attribute: verb, type: "recency", operator: "in the last", value: win.value },
  ];
  if (state.excludeCheckout !== false) {
    conditions.push({ attribute: "Purchase", type: "recency", operator: "not in the last", value: win.value });
  }

  const strategy = state.reach && REACH_FACTOR[state.reach] ? state.reach : state.reach ? `${state.reach}` : "Balanced";
  let reach = Math.round(win.reach * (interest === INTEREST_VIEWED ? 2.1 : interest === INTEREST_BOTH ? 2.6 : 1) * (REACH_FACTOR[strategy] ?? 1));

  const excludes = (state.holdbacks ?? []).map((h, i) => {
    const info = HOLDBACK_NAME[h] ?? { name: h, text: h, cut: 0.03 };
    const removed = Math.round(reach * info.cut);
    reach -= removed;
    return { id: `agent-hold-${i}`, name: info.name, text: info.text, reach: removed };
  });

  const refined = state.holdbacks !== undefined;
  return {
    name: `${interest === INTEREST_CART ? "Cart Abandoners" : interest === INTEREST_VIEWED ? "Product Viewers" : "Shoppers With Intent"} — ${win.short}`,
    conditions,
    reach,
    include: `${phrase} in the last ${win.label}${state.excludeCheckout !== false ? " and haven't completed checkout" : ""}.`,
    excludes,
    strategy,
    goal: state.focus ?? FOCUS_RECOVER,
    why:
      interest === INTEREST_VIEWED
        ? "They've shown interest but haven't committed. Expect a broader, slower lift than cart abandoners."
        : interest === INTEREST_BOTH
          ? "Covers shoppers at every stage of intent. The widest reach, with a mixed lift."
          : "Shoppers with items waiting in their cart are your warmest group. Expect the fastest, strongest lift.",
    refined,
  };
}

/** The line Zeno says once it has the recency and the checkout answer. */
export function draftSentence(state: AudienceAgentState): string {
  const win = windowFor(state.recency ?? "");
  const what =
    state.interest === INTEREST_VIEWED
      ? "viewed products"
      : state.interest === INTEREST_BOTH
        ? "viewed products or added them to their cart"
        : "added products to their cart";
  return `Got it. We'll target users who ${what} in the last ${win.label}${
    state.excludeCheckout !== false ? " but haven't checked out" : ""
  }.`;
}

/** The marketer's own words for their holdback picks. */
export function holdbackSentence(picks: string[]): string {
  const first: Record<string, string> = {
    "Recent purchasers": "recent purchasers",
    "Already in an active journey": "users who are already in an active journey",
    "Contacted in the last 7 days": "users contacted in the last 7 days",
    "Bounced or complained": "bounced or complained addresses",
  };
  const later: Record<string, string> = {
    "Already in an active journey": "those already in an active journey",
    "Contacted in the last 7 days": "those contacted in the last 7 days",
  };
  const parts = picks.map((p, i) => (i === 0 ? first[p] : later[p] ?? first[p]) ?? p.toLowerCase());
  if (parts.length === 0) return "No one to hold back.";
  const joined = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  return `Exclude ${joined}.`;
}

/** The draft as the Audience step shows it. */
export type AudienceDraftView = AudienceDraft & { status: "draft" | "applied" };

/** Everything the host (the wizard) needs from the conversation. */
export interface AudienceAgentHost {
  /** A draft, then a refined draft, to plot on the Audience step. */
  onDraft: (draft: AudienceDraft) => void;
  /** The marketer chose Apply audience (or Continue refining) in the chat. */
  onDecision: (decision: "apply" | "refine") => void;
}
