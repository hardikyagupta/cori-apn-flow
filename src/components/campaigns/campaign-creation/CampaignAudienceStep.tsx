import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, ChevronDown, Info, Pencil, UserCheck, X } from "lucide-react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import sparkleAi from "/campaign-assets/ic-sparkle-ai.gif";
import { Switch } from "@/components/ui/switch";
import Dropdown from "../Dropdown";
import SegmentSelect, { type SegmentRef } from "./SegmentSelect";
import StepCard from "./StepCard";
import ConditionAttributePicker, {
  COUNTABLE_ATTRIBUTES,
  DEFAULT_VALUE_BY_TYPE,
  NON_CORPORATE_NON_GMAIL,
  OPERATORS_BY_ATTRIBUTE,
  OPERATORS_BY_TYPE,
  type AttributeType,
  type ConditionAttribute,
} from "./ConditionAttributePicker";
import type {
  SetupValues,
  UtmParameters,
  KeyValueParameters,
  ConversionPayloadParameters,
} from "./CampaignSetupStep";
import MultiSelectDropdown from "./MultiSelectDropdown";
import { APP_OPTIONS } from "./appOptions.data";
import UtmParametersDrawer from "./UtmParametersDrawer";
import ConversionGoalDrawer from "./ConversionGoalDrawer";

export type AudienceMode = "all" | "segments" | "adhoc" | "table";

export interface AdhocCondition {
  attribute: string;
  /** Kept alongside the attribute so the row knows its operator set. */
  type: AttributeType;
  operator: string;
  value: string;
  /** "At least N times" — only meaningful for a countable behaviour on
   *  "in the last"; undefined means no threshold, i.e. any number of times. */
  count?: number;
}

export interface AudienceValues {
  mode: AudienceMode;
  segments: SegmentRef[];
  conditions: AdhocCondition[];
  /** Reach for conditions plotted from an agent-built segment — the count that
   *  segment was sized at, kept until the user edits the conditions. */
  conditionsReach?: number;
  table: string;
  excludeEnabled: boolean;
  excludeSegments: SegmentRef[];
  /** Cohort currently plotted from the co-marketer, if any. */
  cohortId: string;
  /** Push only — which registered apps this send targets. */
  selectedApps: string[];
  /** Push only — one notification to each user's latest active device, or to
   *  every active device they have. */
  deviceTargeting: "all" | "latest";
}

export const EMPTY_AUDIENCE: AudienceValues = {
  mode: "segments",
  segments: [],
  // No condition by default — the user picks the first attribute from the picker.
  conditions: [],
  table: "",
  excludeEnabled: false,
  excludeSegments: [],
  cohortId: "",
  selectedApps: [],
  deviceTargeting: "all",
};

/** Reachable base for "All contacts" — everyone with a valid email address. */
const ALL_CONTACTS_REACH = 412_640;

/** The three ways "Filter by" can be narrowed further. */
const FILTER_MODES: { id: AudienceMode; label: string }[] = [
  { id: "segments", label: "Segments/Lists" },
  { id: "adhoc", label: "Conditions" },
  { id: "table", label: "User data table" },
];

const DATA_TABLES = ["orders_master", "loyalty_tier", "app_events_daily", "product_catalogue"];

const nf = new Intl.NumberFormat("en-US");

const chipSelectClass =
  "h-8 rounded-md border border-[#DDE2EE] bg-white px-2 font-manrope text-[13px] text-[#17173A] outline-none focus:border-[#2F68E5]";

const fieldClass =
  "h-10 w-full rounded-md border border-[#DDE2EE] bg-[#F7F9FC] px-3 font-manrope text-sm text-[#17173A] outline-none transition-colors placeholder:text-[#A0A0A0] focus:border-[#2F68E5] focus:bg-white";

/** The tracking fields live on the campaign's setup, but are edited here
 *  alongside who the send goes to rather than off in a settings drawer. */
export type TrackingValues = Pick<
  SetupValues,
  | "gaTracking"
  | "conversionTracking"
  | "conversionEvent"
  | "conversionWindowValue"
  | "conversionWindowUnit"
  | "revenueParameter"
  | "utmParameters"
  | "keyValueParameters"
  | "conversionPayloadParameters"
>;

/** Account-level UTM defaults shown on hover of the GA-tracking pill. */
const GA_ACCOUNT_UTMS = [
  { label: "Source (utm_source)", value: "netcore" },
  { label: "Medium (utm_medium)", value: "email" },
  { label: "Campaign (utm_campaign)", value: "summer_sale_2026" },
  { label: "Content (utm_content)", value: "hero_cta" },
  { label: "Key 1, Value 1", value: "coupon, SAVE20" },
];

