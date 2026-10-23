import { useEffect, useState } from "react";
import avatar from "/campaign-assets/cmn-avatar.gif";
import chevron from "/campaign-assets/cmn-chevron.svg";
import iconClose from "/campaign-assets/cmn-close.svg";
import iconChannel from "/campaign-assets/cmn-channel-email.svg";
import iconBuiltForYou from "/campaign-assets/cmn-built-for-you.svg";
import iconMore from "/campaign-assets/cmn-more.svg";

/**
 * Co-marketer review banner above the campaigns table (Figma node 5642:44678).
 * A tinted strip — 20% white over Primary/Line #E0E5EE, flattened to #E6EAF1 —
 * carrying the co-marketer avatar and headline, an "N of 3" pager, and a white
 * card describing the campaign waiting for review.
 *
 * The three campaigns rotate on their own every 4s and can be stepped through
 * with the pager chevrons (which restart the timer). The card's outline is the
 * same rotating conic stroke used by the segment suggestion cards
 * (`.input-border-shimmer` in index.css).
 */

/** How long each campaign stays on screen before the banner advances. */
const ROTATE_MS = 4000;

const CAMPAIGNS = [
  {
    id: "ID - AI",
    title: "Business Psychology Deep Dive: Elevate Your Strategic Decisions",
    subtitle: "Unlock the hidden forces guiding your choices!",
  },
  {
    id: "ID - AI",
    title: "Win Back Dormant Shoppers: A 3-Touch Reactivation Series",
    subtitle: "Bring back the 12,400 users who went quiet last quarter.",
  },
  {
    id: "ID - AI",
    title: "High-Intent Cart Recovery: Personalised Nudges Within the Hour",
    subtitle: "Catch abandoned carts while the intent is still warm.",
  },
];

export default function CoMarketerReviewBanner({
  onReview,
  onDismiss,
}: {
  /** Fired by the "Review" button, with the campaign currently on screen. */
  onReview?: (campaign: (typeof CAMPAIGNS)[number]) => void;
  /** Fired by the close (×) icon in the header strip. */
  onDismiss?: () => void;
}) {
  const [index, setIndex] = useState(0);
  // Bumped by the chevrons so a manual step restarts the dwell timer instead of
  // inheriting whatever was left of the current one.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setTimeout(
      () => setIndex((i) => (i + 1) % CAMPAIGNS.length),
      ROTATE_MS
    );
    return () => window.clearTimeout(id);
  }, [index, tick]);

  const step = (delta: number) => {
    setIndex((i) => (i + delta + CAMPAIGNS.length) % CAMPAIGNS.length);
    setTick((t) => t + 1);
  };

  const campaign = CAMPAIGNS[index];

  return (
    <div className="flex w-full flex-col items-start overflow-hidden rounded-[8px] bg-[#E6EAF1]">
      {/* Header strip — avatar + headline on the left, pager and close on the right. */}
      <div className="flex w-full items-center justify-between px-[16px] py-[8px]">
        <div className="flex min-w-px flex-1 items-center justify-between">
          <div className="flex shrink-0 items-center gap-[9px]">
            <div className="size-[20px] shrink-0 overflow-hidden rounded-full bg-[#291E31]">
              <img
                src={avatar}
                alt=""
                className="pointer-events-none size-[20px] rounded-full object-cover"
              />
            </div>
            <p className="shrink-0 whitespace-nowrap break-words font-manrope text-[14px] font-medium tracking-[0.2917px] text-[#17173A]">
              Zeno has a new campaign for you to review
            </p>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-[24px]">
            {/* Pager — the two chevrons are the same asset, the second flipped. */}
            <div className="flex shrink-0 items-center justify-center gap-[4px] rounded-[6px] border-[0.5px] border-solid border-[#DDE2EE] bg-white p-[4px]">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous campaign"
                className="block size-[14px] shrink-0"
              >
                <img src={chevron} alt="" className="block size-[14px]" />
              </button>
              <p className="shrink-0 whitespace-nowrap break-words font-manrope text-[12px] font-medium text-[#6F6F8D]">
                {index + 1} of {CAMPAIGNS.length}
              </p>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next campaign"
                className="block size-[14px] shrink-0 rotate-180"
              >
                <img src={chevron} alt="" className="block size-[14px]" />
              </button>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="block size-[20px] shrink-0"
            >
              <img src={iconClose} alt="" className="block size-[20px]" />
            </button>
          </div>
        </div>
      </div>

      {/* Campaign card. No static border — the shimmer ring below IS the
          outline, so the card never shows two stacked strokes. */}
      <div className="flex w-full flex-col items-start p-[6px]">
        <div className="relative flex w-full items-start overflow-hidden rounded-[6px] bg-white py-[8px] pl-[10px] pr-[24px]">
          <span
            aria-hidden="true"
            className="input-border-shimmer"
            style={{ padding: "1px" }}
          />

          <div className="relative flex min-w-px flex-1 items-center gap-[15px]">
            <div className="flex min-w-px flex-1 items-start">
              <div className="flex shrink-0 flex-col items-start gap-[12px]">
                <div className="flex w-full flex-col items-center gap-[4px]">
                  <div className="flex shrink-0 items-center gap-[10px]">
                    <img src={iconChannel} alt="" className="block size-[24px] shrink-0" />
                    <p className="shrink-0 whitespace-nowrap break-words font-manrope text-[14px] font-medium leading-[18px] text-[#2F68E5]">
                      {campaign.title}
                    </p>
                  </div>
                  <div className="flex w-full items-center justify-center pl-[34px]">
                    <p className="min-w-px flex-1 break-words font-manrope text-[12px] font-medium text-[#6F6F8D]">
                      {campaign.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start pl-[34px]">
                  <div className="flex shrink-0 items-center gap-[3px]">
                    <p className="shrink-0 whitespace-nowrap break-words font-manrope text-[12px] font-medium leading-[16px] text-[#6F6F8D]">
                      {campaign.id}
                    </p>
                    {/* Vertical hairline separator (1px rule inside a 20px box). */}
                    <span
                      aria-hidden="true"
                      className="relative block size-[20px] shrink-0"
                    >
                      <span className="absolute bottom-0 left-1/2 right-[45%] top-0 rounded-[1px] bg-[#DDE2EE]" />
                    </span>
                    <div className="flex shrink-0 items-center gap-[6px] rounded-[4px] bg-[#F6F6F6] px-[4px] py-[2px]">
                      {/* Wand wiggles, glow flickers — see .magic-wand in index.css. */}
                      <span className="magic-wand-glow shrink-0">
                        <img src={iconBuiltForYou} alt="" className="magic-wand size-[14px]" />
                      </span>
                      <p className="shrink-0 whitespace-nowrap break-words font-manrope text-[10px] font-medium leading-[16px] text-[#6F6F8D]">
                        Built for you
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-[24px]">
              <button
                type="button"
                onClick={() => onReview?.(campaign)}
                className="flex shrink-0 items-start rounded-[4px] border border-solid border-[#2F68E5] bg-white px-[12px] py-[5px]"
              >
                <span className="whitespace-nowrap break-words font-manrope text-[14px] font-semibold leading-[20px] tracking-[0.42px] text-[#2F68E5]">
                  Review
                </span>
              </button>

              <button
                type="button"
                aria-label="More options"
                className="flex size-[30px] shrink-0 items-center justify-center"
              >
                {/* 16px glyph in a 30px hit area; the dots are rotated upright. */}
                <span className="flex items-center justify-center rounded-[6px] bg-[#F6F6F6] p-[7px]">
                  <img src={iconMore} alt="" className="block size-[16px] rotate-90" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
