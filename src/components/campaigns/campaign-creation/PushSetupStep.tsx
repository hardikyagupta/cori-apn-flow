import { useState, type ReactNode } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import Dropdown from "../Dropdown";
import MultiSelectDropdown from "./MultiSelectDropdown";
import { APP_OPTIONS } from "./appOptions.data";
import {
  MAX_CONVERSION_PAYLOAD_PARAMS,
  newConversionPayloadParam,
  mergeTags,
  parseTags,
  type SetupValues,
  type UtmParamConfig,
  type UtmParameters,
} from "./CampaignSetupStep";
import {
  CONVERSION_EVENT_OPTIONS,
  CONVERSION_WINDOW_UNITS,
  CONVERSION_WINDOW_VALUES,
  REVENUE_PARAMETER_OPTIONS,
} from "./ConversionGoalDrawer";

/** Parked for now — the name is edited from the top bar instead. */
const SHOW_NAME_FIELD = false;

const MAX_TAGS = 15;
const MAX_NAME = 100;
const PAYLOAD_ATTRIBUTES = ["name", "Price", "Product_Checkout", "Product_Delivery", "Quantity", "Category"];
const PAYLOAD_OPERATORS = ["Equal to", "Not equal to", "One of", "Begins with", "Contains"];

/** Grey-filled field, the way this step's reference draws every input. */
const fieldClass =
  "h-10 w-full rounded-md border border-transparent bg-[#F4F5F9] px-3 font-manrope text-sm text-[#17173A] outline-none transition-colors placeholder:text-[#8A8AA3] focus:border-[#2F68E5] focus:bg-white";

function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <p className="mb-1.5 font-manrope text-sm font-semibold text-[#17173A]">
      {children}
      {required && <span className="ml-0.5 text-[#E5484D]">*</span>}
    </p>
  );
}

/** A bordered section with a toggle on its heading row. */
function ToggleCard({
  title,
  description,
  checked,
  onChange,
  children,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#DDE2EE] bg-white px-6 py-5">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h3 className="font-manrope text-[15px] font-bold text-[#17173A]">{title}</h3>
          <p className="mt-0.5 font-manrope text-[13px] text-[#6F6F8D]">{description}</p>
        </div>
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          aria-label={title}
          className="data-[state=checked]:bg-[#00C48C]"
        />
      </div>
      {checked && children}
    </section>
  );
}

/** Chip input: Enter or comma adds a tag, × removes it. */
function TagsField({ value, onChange }: { value: string; onChange: (tags: string) => void }) {
  const [draft, setDraft] = useState("");
  const tags = parseTags(value);
  const add = () => {
    const next = draft.trim().replace(/,$/, "");
    setDraft("");
    if (!next || tags.length >= MAX_TAGS) return;
    onChange(mergeTags(value, next));
  };
  return (
    <div className="flex min-h-10 w-full flex-wrap items-center gap-2 rounded-md border border-transparent bg-[#F4F5F9] px-3 py-1.5 focus-within:border-[#2F68E5] focus-within:bg-white">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#CDEBFB] py-0.5 pl-3 pr-1.5 font-manrope text-[13px] font-semibold text-[#17173A]"
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => onChange(tags.filter((t) => t !== tag).join(", "))}
            className="grid size-[18px] place-items-center rounded-full bg-[#17173A] text-white"
          >
            <X className="size-3" strokeWidth={3} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => (e.target.value.endsWith(",") ? (setDraft(e.target.value), add()) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !draft && tags.length) {
            onChange(tags.slice(0, -1).join(", "));
          }
        }}
        onBlur={add}
        placeholder={`Select upto ${MAX_TAGS} tags`}
        className="min-w-[160px] flex-1 bg-transparent font-manrope text-sm text-[#17173A] outline-none placeholder:text-[#8A8AA3]"
      />
    </div>
  );
}

/**
 * App Push's Setup step, the way the campaign-creation reference lays it out:
 * Campaign details (name, apps, tags), then Advanced — Google Analytics
 * tracking, the conversion goal and the control group, each its own toggled
 * card. Replaces the one-line accordion rows the Send to card used for these.
 */
