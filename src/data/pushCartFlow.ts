import type { AdhocCondition } from "@/components/campaigns/campaign-creation/CampaignAudienceStep";
import type { AudienceDraftView } from "@/data/audienceAgentFlow";
import { toLocalInput } from "@/components/campaigns/campaign-creation/CampaignScheduleStep";
import { COUPON_EXPIRY_TEMPLATE_ID } from "@/components/campaigns/campaign-creation/appPushTemplates.data";

/**
 * Cori's App Push "cart recovery" conversation — typed into the docked Cori
 * window on /campaigns. Cori asks one short set of questions at a time
 * (CoriQuestionsCard), drafts the notification on the Coupon Expiry Reminder
 * template (ID 80006), then hands a campaign brief to the wizard's preview.
 */

export const PUSH_CART_TEMPLATE_ID = COUPON_EXPIRY_TEMPLATE_ID;
export const PUSH_CART_TEMPLATE_NAME = "Coupon Expiry Reminder";

/** Anything that asks for an app push / APN campaign around carts. */
export function isPushCartPrompt(message: string): boolean {
  return /app\s*push|\bapn\b|push\s*notification|mobile\s*push/i.test(message) && /cart|checkout|check\s*out/i.test(message);
}

/** The channel-agnostic opener — the marketer names who to reach, not the
 *  channel, so Cori recommends one first (see CHANNEL_QUESTION). */
