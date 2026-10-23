import nudgeGif from "/campaign-assets/co-marketer-nudge.gif";
import NudgeFooter from "./NudgeFooter";

/**
 * Co-marketer discovery nudge — a 320px card that drops below the
 * "Ask co-marketer" button in the top bar. Autoplaying GIF preview on top,
 * a short capability blurb below. Specs mirror the Figma node (16492:49922):
 * white card, Netcore-orange border, 8px radius, principal drop shadow, GIF 320×293.6px.
 * Middle of the three-step discovery sequence (AI Dashboard → Co-marketer →
 * Decisioning); "Back" returns to the AI Dashboard nudge, "Next" advances to
 * the Decisioning nudge.
 */
export default function CoMarketerNudge({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="relative w-[320px]" role="dialog" aria-label="Meet Zeno">
      {/* Pointer arrow — points up to the Ask co-marketer button. Sits above the
          clipped card so it isn't cut off by overflow-hidden. */}
      <span
        aria-hidden="true"
        className="absolute -top-[6px] right-[26px] z-10 h-3 w-3 rotate-45 border-l border-t border-[#DDE2EE] bg-white"
      />

      <div className="flex flex-col overflow-hidden rounded-[8px] border border-solid border-[#DDE2EE] bg-white shadow-[5px_5px_10px_0px_#E5E9F2]">
        {/* Autoplaying preview GIF (autoplay + loop is native to animated GIFs). */}
        <div className="h-[293.6px] w-[320px] shrink-0">
          <img
            src={nudgeGif}
            alt="Zeno generating a segment"
            className="pointer-events-none h-full w-full object-cover"
          />
        </div>

        {/* Capability blurb — describes what the AI agent can do. */}
        <div className="flex items-center justify-center p-[16px]">
          <p className="min-w-px flex-1 break-words font-manrope text-[14px] font-medium leading-[22px] text-black">
            Meet Zeno, your AI marketing agent. Just describe what you need
            in plain language and it generates insights, builds segments, designs
            journeys, and more.
          </p>
        </div>

        <NudgeFooter onBack={onBack} onNext={onNext} step={2} />
      </div>
    </div>
  );
}