export default function PushSetupStep({
  campaignName,
  onRename,
  selectedApps,
  onAppsChange,
  appsError,
  setup,
  onSetupChange,
  controlGroupEnabled,
  onControlGroupChange,
  conversionEventError,
  showApps = true,
  showControlGroup = true,
}: {
  campaignName: string;
  onRename: (name: string) => void;
  selectedApps: string[];
  onAppsChange: (ids: string[]) => void;
  appsError?: string;
  setup: SetupValues;
  onSetupChange: (patch: Partial<SetupValues>) => void;
  controlGroupEnabled: boolean;
  onControlGroupChange: (v: boolean) => void;
  conversionEventError?: string;
  /** Email shares this step but has no target apps or control-group toggle. */
  showApps?: boolean;
  showControlGroup?: boolean;
}) {
  const setUtm = (key: keyof UtmParameters, value: string) =>
    onSetupChange({
      utmParameters: {
        ...setup.utmParameters,
        [key]: { ...setup.utmParameters[key], enabled: true, value } as UtmParamConfig,
      },
    });

  const payload = setup.conversionPayloadParameters;
  const setPayload = (patch: Partial<typeof payload>) =>
    onSetupChange({ conversionPayloadParameters: { ...payload, ...patch } });

  return (
    <div className="rounded-lg border border-[#DDE2EE] bg-white p-8">
      <h2 className="font-manrope text-base font-bold text-[#17173A]">Campaign details</h2>
      <p className="mt-1 font-manrope text-sm text-[#6F6F8D]">Provide basic details about your campaign</p>

      <div className="mt-6 max-w-[760px]">
        {SHOW_NAME_FIELD && (
          <>
        <Label required>Campaign name</Label>
        <input
          type="text"
          value={campaignName}
          maxLength={MAX_NAME}
          onChange={(e) => onRename(e.target.value)}
          placeholder="Ex: MyCampaign"
          className={fieldClass}
        />
        <p className="mt-1.5 text-right font-manrope text-xs font-semibold tabular-nums text-[#6F6F8D]">
          {campaignName.length}/{MAX_NAME}
        </p>

          </>
        )}

        {showApps && (
          <div className={SHOW_NAME_FIELD ? "mt-6" : undefined}>
            <MultiSelectDropdown
              label="Select app(s)"
              required
              options={APP_OPTIONS}
              value={selectedApps}
              onChange={onAppsChange}
              error={appsError}
            />
          </div>
        )}

        <div className={showApps || SHOW_NAME_FIELD ? "mt-6" : undefined}>
          <Label>Add tags</Label>
          <TagsField value={setup.tags} onChange={(tags) => onSetupChange({ tags })} />
        </div>
      </div>

      <h2 className="mt-10 font-manrope text-base font-bold text-[#17173A]">Advanced</h2>
      <p className="mt-1 max-w-[760px] font-manrope text-sm leading-[22px] text-[#6F6F8D]">
        Track your campaign performance to measure traffic and conversion. Set default values for Google
        analytics tracking and conversion goal in <span className="text-[#2F68E5]">UTM tracking &amp; goals settings</span>.
      </p>

      <div className="mt-5 max-w-[760px] space-y-4">
        <ToggleCard
          title="Google Analytics tracking"
          description="Add URL parameters to track campaign efficiency under Google Analytics campaign reports."
          checked={setup.gaTracking}
          onChange={(gaTracking) => onSetupChange({ gaTracking })}
        >
          <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <Label required>Source (utm_source)</Label>
              <input className={fieldClass} value={setup.utmParameters.source.value} onChange={(e) => setUtm("source", e.target.value)} />
            </div>
            <div>
              <Label required>Medium (utm_medium)</Label>
              <input className={fieldClass} value={setup.utmParameters.medium.value} onChange={(e) => setUtm("medium", e.target.value)} />
            </div>
            <div>
              <Label required>Campaign (utm_campaign)</Label>
              <input
                className={fieldClass}
                value={setup.utmParameters.campaign.value}
                placeholder="Ex : Campaign ID-1"
                onChange={(e) => setUtm("campaign", e.target.value)}
              />
            </div>
            <div>
              <Label>Content (utm_content)</Label>
              <input className={fieldClass} value={setup.utmParameters.content.value} onChange={(e) => setUtm("content", e.target.value)} />
            </div>
            <div>
              <Label>Term (utm_term)</Label>
              <input className={fieldClass} value={setup.utmParameters.term.value} onChange={(e) => setUtm("term", e.target.value)} />
            </div>
          </div>
        </ToggleCard>

        <ToggleCard
          title="Set conversion goal"
          description="Select the event you would like to count as a conversion"
          checked={setup.conversionTracking}
          onChange={(conversionTracking) => onSetupChange({ conversionTracking })}
        >
          <div className="mt-6">
            <Label>Event name</Label>
            <Dropdown
              value={setup.conversionEvent}
              options={CONVERSION_EVENT_OPTIONS}
              placeholder="Select event"
              widthClass="w-full"
              heightClass="h-10"
              onChange={(conversionEvent) => onSetupChange({ conversionEvent })}
            />
            {conversionEventError && (
              <p role="alert" className="mt-1.5 font-manrope text-xs font-medium text-[#E5484D]">
                {conversionEventError}
              </p>
            )}

            <label className="mt-5 flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={payload.enabled}
                onChange={(e) =>
                  setPayload({
                    enabled: e.target.checked,
                    pairs: e.target.checked && payload.pairs.length === 0 ? [newConversionPayloadParam()] : payload.pairs,
                  })
                }
                className="size-[18px] accent-[#2F68E5]"
              />
              <span className="font-manrope text-sm text-[#6F6F8D]">Specify payload parameters</span>
            </label>

            {payload.enabled && (
              <div className="mt-4 space-y-3">
                {payload.pairs.map((pair) => (
                  <div key={pair.id} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-3">
                    <Dropdown
                      value={pair.attribute}
                      options={PAYLOAD_ATTRIBUTES}
                      placeholder="Attribute"
                      widthClass="w-full"
                      heightClass="h-10"
                      onChange={(attribute) =>
                        setPayload({ pairs: payload.pairs.map((p) => (p.id === pair.id ? { ...p, attribute } : p)) })
                      }
                    />
                    <Dropdown
                      value={pair.operator}
                      options={PAYLOAD_OPERATORS}
                      widthClass="w-full"
                      heightClass="h-10"
                      onChange={(operator) =>
                        setPayload({ pairs: payload.pairs.map((p) => (p.id === pair.id ? { ...p, operator } : p)) })
                      }
                    />
                    <input
                      className={fieldClass}
                      value={pair.value}
                      placeholder="Value"
                      onChange={(e) =>
                        setPayload({
                          pairs: payload.pairs.map((p) => (p.id === pair.id ? { ...p, value: e.target.value } : p)),
                        })
                      }
                    />
                    <button
                      type="button"
                      aria-label="Remove parameter"
                      onClick={() => {
                        const pairs = payload.pairs.filter((p) => p.id !== pair.id);
                        setPayload({ pairs, enabled: pairs.length > 0 });
                      }}
                      className="grid size-9 place-items-center rounded-md text-[#6F6F8D] hover:bg-[#F4F5F9] hover:text-[#17173A]"
                    >
                      <Trash2 className="size-4" strokeWidth={2} />
                    </button>
                  </div>
                ))}
                {payload.pairs.length < MAX_CONVERSION_PAYLOAD_PARAMS && (
                  <button
                    type="button"
                    onClick={() => setPayload({ pairs: [...payload.pairs, newConversionPayloadParam()] })}
                    className="flex items-center gap-1.5 font-manrope text-sm font-semibold text-[#2F68E5]"
                  >
                    <Plus className="size-4" strokeWidth={2.4} />
                    Add parameter
                  </button>
                )}
              </div>
            )}

            <div className="my-6 border-t border-[#E8ECF4]" />

            <div className="grid grid-cols-2 gap-x-8">
              <div>
                <Label>Conversion window</Label>
                <div className="flex gap-3">
                  <Dropdown
                    value={setup.conversionWindowValue}
                    options={CONVERSION_WINDOW_VALUES}
                    widthClass="w-[88px]"
                    heightClass="h-10"
                    onChange={(conversionWindowValue) => onSetupChange({ conversionWindowValue })}
                  />
                  <Dropdown
                    value={setup.conversionWindowUnit}
                    options={CONVERSION_WINDOW_UNITS}
                    widthClass="w-[140px]"
                    heightClass="h-10"
                    onChange={(conversionWindowUnit) => onSetupChange({ conversionWindowUnit })}
                  />
                </div>
              </div>
              <div>
                <Label>Revenue parameter</Label>
                <Dropdown
                  value={setup.revenueParameter}
                  options={REVENUE_PARAMETER_OPTIONS}
                  placeholder="Revenue parameter"
                  widthClass="w-full"
                  heightClass="h-10"
                  onChange={(revenueParameter) => onSetupChange({ revenueParameter })}
                />
              </div>
            </div>
          </div>
        </ToggleCard>

        {showControlGroup && (
          <ToggleCard
            title="Control group"
            description="This campaign will not be shown to control group users"
            checked={controlGroupEnabled}
            onChange={onControlGroupChange}
          />
        )}
      </div>
    </div>
  );
}
