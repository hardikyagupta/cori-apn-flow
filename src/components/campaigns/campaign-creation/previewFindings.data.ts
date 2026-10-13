import { goalContent } from "./CampaignAIPanel";
import type { SetupApplyKind } from "./SetupApplyCard";
import { minGapMinutes, nextSlot, sliceWindows, type ScheduleValues } from "./CampaignScheduleStep";
import { reachFor, type AudienceValues } from "./CampaignAudienceStep";
import type { ContentValues } from "./CampaignContentStep";
import type { SetupValues } from "./CampaignSetupStep";
import { emailTemplates } from "./emailTemplates.data";
import type { RegularLayoutDraft } from "./PushRegularLayoutEditor";

/**
 * What the co-marketer says about a campaign at preview time. These are read
 * off the actual form values rather than canned, so every finding is true of
 * the campaign in front of the user and every fix writes back to a real field.
 */

export type FindingCategory = "Timing" | "Audience" | "Content";
export type FindingVerdict = "WILL UNDERPERFORM" | "NEEDS ATTENTION";

export interface Finding {
  id: string;
  category: FindingCategory;
  title: string;
  verdict: FindingVerdict;
  /** The number the user decides on — "+14% opens", "≈9% of the audience". */
  impact: string;
  detail: string;
  /** What in their own history backs the claim. */
  evidence: string;
  /** One-tap fix. Omitted where the call genuinely needs the full step. */
  action?: {
    label: string;
    /** Which apply card the co-marketer drops when asked about this. */
    kind: SetupApplyKind;
    schedulePatch?: Partial<ScheduleValues>;
    contentPatch?: Partial<ContentValues>;
    setupPatch?: Partial<SetupValues>;
    /** App Push: a change to the notification being drafted. */
    pushDraftPatch?: Partial<RegularLayoutDraft>;
  };
  /** The card's one CTA, written as what the user is asking for. Doubles as
   *  the opening message of the thread it starts. */
  askLabel: string;
  /** Deep link back into the wizard — "Open Schedule → Send time". */
  link: { stepId: string; stepLabel: string; field: string };
}

export interface CampaignDraft {
  setup: SetupValues;
  audience: AudienceValues;
  content: ContentValues;
  schedule: ScheduleValues;
}