/** One substituted value inside the tracking summary sentence — bold and
 *  dark against the sentence's own grey, the same weight the account-config
 *  tooltip gives its own utm_source=Netcore example. */
function SummaryTerm({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-[#17173A]">{children}</span>;
}

/** Plain-language readout of what "Customize tracking parameters" will
 *  stamp onto this campaign's links — source/content/term stay the account
 *  default (Netcore/test/Campaign), medium and campaign follow the send
 *  itself, and any custom keys the user added tack onto the end. */
function TrackingSummaryText({
  channel,
  campaignName,
  pairs,
}: {
  channel: string;
  campaignName: string;
  pairs: { key: string; value: string }[];
}) {
  const validPairs = pairs.filter((p) => p.key.trim() && p.value.trim());
  return (
    <>
      Tracking parameters with <SummaryTerm>Netcore</SummaryTerm> as the source,{" "}
      <SummaryTerm>{channel}</SummaryTerm> as the medium, and <SummaryTerm>{campaignName}</SummaryTerm>{" "}
      as the campaign, <SummaryTerm>test</SummaryTerm> as the content, <SummaryTerm>Campaign</SummaryTerm>{" "}
      as the term
      {validPairs.length > 0 && (
        <>
          , and the key-value pairs{" "}
          {validPairs.map((p, i) => (
            <span key={`${p.key}-${i}`}>
              <SummaryTerm>
                {p.key}; {p.value}
              </SummaryTerm>
              {i < validPairs.length - 1 ? ", " : " "}
            </span>
          ))}
          included
        </>
      )}
      .
    </>
  );
}

/** "7" + "Days" -> "7 days", "1" + "Days" -> "1 day" — the window value/unit
 *  pair reads as a plain English duration inside the conversion-goal sentence
 *  rather than echoing the dropdown's own capitalized, always-plural label. */
function windowPhrase(value: string, unit: string): string {
  const singular = unit.slice(0, -1).toLowerCase();
  const plural = unit.toLowerCase();
  return `${value} ${value === "1" ? singular : plural}`;
}

/** Plain-language readout of the conversion goal, mirroring
 *  TrackingSummaryText's own bold-term treatment. Before an event is picked
 *  there's nothing to describe yet, so it just prompts for one. */
function ConversionGoalSummaryText({
  conversionEvent,
  conversionWindowValue,
  conversionWindowUnit,
  revenueParameter,
}: {
  conversionEvent: string;
  conversionWindowValue: string;
  conversionWindowUnit: string;
  revenueParameter: string;
}) {
  if (!conversionEvent) {
    return <>Conversion goal enabled. Select an event to continue.</>;
  }
  const window = windowPhrase(conversionWindowValue, conversionWindowUnit);
  if (revenueParameter) {
    return (
      <>
        Track <SummaryTerm>{conversionEvent}</SummaryTerm> as the conversion goal within{" "}
        <SummaryTerm>{window}</SummaryTerm> of delivery, with revenue attributed to{" "}
        <SummaryTerm>{revenueParameter}</SummaryTerm>.
      </>
    );
  }
  return (
    <>
      Track <SummaryTerm>{conversionEvent}</SummaryTerm> as a conversion within{" "}
      <SummaryTerm>{window}</SummaryTerm> of delivery.
    </>
  );
}

function GaConfigPill() {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className="inline-flex cursor-default items-center rounded-full border border-[#D6E2FF] bg-[#EDF1FF] px-2 py-0.5 font-manrope text-[11px] font-medium leading-4 text-[#2F68E5]"
          >
            Pre-filled from account config
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="max-w-[280px] border border-[#DDE2EE] bg-white p-3 text-[#17173A] shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
        >
          <ul className="space-y-1.5 font-manrope text-xs leading-[18px]">
            {GA_ACCOUNT_UTMS.map((row) => (
              <li key={row.label}>
                <span className="text-[#6F6F8D]">{row.label}</span>
                <span className="text-[#6F6F8D]"> — </span>
                <span className="font-semibold text-[#17173A]">{row.value}</span>
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** A smaller toggle than the shared Switch — used for the Exclude/Domain
 *  filter rows, which sit next to compact label text. */
function MiniSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <SwitchPrimitives.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="peer inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=checked]:bg-[#00C48C] data-[state=unchecked]:bg-input"
    >
      <SwitchPrimitives.Thumb className="pointer-events-none block h-3 w-3 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitives.Root>
  );
}

function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-full border-2 transition-colors",
        checked ? "border-[#2F68E5]" : "border-[#C3CAD9]"
      )}
    >
      {checked && <span className="size-2 rounded-full bg-[#2F68E5]" />}
    </span>
  );
}