export function isChannelAskPrompt(message: string): boolean {
  const mentionsCart = /cart|basket|abandon/i.test(message);
  const leftWithoutBuying =
    /(haven'?t|have not|hasn'?t|didn'?t|did not|not|never|without|yet to)\s+(yet\s+)?(checked\s*out|check\s*out|purchased|bought|buy|completed|ordered|finished)/i.test(message) ||
    /abandon(ed|ers?|ment)?\s+(their\s+)?(cart|basket|checkout)|(cart|basket|checkout)\s+abandon/i.test(message) ||
    /left\s+(items|products)?.*\b(in|behind)\b.*(cart|basket)/i.test(message);
  return mentionsCart && leftWithoutBuying && !isPushCartPrompt(message);
}

/** The Content step's "Cart reminder" ask — Cori drafts the notification itself. */
export function isCartReminderPrompt(message: string): boolean {
  return /cart/i.test(message) && /(reminder|nudg|finish|complete|abandon)/i.test(message) && /(title|message|push|notification|reminder)/i.test(message);
}

/** Title of the card that sends the marketer from Audience on to Content. */
export const PUSH_CONTENT_CTA = "Write the notification";

/** v1 of the cart reminder Cori writes on the Content step. */
export const CART_REMINDER_V1 = {
  title: "Your cart is waiting! 🛒",
  message: "Complete your purchase before your favourites are gone.",
};

/** v2 of the cart reminder, after the marketer asks for a specific discount
 *  and more urgency. `{{disc_value}}` is the per-user personalisation tag. */
export const CART_REMINDER_V2 = {
  title: "Abhi nahi toh kab? ⏰",
  message: "Complete your purchase tonight and enjoy {{disc_value}} off!",
  media: "https://img.magnific.com/free-vector/halftone-style-comic-sale-background-yellow-white-color_1017-59305.jpg",
};

/** The one-tap feedback Cori offers under v1. */
export const CART_V2_FEEDBACK =
  "Make the offer more specific by showing the discount amount, and create more urgency by highlighting that the exclusive offer ends tonight.";

/** Feedback on v1 that asks for the discount and/or urgency. */
export function isCartFeedbackPrompt(message: string): boolean {
  return /(discount|offer|amount|specific|urgen|tonight|ends|hurry|deadline|limited)/i.test(message);
}

/** What the wizard's Content step hands Cori so a drafted notification lands
 *  in the editor. */
export interface ContentAgentHost {
  onDraft: (draft: { title: string; message: string; version: number; media?: string }) => void;
}

/** "cancel", "start over", "never mind" — the marketer wants out of the scripted flow. */
export function isCancelPrompt(message: string): boolean {
  return /^\s*(cancel|stop|start over|start again|never\s*mind|forget it|reset|exit)\b/i.test(message);
}

/** Which of a question's options the marketer's typed words amount to, if any —
 *  exact label, a label named inside the sentence, or a plain yes / no. */
export function matchOption(message: string, options: string[]): string | null {
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  const said = norm(message);
  if (!said) return null;
  const exact = options.find(o => norm(o) === said);
  if (exact) return exact;
  const named = options
    .filter(o => said.includes(norm(o)))
    .sort((x, y) => y.length - x.length)[0];
  if (named) return named;
  const partial = said.length >= 4 ? options.filter(o => norm(o).includes(said)) : [];
  if (partial.length === 1) return partial[0];
  if (/^(yes|yep|yeah|sure|ok|okay|go ahead|do it)\b/.test(said)) return options.find(o => /^yes/i.test(o)) ?? null;
  if (/^(no|nope|nah)\b/.test(said)) return options.find(o => /^no\b/i.test(o)) ?? null;
  return null;
}

/** Which channel a free-typed message names, if any. */
export function namedChannel(message: string): "push" | "other" | null {
  if (/app\s*push|push\s*notification|\bapn\b|mobile\s*push/i.test(message)) return "push";
  if (/e-?mail|sms|whats\s*app|\brcs\b|web\s*push|in-?app|facebook|instagram|\bmms\b/i.test(message)) return "other";
  return null;
}

export type FlowAnswers = Record<string, string | null>;

export interface FlowQuestion {
  id: string;
  title: string;
  options: string[];
  /** Placeholder for the free-text "Other" row — its presence turns the row on. */
  otherPlaceholder?: string;
  /** Adds a calendar button to the Other row that picks a date and time. */
  otherDateTime?: boolean;
  /** More than one option can be picked; the answer is the picks joined by
   *  newlines (plus any typed text). */
  multi?: boolean;
  /** Can't be passed over — the Skip button is dropped. */
  required?: boolean;
  /** Label for this question's primary button when it is the last one. */
  confirmLabel?: string;
  /** Only asked when this passes (e.g. the promo-code question). */
  showIf?: (answers: FlowAnswers) => boolean;
  /** Id of the question `showIf` reads — until it's answered, this question
   *  still counts toward the pager's total so the count doesn't jump. Leave
   *  unset for a question that only appears on a less likely branch. */
  dependsOn?: string;
}

export const DISCOUNT_OBJECTIVE = "Offer a discount to encourage conversion";
export const PROMO_YES = "Yes, I'll provide a promo code";
export const SEND_SPECIFIC = "Send at a specific date and time";
export const SEND_OPTIMIZER = "Use the Send time optimizer agent";

export const CHANNEL_YES = "Yes, use App Push";
export const CHANNEL_EXPLORE = "Explore other channels";

/** Cori's recommendation, said before any campaign question is asked. */
export const CHANNEL_RECOMMENDATION =
  "App Push has delivered a 24% higher engagement rate than your other channels over the last 30 days, making it a strong choice to re-engage shoppers who haven't completed their purchase. Would you like to use it for this campaign?";

export const CHANNEL_QUESTIONS: FlowQuestion[] = [
  {
    id: "channel",
    title: "Would you like to use App Push for this campaign?",
    options: [CHANNEL_YES, CHANNEL_EXPLORE],
    required: true,
    confirmLabel: "Continue",
  },
];

export const STAGE_ONE_QUESTIONS: FlowQuestion[] = [
  {
    id: "qualify",
    title: "When should a user qualify for this campaign?",
    options: [
      "Added to cart in the last 24 hours",
      "Added to cart in the last 3 days",
      "Added to cart but hasn't purchased",
    ],
    otherPlaceholder: "Enter a custom condition",
  },
  {
    id: "objective",
    title: "What should the push notification encourage them to do?",
    options: [
      "Remind them to complete their purchase",
      DISCOUNT_OBJECTIVE,
      "Highlight products left in their cart",
    ],
    otherPlaceholder: "Describe your goal",
  },
  {
    id: "promo",
    title: "Do you have a promo code you'd like to include?",
    options: [PROMO_YES, "No promo code needed"],
    showIf: (a) => a.objective === DISCOUNT_OBJECTIVE,
    dependsOn: "objective",
  },
];

export const STAGE_TWO_QUESTIONS: FlowQuestion[] = [
  {
    id: "devices",
    title: "Which devices should receive the push notification?",
    options: ["All devices", "Active devices only"],
  },
  {
    id: "send",
    title: "How would you like to schedule this campaign?",
    options: [SEND_SPECIFIC, SEND_OPTIMIZER],
  },
  {
    id: "sendTime",
    title: "What date and time should it go out?",
    options: ["Today, 6:00 PM", "Tomorrow, 10:00 AM", "Tomorrow, 7:00 PM"],
    otherPlaceholder: "Enter a date and time",
    otherDateTime: true,
    showIf: (a) => a.send === SEND_SPECIFIC,
  },
];

export interface PushCartDraft {
  qualify: string;
  objective: string;
  promoCode: string | null;
  title: string;
  body: string;
  /** Fills {{disc_value}} in the title; blank leaves the variable as-is. */
  discountValue: string;
  richMedia: boolean;
  countdown: boolean;
  devices: string;
  sendMode: "specific" | "optimizer";
  sendLabel: string;
}

/** What Cori's recommendation for "Use the Send time optimizer agent" says. */
export const OPTIMIZER_RECOMMENDATION = "Today, 7:30 PM";
export const COUNTDOWN_PREVIEW = "09:34:28";

const answerOr = (a: FlowAnswers, id: string, fallback: string) => a[id] ?? fallback;

/** Notification copy for the chosen objective. A discount gets the variable title. */
export function contentFor(objective: string): Pick<PushCartDraft, "title" | "body"> {
  if (objective === DISCOUNT_OBJECTIVE) {
    return { title: "{{disc_value}} off 🔥", body: "Your exclusive offer ends tonight. Use it before it's gone." };
  }
  if (objective === "Highlight products left in their cart") {
    return { title: "Still in your cart 🛒", body: "The items you picked are selling fast. Take another look." };
  }
  if (objective === "Remind them to complete their purchase") {
    return { title: "Your cart is waiting 🛒", body: "Complete your purchase before your picks sell out." };
  }
  return { title: "Don't miss out 🔥", body: "Come back and finish what you started." };
}

/** Turns stage-one and stage-two answers into the draft the cards edit. */
export function draftFrom(one: FlowAnswers, two: FlowAnswers, promoCode?: string | null): PushCartDraft {
  const objective = answerOr(one, "objective", "Remind them to complete their purchase");
  const sendMode = two.send === SEND_SPECIFIC ? "specific" : "optimizer";
  return {
    qualify: answerOr(one, "qualify", "Added to cart but hasn't purchased"),
    objective,
    promoCode: promoCode ?? (one.promo === PROMO_YES ? "" : null),
    ...contentFor(objective),
    discountValue: "",
    richMedia: true,
    countdown: true,
    devices: answerOr(two, "devices", "All devices"),
    sendMode,
    sendLabel: sendMode === "specific" ? answerOr(two, "sendTime", "Tomorrow, 10:00 AM") : OPTIMIZER_RECOMMENDATION,
  };
}

/** The discount path shows a first, softer draft before the one it lands on —
 *  the marketer's feedback below is what turns it into the current copy. */
export const FIRST_DRAFT_TITLE = "Your cart won't wait! 🔥";
export const FIRST_DRAFT_BODY = "Get your offer before it's gone.";
export const FIRST_DRAFT_FEEDBACK =
  "Make the offer more specific by showing the discount amount, and create more urgency by highlighting that the exclusive offer ends tonight.";

/** Title with {{disc_value}} filled in once the marketer has typed a value. */
export function resolvedTitle(d: Pick<PushCartDraft, "title" | "discountValue">): string {
  return d.discountValue.trim() ? d.title.replace(/\{\{\s*disc_value\s*\}\}/g, d.discountValue.trim()) : d.title;
}

const REACH_BY_QUALIFY: Record<string, number> = {
  "Added to cart in the last 24 hours": 6_420,
  "Added to cart in the last 3 days": 14_860,
  "Added to cart but hasn't purchased": 11_230,
};

export function reachFor(d: Pick<PushCartDraft, "qualify" | "devices">): number {
  const base = REACH_BY_QUALIFY[d.qualify] ?? 9_000;
  return d.devices === "Active devices only" ? Math.round(base * 0.72) : base;
}

export function conditionsFor(d: Pick<PushCartDraft, "qualify">): AdhocCondition[] {
  const cart = (value: string): AdhocCondition => ({
    attribute: "Added to cart",
    type: "recency",
    operator: "in the last",
    value,
  });
  const notPurchased = (value: string): AdhocCondition => ({
    attribute: "Purchase",
    type: "recency",
    operator: "not in the last",
    value,
  });
  if (d.qualify === "Added to cart in the last 24 hours") return [cart("1 day"), notPurchased("1 day")];
  if (d.qualify === "Added to cart in the last 3 days") return [cart("3 days"), notPurchased("3 days")];
  if (d.qualify === "Added to cart but hasn't purchased") return [cart("30 days"), notPurchased("30 days")];
  return [cart("30 days")];
}

/** "Today, 6:00 PM" / "Tomorrow, 10:00 AM" → a `datetime-local` value. Free
 *  text that can't be read falls back to tomorrow at 10:00. */
export function sendAtFor(label: string): string {
  const d = new Date();
  const m = label.match(/(today|tomorrow)[,\s]+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (m) {
    if (m[1].toLowerCase() === "tomorrow") d.setDate(d.getDate() + 1);
    let h = Number(m[2]) % 12;
    if (m[4].toLowerCase() === "pm") h += 12;
    d.setHours(h, Number(m[3] ?? 0), 0, 0);
  } else if (!Number.isNaN(Date.parse(label))) {
    d.setTime(Date.parse(label));
  } else {
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
  }
  if (d.getTime() < Date.now() + 15 * 60 * 1000) d.setTime(Date.now() + 17 * 60 * 1000);
  return toLocalInput(d);
}

export function campaignNameFor(d: Pick<PushCartDraft, "objective">): string {
  return d.objective === DISCOUNT_OBJECTIVE
    ? "Cart Recovery — Discount Push"
    : "Cart Recovery — App Push";
}

/** What the wizard needs to open straight on its preview screen. */
export interface PushCampaignPrefill {
  campaignName: string;
  conditions: AdhocCondition[];
  reach: number;
  templateId: number;
  /** `datetime-local`; omitted means the optimised send time. */
  sendAt?: string;
  /** What the preview screen lists beside the template. */
  details: {
    title: string;
    body: string;
    richMedia: boolean;
    countdown: boolean;
    promoCode: string | null;
    devices: string;
    qualify: string;
    tags: string;
  };
}

export function prefillFrom(d: PushCartDraft): PushCampaignPrefill {
  return {
    campaignName: campaignNameFor(d),
    conditions: conditionsFor(d),
    reach: reachFor(d),
    templateId: PUSH_CART_TEMPLATE_ID,
    sendAt: d.sendMode === "specific" ? sendAtFor(d.sendLabel) : undefined,
    details: {
      title: resolvedTitle(d),
      body: d.body,
      richMedia: d.richMedia,
      countdown: d.countdown,
      promoCode: d.promoCode,
      devices: d.devices,
      qualify: d.qualify,
      tags: "cart-recovery, app-push",
    },
  };
}

/** Events the flow's cards send back up to the chat. */
export type PushFlowEvent =
  | { type: "questions"; stage: number | string; answers: FlowAnswers; questions: FlowQuestion[] }
  | { type: "content"; draft: PushCartDraft }
  | { type: "changes" }
  | { type: "preview"; draft: PushCartDraft };

export type PushFlowCard =
  | { kind: "questions"; stage: number | string; questions: FlowQuestion[] }
  | { kind: "content"; draft: PushCartDraft; needsPromo: boolean; version?: number; superseded?: boolean }
  | { kind: "brief"; draft: PushCartDraft }
  | { kind: "audience"; draft: AudienceDraftView };