export function buildFindings({ setup, audience, content, schedule }: CampaignDraft): Finding[] {
  const copy = goalContent(setup.goal);
  const template = emailTemplates.find((t) => t.name === copy.template);
  const out: Finding[] = [];

  // — Timing —————————————————————————————————————————————
  if (schedule.mode === "later") {
    out.push({
      id: "fixed-send-time",
      askLabel: "Use optimised send time",
      category: "Timing",
      title: "Fixed send time on an evening-active cohort",
      verdict: "WILL UNDERPERFORM",
      impact: "+14% opens",
      detail: "74% of this audience opens between 19:00 and 21:30 local.",
      evidence: "Jul W2 VIP restock with optimised timing lifted opens 14% vs its fixed-time control.",
      action: {
        label: "Use optimised send time",
        kind: "optimize",
        schedulePatch: { mode: "optimize", optimizeWindow: "Next 24 hours" },
      },
      link: { stepId: "schedule", stepLabel: "Schedule", field: "Send time" },
    });
  }

  if (schedule.mode === "now") {
    out.push({
      id: "send-now",
      askLabel: "Pick a better send slot",
      category: "Timing",
      title: "Sending the moment you publish",
      verdict: "NEEDS ATTENTION",
      impact: "Misses the evening window",
      detail: `This audience peaks in the evening; publishing now lands it mid-day.`,
      evidence: `${copy.subjectWhy.split("—")[0].trim()} Your own sends in the recommended slot open ahead of ad-hoc ones.`,
      action: {
        label: "Schedule for the best slot",
        kind: "sendtime",
        schedulePatch: { mode: "later", sendAt: nextSlot(19) },
      },
      link: { stepId: "schedule", stepLabel: "Schedule", field: "Send time" },
    });
  }

  if (schedule.skipFrequencyCap) {
    out.push({
      id: "frequency-cap",
      askLabel: "Turn the frequency cap back on",
      category: "Timing",
      title: "Frequency cap is off",
      verdict: "WILL UNDERPERFORM",
      impact: "Doubles opt-out risk on the overlap",
      detail: "This send overlaps two live campaigns targeting 31% of the same profiles.",
      evidence: "Aug W1 overlapped 44% with the flash sale — opt-outs ran 2.1× your monthly average.",
      action: {
        label: "Turn the cap back on",
        kind: "cap",
        schedulePatch: { skipFrequencyCap: false },
      },
      link: { stepId: "schedule", stepLabel: "Schedule", field: "Frequency cap" },
    });
  }

  if (schedule.mode === "slice") {
    const gap = minGapMinutes(sliceWindows(schedule));
    if (gap !== null && gap < 30) {
      out.push({
        id: "slice-gap",
        askLabel: "Space the batches out",
        category: "Timing",
        title: "Batches are spaced too tightly",
        verdict: "NEEDS ATTENTION",
        impact: "Cap check can be bypassed",
        detail: `A ${Math.round(gap)}-minute gap sits inside the 30-minute data sync window.`,
        evidence: "Cap checks run on synced data — batches inside 30 minutes can double-message a profile.",
        // No one-tap fix — which day or time to move depends on which two
        // windows collide, so this one sends the user to the step itself.
        link: { stepId: "schedule", stepLabel: "Schedule", field: "Send in batches" },
      });
    }
  }

  // — Audience ————————————————————————————————————————————
  if (audience.mode === "all") {
    out.push({
      id: "all-contacts",
      askLabel: "Suggest a tighter audience",
      category: "Audience",
      title: "Sending to the entire list",
      verdict: "WILL UNDERPERFORM",
      impact: "≈62% has not opened in 90 days",
      detail: "Blanket sends pull deliverability down for every campaign that follows this one.",
      evidence: "Your last all-contacts send placed 18% in spam; the segmented equivalent placed 3%.",
      link: { stepId: "audience", stepLabel: "Audience", field: "Target audience" },
    });
  }

  if (audience.mode !== "all" && reachFor(audience) === 0) {
    out.push({
      id: "empty-audience",
      askLabel: "Help me pick an audience",
      category: "Audience",
      title: "Nothing selected to send to",
      verdict: "NEEDS ATTENTION",
      impact: "0 reachable contacts",
      detail: "The audience step has a mode picked but no segment, table or condition behind it.",
      evidence: "A campaign published with an empty audience completes instantly and reports nothing.",
      link: { stepId: "audience", stepLabel: "Audience", field: "Target audience" },
    });
  }

  if (!audience.excludeEnabled) {
    out.push({
      id: "no-suppression",
      askLabel: "Suggest what to suppress",
      category: "Audience",
      title: "No suppression on this send",
      verdict: "NEEDS ATTENTION",
      impact: "≈4% double-messaged",
      detail: "Contacts already inside a live journey will get this on top of what they're in.",
      evidence: "Journey-overlapped contacts unsubscribed at 3× the rate of the rest of the list in July.",
      link: { stepId: "audience", stepLabel: "Audience", field: "Exclude contacts" },
    });
  }

  // — Content ————————————————————————————————————————————
  if (!content.subject.trim()) {
    out.push({
      id: "no-subject",
      askLabel: "Write me a subject line",
      category: "Content",
      title: "Subject line is empty",
      verdict: "NEEDS ATTENTION",
      impact: "Blocks publish",
      detail: "Nothing to open on — the campaign can't go out without a subject line.",
      evidence: copy.subjectWhy,
      action: {
        label: "Use my recommended line",
        kind: "subject",
        contentPatch: { subject: copy.subject },
      },
      link: { stepId: "content", stepLabel: "Content", field: "Subject" },
    });
  } else if (content.subject.length > 60) {
    out.push({
      id: "long-subject",
      askLabel: "Shorten this subject line",
      category: "Content",
      title: "Subject line will be truncated",
      verdict: "NEEDS ATTENTION",
      impact: `${content.subject.length} characters`,
      detail: "Most mobile clients cut the subject around 60 characters, and half your opens are mobile.",
      evidence: "Your subjects under 60 characters open about 9% ahead of the longer ones.",
      action: {
        label: "Use my recommended line",
        kind: "subject",
        contentPatch: { subject: copy.subject },
      },
      link: { stepId: "content", stepLabel: "Content", field: "Subject" },
    });
  }

  if (!content.preHeader.trim()) {
    out.push({
      id: "no-preheader",
      askLabel: "Write me a pre-header",
      category: "Content",
      title: "Pre-header is empty",
      verdict: "NEEDS ATTENTION",
      impact: "Inbox scrapes the template",
      detail: "With nothing set, clients preview the first line of the template — usually a browser link.",
      evidence: copy.preHeaderWhy,
      action: {
        label: "Use my recommended pre-header",
        kind: "preheader",
        contentPatch: { preHeader: copy.preHeader },
      },
      link: { stepId: "content", stepLabel: "Content", field: "Pre-header" },
    });
  }

  if (content.templateId === null) {
    out.push({
      id: "no-template",
      askLabel: "Recommend a template",
      category: "Content",
      title: "No template selected",
      verdict: "NEEDS ATTENTION",
      impact: "Blocks publish",
      detail: "There's no body to send yet — pick a saved template or start a new one.",
      evidence: copy.templateWhy,
      action: template
        ? {
            label: `Select "${template.name}"`,
            kind: "template" as const,
            contentPatch: { templateId: template.id, tab: "my" as const },
          }
        : undefined,
      link: { stepId: "content", stepLabel: "Content", field: "Select a template" },
    });
  }

  if (!content.senderName.trim() || !content.senderEmail.trim()) {
    out.push({
      id: "sender-incomplete",
      askLabel: "Sort out the sender details",
      category: "Content",
      title: "Sender details are incomplete",
      verdict: "NEEDS ATTENTION",
      impact: "Blocks publish",
      detail: "A from-name and a sender address are both required before this can publish.",
      evidence: "Sends with a recognisable from-name open around 12% ahead of address-only sends.",
      link: { stepId: "content", stepLabel: "Content", field: "Sender details" },
    });
  }

  return out;
}