function InfoDot({ label }: { label: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="More information"
            className="inline-grid shrink-0 place-items-center text-[#8A8AA3] transition-colors hover:text-[#6F6F8D]"
          >
            <Info className="size-4" strokeWidth={2} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          sideOffset={8}
          className="max-w-[260px] overflow-visible rounded-lg border-0 bg-black px-3 py-2.5 text-white shadow-none"
        >
          <p className="font-manrope text-xs leading-[18px]">{label}</p>
          <TooltipPrimitive.Arrow className="fill-black" width={10} height={6} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Flags a collapsed step whose required fields aren't all filled in —
 *  conversion tracking on with no goal picked, so far. Shown ambiently
 *  whenever that's true, not just after a failed "Done". */
export function ConfigPendingPill({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#E5484D] bg-white pl-2.5 pr-3">
      <AlertTriangle className="size-3.5 shrink-0 text-[#E5484D]" strokeWidth={2.2} />
      <span className="font-manrope text-[13px] font-medium text-[#E5484D]">
        {count} configuration{count === 1 ? "" : "s"} pending
      </span>
    </div>
  );
}

/** The reachable-contacts count for the Audience step's own accordion
 *  header — shown only while the step is collapsed, since the expanded
 *  body shows the fuller AudienceReachStat instead. */
export function AudienceReachablePill({ reach }: { reach: number }) {
  return (
    <div className="flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-[#DDE2EE] bg-white pl-2 pr-3">
      <UserCheck className="size-4 shrink-0 text-[#8A8AA3]" strokeWidth={2} />
      <span className="font-manrope text-[13px] text-[#6F6F8D]">
        Potential reach: <span className="font-bold text-[#17173A]">{nf.format(reach)}</span>
      </span>
    </div>
  );
}

/** The same reach count, laid out for the expanded card body — a big
 *  number over its caption. Rendered by the overlay as a sibling of this
 *  step's own StepCard (not inside it), so it sits at the accordion row's
 *  true right edge instead of being capped by the card's own max-width. */
export function AudienceReachStat({ reach }: { reach: number }) {
  return (
    <div className="flex flex-col items-end">
      <span className="font-manrope text-2xl font-bold leading-none text-[#17173A]">
        {nf.format(reach)}
      </span>
      <div className="mt-1 flex items-center gap-1">
        <span className="font-manrope text-[13px] text-[#6F6F8D]">Potential reach</span>
        <InfoDot label="Contacts who can receive this channel after consent and suppression checks." />
      </div>
    </div>
  );
}

/** A bordered toggle row — switch, label, optional info tooltip and badge —
 *  and whatever the switch reveals underneath, if anything. */
function FilterSection({
  title,
  info,
  badge,
  checked,
  onChange,
  flash,
  children,
}: {
  title: string;
  info?: string;
  /** Extra chip sitting next to the title, e.g. a "pre-filled" pill. */
  badge?: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  /** Briefly flashed after the co-marketer plots this field. */
  flash?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="mt-5">
      <div className={cn("flex flex-wrap items-center gap-2", flash && "cmk-field-flash")}>
        <MiniSwitch checked={checked} onCheckedChange={onChange} />
        <p className="font-manrope text-sm font-semibold text-[#17173A]">{title}</p>
        {info && <InfoDot label={info} />}
        {badge}
      </div>

      {children && (
        <div className="t-acc" data-open={checked ? "true" : "false"}>
          <div className="t-acc-panel">
            <div className="t-acc-panel-inner">
              <div className="pt-4">{children}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Reach for the current selection. Overlapping segments are never a clean sum,
 * so we take the largest and add a share of the rest — honest about being an
 * estimate without pretending to a count only the backend can produce.
 */
export function reachFor(v: AudienceValues): number {
  const union = (refs: SegmentRef[]) => {
    const counts = refs.map((r) => r.reach).sort((a, b) => b - a);
    return counts.length
      ? counts[0] + Math.round(counts.slice(1).reduce((a, b) => a + b, 0) * 0.7)
      : 0;
  };

  let base = 0;
  if (v.mode === "all") base = ALL_CONTACTS_REACH;
  if (v.mode === "segments") base = union(v.segments);
  if (v.mode === "adhoc") {
    // An empty condition set matches nobody — 0.42^0 would otherwise
    // read as the full base, which is the opposite of a blank filter.
    base = v.conditions.length
      ? (v.conditionsReach ?? Math.round(ALL_CONTACTS_REACH * Math.pow(0.42, v.conditions.length)))
      : 0;
  }
  if (v.mode === "table") base = v.table ? 38_412 : 0;

  if (v.excludeEnabled) {
    // A suppression only removes people who are in the selection to begin with,
    // so it's capped against the base — a big exclusion list can't take the
    // count below a quarter of what was targeted.
    const overlap = Math.min(Math.round(union(v.excludeSegments) * 0.6), Math.round(base * 0.25));
    base = Math.max(0, base - overlap);
  }
  return base;
}

/**
 * Audience step — who this campaign goes to. The co-marketer opens alongside it
 * and proposes cohorts; picking one plots straight into these fields, which is
 * why everything here is editable afterwards rather than read-only.
 */
/** Parked: the banner that hands the audience to the Segment agent in the
 *  chat. Cori now builds one from a typed goal instead (audienceAgentFlow). */
const SHOW_SEGMENT_AGENT_BANNER = false;

/**
 * The standing offer to have the audience built for you. It is not a fifth
 * mode: it never selects one, it hands the brief to the Segment agent in the
 * co-marketer and plots whichever cut you pick onto the fields below — so it
 * sits above the card instead of among the radios. Fixed copy on purpose: a
 * heading that rewrites itself would make the same control look like a
 * different one each time you glance at it.
 */
function SegmentAgentBanner({ onUse }: { onUse: () => void }) {
  return (
    <div className="relative mb-4 w-full overflow-hidden rounded-lg border border-[#DDE2EE] bg-white p-4">
      {/* Rotating ring drawn over the hairline border, so the offer reads as
          live without the card jumping when it starts. */}
      <span className="agent-offer-shimmer" aria-hidden />
      <div className="relative z-[1] flex flex-wrap items-center gap-4">
        <img src={sparkleAi} alt="" className="h-7 w-7 shrink-0" />
        <div className="min-w-[220px] flex-1">
          <p className="font-manrope text-sm font-bold text-[#17173A]">
            Let the Segment agent build this audience
          </p>
          <p className="mt-0.5 font-manrope text-xs leading-[18px] text-[#6F6F8D]">
            Tell it what this campaign is for and it scores your contacts against that goal, then plots
            the cut you pick onto the fields below.
          </p>
        </div>
        <button
          type="button"
          onClick={onUse}
          className="btn-ai-gradient shrink-0 rounded-md px-4 py-2 font-manrope text-[13px] font-semibold"
        >
          <span className="relative z-[1]">Build with Audience agent</span>
        </button>
      </div>
    </div>
  );
}

export default function CampaignAudienceStep({
  values,
  onChange,
  highlight,
  tracking,
  onTrackingChange,
  trackingHighlight,
  channel = "Email",
  campaignName,
  appsError,
  conversionEventError,
  part = "all",
  onUseSegmentAgent,
}: {
  values: AudienceValues;
  onChange: (patch: Partial<AudienceValues>) => void;
  /** Briefly flashed after the co-marketer plots a cohort. */
  highlight?: boolean;
  tracking: TrackingValues;
  onTrackingChange: (patch: Partial<TrackingValues>) => void;
  /** Tracking field keys just written by a co-marketer apply — briefly flashed. */
  trackingHighlight?: Partial<Record<keyof TrackingValues, boolean>>;
  channel?: string;
  /** This campaign's own name — folded into the customize-tracking summary
   *  sentence as the utm_campaign value. */
  campaignName?: string;
  /** Red message under the Target app(s) field — set when Done was tried without one. */
  appsError?: string;
  /** Red message under Event name — set when Done was tried with conversion
   *  tracking on but no goal picked. */
  conversionEventError?: string;
  /** Which half of the step to draw. App Push's stepper splits it in two —
   *  "setup" is target apps + tracking + conversion goal, "audience" is who
   *  gets it and who's excluded. Everything else draws "all". */
  part?: "all" | "setup" | "audience" | "flow";
  /** Hands the audience to the Segment agent — the host opens the co-marketer
   *  on its questions. When omitted the banner isn't shown. */
  onUseSegmentAgent?: () => void;
}) {
  // Collapses the filter-mode tabs (and whichever one's fields) once the user
  // has them set up, without losing the picked mode — reopened from the same
  // chevron, not by re-picking "Filter by".
  const [filterExpanded, setFilterExpanded] = useState(true);
  const [utmDrawerOpen, setUtmDrawerOpen] = useState(false);
  const [conversionGoalDrawerOpen, setConversionGoalDrawerOpen] = useState(false);

  /** Any hand edit invalidates a count that came from the co-marketer's segment. */
  const setConditions = (conditions: AdhocCondition[]) =>
    onChange({ conditions, conditionsReach: undefined });

  const setCondition = (index: number, patch: Partial<AdhocCondition>) =>
    setConditions(values.conditions.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  /** A picked attribute carries its own operator set, so the row starts on that
   *  type's first operator and default value rather than an invalid pairing. */
  const conditionFor = (a: ConditionAttribute): AdhocCondition => ({
    attribute: a.label,
    type: a.type,
    operator: (OPERATORS_BY_ATTRIBUTE[a.label] ?? OPERATORS_BY_TYPE[a.type])[0],
    value: DEFAULT_VALUE_BY_TYPE[a.type],
  });

  const addCondition = (a: ConditionAttribute) =>
    setConditions([...values.conditions, conditionFor(a)]);

  const replaceAttribute = (index: number, a: ConditionAttribute) => {
    const next = conditionFor(a);
    // Swapping within the same type keeps what the user already typed — but
    // never a count from the old attribute, which may not even be countable.
    const current = values.conditions[index];
    setCondition(index, current.type === a.type ? { attribute: a.label, count: undefined } : next);
  };

  /** The mode-specific fields — segments picker, ad-hoc conditions or a data
   *  table — shared by the original Filter-by layout and the stepper's. */
  const modeFields = (
    <>
              {values.mode === "segments" && (
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="shrink-0 font-manrope text-[13px] font-semibold text-[#6F6F8D]">
                      Contacts which are in
                    </span>
                  </div>
                  <div className={cn(highlight && "cmk-plot-flash")}>
                    <SegmentSelect
                      value={values.segments}
                      onChange={(segments) => onChange({ segments })}
                    />
                  </div>
                  <p className="mt-1.5 font-manrope text-xs text-[#6F6F8D]">
                    Select upto 15 list / segment
                  </p>
                </div>
              )}

              {values.mode === "adhoc" && (
                <div className="mt-4">
                  <div className={cn("space-y-2", highlight && "cmk-plot-flash")}>
                    {values.conditions.map((c, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-1">
                        <span className="w-[90px] shrink-0 font-manrope text-[13px] font-semibold text-[#6F6F8D]">
                          {i === 0 ? "Contacts who" : "And"}
                        </span>
                        <ConditionAttributePicker
                          variant="chip"
                          value={c.attribute}
                          onSelect={(a) => replaceAttribute(i, a)}
                        />
                        {c.type === "recency" && COUNTABLE_ATTRIBUTES.has(c.attribute) && c.operator === "in the last" && (
                          <>
                            <span className="shrink-0 font-manrope text-[13px] font-semibold text-[#6F6F8D]">
                              at least
                            </span>
                            <input
                              type="number"
                              min={1}
                              value={c.count ?? ""}
                              onChange={(e) =>
                                setCondition(i, {
                                  count: e.target.value ? Math.max(1, parseInt(e.target.value, 10)) : undefined,
                                })
                              }
                              placeholder="1"
                              className={cn(
                                chipSelectClass,
                                "w-[44px] px-1 text-center [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              )}
                            />
                            <span className="shrink-0 font-manrope text-[13px] font-semibold text-[#6F6F8D]">
                              times
                            </span>
                          </>
                        )}
                        <Dropdown
                          value={c.operator}
                          options={OPERATORS_BY_ATTRIBUTE[c.attribute] ?? OPERATORS_BY_TYPE[c.type]}
                          onChange={(v) =>
                            setCondition(i, {
                              operator: v,
                              count: v === "in the last" ? c.count : undefined,
                              // No value to type against the canned rule — clear
                              // whatever was there so a stale value can't linger.
                              value: v === NON_CORPORATE_NON_GMAIL ? "" : c.value,
                            })
                          }
                          widthClass="w-[190px]"
                          heightClass="h-8"
                        />
                        {c.type === "boolean" ? (
                          <Dropdown
                            value={c.value}
                            options={["True", "False"]}
                            onChange={(v) => setCondition(i, { value: v })}
                            widthClass="w-[140px]"
                            heightClass="h-8"
                          />
                        ) : (
                          <input
                            type="text"
                            value={c.operator === NON_CORPORATE_NON_GMAIL ? "" : c.value}
                            disabled={c.operator === NON_CORPORATE_NON_GMAIL}
                            onChange={(e) => setCondition(i, { value: e.target.value })}
                            className={cn(
                              chipSelectClass,
                              "w-[140px]",
                              c.operator === NON_CORPORATE_NON_GMAIL && "cursor-not-allowed bg-[#F7F9FC] text-[#8A8AA3]"
                            )}
                          />
                        )}
                        <button
                          type="button"
                          aria-label="Remove condition"
                          onClick={() => setConditions(values.conditions.filter((_, x) => x !== i))}
                          className="grid size-7 place-items-center rounded-md text-[#8A8AA3] hover:bg-[#F0F3F9] hover:text-[#17173A]"
                        >
                          <X className="size-4" strokeWidth={2.2} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className={cn(values.conditions.length > 0 && "mt-3")}>
                    <ConditionAttributePicker onSelect={addCondition} />
                    {values.conditions.length === 0 && (
                      <p className="mt-1.5 font-manrope text-xs text-[#6F6F8D]">
                        Get started by adding a condition
                      </p>
                    )}
                  </div>
                </div>
              )}

              {values.mode === "table" && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="shrink-0 font-manrope text-[13px] font-semibold text-[#6F6F8D]">
                    Contacts which are in
                  </span>
                  <Dropdown
                    value={values.table || "Select a table"}
                    options={["Select a table", ...DATA_TABLES]}
                    onChange={(v) => onChange({ table: v === "Select a table" ? "" : v })}
                    widthClass="w-[240px]"
                    heightClass="h-8"
                  />
                </div>
              )}
    </>
  );

  const [counting, setCounting] = useState(false);
  const [counted, setCounted] = useState(false);

  // App Push's stepper draws the audience step the way the campaign-creation
  // reference does: a Target audience card with four radio options, then an
  // Exclude contacts card with its own toggle.
  if (part === "flow") {
    const MODES: { id: AudienceMode; label: string }[] = [
      { id: "all", label: "All contacts" },
      { id: "segments", label: "Segments/Lists" },
      { id: "adhoc", label: "Ad-hoc segment" },
      { id: "table", label: "User data table" },
    ];
    return (
      <>
      {SHOW_SEGMENT_AGENT_BANNER && onUseSegmentAgent && <SegmentAgentBanner onUse={onUseSegmentAgent} />}
      <div className="rounded-lg border border-[#DDE2EE] bg-white p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="font-manrope text-base font-bold text-[#17173A]">Target audience</h2>
            <p className="mt-1 font-manrope text-sm text-[#6F6F8D]">Select your target audience for the campaign</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {counted && (
              <span className="font-manrope text-sm text-[#6F6F8D]">
                Reachable contacts{" "}
                <span className="font-bold text-[#17173A]">{reachFor(values).toLocaleString("en-US")}</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setCounting(true);
                window.setTimeout(() => {
                  setCounting(false);
                  setCounted(true);
                }, 800);
              }}
              disabled={counting}
              className="h-8 rounded border border-[#2F68E5] bg-white px-3 font-manrope text-xs font-semibold uppercase tracking-[0.42px] text-[#2F68E5] transition-colors hover:bg-[#F4F8FF] disabled:opacity-60"
            >
              {counting ? "Counting…" : "Get count"}
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-[#DDE2EE] px-6 py-5">
          <div role="radiogroup" aria-label="Target audience" className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={values.mode === m.id}
                onClick={() => onChange({ mode: m.id })}
                className="flex items-center gap-2.5 text-left"
              >
                <Radio checked={values.mode === m.id} />
                <span
                  className={cn(
                    "font-manrope text-sm text-[#17173A]",
                    values.mode === m.id ? "font-semibold" : "font-medium"
                  )}
                >
                  {m.label}
                </span>
              </button>
            ))}
          </div>
          {values.mode !== "all" && <div className="mt-5 border-t border-[#EEF1F7] pt-5">{modeFields}</div>}
        </div>

        <h2 className="mt-10 font-manrope text-base font-bold text-[#17173A]">Device targeting</h2>
        <p className="mt-1 font-manrope text-sm text-[#6F6F8D]">
          Choose whether each user receives the notification on their latest active device or on all of their
          active devices. <a
            href="https://cedocs.netcore.ai/docs/create-app-push#device-targeting"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2F9BE5] hover:underline"
          >
            Learn more
          </a>
        </p>
        <div role="radiogroup" aria-label="Device targeting" className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
          {(
            [
              { id: "all", label: "All active devices" },
              { id: "latest", label: "Latest active device only" },
            ] as const
          ).map((d) => (
            <button
              key={d.id}
              type="button"
              role="radio"
              aria-checked={values.deviceTargeting === d.id}
              onClick={() => onChange({ deviceTargeting: d.id })}
              className="flex items-center gap-2.5 text-left"
            >
              <Radio checked={values.deviceTargeting === d.id} />
              <span
                className={cn(
                  "font-manrope text-sm text-[#17173A]",
                  values.deviceTargeting === d.id ? "font-semibold" : "font-medium"
                )}
              >
                {d.label}
              </span>
            </button>
          ))}
        </div>

        <h2 className="mt-10 font-manrope text-base font-bold text-[#17173A]">Exclude contacts</h2>
        <div className="mt-4 rounded-lg border border-[#DDE2EE] px-6 py-5">
          <div className="flex items-center justify-between gap-6">
            <p className="flex items-center gap-2 font-manrope text-sm font-semibold text-[#17173A]">
              Exclude list/segment
              <Info className="size-3.5 text-[#8A8AA3]" strokeWidth={2} aria-label="Contacts in these segments are held back even if they match your targeting." />
            </p>
            <Switch
              checked={values.excludeEnabled}
              onCheckedChange={(excludeEnabled) => onChange({ excludeEnabled })}
              aria-label="Exclude list/segment"
              className="data-[state=checked]:bg-[#00C48C]"
            />
          </div>
          {values.excludeEnabled && (
            <div className="mt-4">
              <SegmentSelect
                value={values.excludeSegments}
                onChange={(excludeSegments) => onChange({ excludeSegments })}
              />
              <p className="mt-1.5 font-manrope text-xs text-[#6F6F8D]">Select upto 15 list / segment</p>
            </div>
          )}
        </div>
      </div>
      </>
    );
  }

  return (
    <>
    {SHOW_SEGMENT_AGENT_BANNER && onUseSegmentAgent && part !== "setup" && <SegmentAgentBanner onUse={onUseSegmentAgent} />}
    <StepCard full>
      {part !== "audience" && channel !== "Email" && (
        <div className="mb-6">
          <MultiSelectDropdown
            label="Target app(s)"
            required
            options={APP_OPTIONS}
            value={values.selectedApps}
            onChange={(selectedApps) => onChange({ selectedApps })}
            error={appsError}
          />
        </div>
      )}
      {part !== "setup" && (
      <>
      <div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            type="button"
            onClick={() => onChange({ mode: values.mode === "all" ? "segments" : values.mode })}
            className="flex items-center gap-2.5 text-left"
          >
            <Radio checked={values.mode !== "all"} />
            <span
              className={cn(
                "font-manrope text-sm text-[#17173A]",
                values.mode !== "all" ? "font-semibold" : "font-medium"
              )}
            >
              Filter by
            </span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ mode: "all" })}
            className="flex items-center gap-2.5 text-left"
          >
            <Radio checked={values.mode === "all"} />
            <span
              className={cn(
                "font-manrope text-sm text-[#17173A]",
                values.mode === "all" ? "font-semibold" : "font-medium"
              )}
            >
              All contacts
            </span>
          </button>
        </div>

        {values.mode !== "all" && (
          <div className="mt-4 flex items-start gap-2">
            <button
              type="button"
              aria-label={filterExpanded ? "Collapse filter" : "Expand filter"}
              aria-expanded={filterExpanded}
              onClick={() => setFilterExpanded((v) => !v)}
              className="mt-1.5 grid size-5 shrink-0 place-items-center rounded text-[#8A8AA3] transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
            >
              <ChevronDown
                className={cn("size-4 transition-transform", !filterExpanded && "-rotate-90")}
                strokeWidth={2}
              />
            </button>
            <div className="min-w-0 flex-1">
              <div className="inline-flex">
                {FILTER_MODES.map((m, i) => {
                  const active = values.mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onChange({ mode: m.id })}
                      className={cn(
                        "border px-4 py-2 font-manrope text-sm font-medium transition-colors",
                        i > 0 && "-ml-px",
                        i === 0 && "rounded-l-md",
                        i === FILTER_MODES.length - 1 && "rounded-r-md",
                        active
                          ? "relative z-[1] border-[#2F68E5] bg-[#F4F8FF] text-[#2F68E5]"
                          : "border-[#DDE2EE] text-[#17173A] hover:bg-[#F7F9FC]"
                      )}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {filterExpanded && modeFields}
            </div>
          </div>
        )}
      </div>

      <FilterSection
        title="Exclude contacts"
        info="Contacts in these segments are held back even if they match your targeting."
        checked={values.excludeEnabled}
        onChange={(v) => onChange({ excludeEnabled: v })}
      >
        <div className="ml-7">
          <SegmentSelect
            value={values.excludeSegments}
            onChange={(excludeSegments) => onChange({ excludeSegments })}
          />
          <p className="mt-1.5 font-manrope text-xs text-[#6F6F8D]">Select upto 15 list / segment</p>
        </div>
      </FilterSection>
      </>
      )}

      {part !== "audience" && (
      <>
      <FilterSection
        title="Include tracking parameters"
        badge={<GaConfigPill />}
        info="Track performance of your campaign with UTM parameters."
        checked={tracking.gaTracking}
        onChange={(v) => onTrackingChange({ gaTracking: v })}
        flash={trackingHighlight?.gaTracking}
      >
        <div className="ml-7 flex items-start gap-3 rounded-lg border border-[#DDE2EE] bg-[#F7F9FC] p-4">
          <p className="min-w-0 flex-1 font-manrope text-sm leading-[22px] text-[#6F6F8D]">
            <TrackingSummaryText
              channel={channel}
              campaignName={campaignName || "this campaign"}
              pairs={tracking.keyValueParameters.pairs}
            />
          </p>
          <button
            type="button"
            aria-label="Edit tracking parameters"
            onClick={() => setUtmDrawerOpen(true)}
            className="grid size-8 shrink-0 place-items-center rounded-md text-[#6F6F8D] transition-colors hover:bg-white hover:text-[#17173A]"
          >
            <Pencil className="size-4" strokeWidth={2} />
          </button>
        </div>
      </FilterSection>

      <UtmParametersDrawer
        open={utmDrawerOpen}
        channel={channel}
        values={tracking.utmParameters}
        onChange={(patch) =>
          onTrackingChange({ utmParameters: { ...tracking.utmParameters, ...patch } as UtmParameters })
        }
        keyValueParameters={tracking.keyValueParameters}
        onKeyValueChange={(patch) =>
          onTrackingChange({
            keyValueParameters: { ...tracking.keyValueParameters, ...patch } as KeyValueParameters,
          })
        }
        onClose={() => setUtmDrawerOpen(false)}
      />

      <FilterSection
        title="Conversion tracking"
        info="Activity which represents a conversion for this campaign."
        checked={tracking.conversionTracking}
        onChange={(v) => onTrackingChange({ conversionTracking: v })}
        flash={trackingHighlight?.conversionTracking}
      >
        <div className="ml-7 flex items-center gap-3 rounded-lg border border-[#DDE2EE] bg-[#F7F9FC] p-4">
          <div className="min-w-0 flex-1">
            <p className="font-manrope text-sm leading-[22px] text-[#6F6F8D]">
              <ConversionGoalSummaryText
                conversionEvent={tracking.conversionEvent}
                conversionWindowValue={tracking.conversionWindowValue}
                conversionWindowUnit={tracking.conversionWindowUnit}
                revenueParameter={tracking.revenueParameter}
              />
            </p>
            {conversionEventError && (
              <p role="alert" className="mt-1.5 font-manrope text-xs font-medium text-[#E5484D]">
                {conversionEventError}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Edit conversion goal"
            onClick={() => setConversionGoalDrawerOpen(true)}
            className="grid size-8 shrink-0 place-items-center rounded-md text-[#6F6F8D] transition-colors hover:bg-white hover:text-[#17173A]"
          >
            <Pencil className="size-4" strokeWidth={2} />
          </button>
        </div>
      </FilterSection>

      <ConversionGoalDrawer
        open={conversionGoalDrawerOpen}
        conversionEvent={tracking.conversionEvent}
        onConversionEventChange={(conversionEvent) => onTrackingChange({ conversionEvent })}
        conversionWindowValue={tracking.conversionWindowValue}
        conversionWindowUnit={tracking.conversionWindowUnit}
        onConversionWindowChange={(patch) => onTrackingChange(patch)}
        revenueParameter={tracking.revenueParameter}
        onRevenueParameterChange={(revenueParameter) => onTrackingChange({ revenueParameter })}
        payloadParameters={tracking.conversionPayloadParameters}
        onPayloadParametersChange={(patch) =>
          onTrackingChange({
            conversionPayloadParameters: {
              ...tracking.conversionPayloadParameters,
              ...patch,
            } as ConversionPayloadParameters,
          })
        }
        onClose={() => setConversionGoalDrawerOpen(false)}
      />
      </>
      )}
    </StepCard>
    </>
  );
}
