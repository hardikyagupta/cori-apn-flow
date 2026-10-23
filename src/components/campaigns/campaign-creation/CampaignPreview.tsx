import { useState, type ReactNode } from "react";
import {
  ChevronLeft,
  LayoutTemplate,
  Pencil,
  RefreshCw,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import sparkle from "/campaign-assets/ic-sparkle-ai.gif";
import navSparkle from "/campaign-assets/ic-sparkle.gif";
import { parseTags, type SetupValues } from "./CampaignSetupStep";
import { reachFor, type AudienceValues } from "./CampaignAudienceStep";
import type { ContentValues } from "./CampaignContentStep";
import { describeSlot, sliceSummaryLabel, type ScheduleValues } from "./CampaignScheduleStep";
import { TemplateThumbnail } from "./TemplateCard";
import { emailTemplates } from "./emailTemplates.data";
import { buildFindings, groupFindings, type Finding } from "./previewFindings.data";
import { buildPushFindings } from "./pushFindings.data";
import { FindingCard } from "./FindingCard";
import PushPreviewBody from "./PushPreviewBody";
import { EMPTY_REGULAR_DRAFT, type RegularLayoutDraft } from "./PushRegularLayoutEditor";
import { appPushTemplates } from "./appPushTemplates.data";
import { APP_OPTIONS } from "./appOptions.data";
import { PlatformIcon } from "./PlatformIcons";
import type { PushCampaignPrefill } from "@/data/pushCartFlow";

const nf = new Intl.NumberFormat("en-US");

/** Card shell — icon + title on a ruled header, EDIT on the right. */
function PreviewCard({
  icon: Icon,
  title,
  onEdit,
  action,
  children,
}: {
  icon: LucideIcon;
  title: string;
  onEdit: () => void;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#DDE2EE] bg-white">
      <header className="flex items-center gap-3 border-b border-[#E8ECF4] px-6 py-4">
        <Icon className="size-[18px] shrink-0 text-[#17173A]" strokeWidth={2} />
        <h2 className="font-manrope text-base font-bold text-[#17173A]">{title}</h2>
        <div className="ml-auto flex items-center gap-3">
          {action}
          <button
            type="button"
            onClick={onEdit}
            className="dc-btn dc-btn-secondary"
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

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-6 py-2">
      <p className="w-[190px] shrink-0 font-manrope text-sm text-[#6F6F8D]">{label}</p>
      <div className="min-w-0 flex-1 font-manrope text-sm text-[#17173A]">{children}</div>
    </div>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="mb-2 font-manrope text-sm font-bold text-[#17173A]">{children}</h3>;
}

/**
 * Pre-publish preview — everything the campaign is about to do, laid out the
 * way the reference does it, with the co-marketer's review of it in the right
 * rail. The rail is the point: this is the last screen before a send goes out,
 * so the findings are read off the real values and each one can be fixed here.
 */
export default function CampaignPreview({
  campaignId,
  campaignName,
  setup,
  audience,
  content,
  schedule,
  onBack,
  onPublish,
  publishLabel = "Save & publish",
  onEditStep,
  onAskCoMarketer,
  onAskFinding,
  chatOpen,
  chatSlot,
  channel = "Email",
  pushDetails,
  customDraft,
  aiMade,
  onClose,
  setupEditStep,
  focusAudienceKey,
}: {
  campaignId: string;
  campaignName: string;
  setup: SetupValues;
  audience: AudienceValues;
  content: ContentValues;
  schedule: ScheduleValues;
  onBack: () => void;
  onPublish: () => void;
  /** Primary button's text — defaults to "Save & publish". */
  publishLabel?: string;
  /** Jump back into the wizard at this step. */
  onEditStep: (stepId: string) => void;
  /** Opens a fresh co-marketer thread from the header CTA. */
  /** Omit to hide the Ask Zeno button. */
  onAskCoMarketer?: () => void;
  /** Opens the co-marketer already answering about one finding. */
  onAskFinding: (finding: Finding) => void;
  /** While the chat is docked the review rail stands down — same rule as the
   *  wizard's suggestion column, so the co-marketer is only in one place. */
  chatOpen: boolean;
  chatSlot?: ReactNode;
  channel?: string;
  /** What Zeno drafted for an App Push campaign — listed beside the template. */
  pushDetails?: PushCampaignPrefill["details"];
  /** App Push: the Regular layout notification written on the Content step. */
  customDraft?: RegularLayoutDraft;
  /** App Push: parts Zeno built, which the review leaves alone. */
  aiMade?: { timing?: boolean; audience?: boolean; content?: boolean };
  /** App Push: leave the wizard altogether (back to the campaigns list). */
  onClose?: () => void;
  /** Which step the Setup card's EDIT opens — the stepper has its own Setup. */
  setupEditStep?: string;
  /** Bumps when the audience was just changed from the chat — scroll to it. */
  focusAudienceKey?: number;
}) {
  const [previewEmail, setPreviewEmail] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [nudgeOpen, setNudgeOpen] = useState(true);
  const isPush = channel === "App Push Notification";
  const [pushOs, setPushOs] = useState<"ios" | "android">("ios");
  const [pushLayout, setPushLayout] = useState<"expanded" | "collapsed">("expanded");

  const name = campaignName;
  const tags = parseTags(setup.tags);
  const template = emailTemplates.find((t) => t.id === content.templateId);
  const pushTemplate = appPushTemplates.find((t) => t.id === content.templateId);
  const apps = APP_OPTIONS.filter((a) => audience.selectedApps.includes(a.id));
  const reach = reachFor(audience);
  const groups = groupFindings(
    isPush
      ? buildPushFindings({ audience, content, schedule, draft: customDraft ?? EMPTY_REGULAR_DRAFT, aiMade })
      : buildFindings({ setup, audience, content, schedule })
  );
  const findingCount = groups.reduce((n, g) => n + g.items.length, 0);

  const audienceSummary = () => {
    if (audience.mode === "all") return "All contacts";
    if (audience.mode === "segments")
      return audience.segments.length
        ? audience.segments.map((s) => s.name).join(", ")
        : "No segment selected";
    if (audience.mode === "table") return audience.table || "No table selected";
    return (
      audience.conditions
        .map((c) => `${c.attribute} ${c.operator} ${c.value}`.trim())
        .join(" AND ") || "No conditions added"
    );
  };

  const sendSummary = () => {
    if (schedule.mode === "now") return "As soon as this is published";
    if (schedule.mode === "later") return describeSlot(schedule.sendAt);
    if (schedule.mode === "slice") return sliceSummaryLabel(schedule, reach);
    return `Optimised per contact · ${schedule.optimizeWindow}`;
  };

  // The co-marketer's review of this campaign. Hidden while the chat is
  // docked; the thread is the same co-marketer.
  // A campaign Zeno built from start to finish has nothing to review, so the
  // rail isn't shown at all.
  const coriBuiltAll = isPush && Boolean(aiMade?.timing && aiMade?.audience && aiMade?.content);
  // App Push never shows the rail by default: Ask Zeno runs the review in the chat.
  const reviewAside = !chatOpen && !isPush && !coriBuiltAll && (
          
          <aside className="flex w-[380px] shrink-0 flex-col gap-5">
            <div className="rounded-lg border border-[#DDE2EE] bg-white p-4">
              <div className="flex items-center gap-2">
                <img src={sparkle} alt="" className="size-5 shrink-0" />
                <h2 className="font-manrope text-base font-bold text-[#17173A]">
                  Zeno review
                </h2>
              </div>
              <p className="mt-1 font-manrope text-xs leading-[18px] text-[#6F6F8D]">
                {findingCount === 0
                  ? "I've been through this one and found nothing that would hold it back."
                  : `I went through this campaign against your last 90 days. ${findingCount} thing${
                      findingCount === 1 ? "" : "s"
                    } worth fixing before it goes out.`}
              </p>
            </div>

            {groups.map((group) => (
              <div key={group.category}>
                <p className="mb-3 font-manrope text-xs font-bold uppercase tracking-[0.6px] text-[#8A8AA3]">
                  {group.category} · {group.items.length} finding
                  {group.items.length === 1 ? "" : "s"}
                </p>
                <div className="space-y-3">
                  {group.items.map((f) => (
                    <FindingCard key={f.id} finding={f} onAsk={() => onAskFinding(f)} />
                  ))}
                </div>
              </div>
            ))}
          </aside>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#DDE2EE] bg-white px-14">
        {!(onClose) && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to campaign setup"
            className="grid size-8 place-items-center rounded text-[#17173A] transition-colors hover:bg-[#F0F3F9]"
          >
            <ChevronLeft className="size-5" strokeWidth={2.2} />
          </button>
        )}
        <h1 className="truncate font-manrope text-base font-bold text-[#17173A]">
          Preview of {name}
        </h1>
        {onAskCoMarketer ? (
          <div className="relative ml-auto">
            <button
              type="button"
              onClick={() => {
                setNudgeOpen(false);
                onAskCoMarketer();
              }}
              className="relative z-[1] flex h-8 items-center gap-1.5 overflow-hidden rounded-lg bg-white px-2.5 transition-shadow hover:shadow-sm"
            >
              <span aria-hidden="true" className="snake-border" />
              <img src={navSparkle} alt="" className="relative z-[1] h-5 w-5" />
              <span className="relative z-[1] font-manrope text-xs font-semibold tracking-[0.42px] text-ash">
                {isPush ? "Audit the campaign with Zeno" : "Ask Zeno"}
              </span>
            </button>
            {isPush && !chatOpen && nudgeOpen && (
              <div
                role="dialog"
                aria-label="Audit the campaign"
                className="absolute right-0 top-[calc(100%+12px)] z-50 animate-in fade-in slide-in-from-top-2 duration-500"
              >
                {/* Pointer — fill matches the banner behind it, so it reads as
                    part of the card edge (same treatment as the discovery tour). */}
                <span
                  aria-hidden="true"
                  className="absolute -top-[6px] right-[56px] z-10 h-3 w-3 rotate-45 border-l border-t border-[#DDE2EE] bg-[#EAF0FF]"
                />
                <div className="relative w-[320px] overflow-hidden rounded-[8px] border border-solid border-[#DDE2EE] bg-white shadow-[5px_5px_10px_0px_#E5E9F2]">
                  <button
                    type="button"
                    aria-label="Dismiss"
                    onClick={() => setNudgeOpen(false)}
                    className="absolute right-2 top-2 z-10 grid h-6 w-6 place-items-center rounded-full border border-[#DDE2EE] bg-white text-[#17173A] shadow-sm transition-colors hover:bg-[#F4F8FF]"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>

                  <div className="relative grid h-[120px] w-full place-items-center bg-[#EAF0FF]">
                    <span className="absolute h-16 w-16 rounded-full bg-[#C9D8FA]" />
                    <span className="relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-b from-[#6F9BF0] to-[#2F68E5] shadow-[0px_8px_20px_rgba(47,104,229,0.35)]">
                      <ShieldCheck className="h-7 w-7 text-white" strokeWidth={1.8} />
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 p-4 pb-3">
                    <span className="whitespace-nowrap font-manrope text-[14px] font-semibold leading-[20px] text-[#17173A]">
                      Give your campaign a quick check ✅
                    </span>
                    <p className="font-manrope text-[13px] font-medium leading-[20px] text-[#6F6F8D]">
                      Let Zeno review your campaign for potential issues and suggest improvements before you publish.
                    </p>
                  </div>

                  <div className="flex justify-end px-4 pb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setNudgeOpen(false);
                        onAskCoMarketer();
                      }}
                      className="dc-btn dc-btn-primary"
                    >
                      Audit campaign
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <span className="ml-auto" />
        )}
        <button
          type="button"
          onClick={onPublish}
          className="dc-btn dc-btn-primary"
        >
          {publishLabel}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close campaign creation"
            className="grid h-8 w-8 place-items-center rounded border border-[#DDE2EE] text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        )}
      </header>

      <div className={cn("flex min-h-0 flex-1 gap-5", chatOpen ? "pr-5" : "")}>
        <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-14 py-6">
          {isPush ? (
            <div className="flex items-start gap-5">
            <div className="min-w-0 flex-1">
            <PushPreviewBody
              campaignId={campaignId}
              campaignName={name}
              setup={setup}
              audience={audience}
              content={content}
              schedule={schedule}
              pushDetails={pushDetails}
              customDraft={customDraft}
              onEditStep={onEditStep}
              focusAudienceKey={focusAudienceKey}
            />
            </div>
            {reviewAside}
            </div>
          ) : (
          <div className="flex items-start gap-5">
          {/* Left column — setup and audience */}
          <div className="flex w-[34%] shrink-0 flex-col gap-5">
            <PreviewCard icon={Settings} title="Setup" onEdit={() => onEditStep(setupEditStep ?? (isPush ? "setup" : "schedule"))}>
              <SubHeading>Campaign details</SubHeading>
              <Row label="Campaign ID:">{campaignId}</Row>
              <Row label="Campaign name:">{name}</Row>
              {isPush && (
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
              )}
              <Row label="Tags:">
                {tags.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-[#FBCB6B] px-3 py-1 font-manrope text-[13px] font-medium text-[#17173A]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[#8A8AA3]">None</span>
                )}
              </Row>

              <div className="mt-5">
                <SubHeading>Advance options</SubHeading>
                <Row label="Google Analytics tracking:">
                  {setup.gaTracking ? (
                    <div className="space-y-0.5">
                      <p>Source (utm_source) - {setup.utmParameters.source.value || "Netcore"}</p>
                      <p>Medium (utm_medium) - {isPush ? setup.utmParameters.medium.value || "App Push" : "Email"}</p>
                      <p>Campaign (utm_campaign) - {isPush ? setup.utmParameters.campaign.value || name : name}</p>
                      <p>Content (utm_content) - {setup.utmParameters.content.value}</p>
                      <p>Term (utm_term) - {setup.utmParameters.term.value || "Campaign"}</p>
                    </div>
                  ) : (
                    "Off"
                  )}
                </Row>
                <Row label="Conversion tracking:">
                  {setup.conversionTracking ? (
                    isPush ? (
                      <div className="space-y-0.5">
                        <p>{setup.conversionEvent || "On"}</p>
                        <p className="text-[#6F6F8D]">
                          Window - {setup.conversionWindowValue} {setup.conversionWindowUnit}
                        </p>
                        <p className="text-[#6F6F8D]">Revenue parameter - {setup.revenueParameter}</p>
                      </div>
                    ) : (
                      setup.conversionEvent || "On"
                    )
                  ) : (
                    "Off"
                  )}
                </Row>
                <Row label="Deduplication:">Off</Row>
                {isPush && <Row label="Control group:">{schedule.controlGroupEnabled ? `On · ${schedule.controlGroupPercent}%` : "Off"}</Row>}
              </div>
            </PreviewCard>

            <PreviewCard
              icon={Users}
              title="Audience"
              onEdit={() => onEditStep("audience")}
              action={
                <div className="flex h-8 items-center gap-2 rounded-full border border-[#DDE2EE] bg-white pl-2 pr-3">
                  <UserCheck className="size-4 text-[#8A8AA3]" strokeWidth={2} />
                  <span className="font-manrope text-[13px] text-[#6F6F8D]">Reachable contacts</span>
                  <span className="font-manrope text-[13px] font-bold text-[#17173A]">
                    {nf.format(reach)}
                  </span>
                  <button
                    type="button"
                    aria-label="Refresh reachable contacts"
                    onClick={() => {
                      setRefreshing(true);
                      window.setTimeout(() => setRefreshing(false), 900);
                    }}
                    className="grid size-5 place-items-center rounded-full text-[#8A8AA3] hover:bg-[#F0F3F9] hover:text-[#17173A]"
                  >
                    <RefreshCw
                      className={cn("size-3.5", refreshing && "animate-spin")}
                      strokeWidth={2.2}
                    />
                  </button>
                </div>
              }
            >
              <SubHeading>Selected contacts</SubHeading>
              <p className="font-manrope text-sm leading-6 text-[#17173A]">{audienceSummary()}</p>

              {isPush && pushDetails && (
                <div className="mt-5">
                  <SubHeading>Devices</SubHeading>
                  <p className="font-manrope text-sm leading-6 text-[#17173A]">{pushDetails.devices}</p>
                </div>
              )}

              <div className="mt-5">
                <SubHeading>Excluded</SubHeading>
                <p className="font-manrope text-sm leading-6 text-[#17173A]">
                  {audience.excludeEnabled && audience.excludeSegments.length
                    ? audience.excludeSegments.map((s) => s.name).join(", ")
                    : "None"}
                </p>
              </div>

              <div className="mt-5">
                <SubHeading>Schedule</SubHeading>
                <p className="font-manrope text-sm leading-6 text-[#17173A]">{sendSummary()}</p>
                <p className="mt-0.5 font-manrope text-sm leading-6 text-[#6F6F8D]">
                  Frequency cap {schedule.skipFrequencyCap ? "skipped" : "applied"}
                </p>
              </div>
            </PreviewCard>
          </div>

          {/* Middle column — content and the rendered email */}
          <div className="min-w-0 flex-1">
            <PreviewCard
              icon={LayoutTemplate}
              title="Content"
              onEdit={() => onEditStep("content")}
            >
              {isPush ? (
                <>
                  <SubHeading>Notification</SubHeading>
                  <Row label="Template name:">{pushTemplate?.name ?? "Not selected"}</Row>
                  <Row label="Template ID:">{pushTemplate ? pushTemplate.id : "—"}</Row>
                  {pushDetails && (
                    <>
                      <Row label="Title:">{pushDetails.title}</Row>
                      <Row label="Body:">{pushDetails.body}</Row>
                      <Row label="Rich media:">{pushDetails.richMedia ? "Shopping cart image" : "None"}</Row>
                      <Row label="Countdown timer:">{pushDetails.countdown ? "09:34:28 (illustrative)" : "Off"}</Row>
                      {pushDetails.promoCode && <Row label="Promo code:">{pushDetails.promoCode}</Row>}
                    </>
                  )}
                  <Row label="Landing page:">App Homepage</Row>

                  <div className="mt-6 rounded-lg border border-[#E8ECF4] bg-[#F7F9FC] p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex overflow-hidden rounded-md border border-[#DDE2EE] bg-white">
                        {(["ios", "android"] as const).map((os) => (
                          <button
                            key={os}
                            type="button"
                            onClick={() => setPushOs(os)}
                            className={cn(
                              "px-4 py-1.5 font-manrope text-sm font-semibold transition-colors",
                              pushOs === os ? "bg-[#2F68E5] text-white" : "text-[#6F6F8D] hover:bg-[#F7F9FC]"
                            )}
                          >
                            {os === "ios" ? "iOS" : "Android"}
                          </button>
                        ))}
                      </div>
                      <div className="inline-flex overflow-hidden rounded-md border border-[#DDE2EE] bg-white">
                        {(["expanded", "collapsed"] as const).map((layout) => (
                          <button
                            key={layout}
                            type="button"
                            onClick={() => setPushLayout(layout)}
                            className={cn(
                              "px-4 py-1.5 font-manrope text-sm font-semibold capitalize transition-colors",
                              pushLayout === layout ? "bg-[#2F68E5] text-white" : "text-[#6F6F8D] hover:bg-[#F7F9FC]"
                            )}
                          >
                            {layout}
                          </button>
                        ))}
                      </div>
                    </div>
                    {pushTemplate?.pushPreviews ? (
                      <img
                        src={pushTemplate.pushPreviews[`${pushOs}-${pushLayout}`]}
                        alt={`${pushTemplate.name} on ${pushOs}`}
                        className="mx-auto max-h-[560px] w-auto"
                      />
                    ) : (
                      <p className="py-10 text-center font-manrope text-sm text-[#6F6F8D]">
                        No template selected yet — pick one on the Content step and it renders here.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
              <SubHeading>Sender's details</SubHeading>
              <Row label="Name:">{content.senderName || "—"}</Row>
              <Row label="Email ID:">
                <span className="text-[#2F68E5]">
                  {content.senderEmail ? `${content.senderEmail}@${content.domain}` : "—"}
                </span>
              </Row>
              <Row label="Subject Line:">
                <span className="text-[#2F68E5]">{content.subject || "—"}</span>
              </Row>
              <Row label="Pre-header:">
                <span className="text-[#2F68E5]">{content.preHeader || "—"}</span>
              </Row>

              <div className="mt-6 flex items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <SubHeading>Email content</SubHeading>
                  <Row label="Template Name:">{template?.name ?? "Not selected"}</Row>
                  <Row label="Template ID:">{template ? template.id : "—"}</Row>
                  <Row label="No. of attachments:">{content.attachments.length}</Row>
                </div>
                <p className="shrink-0 pt-7 font-manrope text-sm text-[#8A8AA3]">
                  Approximate size: <span className="text-[#17173A]">38 KBs</span>
                </p>
              </div>

              <div className="mt-6 rounded-lg border border-[#DDE2EE] p-4">
                <label className="mb-2 block font-manrope text-sm font-semibold text-[#17173A]">
                  Live Preview <span className="text-[#FC5E02]">*</span>
                </label>
                <div className="flex gap-4">
                  <input
                    type="email"
                    value={previewEmail}
                    onChange={(e) => setPreviewEmail(e.target.value)}
                    placeholder="Ex: johndoe@gmail.com"
                    className="h-11 flex-1 rounded-md border border-[#DDE2EE] bg-[#F7F9FC] px-3 font-manrope text-sm text-[#17173A] outline-none transition-colors placeholder:text-[#A0A0A0] focus:border-[#2F68E5] focus:bg-white"
                  />
                  <button
                    type="button"
                    className="dc-btn dc-btn-primary h-11 shrink-0"
                  >
                    Fetch details
                  </button>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-[#E8ECF4] bg-[#F7F9FC] p-6">
                {template ? (
                  <div className="mx-auto aspect-[3/4] w-[320px] overflow-hidden rounded-md border border-[#DDE2EE] bg-white shadow-[0_6px_20px_rgba(23,23,58,0.08)]">
                    <TemplateThumbnail kind={template.preview} />
                  </div>
                ) : (
                  <p className="py-10 text-center font-manrope text-sm text-[#6F6F8D]">
                    No template selected yet — pick one on the Content step and it renders here.
                  </p>
                )}
              </div>
                </>
              )}
            </PreviewCard>
          </div>

          {reviewAside}
          </div>
          )}
        </div>

        {chatSlot}
      </div>
    </div>
  );
}
