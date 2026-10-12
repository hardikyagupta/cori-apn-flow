import { cn } from "@/lib/utils";
import StepCard from "./StepCard";

/** One row of the UTM parameter table — whether it's appended to the link,
 *  and which campaign value it's mapped to. */
export interface UtmParamConfig {
  enabled: boolean;
  value: string;
}

export interface UtmParameters {
  source: UtmParamConfig;
  medium: UtmParamConfig;
  campaign: UtmParamConfig;
  term: UtmParamConfig;
  /** Not in the per-parameter drawer — only App Push's Setup step edits it. */
  content: UtmParamConfig;
}

export const DEFAULT_UTM_PARAMETERS: UtmParameters = {
  source: { enabled: true, value: "Netcore" },
  medium: { enabled: true, value: "" },
  campaign: { enabled: false, value: "" },
  term: { enabled: false, value: "" },
  content: { enabled: false, value: "" },
};

/** Same shape as DEFAULT_UTM_PARAMETERS, but with medium and campaign filled
 *  in from the draft actually being created — the channel it's going out on
 *  and the name it currently has — rather than left blank. Used whenever a
 *  channel and campaign name are known, i.e. everywhere but the brief reset
 *  between one draft closing and the next one's own open effect running. */
export function defaultUtmParameters(channel: string, campaignName: string): UtmParameters {
  return {
    ...DEFAULT_UTM_PARAMETERS,
    medium: { enabled: true, value: channel },
    campaign: { enabled: false, value: campaignName },
  };
}

/** One custom UTM key-value pair — Email-only, appended alongside the fixed
 *  parameters above. */
export interface UtmKeyValuePair {
  id: string;
  key: string;
  value: string;
}

export interface KeyValueParameters {
  enabled: boolean;
  pairs: UtmKeyValuePair[];
}

/** Custom keys are capped; the ADD CUSTOM KEY button shows how many slots
 *  are left. */
export const MAX_CUSTOM_KEYS = 5;

export function newUtmKeyValuePair(): UtmKeyValuePair {
  return { id: `kv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, key: "", value: "" };
}

export const DEFAULT_KEY_VALUE_PARAMETERS: KeyValueParameters = {
  enabled: false,
  pairs: [],
};

/** One filter on the conversion event's own payload — e.g. only count it
 *  when Product_Checkout equals a given value. */
export interface ConversionPayloadParam {
  id: string;
  attribute: string;
  operator: string;
  value: string;
}

export interface ConversionPayloadParameters {
  enabled: boolean;
  pairs: ConversionPayloadParam[];
}

/** Payload filters are capped the same way custom UTM keys are. */
export const MAX_CONVERSION_PAYLOAD_PARAMS = 5;

export function newConversionPayloadParam(): ConversionPayloadParam {
  return {
    id: `cp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    attribute: "",
    operator: "Equal to",
    value: "",
  };
}

export const DEFAULT_CONVERSION_PAYLOAD_PARAMETERS: ConversionPayloadParameters = {
  enabled: false,
  pairs: [],
};

export interface SetupValues {
  /** What this campaign is for. Nothing else in the step opens until it's set. */
  goal: string;
  tags: string;
  gaTracking: boolean;
  conversionTracking: boolean;
  /** Event name — which behaviour counts as a conversion. */
  conversionEvent: string;
  /** How long after the event it still counts, e.g. "7" + "Days". */
  conversionWindowValue: string;
  conversionWindowUnit: string;
  /** Which attribute on the conversion event holds the revenue figure. */
  revenueParameter: string;
  audienceSuggestion: string;
  /** Holds back a send to anyone who already got a campaign from this
   *  account within the dedup window, regardless of list/segment overlap. */
  avoidDuplicateComms: boolean;
  utmParameters: UtmParameters;
  keyValueParameters: KeyValueParameters;
  conversionPayloadParameters: ConversionPayloadParameters;
}

export function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function mergeTags(current: string, incoming: string): string {
  const seen = new Set(parseTags(current).map((t) => t.toLowerCase()));
  const out = parseTags(current);
  for (const tag of parseTags(incoming)) {
    if (!seen.has(tag.toLowerCase())) {
      out.push(tag);
      seen.add(tag.toLowerCase());
    }
  }
  return out.join(", ");
}

