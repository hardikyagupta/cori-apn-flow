import sparkle from "/campaign-assets/ic-sparkle-ai.gif";

/**
 * Co-marketer suggestion strip above the Segments table (Figma node 5639:44292)
 * — a tinted panel with four prompt cards the user can fire straight into the
 * co-marketer chat.
 *
 * Each card shows a short headline + one-line description instead of the raw
 * prompt (the full prompt still goes to the chat via `prompt`), plus badges
 * that say what the segment is worth before the user commits to a click.
 *
 * The peach border carries the same rotating conic stroke animation as the AI
 * homepage chat input (`.input-border-shimmer` in index.css), offset per card so
 * the four rings sweep out of phase instead of in lockstep.
 */

type Badge = {
  label: string;
  /** Size/reach badges read as data (blue); qualitative ones as intent (violet). */
  tone: "reach" | "intent";
};

export type SegmentStarter = {
  title: string;
  description: string;
  badges: Badge[];
  /** Sent verbatim to the co-marketer chat — keeps the SEGMENTS_FLOWS keywords. */
  prompt: string;
};

/** The four starting points, also reused as the campaign wizard's audience pills. */
export const SEGMENT_STARTERS: SegmentStarter[] = [
  {
    title: "Reach engaged Gmail users",
    description: "Clicked an email in the last 30 days",
    badges: [
      { label: "18.4K users", tone: "reach" },
      { label: "High intent", tone: "intent" },
    ],
    prompt:
      'Find users whose email address contains "gmail.com" and also have clicked an email in the past 30 days',
  },
  {
    title: "Win back inactive customers",
    description: "No opens or clicks in 6 months",
    badges: [
      { label: "42.1K users", tone: "reach" },
      { label: "Retention play", tone: "intent" },
    ],
    prompt:
      "Generate a segment of subscribers who have not opened or clicked on any links in the past 6 months",
  },
  {
    title: "Welcome new customers",
    description: "Joined within the last 60 days",
    badges: [
      { label: "6.7K users", tone: "reach" },
      { label: "Fresh audience", tone: "intent" },
    ],
    prompt: "Create a segment of new customers who joined within the last 60 days",
  },
  {
    title: "Target high-engagement users",
    description: "In Europe, engagement above 30%",
    badges: [
      { label: "9.2K users", tone: "reach" },
      { label: "Best converters", tone: "intent" },
    ],
    prompt:
      "Find all users who are located in europe and have an email engagement rate higher  than 30%",
  },
];

const BADGE_TONE: Record<Badge["tone"], string> = {
  reach: "bg-[#EDF3FE] text-[#2F68E5]",
  intent: "bg-[#F6EFFE] text-[#8B44D6]",
};

export default function SegmentSuggestions({
  onSelect,
}: {
  /** Fired with the prompt text when a card is picked. */
  onSelect?: (prompt: string) => void;
}) {
  return (
    // 20% white over Primary/Line #E0E5EE, flattened to the blended tint.
    <div className="flex w-full flex-col items-start overflow-hidden rounded-[8px] bg-[#E6EAF1]">
      <div className="flex w-full items-center justify-between py-[8px] pl-[16px] pr-[8px]">
        <p className="flex-1 font-manrope text-[14px] font-bold text-[#17173A]">
          Pick a starting point —{" "}
          <span className="font-medium text-[#6F6F8D]">
            Zeno builds the segment for you
          </span>
        </p>
      </div>

      <div className="flex w-full items-stretch gap-[8px] px-[4px] pb-[4px]">
        {SEGMENT_STARTERS.map(({ title, description, badges, prompt }, i) => (
          <button
            key={title}
            type="button"
            onClick={() => onSelect?.(prompt)}
            // No static border — the shimmer ring below IS the card's 1px
            // border, so the card never shows two stacked outlines.
            className="relative flex min-w-0 flex-1 flex-col items-start gap-[6px] overflow-hidden rounded-[6px] bg-white px-[13px] py-[10px] text-left"
          >
            {/* Rotating stroke — 1px to match the designed border weight, with a
                negative delay so the four cards sweep out of phase. */}
            <span
              aria-hidden="true"
              className="input-border-shimmer"
              style={{ padding: "1px", animationDelay: `${i * -1}s` }}
            />

            <span className="relative flex w-full min-w-0 items-center gap-[6px]">
              <img src={sparkle} alt="" className="size-[18px] shrink-0 object-cover" />
              <span className="min-w-0 flex-1 truncate font-manrope text-[13px] font-bold text-[#17173A]">
                {title}
              </span>
            </span>

            <span className="relative font-manrope text-[11px] font-medium leading-[15px] text-[#6F6F8D]">
              {description}
            </span>

            <span className="relative flex flex-wrap items-center gap-[4px]">
              {badges.map((badge) => (
                <span
                  key={badge.label}
                  className={`rounded-[4px] px-[6px] py-[2px] font-manrope text-[10px] font-semibold tracking-[0.2px] ${BADGE_TONE[badge.tone]}`}
                >
                  {badge.label}
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
