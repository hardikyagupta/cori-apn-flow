import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Pencil, RefreshCw, Settings, Sparkles, Users, LayoutTemplate, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlatformIcon } from "./PlatformIcons";
import { APP_OPTIONS } from "./appOptions.data";
import { appPushTemplates } from "./appPushTemplates.data";
import { parseTags, type SetupValues } from "./CampaignSetupStep";
import { reachFor, type AudienceValues } from "./CampaignAudienceStep";
import { describeSlot, sliceSummaryLabel, type ScheduleValues } from "./CampaignScheduleStep";
import type { ContentValues } from "./CampaignContentStep";
import type { PushCampaignPrefill } from "@/data/pushCartFlow";
import TemplatePushMock from "./TemplatePushMock";
import { AndroidPreview, IosPreview, hasDraftContent, type RegularLayoutDraft } from "./PushRegularLayoutEditor";

const nf = new Intl.NumberFormat("en-US");

/** A segment Zeno built: sparkle, then its name — read-only here. */
function AiSegmentPill({ name }: { name: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#DDE2EE] bg-white px-3 py-1.5 font-manrope text-sm font-medium text-[#17173A]">
      <Sparkles className="size-3.5 shrink-0 text-[#7B5CFA]" strokeWidth={2.2} />
      <span className="truncate">{name}</span>
    </span>
  );
}

/** Each section's icon sits in its own colourful badge. */
const SECTION_TONES = {
  setup: "from-[#6FD08C] to-[#27A86B]",
  audience: "from-[#6C8CFF] to-[#8F63F5]",
  content: "from-[#27C7A5] to-[#2F8FE5]",
  schedule: "from-[#FFAA5C] to-[#FF6B8E]",
} as const;

/** A section card — colourful icon badge + title on a ruled header, EDIT on the
 *  right (just the pencil, with a tooltip, once the chat takes the room). */
