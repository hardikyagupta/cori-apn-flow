import { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Send,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PushVariation, VariationField } from "@/data/pushCartFlow";

/** How long the images "generate" before they appear. */
const IMAGE_GENERATION_MS = 5500;

const ROWS: { field: Exclude<VariationField, "image">; label: string }[] = [
  { field: "title", label: "Title" },
  { field: "message", label: "Description" },
  { field: "buttonText", label: "Action button" },
];

/**
 * Cori's copy variations for a notification, one at a time with a pager.
 * Each line can be sent to the editor on its own or copied.
 */
export default function PushVariationsCard({
  variations,
  onApply,
  onUse,
}: {
  variations: PushVariation[];
  onApply: (field: VariationField, value: string) => void;
  /** Puts the whole variation in the editor. Nothing reaches it before this. */
  onUse: (variation: PushVariation, withImage: boolean) => void;
}) {
  const [imagesReady, setImagesReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(
      () => setImagesReady(true),
      IMAGE_GENERATION_MS,
    );
    return () => window.clearTimeout(id);
  }, []);
  const [index, setIndex] = useState(0);
  // Which whole variation was last put in the editor. Single lines from any
  // variation can be mixed in at any time.
  const [inUse, setInUse] = useState<number | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const v = variations[index];

  const flash = (key: string) => {
    setDone(key);
    window.setTimeout(() => setDone((d) => (d === key ? null : d)), 1500);
  };

  return (
    <div className="w-full">
      <section className="overflow-hidden rounded-lg border border-[#DDE2EE] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[#DDE2EE] px-4 py-3">
          <h3 className="font-manrope text-[15px] font-semibold text-[#17173A]">
            {variations.length > 1 ? `${index + 1}. ` : ""}
            {v.name}
          </h3>
          {inUse === index ? (
            <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-[#EDFBF5] px-3 font-manrope text-[13px] font-semibold text-[#0B7A56]">
              <Check className="size-3.5" strokeWidth={3} /> In use
            </span>
          ) : (
            <button
              type="button"
              title="Use this whole variation in the editor"
              onClick={() => {
                setInUse(index);
                onUse(v, imagesReady);
              }}
              className="inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 font-manrope text-[13px] font-semibold text-[#6F6F8D] transition-colors hover:bg-[#F0F3F9] hover:text-[#2F68E5]"
            >
              <Send className="size-4" strokeWidth={1.75} />
              Use
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3 p-4">
          <span className="self-start rounded-md bg-[#0A8FFD] px-2.5 py-1 font-manrope text-[13px] font-medium text-white">
            Message content
          </span>
          {ROWS.map(({ field, label }) => {
            const value = v[field];
            const sentKey = `${index}-${field}-sent`;
            const copiedKey = `${index}-${field}-copied`;
            return (
              <div key={field} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-manrope text-[13px] font-bold text-[#17173A]">
                    {label}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Use this ${label.toLowerCase()} in the editor`}
                      title="Use in editor"
                      onClick={() => {
                        onApply(field, value);
                        flash(sentKey);
                      }}
                      className="grid size-7 cursor-pointer place-items-center rounded-md text-[#6F6F8D] transition-colors hover:bg-[#F0F3F9] hover:text-[#2F68E5] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#6F6F8D]"
                    >
                      {done === sentKey ? (
                        <Check className="size-4 text-[#0B7A56]" />
                      ) : (
                        <Send className="size-4" strokeWidth={1.75} />
                      )}
                    </button>
                    <button
                      type="button"
                      aria-label={`Copy ${label.toLowerCase()}`}
                      title="Copy"
                      onClick={() => {
                        void navigator.clipboard
                          ?.writeText(value)
                          .catch(() => {});
                        flash(copiedKey);
                      }}
                      className="grid size-7 cursor-pointer place-items-center rounded-md text-[#6F6F8D] transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
                    >
                      {done === copiedKey ? (
                        <Check className="size-4 text-[#0B7A56]" />
                      ) : (
                        <Copy className="size-4" strokeWidth={1.75} />
                      )}
                    </button>
                  </div>
                </div>
                <p
                  className={cn(
                    "font-manrope text-sm leading-5 text-[#17173A]",
                    field === "buttonText" && "uppercase",
                  )}
                >
                  {value}
                </p>
              </div>
            );
          })}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <p className="font-manrope text-[13px] font-bold text-[#17173A]">
                Image
              </p>
              <button
                type="button"
                aria-label="Use this image in the editor"
                title={imagesReady ? "Use in editor" : "Still generating"}
                disabled={!imagesReady}
                onClick={() => {
                  onApply("image", v.image);
                  flash(`${index}-image-sent`);
                }}
                className="grid size-7 cursor-pointer place-items-center rounded-md text-[#6F6F8D] transition-colors hover:bg-[#F0F3F9] hover:text-[#2F68E5] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#6F6F8D]"
              >
                {done === `${index}-image-sent` ? (
                  <Check className="size-4 text-[#0B7A56]" />
                ) : (
                  <Send className="size-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
            {imagesReady ? (
              <img
                src={v.image}
                alt={`${v.name} image`}
                className="aspect-[282/158] w-full rounded-md object-cover"
              />
            ) : (
              <div
                role="status"
                className="flex aspect-[282/158] w-full animate-pulse flex-col items-center justify-center gap-2 rounded-md bg-gradient-to-br from-[#EEF1F7] via-[#F4F0FF] to-[#EAF1FE]"
              >
                <Sparkles className="size-5 text-[#7B5CFA]" />
                <span className="font-manrope text-xs font-medium text-[#6F6F8D]">
                  Generating images…
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {variations.length > 1 && (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous variation"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="grid size-8 cursor-pointer place-items-center rounded-md bg-[#EEF1F7] text-[#6F6F8D] transition-colors hover:bg-[#E2E7F2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="font-manrope text-sm text-[#6F6F8D]">
            {index + 1}/{variations.length}
          </span>
          <button
            type="button"
            aria-label="Next variation"
            disabled={index === variations.length - 1}
            onClick={() =>
              setIndex((i) => Math.min(variations.length - 1, i + 1))
            }
            className="grid size-8 cursor-pointer place-items-center rounded-md bg-[#EEF1F7] text-[#6F6F8D] transition-colors hover:bg-[#E2E7F2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
