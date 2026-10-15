import { useState } from "react";
import {
  BarChart3,
  Check,
  ChevronDown,
  Clock,
  LayoutTemplate,
  ShieldCheck,
  Sparkles,
  Tag,
  Target,
  Type,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SetupValues } from "./CampaignSetupStep";
import type { ContentValues } from "./CampaignContentStep";
import type { ScheduleValues } from "./CampaignScheduleStep";
import type { AudienceCohort } from "./audienceCohorts.data";
import type { RegularLayoutDraft } from "./PushRegularLayoutEditor";
import type { AudienceDraft } from "@/data/audienceAgentFlow";

export type SetupApplyKind =
  | "tags"
  | "tracking"
  | "conversion"
  | "audience"
  | "cohorts"
  | "subject"
  | "preheader"
  | "template"
  | "sendtime"
  | "optimize"
  | "cap"
  // Kinds for the scripted "Welcome new customers" autonomous walkthrough —
  // see welcomeNewCustomersFlow.data.ts.
  | "cta"
  | "pushContent"
  | "templates"
  | "subjectOptions"
  | "scheduleChoice"
  | "sendTimeRecommendation";

/** One recommended template, with the historical numbers behind the pick. */
export interface TemplateOption {
  templateId: number;
  name: string;
  description: string;
  estimatedEngagement: string;
  basedOnCampaigns: number;
}

/** One recommended subject/pre-header pairing. */
export interface SubjectOption {
  subject: string;
  preHeader: string;
  estimatedOpenRate: string;
}

/** The send-time optimizer's own recommendation, once chosen. */
export interface SendTimeRecommendation {
  recommendedAt: string;
  reasoning: string;
  basedOnCampaigns: number;
}

/** Visual payload the co-marketer drops into the chat so the user can plot values onto setup. */
export interface SetupApplyCardData {
  kind: SetupApplyKind;
  title: string;
  applyLabel: string;
  appliedLabel: string;
  tags?: string[];
  conversionEvent?: string;
  audience?: string;
  blurb?: string;
  /** Proposed copy — subject line, pre-header, or the template's name. */
  text?: string;
  /** Runner-up subject lines, listed under the recommended one. */
  alternates?: string[];
  /** Written onto the setup form when the user taps apply. */
  patch?: Partial<SetupValues>;
  /** Written onto the content form instead, for content-step suggestions. */
  contentPatch?: Partial<ContentValues>;
  /** Written onto the schedule form, for schedule-step suggestions. */
  schedulePatch?: Partial<ScheduleValues>;
  /** A segment Cori built; "segment" plots its conditions, "exclusions" only its holdbacks. */
  audienceDraft?: AudienceDraft;
  audienceScope?: "segment" | "exclusions";
  /** Written onto the App Push notification being drafted. */
  pushDraftPatch?: Partial<RegularLayoutDraft>;
  /** Audience cuts — rendered as a stack, each plotted on its own. */
  cohorts?: AudienceCohort[];
  /** Goal the cuts were picked for, named in each card's "why" line. */
  goalLabel?: string;
  /** Template recommendations — rendered as a stack, each plotted on its own. */
  templates?: TemplateOption[];
  /** Subject/pre-header recommendations — rendered as a stack. */
  subjectOptions?: SubjectOption[];
  /** The send-time optimizer's recommended slot, once computed. */
  sendTimeRecommendation?: SendTimeRecommendation;
}

const nf = new Intl.NumberFormat("en-US");

/**
 * One proposed audience. Reach and historical conversion are the two numbers a
 * marketer actually decides on, so they lead; everything behind the pick sits
 * under "Rules & signals" to keep three of these scannable in a thread.
 */
