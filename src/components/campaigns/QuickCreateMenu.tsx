import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import iconJourney from "/campaign-assets/qc-journey.svg";
import iconEmail from "/campaign-assets/qc-email.svg";
import iconSms from "/campaign-assets/qc-sms.svg";
import iconAppPush from "/campaign-assets/qc-app-push.svg";
import iconAmp from "/campaign-assets/qc-amp.svg";
import iconAppPushAb from "/campaign-assets/qc-app-push-ab.svg";
import iconAppPushSplit from "/campaign-assets/qc-app-push-split.svg";
import iconAppPushMulti from "/campaign-assets/qc-app-push-multi.svg";
import iconWebPush from "/campaign-assets/qc-web-push.svg";
import iconWhatsapp from "/campaign-assets/qc-whatsapp.svg";
import iconInApp from "/campaign-assets/qc-in-app.svg";
import iconWebMessage from "/campaign-assets/qc-web-message.svg";
import iconContent from "/campaign-assets/qc-content.svg";
import iconSegment from "/campaign-assets/aud-segments.svg";
import iconList from "/campaign-assets/aud-lists.svg";
import iconChevron from "/campaign-assets/qc-chevron.svg";
import iconSearch from "/campaign-assets/qc-search.svg";
import iconClear from "/campaign-assets/qc-clear.svg";
import { cn } from "@/lib/utils";

/**
 * Quick-create menu behind the top bar's "+" (Figma node 5636:43886).
 * 364px card: search + tab switch header, then a scrolling list of things the
 * user can create, grouped into Create campaigns / Onsite / Personalisation.
 *
 * Each icon is the exported Figma asset, drawn as a leaf inside its own 16px
 * box using the insets from the design so the glyphs sit exactly as designed
 * rather than being stretched to fill the box.
 */

const TABS = ["Campaigns", "Content", "Contacts", "Analytics"] as const;
type Tab = (typeof TABS)[number];

/** Placeholder cycles the way the "Search anim" component does in Figma. */
const SEARCH_HINTS = ["Search “Email”", "Search “App push”", "Search “Journey”"];

interface QuickCreateItem {
  /** What the menu reports on select — for channels, the id the wizard keys off. */
  label: string;
  /** What the row shows, when it should read differently from `label`. */
  display?: string;
  icon: string;
  /** Leaf insets from Figma, preserving each glyph's designed geometry. */
  inset: string;
  /** Items that open a further level show the caret on the right. */
  hasSubmenu?: boolean;
  /** The second level itself — shown as a flyout beside the row. */
  submenu?: SubmenuItem[];
  /** Disabled items are shown but not selectable. */
  disabled?: boolean;
}

interface SubmenuItem {
  label: string;
  icon: ReactNode;
  /** Shown but not selectable yet. */
  disabled?: boolean;
}

interface QuickCreateSection {
  /** Undefined for the ungrouped lead item (Journey). */
  heading?: string;
  items: QuickCreateItem[];
}

/** Each campaign type's own exported icon, drawn at its full 16px box. */
const typeIcon = (src: string) => <img src={src} alt="" className="block size-[16px] shrink-0" />;

const APP_PUSH_SUBMENU: SubmenuItem[] = [
  { label: "Regular campaign", icon: <ItemIcon src={iconAppPush} inset="6.47% 7.14% 5.95% 5.36%" /> },
  { label: "A/B campaign", disabled: true, icon: typeIcon(iconAppPushAb) },
  { label: "Split campaign", disabled: true, icon: typeIcon(iconAppPushSplit) },
  { label: "Multi message", disabled: true, icon: typeIcon(iconAppPushMulti) },
];

const EMAIL_SUBMENU: SubmenuItem[] = [
  { label: "Regular campaign", icon: <ItemIcon src={iconEmail} inset="9.74% 5.36%" /> },
  { label: "AMP", disabled: true, icon: typeIcon(iconAmp) },
  { label: "A/B campaign", disabled: true, icon: typeIcon(iconAppPushAb) },
  { label: "Split campaign", disabled: true, icon: typeIcon(iconAppPushSplit) },
];

const SECTIONS: QuickCreateSection[] = [
  {
    items: [{ label: "Journey", icon: iconJourney, inset: "7.15% 7.14% 7.14% 10.72%" }],
  },
  {
    heading: "Create campaigns",
    items: [
      {
        label: "Email",
        icon: iconEmail,
        inset: "9.74% 5.36%",
        hasSubmenu: true,
        submenu: EMAIL_SUBMENU,
      },
      { label: "SMS", icon: iconSms, inset: "5.57% 5.36% 5.73% 5.87%", disabled: true },
      {
        label: "App Push Notification",
        display: "App push",
        icon: iconAppPush,
        inset: "6.47% 7.14% 5.95% 5.36%",
        hasSubmenu: true,
        submenu: APP_PUSH_SUBMENU,
      },
      { label: "Web Push Notification", display: "Web push", icon: iconWebPush, inset: "6.47% 6.52% 4.93% 5.53%", disabled: true },
      { label: "Whatsapp", icon: iconWhatsapp, inset: "5.21%", disabled: true },
    ],
  },
  {
    heading: "Onsite",
    items: [
      { label: "In-app Message", icon: iconInApp, inset: "7.15% 7.14% 5.95% 5.36%" },
      { label: "Web Message", icon: iconWebMessage, inset: "7.15% 6.52% 4.93% 5.53%" },
    ],
  },
  {
    heading: "Personalisation",
    items: [{ label: "Content", icon: iconContent, inset: "5.35% 6.39% 5.36% 6.38%" }],
  },
];

