import type { OnsiteKind } from "./onsiteMessages.data";

const SRC: Record<OnsiteKind, string> = {
  inapp: "/campaign-assets/onsite/inapp-message.svg",
  web: "/campaign-assets/onsite/web-message.svg",
};

/** In-app / web message glyph. Drawn as a mask so the SVG (baked in dark
 *  purple) takes whatever text colour the caller sets. */
export default function OnsiteKindIcon({ kind, className = "size-[22px]" }: { kind: OnsiteKind; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        WebkitMask: `url(${SRC[kind]}) center / contain no-repeat`,
        mask: `url(${SRC[kind]}) center / contain no-repeat`,
      }}
    />
  );
}