function CohortCard({
  cohort,
  index,
  goalLabel,
  applied,
  onApply,
}: {
  cohort: AudienceCohort;
  index: number;
  goalLabel?: string;
  applied?: boolean;
  onApply?: () => void;
}) {
  const [openSignals, setOpenSignals] = useState(false);

  return (
    <div className="w-full rounded-lg border border-[#DDE2EE] bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-manrope text-sm font-bold text-[#17173A]">
          {index}. {cohort.name}
        </p>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 font-manrope text-[11px] font-bold",
            cohort.fit >= 75 ? "bg-[#E6F8F0] text-[#0B7A56]" : "bg-[#FFF1E6] text-[#B25A12]"
          )}
        >
          {cohort.fit}/100 fit
        </span>
      </div>
      <p className="mt-1 font-manrope text-xs leading-[18px] text-[#6F6F8D]">{cohort.rule}</p>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-manrope text-xs text-[#6F6F8D]">
        <span>
          <span className="font-bold text-[#17173A]">{nf.format(cohort.reachable)}</span> reachable
        </span>
        <span>
          <span className="font-bold text-[#17173A]">{cohort.cvr}</span> historical CVR
        </span>
      </div>

      <p className="mt-2 font-manrope text-xs leading-[18px] text-[#6F6F8D]">
        <span className="font-bold text-[#17173A]">
          {goalLabel ? `Why for “${goalLabel}”:` : "Why:"}
        </span>{" "}
        {cohort.why}
      </p>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onApply?.()}
          disabled={applied}
          className={cn(
            "dc-btn",
            applied
              ? "cursor-default border-transparent bg-[#EDFBF5] text-[#0B7A56]"
              : "dc-btn-primary"
          )}
        >
          {applied ? (
            <>
              <Check className="size-3.5" strokeWidth={3} />
              Plotted on audience
            </>
          ) : (
            "Review audience"
          )}
        </button>
        <button
          type="button"
          onClick={() => setOpenSignals((o) => !o)}
          className="inline-flex items-center gap-1 font-manrope text-[13px] font-semibold text-[#2F68E5]"
        >
          Rules &amp; signals
          <ChevronDown
            className={cn("size-4 transition-transform", openSignals && "rotate-180")}
            strokeWidth={2.2}
          />
        </button>
      </div>

      {openSignals && (
        <ul className="mt-3 space-y-1 border-t border-[#EEF1F7] pt-3">
          {cohort.signals.map((sig) => (
            <li key={sig} className="flex gap-2 font-manrope text-xs leading-[18px] text-[#6F6F8D]">
              <span className="mt-[7px] size-1 shrink-0 rounded-full bg-[#C3CAD9]" />
              {sig}
            </li>
          ))}
          <li className="flex gap-2 font-manrope text-xs leading-[18px] text-[#6F6F8D]">
            <span className="mt-[7px] size-1 shrink-0 rounded-full bg-[#C3CAD9]" />
            Holds back {cohort.exclude.name.toLowerCase()}
          </li>
        </ul>
      )}
    </div>
  );
}

/** One recommended template — mirrors CohortCard's shape, minus the fit
 *  score and "rules & signals" drawer templates don't have. */
function TemplateOptionCard({
  option,
  index,
  onApply,
}: {
  option: TemplateOption;
  index: number;
  onApply?: () => void;
}) {
  return (
    <div className="w-full rounded-lg border border-[#DDE2EE] bg-white p-4">
      <p className="font-manrope text-sm font-bold text-[#17173A]">
        {index}. {option.name}
      </p>
      <p className="mt-1 font-manrope text-xs leading-[18px] text-[#6F6F8D]">{option.description}</p>
      <p className="mt-2 font-manrope text-xs text-[#6F6F8D]">
        <span className="font-bold text-[#17173A]">Estimated engagement: {option.estimatedEngagement}</span>
        {" · "}Based on {option.basedOnCampaigns} similar campaigns
      </p>
      <div className="mt-3">
        <button type="button" onClick={() => onApply?.()} className="dc-btn dc-btn-primary">
          Use template
        </button>
      </div>
    </div>
  );
}

/** One recommended subject/pre-header pairing. */
function SubjectOptionCard({
  option,
  index,
  onApply,
}: {
  option: SubjectOption;
  index: number;
  onApply?: () => void;
}) {
  return (
    <div className="w-full rounded-lg border border-[#DDE2EE] bg-white p-4">
      <p className="font-manrope text-[11px] font-semibold uppercase tracking-wide text-[#8A8AA3]">
        Option {index}
      </p>
      <p className="mt-1 font-manrope text-sm font-bold leading-5 text-[#17173A]">{option.subject}</p>
      <p className="mt-1 font-manrope text-xs leading-[18px] text-[#6F6F8D]">{option.preHeader}</p>
      <p className="mt-2 font-manrope text-xs text-[#6F6F8D]">
        <span className="font-bold text-[#17173A]">Estimated open rate: {option.estimatedOpenRate}</span>
        {" · "}Based on similar campaigns
      </p>
      <div className="mt-3">
        <button type="button" onClick={() => onApply?.()} className="dc-btn dc-btn-primary">
          Use this
        </button>
      </div>
    </div>
  );
}