/**
 * The goals a campaign can be created against. Deliberately outcomes the
 * platform can actually reason about — each one tells the co-marketer which
 * audience, content and timing advice is relevant, which is why the right-hand
 * suggestions stay closed until one is picked.
 */
export const CAMPAIGN_GOALS = [
  {
    value: "reengage-dormant",
    label: "Re-engage dormant contacts",
    hint: "Bring back people who've gone quiet",
  },
  {
    value: "first-purchase",
    label: "Drive a first purchase",
    hint: "Convert signups who haven't bought yet",
  },
  {
    value: "repeat-purchase",
    label: "Increase repeat purchases",
    hint: "Get existing customers ordering again",
  },
  {
    value: "abandoned-cart",
    label: "Recover abandoned carts",
    hint: "Close the sale someone walked away from",
  },
  {
    value: "product-launch",
    label: "Announce a product or feature launch",
    hint: "Put something new in front of the right people",
  },
  {
    value: "promo-offer",
    label: "Promote an offer or sale",
    hint: "Time-boxed discount or campaign moment",
  },
  {
    value: "onboarding",
    label: "Onboard new customers",
    hint: "Get new joiners to their first real action",
  },
  {
    value: "winback",
    label: "Win back churned customers",
    hint: "Last-chance reactivation for lapsed contacts",
  },
] as const;

/** Label for a stored goal value — used by the navbar and the AI panel. */
export function goalLabel(value: string): string | undefined {
  return CAMPAIGN_GOALS.find((g) => g.value === value)?.label;
}

/**
 * Setup step for an Email campaign. Starts as a single question — what is this
 * campaign for — and only opens up the rest of the form once it's answered, so
 * the goal is a real decision rather than a field to skip past.
 */
export default function CampaignSetupStep({
  values,
  onChange,
  highlight,
}: {
  values: SetupValues;
  onChange: (patch: Partial<SetupValues>) => void;
  /** Field keys just written by a co-marketer apply — briefly flashed. */
  highlight?: Partial<Record<keyof SetupValues, boolean>>;
}) {
  // The goal question is out of phase 1, so nothing here is gated any more —
  // tracking is open from the moment the step is. Tags live in Campaign settings.
  const chosen = true;
  // Previously: const chosen = Boolean(values.goal);

  return (
    <StepCard>
      {/* Campaign goal question — not part of phase 1.
      <div className={chosen ? "mb-8" : ""}>
        <label className="mb-1.5 block font-manrope text-sm font-semibold text-[#17173A]">
          What are you trying to achieve? <span className="text-[#FC5E02]">*</span>
        </label>
        <GoalDropdown
          options={CAMPAIGN_GOALS}
          value={values.goal}
          placeholder="Pick a goal for this campaign"
          onChange={(goal) => onChange({ goal })}
        />

        {!chosen && (
          <p className="mt-3 font-manrope text-xs leading-[18px] text-[#6F6F8D]">
            Pick a goal to unlock the rest of the setup — naming, tags, tracking and the
            co-marketer's recommendations all follow from it.
          </p>
        )}
      </div>
      */}

      <div className="t-acc" data-open={chosen ? "true" : "false"}>
        <div className="t-acc-panel">
          <div className="t-acc-panel-inner">
            {values.audienceSuggestion && (
              <div
                className={cn(
                  "rounded-md border border-[#DDE2EE] bg-[#F7F9FC] p-4",
                  highlight?.audienceSuggestion && "cmk-field-flash"
                )}
              >
                <p className="font-manrope text-[11px] font-semibold uppercase tracking-wide text-[#8A8AA3]">
                  Planned audience
                </p>
                <p className="mt-1 font-manrope text-sm font-semibold text-[#17173A]">
                  {values.audienceSuggestion}
                </p>
                <p className="mt-1 font-manrope text-xs leading-[18px] text-[#6F6F8D]">
                  Parked from co-marketer. You can refine this on the Audience step.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </StepCard>
  );
}
