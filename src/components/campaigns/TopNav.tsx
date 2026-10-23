import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Plus, Bell } from "lucide-react";
import trending from "/campaign-assets/ic-trending.svg";
import CoMarketerNudge from "./CoMarketerNudge";
import CoMarketerButton from "./CoMarketerButton";
import QuickCreateMenu from "./QuickCreateMenu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import CampaignCreationOverlay from "./campaign-creation/CampaignCreationOverlay";
import SegmentCreationOverlay from "./segment-creation/SegmentCreationOverlay";

/** Quick-create items that open the campaign creation wizard. */
const CREATION_CHANNELS = new Set([
  "Email",
  "SMS",
  "Whatsapp",
  "App Push Notification",
  "Web Push Notification",
  "In-app Message",
  "Web Message",
]);

/** Each wizard has its own address — /campaigns/email, /campaigns/app-push, … —
 *  so it can be linked to and reloaded straight into. */
const CHANNEL_SLUGS: Record<string, string> = {
  Email: "email",
  SMS: "sms",
  Whatsapp: "whatsapp",
  "App Push Notification": "app-push",
  "Web Push Notification": "web-push",
  "In-app Message": "in-app-message",
  "Web Message": "web-message",
};
const CHANNEL_BY_SLUG = Object.fromEntries(Object.entries(CHANNEL_SLUGS).map(([ch, slug]) => [slug, ch]));