/** Contacts tab — the audience objects, which open the segment creation canvas. */
const CONTACT_SECTIONS: QuickCreateSection[] = [
  {
    heading: "Audience",
    items: [
      { label: "Segment", icon: iconSegment, inset: "8%" },
      { label: "List", icon: iconList, inset: "8%" },
    ],
  },
];

/** Which tab shows what. Tabs with nothing yet fall through to the empty note. */
const TAB_SECTIONS: Partial<Record<Tab, QuickCreateSection[]>> = {
  Campaigns: SECTIONS,
  Contacts: CONTACT_SECTIONS,
};

function ItemIcon({ src, inset }: { src: string; inset: string }) {
  return (
    <span className="relative block size-[16px] shrink-0 overflow-hidden">
      <span className="absolute" style={{ inset }}>
        <img src={src} alt="" className="block size-full max-w-none" />
      </span>
    </span>
  );
}

export default function QuickCreateMenu({ onSelect }: { onSelect?: (label: string) => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("Campaigns");
  const [query, setQuery] = useState("");
  const [hintIndex, setHintIndex] = useState(0);
  // The open flyout: which row, how far down the menu it starts, and which side
  // has room for it.
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const [flyout, setFlyout] = useState<{ label: string; top: number; side: "right" | "left" | "inside" } | null>(null);

  const openFlyout = (item: QuickCreateItem, row: HTMLElement) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    const wrap = wrapRef.current;
    if (!wrap) return;
    const w = wrap.getBoundingClientRect();
    const r = row.getBoundingClientRect();
    const FLYOUT_W = 232;
    // Beside the menu when there's room on either side; otherwise (a narrow
    // window) it overlaps the menu's right edge, just under its row.
    const side =
      window.innerWidth - w.right >= FLYOUT_W
        ? "right"
        : w.left >= FLYOUT_W
          ? "left"
          : "inside";
    setFlyout({
      label: item.label,
      top: side === "inside" ? r.bottom - w.top + 2 : r.top - w.top - 8,
      side,
    });
  };
  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setFlyout(null), 140);
  };
  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);

  // Rotate the placeholder while the field is empty (matches the Figma anim).
  useEffect(() => {
    if (query) return;
    const id = setInterval(() => setHintIndex((i) => (i + 1) % SEARCH_HINTS.length), 2400);
    return () => clearInterval(id);
  }, [query]);

  const sections = useMemo(() => {
    const tabSections = TAB_SECTIONS[activeTab] ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return tabSections;
    return tabSections
      .map((s) => ({ ...s, items: s.items.filter((i) => (i.display ?? i.label).toLowerCase().includes(q)) }))
      .filter((s) => s.items.length > 0);
  }, [query, activeTab]);

  const flyoutItem = flyout
    ? sections.flatMap((sec) => sec.items).find((i) => i.label === flyout.label)
    : undefined;

  return (
    <div ref={wrapRef} className="relative w-[364px]">
    <div className="flex w-full flex-col overflow-hidden rounded-[6px] border border-[#DDE2EE] bg-white font-manrope shadow-[0px_5px_15px_0px_rgba(23,23,58,0.15)]">
      {/* Header — search field + tab switch */}
      <div className="shrink-0 px-[14px] pt-[14px]">
        <div className="flex items-center justify-between gap-[8px] rounded-[6px] border border-[#DDE2EE] px-[12px] py-[8px]">
          <span className="relative block size-[14px] shrink-0 overflow-hidden">
            <span className="absolute inset-[5.36%]">
              <img src={iconSearch} alt="" className="block size-full max-w-none" />
            </span>
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={SEARCH_HINTS[hintIndex]}
            className="min-w-0 flex-1 bg-transparent text-[14px] font-medium leading-[18px] text-[#17173A] outline-none placeholder:text-[#A0A0A0]"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="grid size-[14px] shrink-0 place-items-center"
            >
              <img src={iconClear} alt="" className="block size-[8px]" />
            </button>
          )}
        </div>

        <div className="mt-[18px] flex gap-[24px]">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-[8px] text-[14px] leading-[18px] transition-colors",
                tab === activeTab ? "font-bold text-[#2F68E5]" : "font-semibold text-[#6F6F8D] hover:text-[#17173A]"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        {/* Track + active segment; the segment slides to the selected tab. */}
        <div className="relative h-[2px] w-full rounded-[100px] bg-[#DDE2EE]">
          <span
            className="absolute left-0 top-0 h-[2px] rounded-[100px] bg-[#2F68E5] transition-all duration-200"
            style={{
              width: `${100 / TABS.length}%`,
              transform: `translateX(${TABS.indexOf(activeTab) * 100}%)`,
            }}
          />
        </div>
      </div>

      {/* Scrolling list */}
      <div className="max-h-[268px] overflow-y-auto px-[7px] pb-[8px] pt-[12px]">
        {!TAB_SECTIONS[activeTab] ? (
          <p className="px-[8px] py-[12px] text-[13px] font-medium text-[#6F6F8D]">
            Nothing to quick-create under {activeTab} yet.
          </p>
        ) : sections.length === 0 ? (
          <p className="px-[8px] py-[12px] text-[13px] font-medium text-[#6F6F8D]">
            No matches for “{query}”.
          </p>
        ) : (
          sections.map((section, si) => (
            <div key={section.heading ?? "lead"}>
              {section.heading && (
                <p
                  className={cn(
                    "px-[8px] pb-[12px] text-[12px] font-extrabold uppercase text-[#6F6F8D]",
                    si === 1 ? "pt-[10px]" : "pt-[16px]"
                  )}
                >
                  {section.heading}
                </p>
              )}
              {section.items.map((item) => {
                const row = (
                  <>
                    <ItemIcon src={item.icon} inset={item.inset} />
                    <span className="flex-1 text-[14px] font-semibold leading-[18px] text-[#17173A]">
                      {item.display ?? item.label}
                    </span>
                    {item.hasSubmenu && (
                      <span className="grid size-[16px] shrink-0 place-items-center">
                        <img src={iconChevron} alt="" className="block h-[5px] w-[8px] -rotate-90" />
                      </span>
                    )}
                  </>
                );

                if (item.disabled) {
                  return (
                    <div
                      key={item.label}
                      aria-disabled="true"
                      className="flex w-full cursor-default items-center gap-[8px] rounded-[4px] p-[8px] text-left"
                    >
                      {row}
                    </div>
                  );
                }

                if (item.submenu) {
                  const active = flyout?.label === item.label;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={active}
                      onMouseEnter={(e) => openFlyout(item, e.currentTarget)}
                      onMouseLeave={scheduleClose}
                      onFocus={(e) => openFlyout(item, e.currentTarget)}
                      onClick={(e) => (active ? setFlyout(null) : openFlyout(item, e.currentTarget))}
                      className={cn(
                        "flex w-full items-center gap-[8px] rounded-[4px] p-[8px] text-left transition-colors",
                        active ? "bg-[#F4F8FF] [&_span]:text-[#2F68E5]" : "hover:bg-[#F7F9FC]"
                      )}
                    >
                      {row}
                    </button>
                  );
                }

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onSelect?.(item.label)}
                    className="flex w-full items-center gap-[8px] rounded-[4px] p-[8px] text-left transition-colors hover:bg-[#F7F9FC]"
                  >
                    {row}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>

    {flyout && flyoutItem?.submenu && (
      <div
        role="menu"
        onMouseEnter={() => closeTimer.current && window.clearTimeout(closeTimer.current)}
        onMouseLeave={scheduleClose}
        className={cn(
          "absolute z-10 w-[224px] rounded-[6px] border border-[#DDE2EE] bg-white p-[7px] font-manrope shadow-[0px_5px_15px_0px_rgba(23,23,58,0.15)] animate-in fade-in duration-150",
          flyout.side === "right" && "left-[calc(100%+4px)] slide-in-from-left-1",
          flyout.side === "left" && "right-[calc(100%+4px)] slide-in-from-right-1",
          flyout.side === "inside" && "right-[12px] z-20 slide-in-from-top-1"
        )}
        style={{ top: Math.max(0, flyout.top) }}
      >
        {flyoutItem.submenu.map((sub) =>
          sub.disabled ? (
            <div
              key={sub.label}
              role="menuitem"
              aria-disabled="true"
              className="flex w-full cursor-default items-center gap-[10px] rounded-[4px] p-[8px] text-left text-[14px] font-semibold leading-[18px] text-[#17173A]"
            >
              {sub.icon}
              {sub.label}
            </div>
          ) : (
            <button
              key={sub.label}
              type="button"
              role="menuitem"
              onClick={() => onSelect?.(flyoutItem.label)}
              className="flex w-full items-center gap-[10px] rounded-[4px] p-[8px] text-left text-[14px] font-semibold leading-[18px] text-[#17173A] transition-colors hover:bg-[#F7F9FC]"
            >
              {sub.icon}
              {sub.label}
            </button>
          )
        )}
      </div>
    )}
    </div>
  );
}