const ICON: Record<SetupApplyKind, { icon: LucideIcon; wrap: string; color: string }> = {
  tags: { icon: Tag, wrap: "bg-[#E6F8F0]", color: "text-[#00A86B]" },
  tracking: { icon: BarChart3, wrap: "bg-[#E8F0FE]", color: "text-[#2F68E5]" },
  conversion: { icon: Target, wrap: "bg-[#F0E8FF]", color: "text-[#7B5CFA]" },
  audience: { icon: Users, wrap: "bg-[#FFF1E6]", color: "text-[#E07A2F]" },
  cohorts: { icon: Users, wrap: "bg-[#FFF1E6]", color: "text-[#E07A2F]" },
  subject: { icon: Type, wrap: "bg-[#E8F0FE]", color: "text-[#2F68E5]" },
  preheader: { icon: Type, wrap: "bg-[#E6F8F0]", color: "text-[#00A86B]" },
  template: { icon: LayoutTemplate, wrap: "bg-[#F0E8FF]", color: "text-[#7B5CFA]" },
  sendtime: { icon: Clock, wrap: "bg-[#E8F0FE]", color: "text-[#2F68E5]" },
  optimize: { icon: Sparkles, wrap: "bg-[#F0E8FF]", color: "text-[#7B5CFA]" },
  cap: { icon: ShieldCheck, wrap: "bg-[#E6F8F0]", color: "text-[#00A86B]" },
  cta: { icon: Sparkles, wrap: "bg-[#F0E8FF]", color: "text-[#7B5CFA]" },
  pushContent: { icon: LayoutTemplate, wrap: "bg-[#F0E8FF]", color: "text-[#7B5CFA]" },
  // These four are special-cased below (stacked cards, multiple actions each)
  // and never reach the generic icon header — entries exist only to satisfy
  // the Record's exhaustiveness check.
  templates: { icon: LayoutTemplate, wrap: "bg-[#F0E8FF]", color: "text-[#7B5CFA]" },
  subjectOptions: { icon: Type, wrap: "bg-[#E8F0FE]", color: "text-[#2F68E5]" },
  scheduleChoice: { icon: Clock, wrap: "bg-[#E8F0FE]", color: "text-[#2F68E5]" },
  sendTimeRecommendation: { icon: Clock, wrap: "bg-[#E8F0FE]", color: "text-[#2F68E5]" },
};

const COPY_LABEL: Partial<Record<SetupApplyKind, string>> = {
  subject: "Recommended subject line",
  preheader: "Recommended pre-header",
  template: "Recommended template",
  sendtime: "Recommended send time",
  optimize: "Delivery",
  cap: "Frequency cap",
  pushContent: "Recommended change",
};