/** Top application bar — 56px, white, rounded, soft card shadow. */
export default function TopNav({
  onOpenChat,
  onQuickCreate,
  label = "Customer Engagement",
  showAskCoMarketer = true,
  showCoMarketerNudge = true,
  onBackToAiDashboardNudge,
  onCoMarketerNext,
  onFinishNudgeSequence,
  onCampaignLaunched,
}: {
  onOpenChat?: () => void;
  /** An item was picked in the quick-create menu, e.g. "Email". */
  onQuickCreate?: (label: string) => void;
  /** A campaign in the creation wizard finished its launch pop-up. */
  onCampaignLaunched?: (info: { name: string; aiGenerated: boolean }) => void;
  label?: string;
  showAskCoMarketer?: boolean;
  /** False keeps the button but skips its discovery nudge (and dot). Toggling
   *  this true later (e.g. once a preceding nudge closes) shows the nudge. */
  showCoMarketerNudge?: boolean;
  /** "Back" on the nudge — steps back to the AI Dashboard nudge (first of the
   *  three-step discovery sequence, so only wired where that sequence runs). */
  onBackToAiDashboardNudge?: () => void;
  /** "Next" on the nudge — advances to the Decisioning nudge (co-marketer is
   *  the middle step of the three-step discovery sequence). */
  onCoMarketerNext?: () => void;
  /** Ends the discovery sequence — clicking the button while the nudge is up,
   *  or clicking anywhere outside it. */
  onFinishNudgeSequence?: () => void;
}) {
  const nudgeWrapRef = useRef<HTMLDivElement>(null);
  // Controlled so picking an item can dismiss the menu before the flow opens.
  const [createOpen, setCreateOpen] = useState(false);
  // The campaign creation wizard lives here rather than in each page, so it
  // works from every surface that renders this bar. `flowChannel` is kept while
  // the overlay slides away so its navbar doesn't blank out mid-exit.
  const [flowChannel, setFlowChannel] = useState<string | null>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // The wizard is open whenever the address is /campaigns/<channel>.
  const routeChannel = CHANNEL_BY_SLUG[pathname.replace(/^\/campaigns\//, "")] as string | undefined;
  const flowOpen = pathname.startsWith("/campaigns/") && Boolean(routeChannel);
  useEffect(() => {
    if (routeChannel) setFlowChannel(routeChannel);
  }, [routeChannel]);
  // Segment creation shares the same treatment — quick-create → Segment opens a
  // blank canvas, the same one "Review segment" opens with rules already on it.
  const [segmentFlowOpen, setSegmentFlowOpen] = useState(false);
  const dismissNudge = () => {
    onFinishNudgeSequence?.();
  };

  // Dismiss the nudge when clicking anywhere outside it (and its button).
  useEffect(() => {
    if (!showCoMarketerNudge) return;
    const onDocDown = (e: MouseEvent) => {
      if (!nudgeWrapRef.current?.contains(e.target as Node)) dismissNudge();
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [showCoMarketerNudge]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <header className="flex h-14 items-center rounded-lg bg-white pl-4 pr-4 shadow-[0px_5px_10px_0px_rgba(23,23,58,0.05)]">
      {/* Left: workspace pill + search */}
      <div className="flex items-center gap-4">
        <span className="rounded bg-[#E7EDFF] px-2 py-1 font-manrope text-xs font-semibold text-[#2F68E5]">
          {label}
        </span>

        <button className="flex items-center gap-2 rounded py-1 opacity-80 transition-opacity hover:opacity-100">
          <Search className="h-3.5 w-3.5 text-[#6F6F8D]" strokeWidth={2} />
          <span className="font-manrope text-[13px] font-medium text-[#6F6F8D]">
            Search
          </span>
          <span className="flex h-[22px] items-center gap-1 rounded border border-[#DDE2EE] px-1.5 font-manrope text-[13px] font-medium text-[#6F6F8D]">
            ⌘ K
          </span>
        </button>
      </div>

      {/* Right cluster */}
      <div className="ml-auto flex items-center gap-4">
        {/* Ask co-marketer — rotating conic-gradient border ring (same shimmer
            used on the chat input field). h-8 matches the Create/Plus button.
            While the discovery nudge is up, a pulsing halo highlights the button
            and the nudge card drops beneath it. */}
        {showAskCoMarketer && (
          <div ref={nudgeWrapRef} className="relative">
            {/* Small royal-blue pulsing dot centered on the lower edge of the
                button — a ping ring behind a solid dot. */}
            {showCoMarketerNudge && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-1 left-1/2 z-[2] grid h-2.5 w-2.5 -translate-x-1/2 place-items-center"
              >
                <span className="absolute inset-0 animate-ping rounded-full bg-[#2F68E5]/50" />
                <span className="relative h-2 w-2 rounded-full bg-[#2F68E5]" />
              </span>
            )}
            <CoMarketerButton
              label="Ask Cori"
              onClick={() => {
                if (showCoMarketerNudge) dismissNudge();
                onOpenChat?.();
              }}
            />

            {/* Discovery nudge — drops below the button, right-aligned. */}
            {showCoMarketerNudge && (
              <div className="absolute right-0 top-[calc(100%+12px)] z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                <CoMarketerNudge
                  onBack={() => onBackToAiDashboardNudge?.()}
                  onNext={() => onCoMarketerNext?.()}
                />
              </div>
            )}
          </div>
        )}

        {/* Create — opens the quick-create menu, anchored under the button with
            its right edge flush to the button's (Figma node 5636:43886). */}
        <Popover open={createOpen} onOpenChange={setCreateOpen}>
          <PopoverTrigger asChild>
            <button
              aria-label="Create"
              className="grid h-8 w-8 place-items-center rounded bg-[#2F68E5] text-white transition-colors hover:bg-[#255ad2]"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={10}
            className="w-auto border-0 bg-transparent p-0 shadow-none"
          >
            <QuickCreateMenu
              onSelect={(item) => {
                setCreateOpen(false);
                // Messaging channels open the wizard here; anything else
                // (Journey, Content) is left to the host page to route.
                if (CREATION_CHANNELS.has(item)) {
                  navigate(`/campaigns/${CHANNEL_SLUGS[item]}`);
                } else if (item === "Segment") {
                  setSegmentFlowOpen(true);
                }
                onQuickCreate?.(item);
              }}
            />
          </PopoverContent>
        </Popover>

        <span className="h-8 w-px bg-[#DDE2EE]" />

        {/* Notifications */}
        <div className="flex items-center gap-3">
          <button aria-label="Notifications" className="grid place-items-center">
            <Bell className="h-[22px] w-[22px] text-[#17173A]" strokeWidth={1.6} />
          </button>
          <button aria-label="Trending" className="grid place-items-center">
            <img src={trending} alt="" className="h-[22px] w-[22px]" />
          </button>
          {/* Engagement score ring */}
          <div className="relative grid h-[22px] w-[22px] place-items-center">
            <svg viewBox="0 0 22 22" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="11" cy="11" r="9.5" fill="none" stroke="#E7EFEA" strokeWidth="2" />
              <circle
                cx="11"
                cy="11"
                r="9.5"
                fill="none"
                stroke="#00C48C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 9.5}
                strokeDashoffset={2 * Math.PI * 9.5 * (1 - 0.65)}
              />
            </svg>
            <span className="font-manrope text-[11px] font-extrabold text-[#00C48C]">65</span>
          </div>
        </div>

        <span className="h-8 w-px bg-[#DDE2EE]" />

        {/* Profile */}
        <div className="flex flex-col gap-[3px]">
          <div className="flex items-center gap-1.5">
            <span className="font-manrope text-sm font-semibold tracking-[0.42px] text-[#17173A]">
              Amit
            </span>
            <svg className="h-3 w-3 text-[#17173A]" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-[5px] w-[5px] rounded-full bg-[#00C48C]" />
            <span className="font-manrope text-[10px] font-semibold tracking-[0.42px] text-[#00C48C]">
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Portalled to <body> so the fixed full-screen wizard can't be trapped
          by a page's stacking or transform context. */}
      {createPortal(
        <CampaignCreationOverlay
          open={flowOpen}
          channel={routeChannel ?? flowChannel ?? "Email"}
          onClose={() => navigate("/campaigns")}
          onLaunched={onCampaignLaunched}
        />,
        document.body
      )}

      {createPortal(
        <SegmentCreationOverlay
          open={segmentFlowOpen}
          segment={null}
          onClose={() => setSegmentFlowOpen(false)}
        />,
        document.body
      )}
    </header>
  );
}
