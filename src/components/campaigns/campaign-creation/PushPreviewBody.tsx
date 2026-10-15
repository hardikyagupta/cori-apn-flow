import { useState, type ReactNode } from "react";
import { Pencil, RefreshCw, Settings, UserCheck, Users, LayoutTemplate, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformIcon } from "./PlatformIcons";
import { APP_OPTIONS } from "./appOptions.data";
import { appPushTemplates } from "./appPushTemplates.data";
import { parseTags, type SetupValues } from "./CampaignSetupStep";
import { reachFor, type AudienceValues } from "./CampaignAudienceStep";
import { describeSlot, sliceSummaryLabel, type ScheduleValues } from "./CampaignScheduleStep";
import type { ContentValues } from "./CampaignContentStep";
import type { PushCampaignPrefill } from "@/data/pushCartFlow";
import { AndroidPreview, IosPreview, hasDraftContent, type RegularLayoutDraft } from "./PushRegularLayoutEditor";

const nf = new Intl.NumberFormat("en-US");

/** A section card — muted icon + title on a ruled header, EDIT on the right. */
function Section({
  icon: Icon,
  title,
  onEdit,
  action,
  children,
}: {
  icon: typeof Settings;
  title: string;
  onEdit: () => void;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg bg-white shadow-[0_1px_6px_rgba(23,23,58,0.08)]">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#EEF1F7] px-6 py-4">
        <Icon className="size-[18px] shrink-0 text-[#6F6F8D]" strokeWidth={2} />
        <h2 className="font-manrope text-base font-bold text-[#4A4A68]">{title}</h2>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
          {action}
          <button
            type="button"
            onClick={onEdit}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded border border-[#DDE2EE] bg-white px-3 font-manrope text-xs font-semibold uppercase tracking-[0.42px] text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
          >
            <Pencil className="size-3.5" strokeWidth={2} />
            Edit
          </button>
        </div>
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

const SubHeading = ({ children, className }: { children: ReactNode; className?: string }) => (
  <h3 className={cn("mb-3 font-manrope text-[15px] font-bold text-[#17173A]", className)}>{children}</h3>
);

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-6 py-1.5">
      <p className="w-[150px] shrink-0 font-manrope text-sm text-[#6F6F8D]">{label}</p>
      <div className="min-w-0 flex-1 font-manrope text-sm font-medium leading-6 text-[#17173A]">{children}</div>
    </div>
  );
}

/**
 * App Push's pre-publish preview, laid out the way the campaign-creation
 * reference does: Setup details, Audience and Schedule stacked on the left,
 * the notification itself on the right. No review rail — what's shown is just
 * what was set.
 */
export default function PushPreviewBody({
  campaignId,
  campaignName,
  setup,
  audience,
  content,
  schedule,
  pushDetails,
  customDraft,
  onEditStep,
}: {
  campaignId: string;
  campaignName: string;
  setup: SetupValues;
  audience: AudienceValues;
  content: ContentValues;
  schedule: ScheduleValues;
  pushDetails?: PushCampaignPrefill["details"];
  /** The Regular layout notification written on the Content step, if any. */
  customDraft?: RegularLayoutDraft;
  onEditStep: (stepId: string) => void;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const apps = APP_OPTIONS.filter((a) => audience.selectedApps.includes(a.id));
  const platforms = (["ios", "android"] as const).filter((p) => apps.some((a) => a.platform === p));
  const [os, setOs] = useState<"ios" | "android">(platforms[0] ?? "ios");
  const [layout, setLayout] = useState<"expanded" | "collapsed">("expanded");
  const tags = parseTags(setup.tags);
  const template = appPushTemplates.find((t) => t.id === content.templateId);
  const custom = !template && customDraft && hasDraftContent(customDraft) ? customDraft : null;
  const reach = reachFor(audience);

  const audienceSummary =
    audience.mode === "all"
      ? "All contacts"
      : audience.mode === "segments"
        ? audience.segments.map((s) => s.name).join(", ") || "No segment selected"
        : audience.mode === "table"
          ? audience.table || "No table selected"
          : audience.conditions.map((c) => `${c.attribute} ${c.operator} ${c.value}`.trim()).join(" AND ") ||
            "No conditions added";

  const whenToSend =
    schedule.mode === "now"
      ? "Send now"
      : schedule.mode === "later"
        ? "Send later"
        : schedule.mode === "slice"
          ? "Send in batches"
          : "Optimise with Cori";
  const whenDetail =
    schedule.mode === "later"
      ? describeSlot(schedule.sendAt)
      : schedule.mode === "slice"
        ? sliceSummaryLabel(schedule, reach)
        : schedule.mode === "optimize"
          ? `Optimised per contact · ${schedule.optimizeWindow}`
          : null;

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(380px,2fr)_3fr]">
      <div className="flex flex-col gap-5">
        <Section icon={Settings} title="Setup details" onEdit={() => onEditStep("setup")}>
          <SubHeading>Campaign details</SubHeading>
          <Row label="Campaign ID:">{campaignId}</Row>
          <Row label="Campaign name:">{campaignName}</Row>
          <Row label="Select app(s):">
            {apps.length ? (
              <div className="flex flex-wrap gap-1.5">
                {apps.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#DDE2EE] bg-white py-1 pl-2 pr-3 font-manrope text-[13px] font-medium text-[#17173A]"
                  >
                    <PlatformIcon platform={a.platform} className="size-3.5" />
                    {a.name}
                  </span>
                ))}
              </div>
            ) : (
              "—"
            )}
          </Row>
          <Row label="Tags:">
            {tags.length ? (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-[#F5B25C] px-3 py-1 font-manrope text-[13px] font-medium text-[#17173A]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[#8A8AA3]">None</span>
            )}
          </Row>

          <SubHeading className="mt-6">Advance options</SubHeading>
          {setup.gaTracking && (
            <Row label="Google Analytics tracking:">
              <div className="space-y-0.5">
                <p>Source (utm_source) - {setup.utmParameters.source.value}</p>
                <p>Medium (utm_medium) - {setup.utmParameters.medium.value}</p>
                <p>Campaign (utm_campaign) - {setup.utmParameters.campaign.value || campaignName}</p>
                {setup.utmParameters.content.value && (
                  <p>Content (utm_content) - {setup.utmParameters.content.value}</p>
                )}
                {setup.utmParameters.term.value && <p>Term (utm_term) - {setup.utmParameters.term.value}</p>}
              </div>
            </Row>
          )}
          <Row label="Conversion goal:">
            {setup.conversionTracking ? (
              <div className="space-y-0.5">
                <p>On</p>
                <p>Conversion Tracking - {setup.conversionEvent || "—"}</p>
                <p>
                  Conversion window - {setup.conversionWindowValue} {setup.conversionWindowUnit}
                </p>
                <p>Revenue parameter - {setup.revenueParameter || "—"}</p>
              </div>
            ) : (
              "Off"
            )}
          </Row>
          <Row label="Control group:">
            {schedule.controlGroupEnabled ? `On · ${schedule.controlGroupPercent}%` : "Off"}
          </Row>
        </Section>

        <Section
          icon={Users}
          title="Audience"
          onEdit={() => onEditStep("audience")}
          action={
            <div className="flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-[#DDE2EE] bg-white pl-2 pr-3">
              <UserCheck className="size-4 text-[#8A8AA3]" strokeWidth={2} />
              <span className="font-manrope text-[13px] text-[#6F6F8D]">Reachable contacts</span>
              <span className="font-manrope text-[13px] font-bold text-[#17173A]">{nf.format(reach)}</span>
              <button
                type="button"
                aria-label="Refresh reachable contacts"
                onClick={() => {
                  setRefreshing(true);
                  window.setTimeout(() => setRefreshing(false), 900);
                }}
                className="grid size-5 place-items-center rounded-full text-[#8A8AA3] hover:bg-[#F0F3F9] hover:text-[#17173A]"
              >
                <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} strokeWidth={2.2} />
              </button>
            </div>
          }
        >
          <SubHeading>Selected contacts</SubHeading>
          <p className="font-manrope text-sm font-medium leading-6 text-[#17173A]">{audienceSummary}</p>
          <div className="mt-4">
            <Row label="Device targeting:">
              {audience.deviceTargeting === "latest" ? "Latest active device only" : "All active devices"}
            </Row>
            {pushDetails && <Row label="Devices:">{pushDetails.devices}</Row>}
          </div>

          <SubHeading className="mt-6">Excluded contacts</SubHeading>
          {audience.excludeEnabled && audience.excludeSegments.length ? (
            <Row label="Exclude list/segment:">
              <div className="flex flex-wrap gap-1.5">
                {audience.excludeSegments.map((s) => (
                  <span
                    key={s.id}
                    className="rounded-full bg-[#6B6B8E] px-3 py-1 font-manrope text-[13px] font-medium text-white"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </Row>
          ) : (
            <p className="font-manrope text-sm font-medium leading-6 text-[#17173A]">None</p>
          )}
        </Section>

        <Section icon={Clock} title="Schedule" onEdit={() => onEditStep("schedule")}>
          <SubHeading>Schedule campaign</SubHeading>
          <Row label="Frequency cap:">{schedule.skipFrequencyCap ? "Skipped" : "Applied"}</Row>
          <Row label="When to send:">
            <p>{whenToSend}</p>
            {whenDetail && <p>{whenDetail}</p>}
          </Row>
          <Row label="Time to live:">
            <p>28 days</p>
            <p className="text-[#6F6F8D]">Default — undelivered messages are revoked after this</p>
          </Row>
        </Section>
      </div>

      <Section icon={LayoutTemplate} title="Content" onEdit={() => onEditStep("content")}>
        <Row label="Landing page:">App Homepage</Row>
        <Row label="Template:">
          {template ? `${template.name} · ID ${template.id}` : custom ? "Custom notification · Regular layout" : "Not selected"}
        </Row>
        {custom && (
          <>
            <Row label="Title:">{custom.title}</Row>
            <Row label="Message:">{custom.message}</Row>
            <Row label="Rich media:">{custom.android.richMedia || custom.ios.richMedia ? "Image" : "None"}</Row>
          </>
        )}
        {pushDetails && (
          <>
            <Row label="Title:">{pushDetails.title}</Row>
            <Row label="Body:">{pushDetails.body}</Row>
            <Row label="Rich media:">{pushDetails.richMedia ? "Shopping cart image" : "None"}</Row>
            <Row label="Countdown timer:">{pushDetails.countdown ? "09:34:28 (illustrative)" : "Off"}</Row>
            {pushDetails.promoCode && <Row label="Promo code:">{pushDetails.promoCode}</Row>}
          </>
        )}

        <div className="mt-5 border-t border-dashed border-[#DDE2EE] pt-5">
          <div className="flex items-center justify-end">
            <div className="inline-flex overflow-hidden rounded-md border border-[#DDE2EE] bg-white">
              {(["expanded", "collapsed"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLayout(l)}
                  className={cn(
                    "px-4 py-2 font-manrope text-sm font-semibold capitalize transition-colors",
                    layout === l ? "bg-[#2F68E5] text-white" : "text-[#6F6F8D] hover:bg-[#F7F9FC]"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {platforms.length > 0 && (
            <div className="mt-4 flex justify-center gap-3">
              {platforms.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-label={p === "ios" ? "iOS preview" : "Android preview"}
                  aria-pressed={os === p}
                  onClick={() => setOs(p)}
                  className={cn(
                    "grid size-9 place-items-center rounded-full transition-colors",
                    os === p ? "bg-[#E7EDFF] text-[#2F68E5]" : "text-[#8A8AA3] hover:bg-[#F0F3F9]"
                  )}
                >
                  <PlatformIcon platform={p} className="size-5" />
                </button>
              ))}
            </div>
          )}

          {custom ? (
            <div className="mt-4 flex justify-center overflow-x-auto pb-2">
              {os === "android" ? <AndroidPreview draft={custom} view={layout} /> : <IosPreview draft={custom} view={layout} />}
            </div>
          ) : template?.pushPreviews ? (
            <img
              src={template.pushPreviews[`${os}-${layout}`]}
              alt={`${template.name} on ${os}`}
              className="mx-auto mt-4 max-h-[620px] w-auto"
            />
          ) : (
            <p className="py-12 text-center font-manrope text-sm text-[#6F6F8D]">
              No template selected yet — pick one on the Content step and it renders here.
            </p>
          )}
        </div>
      </Section>
    </div>
  );
}