/** Findings grouped in the order the rail lists them. */
export function groupFindings(findings: Finding[]): { category: FindingCategory; items: Finding[] }[] {
  const order: FindingCategory[] = ["Timing", "Audience", "Content"];
  return order
    .map((category) => ({ category, items: findings.filter((f) => f.category === category) }))
    .filter((g) => g.items.length > 0);
}

// — A scripted review for one specific demo campaign ————————————————————
// "High-Intent Re-Engagers" segment + the "Exclusive Deals — Gold Members"
// template — canned rather than computed, since it's a fixed walkthrough
// rather than a claim about the account's real history.

const EXCLUSIVE_DEALS_SEGMENT_ID = "630";
const EXCLUSIVE_DEALS_TEMPLATE_ID = 868;

export function isExclusiveDealsReviewScenario({
  audience,
  content,
}: Pick<CampaignDraft, "audience" | "content">): boolean {
  return (
    content.templateId === EXCLUSIVE_DEALS_TEMPLATE_ID &&
    audience.mode === "segments" &&
    audience.segments.some((s) => s.id === EXCLUSIVE_DEALS_SEGMENT_ID)
  );
}

/** Opening line for the scripted "Exclusive Deals" review thread. */
export const EXCLUSIVE_DEALS_REVIEW_REPLY =
  "🔍 I reviewed your campaign and found 3 opportunities that could improve engagement:";

export function exclusiveDealsReviewFindings(): Finding[] {
  return [
    {
      id: "exclusive-deals-conversion-goal",
      category: "Audience",
      title: "Consider adding a conversion goal 🎯",
      verdict: "NEEDS ATTENTION",
      impact: "+18% attributed purchases",
      detail:
        "Purchase is the most common conversion goal for your product campaigns. Recommended goal: Purchase.",
      evidence:
        "24 similar campaigns · Last 90 days — campaigns with conversion tracking enabled generated 18% more attributed purchases on average.",
      action: {
        label: "Set conversion goal",
        kind: "conversion",
        setupPatch: { conversionTracking: true, conversionEvent: "Purchase" },
      },
      askLabel: "Set conversion goal",
      link: { stepId: "audience", stepLabel: "Send to", field: "Conversion tracking" },
    },
    {
      id: "exclusive-deals-generic-subject",
      category: "Content",
      title: "Your subject line could perform better 📝",
      verdict: "NEEDS ATTENTION",
      impact: "+16% opens",
      detail: "Your subject line is generic.",
      evidence:
        "In your last 12 similar campaigns, product-led subject lines generated 16% higher opens.",
      action: {
        label: "Use my recommended line",
        kind: "subject",
        contentPatch: { subject: "Discover our latest arrivals ✨" },
      },
      askLabel: "Write me a better subject line",
      link: { stepId: "content", stepLabel: "Content", field: "Subject" },
    },
    {
      id: "exclusive-deals-product-sections",
      category: "Content",
      title: "Your product sections may be doing too much 👀",
      verdict: "NEEDS ATTENTION",
      impact: "+18% clicks",
      detail: "Similar campaigns with fewer product sections have seen 18% higher click-through rates.",
      evidence:
        'Consider keeping one "New arrivals" section and using the remaining space for a stronger CTA or personalized recommendations.',
      askLabel: "Help me simplify this template",
      link: { stepId: "content", stepLabel: "Content", field: "Template" },
    },
  ];
}