export default function SetupApplyCard({
  card,
  applied,
  appliedCohortId,
  onApply,
}: {
  card: SetupApplyCardData;
  applied?: boolean;
  /** Which cut is already plotted, for a cohorts card. */
  appliedCohortId?: string;
  onApply?: (cohortId?: string) => void;
}) {
  if (card.cohorts) {
    return (
      <div className="w-full space-y-2">
        {card.cohorts.map((c, i) => (
          <CohortCard
            key={c.id}
            cohort={c}
            index={i + 1}
            goalLabel={card.goalLabel}
            applied={appliedCohortId === c.id}
            onApply={() => onApply?.(c.id)}
          />
        ))}
      </div>
    );
  }

  if (card.templates) {
    return (
      <div className="w-full space-y-2">
        {card.templates.map((t, i) => (
          <TemplateOptionCard
            key={t.templateId}
            option={t}
            index={i + 1}
            onApply={() => onApply?.(String(t.templateId))}
          />
        ))}
      </div>
    );
  }

  if (card.subjectOptions) {
    return (
      <div className="w-full space-y-2">
        {card.subjectOptions.map((s, i) => (
          <SubjectOptionCard key={s.subject} option={s} index={i + 1} onApply={() => onApply?.(String(i))} />
        ))}
      </div>
    );
  }

  if (card.kind === "scheduleChoice") {
    return (
      <div className="w-full space-y-2">
        <button
          type="button"
          onClick={() => onApply?.("optimize")}
          className="w-full rounded-lg border border-[#DDE2EE] bg-white p-4 text-left transition-colors hover:border-[#2F68E5]"
        >
          <p className="font-manrope text-sm font-bold text-[#17173A]">Send time optimizer</p>
          <p className="mt-1 font-manrope text-xs leading-[18px] text-[#6F6F8D]">
            Let Cori choose the send time based on when this audience is most likely to engage.
          </p>
        </button>
        <button
          type="button"
          onClick={() => onApply?.("choose")}
          className="w-full rounded-lg border border-[#DDE2EE] bg-white p-4 text-left transition-colors hover:border-[#2F68E5]"
        >
          <p className="font-manrope text-sm font-bold text-[#17173A]">Choose a time</p>
          <p className="mt-1 font-manrope text-xs leading-[18px] text-[#6F6F8D]">
            Pick a specific date and time for your campaign.
          </p>
        </button>
      </div>
    );
  }

  if (card.kind === "sendTimeRecommendation" && card.sendTimeRecommendation) {
    const rec = card.sendTimeRecommendation;
    return (
      <div className="w-full rounded-lg border border-[#DDE2EE] bg-white p-4">
        <p className="font-manrope text-[11px] font-semibold uppercase tracking-wide text-[#8A8AA3]">
          Recommended send time
        </p>
        <p className="mt-1 font-manrope text-base font-bold text-[#17173A]">{rec.recommendedAt}</p>
        <p className="mt-1.5 font-manrope text-xs leading-[18px] text-[#6F6F8D]">{rec.reasoning}</p>
        <p className="mt-1 font-manrope text-xs text-[#6F6F8D]">
          Based on engagement patterns from {rec.basedOnCampaigns} similar campaigns
        </p>
        <div className="mt-3 flex items-center gap-4">
          <button type="button" onClick={() => onApply?.("use")} className="dc-btn dc-btn-primary">
            Use recommended time
          </button>
          <button
            type="button"
            onClick={() => onApply?.("choose")}
            className="font-manrope text-[13px] font-semibold text-[#2F68E5]"
          >
            Choose a different time
          </button>
        </div>
      </div>
    );
  }

  const meta = ICON[card.kind];
  const Icon = meta.icon;

  return (
    <div className="w-full overflow-hidden rounded-lg border border-[#DDE2EE] bg-white">
      <div className="flex items-center gap-2.5 border-b border-[#E6EAF4] px-4 py-3">
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-md", meta.wrap)}>
          <Icon className={cn("size-4", meta.color)} strokeWidth={2} />
        </span>
        <p className="font-manrope text-sm font-bold text-[#17173A]">{card.title}</p>
      </div>

      <div className="px-4 py-3">
        {card.kind === "tags" && card.tags && (
          <div className="flex flex-wrap gap-1.5">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#DDE2EE] bg-[#F7F9FC] px-2.5 py-0.5 font-manrope text-[12px] font-medium text-[#17173A]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {card.kind === "tracking" && (
          <>
            <p className="font-manrope text-[13px] font-semibold text-[#17173A]">Google Analytics</p>
            {card.blurb && (
              <p className="mt-1 font-manrope text-xs leading-[18px] text-[#6F6F8D]">{card.blurb}</p>
            )}
          </>
        )}
        {card.kind === "conversion" && (
          <>
            <p className="font-manrope text-[11px] font-semibold uppercase tracking-wide text-[#8A8AA3]">
              Primary conversion
            </p>
            <p className="mt-1 font-manrope text-sm font-bold text-[#17173A]">{card.conversionEvent}</p>
          </>
        )}
        {card.kind === "audience" && (
          <>
            <p className="font-manrope text-[11px] font-semibold uppercase tracking-wide text-[#8A8AA3]">
              Who to target
            </p>
            <p className="mt-1 font-manrope text-xs leading-[18px] text-[#17173A]">{card.audience}</p>
          </>
        )}
        {COPY_LABEL[card.kind] && (
          <>
            <p className="font-manrope text-[11px] font-semibold uppercase tracking-wide text-[#8A8AA3]">
              {COPY_LABEL[card.kind]}
            </p>
            <p className="mt-1 font-manrope text-sm font-bold leading-5 text-[#17173A]">
              {card.text}
            </p>
            {card.blurb && (
              <p className="mt-1.5 font-manrope text-xs leading-[18px] text-[#6F6F8D]">
                {card.blurb}
              </p>
            )}
            {card.alternates && card.alternates.length > 0 && (
              <div className="mt-3 border-t border-[#EEF1F7] pt-2.5">
                <p className="font-manrope text-[11px] font-semibold uppercase tracking-wide text-[#8A8AA3]">
                  Also worth testing
                </p>
                <ul className="mt-1.5 space-y-1">
                  {card.alternates.map((alt) => (
                    <li
                      key={alt}
                      className="flex gap-2 font-manrope text-xs leading-[18px] text-[#6F6F8D]"
                    >
                      <span className="mt-[7px] size-1 shrink-0 rounded-full bg-[#C3CAD9]" />
                      {alt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={() => onApply?.()}
          disabled={applied}
          className={cn(
            "dc-btn w-full",
            applied
              ? "cursor-default border-transparent bg-[#EDFBF5] text-[#0B7A56]"
              : "dc-btn-primary"
          )}
        >
          {applied ? (
            <>
              <Check className="size-3.5" strokeWidth={3} />
              {card.appliedLabel}
            </>
          ) : (
            card.applyLabel
          )}
        </button>
      </div>
    </div>
  );
}

/** Has this suggested change already been made to the notification? */
export function isPushDraftPatchApplied(patch: Partial<RegularLayoutDraft>, draft: RegularLayoutDraft): boolean {
  return (Object.keys(patch) as (keyof RegularLayoutDraft)[]).every(
    (k) => JSON.stringify(draft[k]) === JSON.stringify(patch[k])
  );
}
