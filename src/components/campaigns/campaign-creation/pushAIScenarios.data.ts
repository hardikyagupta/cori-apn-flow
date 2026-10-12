import { Ticket, TrendingDown, type LucideIcon } from "lucide-react";
import type { AdhocCondition } from "./CampaignAudienceStep";
import { toLocalInput } from "./CampaignScheduleStep";
import { COUPON_EXPIRY_TEMPLATE_ID, PRICE_DROP_TEMPLATE_ID } from "./appPushTemplates.data";

/**
 * The goals App Push's AI flow can draft a campaign for. Each one is offered
 * on the prompt screen (typed out, plus a starter card) and, once submitted,
 * fills the wizard with its own audience, notification and send time.
 */
export interface PushAIScenario {
  id: string;
  prompt: string;
  starterLabel: string;
  icon: LucideIcon;
  campaignName: string;
  /** Recognises the scenario from whatever the user typed or edited. */
  matches: RegExp;
  /** Registered-app ids from appOptions.data — target apps must be filled in
   *  or Message and Schedule stay locked. */
  apps: string[];
  conditions: AdhocCondition[];
  reach: number;
  templateId: number;
  /** Omitted = optimised send time. */
  sendAt?: () => { mode: "later"; sendAt: string };
  /** Conversion goal the draft ships with — event, window and revenue field. */
  conversionEvent: string;
  conversionWindowValue: string;
  conversionWindowUnit: string;
  revenueParameter: string;
}

export const CONSUMER_APPS = ["neww_1", "cart_recovery_android"];

export const PUSH_AI_SCENARIOS: PushAIScenario[] = [
  {
    id: "price-drop",
    prompt:
      "Notify users when a product they viewed or added to their wishlist is now available at a lower price.",
    starterLabel: "Notify on price drops",
    icon: TrendingDown,
    campaignName: "Price Drop Alert — Viewed & Wishlisted Products",
    matches: /price|wishlist|lower|cheaper|discount/i,
    apps: CONSUMER_APPS,
    conditions: [
      {
        attribute: "Viewed or wishlisted a product",
        type: "recency",
        operator: "in the last",
        value: "30 days",
      },
    ],
    reach: 21_380,
    templateId: PRICE_DROP_TEMPLATE_ID,
    conversionEvent: "Purchase",
    conversionWindowValue: "7",
    conversionWindowUnit: "Days",
    revenueParameter: "Order value",
  },
  {
    id: "coupon-expiry",
    prompt:
      "Remind users that their ₹1000 coupon expires tonight and encourage them to use it before midnight.",
    starterLabel: "Remind about expiring coupons",
    icon: Ticket,
    campaignName: "Coupon Expiry Reminder — ₹1000 Off",
    matches: /coupon|expire|midnight|tonight/i,
    apps: CONSUMER_APPS,
    conditions: [
      { attribute: "Coupon issued", type: "recency", operator: "in the last", value: "7 days" },
      { attribute: "Coupon redeemed", type: "recency", operator: "not in the last", value: "7 days" },
    ],
    reach: 9_640,
    templateId: COUPON_EXPIRY_TEMPLATE_ID,
    // A reminder for a coupon that ends at midnight goes out this evening.
    sendAt: () => {
      const d = new Date();
      d.setHours(18, 0, 0, 0);
      if (d.getTime() < Date.now() + 15 * 60 * 1000) d.setTime(Date.now() + 17 * 60 * 1000);
      return { mode: "later", sendAt: toLocalInput(d) };
    },
    conversionEvent: "Coupon redeemed",
    conversionWindowValue: "1",
    conversionWindowUnit: "Days",
    revenueParameter: "Order value",
  },
];

/** Coupon wording is the more specific of the two, so it's checked first;
 *  anything unrecognised falls back to the first scenario. */
export function pushScenarioFor(prompt: string): PushAIScenario {
  return (
    [...PUSH_AI_SCENARIOS].reverse().find((s) => s.matches.test(prompt)) ?? PUSH_AI_SCENARIOS[0]
  );
}
