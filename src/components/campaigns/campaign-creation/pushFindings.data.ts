import { reachFor, type AudienceValues } from "./CampaignAudienceStep";
import type { ContentValues } from "./CampaignContentStep";
import type { ScheduleValues } from "./CampaignScheduleStep";
import { hasDraftContent, type RegularLayoutDraft } from "./PushRegularLayoutEditor";
import type { Finding } from "./previewFindings.data";
import { buildAudienceDraft, INTEREST_CART } from "@/data/audienceAgentFlow";

/** The tighter audience Zeno builds: recent cart adders who haven't bought,
 *  with recent buyers and anyone already in a journey held back. */
function tighterAudience() {
  return buildAudienceDraft({
    focus: "Recover potentially lost purchases",
    interest: INTEREST_CART,
    recency: "In the last 24 hours",
    excludeCheckout: true,
    reach: "Balanced",
    holdbacks: ["Recent purchasers", "Already in an active journey"],
  });
}

/**
 * What Zeno says about an App Push campaign at preview time — the push
 * counterpart of buildFindings. Read off the real form values, so each finding
 * is true of the campaign on screen and each fix writes back to a real field.
 * The evidence lines are illustrative, in the same spirit as the email review.
 */
export function buildPushFindings({
  audience,
  content,
  schedule,
  draft,
  aiMade = {},
}: {
  audience: AudienceValues;
  content: ContentValues;
  schedule: ScheduleValues;
  draft: RegularLayoutDraft;
  /** Parts Zeno built herself — her own work has no flaws to flag, so those
   *  sections are skipped. Only what the marketer set by hand is audited. */
  aiMade?: { timing?: boolean; audience?: boolean; content?: boolean };
}): Finding[] {
  const out: Finding[] = [];
  const written = hasDraftContent(draft);
  const hasContent = written || content.templateId !== null;

  // — Timing —————————————————————————————————————————————
  if (!aiMade.timing && schedule.mode !== "optimize") {
    out.push({
      id: "push-send-time",
      askLabel: "Use the send time optimizer",
      category: "Timing",
      title: "Not using the send time optimizer",
      verdict: "WILL UNDERPERFORM",
      impact: "+12% taps",
      detail: "Shoppers with a cart waiting tap most between 19:00 and 21:30 local, and a fixed time misses half of them.",
      evidence: "Your last 9 cart-recovery pushes sent per-contact beat their fixed-time controls by 12% on taps.",
      action: {
        label: "Use the send time optimizer",
        kind: "optimize",
        schedulePatch: { mode: "optimize", optimizeWindow: "Next 24 hours" },
      },
      link: { stepId: "schedule", stepLabel: "Schedule", field: "Send time" },
    });
  }

  // — Audience ————————————————————————————————————————————
  if (aiMade.audience) {
    // Zeno cut this audience: nothing to flag.
  } else if (audience.mode === "all") {
    out.push({
      id: "push-all-contacts",
      askLabel: "Suggest a tighter audience",
      category: "Audience",
      title: "Sending to every contact",
      verdict: "WILL UNDERPERFORM",
      impact: "≈70% have no cart",
      detail: "A cart reminder only means something to people with something in their cart.",
      evidence: "Your broad pushes opt out at 2.4× the rate of your segmented ones.",
      action: { label: "Use this segment", kind: "audience", audienceDraft: tighterAudience(), audienceScope: "segment" },
      link: { stepId: "audience", stepLabel: "Audience", field: "Target audience" },
    });
  } else if (reachFor(audience) === 0) {
    out.push({
      id: "push-empty-audience",
      askLabel: "Help me pick an audience",
      category: "Audience",
      title: "Nothing selected to send to",
      verdict: "NEEDS ATTENTION",
      impact: "0 reachable contacts",
      detail: "The audience step has a mode picked but no segment or condition behind it.",
      evidence: "A campaign published with an empty audience completes instantly and reports nothing.",
      action: { label: "Use this segment", kind: "audience", audienceDraft: tighterAudience(), audienceScope: "segment" },
      link: { stepId: "audience", stepLabel: "Audience", field: "Target audience" },
    });
  }

  if (!aiMade.audience && !audience.excludeEnabled) {
    out.push({
      id: "push-no-suppression",
      askLabel: "Suggest what to suppress",
      category: "Audience",
      title: "Recent buyers can still get this",
      verdict: "NEEDS ATTENTION",
      impact: "≈6% already bought",
      detail: "Someone who checked out an hour ago would still get a reminder about the cart they just paid for.",
      evidence: "Reminders that reached recent buyers drew 3× the notification opt-outs last quarter.",
      action: { label: "Add these exclusions", kind: "audience", audienceDraft: tighterAudience(), audienceScope: "exclusions" },
      link: { stepId: "audience", stepLabel: "Audience", field: "Exclude contacts" },
    });
  }

  // — Content —————————————————————————————————————————————
  if (aiMade.content) return out;

  if (!hasContent) {
    out.push({
      id: "push-no-content",
      askLabel: "Write me a notification",
      category: "Content",
      title: "No notification written yet",
      verdict: "NEEDS ATTENTION",
      impact: "Blocks publish",
      detail: "There's nothing to send. Pick a template or create a notification.",
      evidence: "Cart reminders written by Zeno beat hand-written ones by 8% on taps in your account.",
      link: { stepId: "content", stepLabel: "Content", field: "Select layout" },
    });
    return out;
  }

  if (written && draft.landing === "App Homepage") {
    out.push({
      id: "push-landing",
      askLabel: "Link straight to the cart",
      category: "Content",
      title: "Tap lands on the app homepage",
      verdict: "NEEDS ATTENTION",
      impact: "2.3× checkouts started",
      detail: "Shoppers who tap a cart reminder and land on the homepage have to find their items all over again.",
      evidence: "Your last 9 cart-recovery pushes that opened the cart started checkout 2.3× more often.",
      action: {
        label: "Link to the cart",
        kind: "pushContent",
        pushDraftPatch: { landing: "Cart" },
      },
      link: { stepId: "content", stepLabel: "Content", field: "Landing page URL" },
    });
  }

  if (written && !draft.android.actionButtons && !draft.ios.actionButtons) {
    const withButton = (cfg: RegularLayoutDraft["android"]) => ({
      ...cfg,
      actionButtons: true,
      buttons: [{ label: "View cart", url: "" }],
    });
    out.push({
      id: "push-action-button",
      askLabel: "Add an action button",
      category: "Content",
      title: "No action button on a cart reminder",
      verdict: "NEEDS ATTENTION",
      impact: "+9% taps",
      detail: "A one-tap “View cart” button saves a step for anyone ready to finish.",
      evidence: "Cart pushes with an action button were tapped 9% more than the same copy without one.",
      action: {
        label: "Add a View cart button",
        kind: "pushContent",
        pushDraftPatch: { android: withButton(draft.android), ios: withButton(draft.ios) },
      },
      link: { stepId: "content", stepLabel: "Content", field: "Action buttons" },
    });
  }

  if (written && /\{\{[^}]+\}\}/.test(`${draft.title} ${draft.message}`)) {
    const tag = (`${draft.title} ${draft.message}`.match(/\{\{[^}]+\}\}/) ?? ["{{…}}"])[0];
    out.push({
      id: "push-personalisation-fallback",
      askLabel: `Add a fallback for ${tag}`,
      category: "Content",
      title: "Personalisation tag has no fallback",
      verdict: "NEEDS ATTENTION",
      impact: "≈3% would see blank text",
      detail: `${tag} renders empty for anyone without that value, which leaves a gap in the sentence.`,
      evidence: "Notifications with an unresolved tag were dismissed 2× as often as complete ones.",
      link: { stepId: "content", stepLabel: "Content", field: "Message" },
    });
  }

  return out;
}