function Section({
  icon: Icon,
  tone,
  title,
  onEdit,
  action,
  children,
  sectionRef,
  flash = false,
  compact = false,
}: {
  icon: typeof Settings;
  tone: keyof typeof SECTION_TONES;
  title: string;
  onEdit: () => void;
  action?: ReactNode;
  children: ReactNode;
  /** For scrolling the card into view. */
  sectionRef?: React.Ref<HTMLElement>;
  /** Briefly ring the card to draw the eye to it. */
  flash?: boolean;
  /** Icon-only Edit, so the header keeps to one tidy row beside the chat. */
  compact?: boolean;
}) {
  return (
    <section
      ref={sectionRef}
      className={cn(
        "overflow-hidden rounded-lg bg-white shadow-[0_1px_6px_rgba(23,23,58,0.08)] transition-shadow duration-500",
        flash && "shadow-[0_0_0_2px_#2F68E5,0_4px_16px_rgba(47,104,229,0.25)]"
      )}
    >
      {/* One flex-wrap with a single gap, so when it does wrap the rows sit an
          equal distance apart. */}
      <header className="flex flex-wrap items-center gap-3 border-b border-[#EEF1F7] px-6 py-4">
        <span className="flex items-center gap-3">
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br shadow-[0_2px_6px_rgba(23,23,58,0.18)]",
              SECTION_TONES[tone]
            )}
          >
            <Icon className="size-4 text-white" strokeWidth={2} />
          </span>
          <h2 className="font-manrope text-base font-bold text-[#4A4A68]">{title}</h2>
        </span>
        {action}
        {compact ? (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`Edit ${title}`}
                  onClick={onEdit}
                  className="ml-auto grid size-8 shrink-0 place-items-center rounded border border-[#DDE2EE] bg-white text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
                >
                  <Pencil className="size-3.5" strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={8}
                className="overflow-visible rounded-lg border-0 bg-black px-3 py-1.5 text-white shadow-none"
              >
                <p className="font-manrope text-xs leading-[18px]">Edit</p>
                <TooltipPrimitive.Arrow className="fill-black" width={10} height={6} />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="ml-auto flex h-8 shrink-0 items-center gap-1.5 rounded border border-[#DDE2EE] bg-white px-3 font-manrope text-xs font-semibold uppercase tracking-[0.42px] text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
          >
            <Pencil className="size-3.5" strokeWidth={2} />
            Edit
          </button>
        )}
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
  focusAudienceKey = 0,
  compact = false,
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
  /** Bumps when the audience was just changed from the chat. */
  focusAudienceKey?: number;
  /** The chat is docked beside the preview — icon-only Edit buttons. */
  compact?: boolean;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const apps = APP_OPTIONS.filter((a) => audience.selectedApps.includes(a.id));
  const platforms = (["ios", "android"] as const).filter((p) => apps.some((a) => a.platform === p));
  // A new key means the audience just changed from the chat: scroll to its
  // card and ring it for a moment so the change is noticed.
  const audienceRef = useRef<HTMLElement>(null);
  const [audienceFlash, setAudienceFlash] = useState(false);
  useEffect(() => {
    if (!focusAudienceKey) return;
    audienceRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setAudienceFlash(true);
    const id = window.setTimeout(() => setAudienceFlash(false), 2200);
    return () => window.clearTimeout(id);
  }, [focusAudienceKey]);

  const contentWrapRef = useRef<HTMLDivElement>(null);
  const [contentTop, setContentTop] = useState(24);
  useLayoutEffect(() => {
    const wrap = contentWrapRef.current;
    if (!wrap) return;
    let scroller: HTMLElement | null = wrap.parentElement;
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
    const measure = () => {
      const viewport = scroller ? scroller.clientHeight : window.innerHeight;
      // Top-aligned while it fits; otherwise let it stick with its bottom edge
      // 24px above the bottom of the view.
      setContentTop(Math.min(24, viewport - wrap.offsetHeight - 24));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    if (scroller) ro.observe(scroller);
    return () => ro.disconnect();
  }, []);

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
          : "Optimise with Zeno";
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
        <Section icon={Settings} tone="setup" compact={compact} title="Setup details" onEdit={() => onEditStep("setup")}>
          <SubHeading>Campaign details</SubHeading>
          <Row label="Campaign ID:">{campaignId}</Row>
          <Row label="Campaign name:">{campaignName}</Row>
          {/* Apps list under their label — beside it they left a wide empty gutter. */}
          <div className="py-1.5">
            <p className="font-manrope text-sm text-[#6F6F8D]">Select app(s):</p>
            {apps.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {apps.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#DDE2EE] bg-white py-1 pl-2.5 pr-3 font-manrope text-[13px] font-medium text-[#17173A]"
                  >
                    <PlatformIcon
                      platform={a.platform}
                      className={cn("size-3.5", a.platform === "android" ? "text-[#3DDC84]" : "text-[#6F6F8D]")}
                    />
                    {a.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 font-manrope text-sm font-medium text-[#17173A]">—</p>
            )}
          </div>
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
          tone="audience"
          compact={compact}
          title="Audience"
          sectionRef={audienceRef}
          flash={audienceFlash}
          onEdit={() => onEditStep("audience")}
        >
          <div className="mb-4 flex items-center gap-2 font-manrope text-sm">
            <span className="text-[#6F6F8D]">Reachable contacts:</span>
            <span className="font-bold text-[#17173A]">{nf.format(reach)}</span>
            <button
              type="button"
              aria-label="Refresh reachable contacts"
              onClick={() => {
                setRefreshing(true);
                window.setTimeout(() => setRefreshing(false), 900);
              }}
              className="grid size-6 place-items-center rounded-full text-[#8A8AA3] hover:bg-[#F0F3F9] hover:text-[#17173A]"
            >
              <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} strokeWidth={2.2} />
            </button>
          </div>
          <SubHeading>Selected contacts</SubHeading>
          {audience.mode === "segments" && audience.segments.some((sg) => sg.ai) ? (
            <div className="flex flex-wrap gap-2 py-1">
              {audience.segments.map((sg) =>
                sg.ai ? (
                  <AiSegmentPill key={sg.id} name={sg.name} />
                ) : (
                  <span
                    key={sg.id}
                    className="rounded-full border border-[#DDE2EE] bg-white px-3 py-1.5 font-manrope text-sm font-medium text-[#17173A]"
                  >
                    {sg.name}
                  </span>
                )
              )}
            </div>
          ) : (
            <p className="font-manrope text-sm font-medium leading-6 text-[#17173A]">{audienceSummary}</p>
          )}
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
                {audience.excludeSegments.map((s) =>
                  s.ai ? (
                    <AiSegmentPill key={s.id} name={s.name} />
                  ) : (
                    <span
                      key={s.id}
                      className="rounded-full bg-[#6B6B8E] px-3 py-1 font-manrope text-[13px] font-medium text-white"
                    >
                      {s.name}
                    </span>
                  )
                )}
              </div>
            </Row>
          ) : (
            <p className="font-manrope text-sm font-medium leading-6 text-[#17173A]">None</p>
          )}
        </Section>

        <Section icon={Clock} tone="schedule" compact={compact} title="Schedule" onEdit={() => onEditStep("schedule")}>
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

      {/* Sticks once its bottom reaches the bottom of the view, so scrolling on
          moves only the left column and no blank space opens under the card. */}
      <div ref={contentWrapRef} className="sticky" style={{ top: contentTop }}>
      <Section icon={LayoutTemplate} tone="content" compact={compact} title="Content" onEdit={() => onEditStep("content")}>
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
          ) : template?.pushCard ? (
            <div className="mt-4 flex justify-center">
              <TemplatePushMock card={template.pushCard} os={os} view={layout} />
            </div>
          ) : (
            <p className="py-12 text-center font-manrope text-sm text-[#6F6F8D]">
              No template selected yet — pick one on the Content step and it renders here.
            </p>
          )}
        </div>
      </Section>
      </div>
    </div>
  );
}
