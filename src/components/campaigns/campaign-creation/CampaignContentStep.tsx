import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Archive,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Code2,
  Copy,
  Eye,
  FlaskConical,
  FolderInput,
  Info,
  LayoutGrid,
  List as ListIcon,
  Mail,
  Monitor,
  Moon,
  MoreVertical,
  Paperclip,
  Pencil,
  Plus,
  Replace,
  Search,
  SlidersHorizontal,
  SplitSquareHorizontal,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  Trophy,
  Upload,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import sparkle from "/campaign-assets/ic-sparkle-ai.gif";
import folderIcon from "/campaign-assets/ic-template-folder.svg";
import { ActionMenu, ActionMenuContent, ActionMenuTrigger } from "@/components/ui/action-menu";
import StepCard from "./StepCard";
import TemplateCard, { CardMenuItem, TemplateThumbnail } from "./TemplateCard";
import AppPushTemplateCard from "./AppPushTemplateCard";
import TemplatePreviewOverlay from "./TemplatePreviewOverlay";
import AiSuggestPopover from "./AiSuggestPopover";
import ErrorToast from "./ErrorToast";
import {
  emailTemplates,
  savedTemplateFolders,
  templateLibrary,
  type EmailTemplate,
  type PushPreviewKey,
  type TemplateFolder,
} from "./emailTemplates.data";
import { appPushTemplates } from "./appPushTemplates.data";
import { AppleIcon, AndroidIcon } from "./PlatformIcons";
import CarouselTemplateEditor from "./CarouselTemplateEditor";
import SendTestMailDrawer from "./SendTestMailDrawer";

/** Envelope-with-reply-arrow mark for the From row's reply-to button —
 *  stroke="currentColor" so it picks up the button's own hover color like
 *  the lucide icons beside it. */
function ReplyEmailIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M15.1062 2.47393L9.48559 6.4058C9.06228 6.70175 8.53898 6.86269 7.99999 6.86269C7.46101 6.86269 6.93771 6.70175 6.51439 6.4058L0.894017 2.47407M0.894017 2.47407C1.00627 2.07814 1.23978 1.71542 1.57132 1.42735C1.97463 1.07692 2.49943 0.857453 3.0608 0.804444C4.6556 0.65648 6.308 0.5 8 0.5C9.692 0.5 11.3444 0.655416 12.9392 0.802315C13.5006 0.855739 14.0253 1.07548 14.4286 1.42605C14.7603 1.71447 14.9939 2.07758 15.1062 2.47393C15.1304 2.55933 15.1489 2.64629 15.1616 2.73437C15.332 3.95214 15.5 5.21144 15.5 6.49947C15.5 7.00458 15.4742 7.50495 15.4326 8M0.894017 2.47407C0.869719 2.55978 0.851101 2.64703 0.8384 2.73543C0.668 3.95214 0.5 5.21144 0.5 6.49947C0.5 7.7875 0.668 9.04679 0.8384 10.2646C0.91019 10.7612 1.16855 11.2219 1.57179 11.5722C1.97502 11.9226 2.49958 12.1422 3.0608 12.1956C4.22183 12.304 5.41274 12.4159 6.628 12.4688"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.29273 14.4044C9.91462 15.1348 10.9573 15.5 12 15.5C13.0427 15.5 14.0854 15.1348 14.7073 14.4044C15.2344 13.7854 15.5005 12.8937 15.5 11.9991C15.4995 11.1127 15.2371 10.2235 14.7073 9.59382C14.6096 9.47778 14.5029 9.37056 14.3871 9.27379C13.7696 8.75793 12.8848 8.5 12 8.5C11.1152 8.5 10.2305 8.75793 9.61293 9.27379C9.49709 9.37056 9.39037 9.47779 9.29273 9.59382C8.7629 10.2235 8.50053 11.1127 8.5 11.9991C8.49946 12.8937 8.76563 13.7854 9.29273 14.4044Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.2728 12.8182C12.8486 12.8182 12.9096 12.8153 12.5263 12.8096C11.7707 12.7984 11.1354 12.5535 11.0502 12.2394C11.0206 12.1299 11 12.0187 11 11.9061C11 11.7934 11.0206 11.6822 11.0502 11.5727C11.1354 11.2586 11.7707 11.0137 12.5263 11.0025C12.9096 10.9968 12.8486 11.0025 13.2728 11.0025"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.3636 12.1363C12.7402 12.3222 13.0761 12.5702 13.2727 12.8182C13.0761 13.0662 12.7402 13.3141 12.3636 13.5"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface ContentValues {
  senderName: string;
  senderEmail: string;
  domain: string;
  subject: string;
  preHeader: string;
  /** Optional sender fields, each opened from its own "+" button. Kept for the
   *  v1 layout (see CONTENT_LAYOUT_V2) even while it's hidden. */
  replyEnabled: boolean;
  replyEmail: string;
  copyEnabled: boolean;
  copyEmails: string;
  /** Cc/Bcc — the v2 layout's own fields, separate from the v1 ones above. */
  ccEnabled: boolean;
  ccEmails: string;
  bccEnabled: boolean;
  bccEmails: string;
  attachmentsEnabled: boolean;
  attachments: string[];
  /** Saved template picked for this campaign, if any. */
  templateId: number | null;
  starterId: string;
  /** A/B variants — "A" only until the "+" tab adds more. */
  variants: string[];
  activeVariant: string;
  /** % of reach each variant gets. Whatever's left over is the winner send. */
  variantSplit: Record<string, number>;
  /** On = the sentence below picks a winner automatically. */
  decideWinner: boolean;
  winningMetric: "Open" | "Clicks" | "Conversion";
  /** How long the test runs before a winner is picked. */
  testDurationValue: string;
  testDurationUnit: "Hours" | "Days";
}

export const EMPTY_CONTENT: ContentValues = {
  senderName: "",
  senderEmail: "",
  domain: "m3m.in",
  subject: "",
  preHeader: "",
  replyEnabled: false,
  replyEmail: "",
  copyEnabled: false,
  copyEmails: "",
  ccEnabled: false,
  ccEmails: "",
  bccEnabled: false,
  bccEmails: "",
  attachmentsEnabled: false,
  attachments: [],
  templateId: null,
  starterId: "",
  variants: ["A"],
  activeVariant: "A",
  variantSplit: { A: 100 },
  decideWinner: false,
  winningMetric: "Open",
  testDurationValue: "01",
  testDurationUnit: "Hours",
};

/** Verified sending domains on the account. */
const DOMAINS = ["m3m.in", "mailer.m3m.in", "news.m3m.in", "offers.m3m.in"];

/** A/B variants cap out at five (A–E). */
const MAX_VARIANTS = 5;

/** One color per variant letter, for the small badges in User distribution. */
const VARIANT_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: "#2F68E5", text: "#fff" },
  B: { bg: "#7B5CFA", text: "#fff" },
  C: { bg: "#00C48C", text: "#fff" },
  D: { bg: "#FC5E02", text: "#fff" },
  E: { bg: "#F5C542", text: "#17173A" },
};

/** Share held back for the winning variant's send, once that's switched on. */
const WINNER_RESERVE = 20;

/** Splits `total` across `variants`, giving the remainder to the first one so
 *  the pills always add up to a round 100. */
function evenSplit(variants: string[], total: number): Record<string, number> {
  const each = Math.floor(total / variants.length);
  const split: Record<string, number> = {};
  variants.forEach((v, i) => {
    split[v] = i === 0 ? total - each * (variants.length - 1) : each;
  });
  return split;
}

/** Rescales an existing split to a new total, keeping each variant's share of
 *  the test relative to the others. Used when the winner's cut is edited. */
function rescaleSplit(
  variants: string[],
  split: Record<string, number>,
  total: number
): Record<string, number> {
  const current = variants.reduce((sum, v) => sum + (split[v] ?? 0), 0);
  if (current <= 0) return evenSplit(variants, total);
  const next: Record<string, number> = {};
  let assigned = 0;
  variants.forEach((v, i) => {
    if (i === variants.length - 1) {
      next[v] = total - assigned;
      return;
    }
    next[v] = Math.round(((split[v] ?? 0) * total) / current);
    assigned += next[v];
  });
  return next;
}

const DURATION_UNITS = ["Hours", "Days"] as const;
const durationOptionsFor = (unit: string) => {
  const max = unit === "Days" ? 30 : 23;
  return Array.from({ length: max }, (_, i) => String(i + 1).padStart(2, "0"));
};

/** Formats a saved attachment can be, and the size cap on it. */
const ATTACHMENT_ACCEPT = ".csv,.xls,.xlsx,.htm,.html,.pdf,.docx,.jpg,.jpeg,.gif,.png,.ics";

/**
 * Exploring a new take on the Content step's header (From/Cc/Bcc/attachments,
 * then Subject/Pre-header) — the old sender-fields block stays in place below,
 * just not rendered, so flipping this back to false brings it right back.
 */
const CONTENT_LAYOUT_V2 = false;

const PER_PAGE_OPTIONS = [5, 10, 50, 100, 150];
/** Only these page sizes are wired up; the rest are shown but not selectable. */
const PER_PAGE_ENABLED = [5, 10];

/** The three editors either email format leads to, from the "Create new"
 *  menu — same destinations regardless of HTML or AMP. */
const EDITOR_OPTIONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "ai", label: "Create with AI", icon: Sparkles },
  { id: "drag-drop", label: "Drag and drop editor", icon: LayoutGrid },
  { id: "html", label: "Code editor", icon: Code2 },
];

const EMAIL_FORMATS: { id: "html" | "amp"; label: string; icon: LucideIcon }[] = [
  { id: "html", label: "HTML email", icon: Mail },
  { id: "amp", label: "AMP email", icon: Zap },
];

/** App Push's own "Create new" list — flat, no submenu, no icons. The
 *  notification layouts a push message can take, rather than an editor
 *  format/tool choice like Email's two-level menu. */
const APP_PUSH_LAYOUTS: { id: string; label: string }[] = [
  { id: "regular", label: "Regular layout" },
  { id: "overlay-image", label: "Overlay on image" },
  { id: "timer", label: "Timer" },
  { id: "carousel-e2e", label: "Carousel (E2E)" },
  { id: "edge-to-edge", label: "Edge to edge" },
  { id: "rating", label: "Rating" },
  { id: "small-image", label: "Small image" },
  { id: "progress-bar", label: "Progress bar" },
  { id: "multi-icon", label: "Multi-icon" },
  { id: "quick-reply", label: "Quick reply" },
  { id: "product-set", label: "Product set" },
];

type TemplateSourceTab = "library" | "saved" | "folders";

const TEMPLATE_SOURCE_TABS: { id: TemplateSourceTab; label: string }[] = [
  { id: "library", label: "Template gallery" },
  { id: "saved", label: "Saved templates" },
  { id: "folders", label: "Folders" },
];

/** Folders collapse to one row until "View more" is tapped. */
const FOLDERS_COLLAPSED_COUNT = 3;

/** Parked for now: show every folder upfront, without the "View more" toggle. */
const COLLAPSE_FOLDERS = false;

const fieldClass =
  "h-10 w-full rounded-md border border-[#DDE2EE] bg-[#F7F9FC] px-3 font-manrope text-sm text-[#17173A] outline-none transition-colors placeholder:text-[#A0A0A0] focus:border-[#2F68E5] focus:bg-white";

/** A smaller toggle than the shared Switch — matches the compact toggle+text
 *  rows used elsewhere in the wizard (e.g. Audience's "Don't include"). */
function MiniSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <SwitchPrimitives.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="peer inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=checked]:bg-[#00C48C] data-[state=unchecked]:bg-input"
    >
      <SwitchPrimitives.Thumb className="pointer-events-none block h-3 w-3 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitives.Root>
  );
}

/** "Create new" — for Email, a menu button whose two rows (HTML/AMP email)
 *  each open a submenu of the same three editors on hover, flyout-style; for
 *  App Push, a flat list of notification layouts instead — there's no
 *  format/editor choice to make, just which layout the push takes. Portalled
 *  to <body> and positioned by rect, same as this file's other dropdowns —
 *  the accordion's height-animation wrapper clips overflow, which would
 *  otherwise crop the flyout instead of letting it float free. */
function CreateNewMenu({
  onPick,
  channel = "Email",
  tile = false,
}: {
  onPick: (starterId: string) => void;
  channel?: string;
  /** Email's Content section shows "Create a new" as a single HTML tile. */
  tile?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<"html" | "amp" | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        !wrapRef.current?.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
        setHovered(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => wrapRef.current && setRect(wrapRef.current.getBoundingClientRect());
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  const pick = (starterId: string) => {
    onPick(starterId);
    setOpen(false);
    setHovered(null);
  };

  return (
    <div ref={wrapRef} className="relative">
      {tile ? (
        <button
          type="button"
          aria-label="Create a new HTML template"
          onClick={() => setOpen((o) => !o)}
          className="block rounded-[5px] transition-opacity hover:opacity-90"
        >
          <img src="/campaign-assets/email/html-icon.svg" alt="" className="h-[144px] w-[149px]" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="dc-btn dc-btn-secondary"
        >
          <Plus className="size-4" strokeWidth={2.4} />
          Create new
        </button>
      )}
      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: rect.bottom + 4, left: tile ? rect.left : rect.right - 190, width: 190 }}
            className="scroll-slim z-[80] max-h-[280px] overflow-y-auto rounded-md border border-[#DDE2EE] bg-white py-1 shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
          >
            {tile
              ? EDITOR_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => pick(o.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left font-manrope text-sm text-[#17173A] transition-colors hover:bg-[#F7F9FC]"
                  >
                    <o.icon className="size-4 text-[#6F6F8D]" strokeWidth={2} />
                    {o.label}
                  </button>
                ))
              : channel === "Email"
              ? EMAIL_FORMATS.map((fmt) => (
                  <div
                    key={fmt.id}
                    className="relative"
                    onMouseEnter={() => setHovered(fmt.id)}
                    onMouseLeave={() => setHovered((h) => (h === fmt.id ? null : h))}
                  >
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-manrope text-sm transition-colors",
                        hovered === fmt.id
                          ? "bg-[#F4F8FF] text-[#2F68E5]"
                          : "text-[#17173A] hover:bg-[#F7F9FC]"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <fmt.icon className="size-4" strokeWidth={2} />
                        {fmt.label}
                      </span>
                      <ChevronRight className="size-3.5 text-[#8A8AA3]" strokeWidth={2} />
                    </button>
                    {hovered === fmt.id && (
                      <div className="absolute left-full top-0 z-[80] -ml-px w-[190px] rounded-md border border-[#DDE2EE] bg-white py-1 shadow-[0_8px_24px_rgba(23,23,58,0.12)]">
                        {EDITOR_OPTIONS.map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => pick(o.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left font-manrope text-sm text-[#17173A] transition-colors hover:bg-[#F7F9FC]"
                          >
                            <o.icon className="size-4 text-[#6F6F8D]" strokeWidth={2} />
                            {o.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              : APP_PUSH_LAYOUTS.map((layout) => (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => pick(layout.id)}
                    className="flex w-full items-center px-3 py-2 text-left font-manrope text-sm text-[#17173A] transition-colors hover:bg-[#F7F9FC]"
                  >
                    {layout.label}
                  </button>
                ))}
          </div>,
          document.body
        )}
    </div>
  );
}

/** One folder under "Saved templates" — icon, name, counts, and a kebab menu
 *  offering the two things you can do to a folder itself (not what's in it). */
function FolderCard({ folder }: { folder: TemplateFolder }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#DDE2EE] bg-white px-4 py-3 transition-colors hover:border-[#B9C6E4]">
      <img src={folderIcon} alt="" className="size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-manrope text-xs font-semibold text-[#17173A]">{folder.name}</p>
        <p className="mt-0.5 font-manrope text-[11px] text-[#6F6F8D]">
          {folder.templateCount} template{folder.templateCount === 1 ? "" : "s"}, {folder.folderCount}{" "}
          folder{folder.folderCount === 1 ? "" : "s"}
        </p>
      </div>
      <ActionMenu>
        <ActionMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Actions for ${folder.name}`}
            className="grid size-7 shrink-0 place-items-center rounded-md text-[#8A8AA3] transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
          >
            <MoreVertical className="size-4" strokeWidth={2} />
          </button>
        </ActionMenuTrigger>
        <ActionMenuContent
          align="end"
          side="bottom"
          sideOffset={4}
          className="z-[120] w-[148px] gap-0 overflow-hidden rounded-lg border-[#DDE2EE] p-0 shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
        >
          <CardMenuItem icon={FolderInput} onSelect={() => {}}>
            Move
          </CardMenuItem>
          <CardMenuItem icon={Archive} onSelect={() => {}}>
            Archive
          </CardMenuItem>
        </ActionMenuContent>
      </ActionMenu>
    </div>
  );
}

/** Two-way segmented toggle — one bordered pill split into contiguous
 *  segments, active one in brand blue. Same treatment as the audience step's
 *  "Segments/Lists | Conditions | User data table" filter-mode picker, sized
 *  down to h-8 so it sits level with the row of buttons beside it here.
 *  An option with an `icon` renders that glyph instead of its label — the
 *  label still backs the button's accessible name. */
function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: LucideIcon | typeof AppleIcon }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex">
      {options.map((o, i) => {
        const active = value === o.value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            aria-label={Icon ? o.label : undefined}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex h-8 items-center border font-manrope text-sm font-medium transition-colors",
              Icon ? "w-9 justify-center" : "px-3",
              i > 0 && "-ml-px",
              i === 0 && "rounded-l-md",
              i === options.length - 1 && "rounded-r-md",
              active
                ? "relative z-[1] border-[#2F68E5] bg-[#F4F8FF] text-[#2F68E5]"
                : "border-[#DDE2EE] text-[#17173A] hover:bg-[#F7F9FC]"
            )}
          >
            {Icon ? (
              <Icon className={cn("size-4", o.value === "android" && "text-[#78C257]")} />
            ) : (
              o.label
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Replaces the whole "Select a template" picker once one's been picked —
 *  a laptop/mobile preview of the chosen template, plus the three things
 *  you can do with it from here. */
function TemplatePreviewPanel({
  template,
  channel,
  device,
  onDeviceChange,
  theme,
  onThemeChange,
  os,
  onOSChange,
  expanded,
  onExpandedChange,
  onChangeTemplate,
  defaultSubject,
  defaultSenderName,
  defaultDomain,
  testListMode = false,
}: {
  template: EmailTemplate | null;
  channel: string;
  device: "desktop" | "mobile";
  onDeviceChange: (device: "desktop" | "mobile") => void;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
  os: "ios" | "android";
  onOSChange: (os: "ios" | "android") => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onChangeTemplate: () => void;
  /** Pre-filled onto the "Send a test email" drawer — Email only. */
  defaultSubject: string;
  defaultSenderName: string;
  defaultDomain: string;
  /** The audience is a user data table: tests go to an uploaded list. */
  testListMode?: boolean;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendTestOpen, setSendTestOpen] = useState(false);
  const isPush = channel !== "Email";
  // Only templates rendered for every OS/expanded combination carry a real
  // mock for each — everything else still falls back to the one flat image.
  const pushPreviewKey: PushPreviewKey = `${os}-${expanded ? "expanded" : "collapsed"}`;
  const resolvedImage = isPush
    ? template?.pushPreviews?.[pushPreviewKey] ?? template?.image
    : template?.image;

  // Email's chosen-template state follows the Content-section revamp: an "Email
  // body" header with Send test, then one panel — change/edit, device toggle and
  // view options on a toolbar, the template's name and ID, then the template.
  if (!isPush) {
    return (
      <div className="mt-8">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-manrope text-[20px] font-bold leading-7 text-[#222B45]">Email body</h2>
            <p className="font-manrope text-sm font-semibold text-[#6F6F8D]">
              Personalized content leads to better engagement.
            </p>
          </div>
          <button type="button" onClick={() => setSendTestOpen(true)} className="dc-btn dc-btn-secondary">
            <FlaskConical className="size-4" strokeWidth={2} />
            Send test
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#DDE2EE] bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-[#DDE2EE] px-6 py-3">
            <div className="flex items-center gap-4">
              <button type="button" onClick={onChangeTemplate} className="dc-btn dc-btn-secondary">
                <Replace className="size-4" strokeWidth={2} />
                Change template
              </button>
              <button type="button" className="dc-btn dc-btn-secondary">
                <Pencil className="size-4" strokeWidth={2} />
                Edit template
              </button>
            </div>

            <div className="flex overflow-hidden rounded border border-[#DDE2EE]">
              {(
                [
                  { id: "desktop", label: "Desktop preview", Icon: Monitor },
                  { id: "mobile", label: "Mobile preview", Icon: Smartphone },
                ] as const
              ).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-label={label}
                  aria-pressed={device === id}
                  onClick={() => onDeviceChange(id)}
                  className={cn(
                    "grid h-8 w-[34px] place-items-center transition-colors",
                    device === id
                      ? "bg-[var(--btn-primary)] text-white"
                      : "bg-white text-[#8A8AA3] hover:text-[#17173A]"
                  )}
                >
                  <Icon className="size-4" strokeWidth={2} />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-6">
              {["Browser view", "Mobile view"].map((label) => (
                <label key={label} className="flex cursor-pointer items-center gap-2 font-manrope text-sm text-[#6F6F8D]">
                  <input type="checkbox" className="size-4 rounded border-[#DDE2EE] accent-[var(--btn-primary)]" />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="px-6 py-4">
            <p className="font-manrope text-sm text-[#17173A]">
              Template name: <span className="font-bold">{template?.name ?? "—"}</span>
            </p>
            <p className="font-manrope text-sm text-[#17173A]">
              Template ID: <span className="font-bold">{template?.id ?? "—"}</span>
            </p>
          </div>

          <div className="flex justify-center px-6 pb-8">
            <div
              className={cn(
                "max-h-[640px] overflow-y-auto transition-all duration-300 ease-in-out",
                device === "mobile" ? "w-[380px] rounded-lg border border-[#DDE2EE]" : "w-full"
              )}
            >
              {!template ? (
                <div className="grid h-40 place-items-center font-manrope text-sm text-[#6F6F8D]">
                  Template not found.
                </div>
              ) : template.image ? (
                <img src={template.image} alt="" className="block h-auto w-full" />
              ) : (
                <TemplateThumbnail kind={template.preview} />
              )}
            </div>
          </div>
        </div>

        <SendTestMailDrawer
          open={sendTestOpen}
          onClose={() => setSendTestOpen(false)}
          defaultSubject={defaultSubject}
          defaultSenderName={defaultSenderName}
          defaultDomain={defaultDomain}
          testListMode={testListMode}
        />
      </div>
    );
  }

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {isPush ? (
            <>
              <SegmentedTabs
                options={[
                  { value: "ios", label: "iOS", icon: AppleIcon },
                  { value: "android", label: "Android", icon: AndroidIcon },
                ]}
                value={os}
                onChange={onOSChange}
              />
              <SegmentedTabs
                options={[
                  { value: "expanded", label: "Expanded" },
                  { value: "collapsed", label: "Collapsed" },
                ]}
                value={expanded ? "expanded" : "collapsed"}
                onChange={(v) => onExpandedChange(v === "expanded")}
              />
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 rounded-md border border-[#DDE2EE] bg-white p-1">
                <button
                  type="button"
                  aria-label="Desktop preview"
                  aria-pressed={device === "desktop"}
                  onClick={() => onDeviceChange("desktop")}
                  className={cn(
                    "grid size-8 place-items-center rounded-md transition-colors",
                    device === "desktop"
                      ? "bg-[#F0F3F9] text-[#17173A]"
                      : "text-[#8A8AA3] hover:text-[#17173A]"
                  )}
                >
                  <Monitor className="size-4" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  aria-label="Mobile preview"
                  aria-pressed={device === "mobile"}
                  onClick={() => onDeviceChange("mobile")}
                  className={cn(
                    "grid size-8 place-items-center rounded-md transition-colors",
                    device === "mobile"
                      ? "bg-[#F0F3F9] text-[#17173A]"
                      : "text-[#8A8AA3] hover:text-[#17173A]"
                  )}
                >
                  <Smartphone className="size-4" strokeWidth={2} />
                </button>
              </div>

              <div className="rounded-md border border-[#DDE2EE] bg-white p-1">
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={theme === "dark" ? "View template in light mode" : "View template in dark mode"}
                        aria-pressed={theme === "dark"}
                        onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
                        className="grid size-8 place-items-center rounded-md text-[#8A8AA3] transition-colors hover:text-[#17173A]"
                      >
                        {theme === "dark" ? (
                          <Sun className="size-4" strokeWidth={2} />
                        ) : (
                          <Moon className="size-4" strokeWidth={2} />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      sideOffset={8}
                      className="overflow-visible rounded-lg border-0 bg-black px-3 py-2.5 text-white shadow-none"
                    >
                      <p className="font-manrope text-xs leading-[18px]">
                        {theme === "dark" ? "View template in light mode" : "View template in dark mode"}
                      </p>
                      <TooltipPrimitive.Arrow className="fill-black" width={10} height={6} />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="flex h-8 items-center gap-2 rounded-lg border border-[#e3e3e3] bg-white px-3 font-manrope text-sm font-medium tracking-[0.4px] text-[#6f6f8d] transition-colors hover:bg-[#f8f8f8]"
          >
            <Eye className="size-4" strokeWidth={2} />
            Preview as
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isPush) setSendTestOpen(true);
            }}
            className="flex h-8 items-center gap-2 rounded-lg border border-[#e3e3e3] bg-white px-3 font-manrope text-sm font-medium tracking-[0.4px] text-[#6f6f8d] transition-colors hover:bg-[#f8f8f8]"
          >
            <FlaskConical className="size-4" strokeWidth={2} />
            {isPush ? "Send test notification" : "Send a test email"}
          </button>
          {/* Edit + the kebab's one action (Change template) as a single grouped
              control — same visual weight as the standalone buttons beside it,
              but the two things you'd do to the template itself share one pill. */}
          <div className="flex h-8 items-center overflow-hidden rounded-lg border border-[#e3e3e3] bg-white">
            <button
              type="button"
              className="flex h-full items-center gap-2 px-3 font-manrope text-sm font-medium tracking-[0.4px] text-[#6f6f8d] transition-colors hover:bg-[#f8f8f8]"
            >
              <Pencil className="size-4" strokeWidth={2} />
              Edit
            </button>
            <span className="h-4 w-px shrink-0 bg-[#e3e3e3]" />
            <ActionMenu>
              <ActionMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="More template actions"
                  className="grid h-full w-8 shrink-0 place-items-center text-[#6f6f8d] transition-colors hover:bg-[#f8f8f8]"
                >
                  <MoreVertical className="size-4" strokeWidth={2} />
                </button>
              </ActionMenuTrigger>
              <ActionMenuContent
                align="end"
                side="bottom"
                sideOffset={4}
                className="z-[120] w-[200px] gap-0 overflow-hidden rounded-lg border-[#DDE2EE] p-0 shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
              >
                <CardMenuItem icon={Copy} onSelect={() => {}}>
                  Edit a copy instead
                </CardMenuItem>
                <CardMenuItem icon={Replace} onSelect={onChangeTemplate}>
                  Change template
                </CardMenuItem>
              </ActionMenuContent>
            </ActionMenu>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "flex justify-center rounded-xl border p-8 transition-colors duration-300",
          !isPush && theme === "dark" ? "border-[#2A2F3E] bg-[#12141C]" : "border-[#DDE2EE] bg-[#F7F9FC]"
        )}
      >
        <div
          className={cn(
            "overflow-hidden rounded-lg transition-all duration-300 ease-in-out",
            !isPush && "border shadow-[0_8px_24px_rgba(23,23,58,0.08)]",
            isPush
              ? ""
              : theme === "dark"
                ? "border-[#2A2F3E] bg-[#1B1E29]"
                : "border-[#DDE2EE] bg-white",
            isPush ? "w-[320px]" : device === "mobile" ? "w-[380px]" : "w-[900px]"
          )}
        >
          {/* Push's own phone mock already draws its status bar and notch —
              this toolbar strip is only for email's browser-chrome illusion. */}
          {!isPush && (
            <div
              className={cn(
                "h-9 border-b transition-colors duration-300",
                theme === "dark" ? "border-[#2A2F3E] bg-[#1B1E29]" : "border-[#EEF1F7] bg-[#F7F9FC]"
              )}
            />
          )}
          {/* Email's frame is a fixed viewport shorter than the template, so it
              scrolls to reveal the rest. Push's own mock is shown in full —
              one fixed box for both expanded and collapsed, the image scaled
              to fit inside it rather than cropped. */}
          <div
            className={cn(
              "transition-all duration-300 ease-in-out",
              isPush ? "flex items-center justify-center overflow-hidden" : "overflow-y-auto",
              !isPush && (theme === "dark" ? "bg-[#1B1E29]" : "bg-white"),
              isPush ? "h-[540px]" : device === "desktop" ? "h-[560px]" : "h-[640px]"
            )}
          >
            {!template ? (
              <div className="grid h-full place-items-center font-manrope text-sm text-[#6F6F8D]">
                Template not found.
              </div>
            ) : resolvedImage ? (
              <img
                src={resolvedImage}
                alt=""
                className={isPush ? "h-full w-full object-contain" : "block h-auto w-full"}
              />
            ) : (
              <TemplateThumbnail kind={template.preview} />
            )}
          </div>
        </div>
      </div>

      {previewOpen && (
        <TemplatePreviewOverlay
          template={template}
          channel={channel}
          initialOS={os}
          initialExpanded={expanded}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {!isPush && (
        <SendTestMailDrawer
          open={sendTestOpen}
          onClose={() => setSendTestOpen(false)}
          defaultSubject={defaultSubject}
          defaultSenderName={defaultSenderName}
          defaultDomain={defaultDomain}
          testListMode={testListMode}
        />
      )}
    </div>
  );
}

/** Our own styled dropdown — a trigger button plus a floating option list —
 *  in place of a native <select>, for the variant test-settings fields. */
function Dropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!wrapRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Some triggers sit inside the accordion's height-animating panel, which
  // clips overflow — so the option list is portalled to <body> and kept in
  // sync with the trigger's live position instead of relying on normal-flow
  // absolute positioning (which that ancestor would crop).
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => wrapRef.current && setRect(wrapRef.current.getBoundingClientRect());
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-white px-3 font-manrope text-sm text-[#17173A] outline-none transition-colors",
          open ? "border-[#2F68E5]" : "border-[#DDE2EE]"
        )}
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-[#8A8AA3] transition-transform", open && "rotate-180")}
          strokeWidth={2}
        />
      </button>
      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: rect.bottom + 4, left: rect.left, width: rect.width }}
            className="scroll-slim fixed z-[80] max-h-[240px] overflow-y-auto rounded-md border border-[#DDE2EE] bg-white py-1 shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
          >
            {options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full whitespace-nowrap px-3 py-2 text-left font-manrope text-sm transition-colors",
                  o === value ? "bg-[#F4F8FF] font-semibold text-[#2F68E5]" : "text-[#17173A] hover:bg-[#F7F9FC]"
                )}
              >
                {o}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

function InfoDot({ label }: { label: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="More information"
            className="inline-grid shrink-0 place-items-center text-[#8A8AA3] transition-colors hover:text-[#6F6F8D]"
          >
            <Info className="size-4" strokeWidth={2} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          sideOffset={8}
          className="max-w-[260px] overflow-visible rounded-lg border-0 bg-black px-3 py-2.5 text-white shadow-none"
        >
          <p className="font-manrope text-xs leading-[18px]">{label}</p>
          <TooltipPrimitive.Arrow className="fill-black" width={10} height={6} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function Field({
  label,
  required,
  info,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  info?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center gap-1.5">
        <label className="font-manrope text-sm font-semibold text-[#17173A]">
          {label}
          {required && <span className="ml-0.5 text-[#FC5E02]">*</span>}
        </label>
        {info && <InfoDot label={info} />}
      </div>
      {children}
    </div>
  );
}

/** A borderless field styled as a single line — label, then the field, then
 *  whatever's trailing on that row. Full-width rows separated by hairlines,
 *  the way a mail composer lays out From/Cc/Bcc/Subject rather than a form. */
function FieldRow({
  label,
  required,
  info,
  trailing,
  children,
}: {
  label: string;
  required?: boolean;
  info?: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-[#E8ECF4] py-3">
      <span className="w-20 shrink-0 font-manrope text-sm font-semibold text-[#17173A]">
        {label}
        {required && <span className="ml-0.5 text-[#FC5E02]">*</span>}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
      {info && <InfoDot label={info} />}
      {trailing}
    </div>
  );
}

/** Plain text styling for a FieldRow's own input — no box, the row's own
 *  bottom hairline is the only separator. */
const lineInputClass =
  "min-w-0 flex-1 bg-transparent font-manrope text-sm text-[#17173A] outline-none placeholder:text-[#A0A0A0]";

/** One variant's tab — its own label to select it, plus (once a second
 *  variant exists) a kebab menu to copy or delete it. */
function VariantTab({
  letter,
  active,
  showMenu,
  onSelect,
  onCopy,
  onDelete,
}: {
  letter: string;
  active: boolean;
  showMenu: boolean;
  onSelect: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative flex h-9 items-stretch rounded-md transition-colors",
        active ? "bg-[#2F68E5] text-white" : "border border-[#DDE2EE] bg-white text-[#17173A]"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "rounded-l-md px-4 font-manrope text-xs font-bold uppercase tracking-[0.4px] transition-colors",
          !showMenu && "rounded-r-md",
          !active && "hover:bg-[#F7F9FC]"
        )}
      >
        Variant {letter}
      </button>
      {showMenu && (
        <>
          <button
            type="button"
            aria-label={`Variant ${letter} options`}
            onClick={() => setMenuOpen((o) => !o)}
            className={cn(
              "grid w-7 shrink-0 place-items-center rounded-r-md transition-colors",
              active ? "hover:bg-white/15" : "hover:bg-[#F7F9FC]"
            )}
          >
            <MoreVertical className="size-4" strokeWidth={2.2} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-md border border-[#DDE2EE] bg-white py-1 shadow-[0_8px_24px_rgba(23,23,58,0.12)]">
              <button
                type="button"
                onClick={() => {
                  onCopy();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center justify-between border-l-2 border-transparent px-3 py-2 text-left font-manrope text-sm text-[#17173A] transition-colors hover:border-[#2F68E5] hover:bg-[#F4F8FF]"
              >
                Copy
                <Copy className="size-4 text-[#8A8AA3]" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center justify-between border-l-2 border-transparent px-3 py-2 text-left font-manrope text-sm text-[#17173A] transition-colors hover:border-[#2F68E5] hover:bg-[#F4F8FF]"
              >
                Delete
                <Trash2 className="size-4 text-[#8A8AA3]" strokeWidth={2} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Test allocation opens in its own right-side drawer instead of expanding
 *  inline — the split/winner controls need more breathing room than an
 *  accordion squeezed between the variant tabs and the From field. Mirrors
 *  CampaignSettingsDrawer's slide-in treatment. */
function TestAllocationDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          shown ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative flex h-full w-full max-w-[600px] flex-col bg-white shadow-[-20px_0_60px_rgba(23,23,58,0.15)] transition-transform duration-300 ease-out",
          shown ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-[#DDE2EE] px-6 py-5">
          <h2 className="font-manrope text-lg font-bold text-[#17173A]">Test allocation</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-[#8A8AA3] transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}

/** The "+ REPLY EMAIL ID" row under the sender fields — each opens one field. */
function AddButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = active ? X : Plus;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1 rounded-[4px] border px-3.5 font-manrope text-sm font-semibold uppercase tracking-[0.42px] transition-colors",
        active
          ? "border-[#2F68E5] bg-[#F4F8FF] text-[#2F68E5]"
          : "border-[#DDE2EE] bg-white text-[#6F6F8D] hover:bg-[#F7F9FC] hover:text-[#17173A]"
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.4} />
      {label}
    </button>
  );
}

/** The attachment picker — a paperclip icon that opens this, and shows a green
 *  tick once something's saved. One file, per the reference. */
function AttachmentsModal({
  open,
  initial,
  onCancel,
  onSave,
}: {
  open: boolean;
  initial: string | null;
  onCancel: () => void;
  onSave: (fileName: string | null) => void;
}) {
  const [fileName, setFileName] = useState(initial);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // The component stays mounted (it just renders null) between opens, so the
  // draft has to be reset from the saved value on each open — otherwise a
  // cancelled draft would still be sitting there next time.
  useEffect(() => {
    if (open) setFileName(initial);
  }, [open, initial]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-[520px] rounded-lg bg-white p-6 shadow-[0_20px_60px_rgba(23,23,58,0.25)]">
        <div className="flex items-start justify-between">
          <h2 className="font-manrope text-xl font-bold text-[#17173A]">Attachments</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            className="grid size-8 place-items-center rounded-full text-[#8A8AA3] hover:bg-[#F0F3F9] hover:text-[#17173A]"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>
        <p className="mt-1 font-manrope text-sm text-[#6F6F8D]">You can add upto 1 attachments</p>

        <div className="mt-5 rounded-lg border border-[#DDE2EE] p-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) setFileName(f.name);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed px-6 py-10 text-center transition-colors sm:flex-row",
              dragOver ? "border-[#2F68E5] bg-[#F4F8FF]" : "border-[#C3CAD9] bg-white"
            )}
          >
            <span className="font-manrope text-sm font-bold uppercase tracking-[0.4px] text-[#6F6F8D]">
              Drag &amp; drop
            </span>
            <span className="font-manrope text-sm font-bold text-[#6F6F8D]">OR</span>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#DDE2EE] bg-white px-3 font-manrope text-[12px] font-bold uppercase tracking-[0.4px] text-[#17173A] transition-colors hover:bg-[#F7F9FC]"
            >
              <Upload className="size-4" strokeWidth={2.2} />
              Click to upload
            </button>
            <input
              ref={inputRef}
              type="file"
              accept={ATTACHMENT_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFileName(f.name);
              }}
            />
          </div>
          {fileName && (
            <div className="mt-3 flex items-center justify-between rounded-md bg-[#F7F9FC] px-3 py-2">
              <span className="min-w-0 truncate font-manrope text-sm text-[#17173A]">
                {fileName}
              </span>
              <button
                type="button"
                aria-label="Remove file"
                onClick={() => setFileName(null)}
                className="grid size-5 shrink-0 place-items-center rounded-full text-[#8A8AA3] hover:bg-[#E8ECF4] hover:text-[#17173A]"
              >
                <X className="size-3.5" strokeWidth={2.4} />
              </button>
            </div>
          )}
          <p className="mt-3 font-manrope text-xs leading-[18px] text-[#8A8AA3]">
            Supported formats csv, xls, xlsx, htm, html, pdf, docx, jpg, jpeg, gif, png and ics
            with the maximum file size of 1024 KB
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 items-center rounded-md border border-[#2F68E5] px-5 font-manrope text-sm font-bold uppercase tracking-[0.4px] text-[#2F68E5] transition-colors hover:bg-[#F4F8FF]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(fileName)}
            className="inline-flex h-10 items-center rounded-md bg-[#2F68E5] px-5 font-manrope text-sm font-bold uppercase tracking-[0.4px] text-white transition-colors hover:bg-[#255ad2]"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Inboxes the account can reply from — stand-in for real mailbox config. */
const REPLY_TO_EMAIL_OPTIONS = [
  "yogesh.badgujar@pranaglow.com",
  "suhesh.patil@pranaglow.com",
  "sarvesh.mahashabde@pranaglow.com",
  "prashant.pawar@pranaglow.com",
  "jaideep.jambhale@pranaglow.com",
  "abhaykant.nirala@pranaglow.com",
];

/** Single-select for the reply-to modal — a combobox: the trigger becomes a
 *  live search field once open, and typing something that matches nothing
 *  offers to add it as a new reply-to address. Portalled at z-[95] since it
 *  opens from inside a z-[90] modal rather than the accordion. */
function ReplyToSelect({
  value,
  onChange,
  extraOptions,
  onCreate,
}: {
  value: string;
  onChange: (v: string) => void;
  /** Addresses created earlier in this session, offered alongside the fixed list. */
  extraOptions: string[];
  onCreate: (email: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!wrapRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => wrapRef.current && setRect(wrapRef.current.getBoundingClientRect());
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  const openWithSearch = () => {
    setQuery("");
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const pick = (email: string) => {
    onChange(email);
    setOpen(false);
    setQuery("");
  };

  const allOptions = [...REPLY_TO_EMAIL_OPTIONS, ...extraOptions];
  const q = query.trim();
  const matches = q ? allOptions.filter((o) => o.toLowerCase().includes(q.toLowerCase())) : allOptions;
  const exactMatch = allOptions.some((o) => o.toLowerCase() === q.toLowerCase());
  const canCreate = q.length > 0 && !exactMatch;

  return (
    <div ref={wrapRef} className="relative w-full">
      {open ? (
        <div className="flex h-10 w-full items-center gap-2 rounded-md border border-[#2F68E5] bg-white px-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Select email ID"
            className="min-w-0 flex-1 bg-transparent font-manrope text-sm text-[#17173A] outline-none placeholder:text-[#A0A0A0]"
          />
          <Search className="size-4 shrink-0 text-[#8A8AA3]" strokeWidth={2} />
        </div>
      ) : (
        <button
          type="button"
          onClick={openWithSearch}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-white px-3 font-manrope text-sm outline-none transition-colors",
            "border-[#DDE2EE]",
            value ? "text-[#17173A]" : "text-[#A0A0A0]"
          )}
        >
          <span className="truncate">{value || "Select email ID"}</span>
          <ChevronDown className="size-4 shrink-0 text-[#8A8AA3]" strokeWidth={2} />
        </button>
      )}
      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width }}
            className="scroll-slim z-[95] max-h-[280px] overflow-y-auto rounded-md border border-[#DDE2EE] bg-white py-1 shadow-[0_8px_24px_rgba(23,23,58,0.12)]"
          >
            {matches.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => pick(o)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-manrope text-sm transition-colors",
                  o === value
                    ? "bg-[#F4F8FF] font-semibold text-[#2F68E5]"
                    : "text-[#17173A] hover:bg-[#F7F9FC]"
                )}
              >
                <span className="truncate">{o}</span>
                {o === value && <Check className="size-4 shrink-0" strokeWidth={2.4} />}
              </button>
            ))}
            {matches.length === 0 && !canCreate && (
              <p className="px-3 py-4 text-center font-manrope text-[13px] text-[#6F6F8D]">
                No email ID matches that.
              </p>
            )}
            {canCreate && (
              <button
                type="button"
                onClick={() => {
                  onCreate(q);
                  pick(q);
                }}
                className="flex w-full items-center gap-1.5 px-3 py-2 text-left font-manrope text-sm font-semibold text-[#2F68E5] transition-colors hover:bg-[#F4F8FF]"
              >
                <Plus className="size-4 shrink-0" strokeWidth={2.4} />
                <span className="truncate">Create '{q}'</span>
              </button>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

/** Pop-up for picking which inbox replies to this campaign land in — one at a
 *  time, reached from the From row's reply-to icon. */
function ReplyToEmailModal({
  open,
  initial,
  extraOptions,
  onCreate,
  onCancel,
  onSave,
}: {
  open: boolean;
  initial: string;
  extraOptions: string[];
  onCreate: (email: string) => void;
  onCancel: () => void;
  onSave: (email: string) => void;
}) {
  const [selected, setSelected] = useState(initial);

  // Stays mounted between opens (renders null while closed), so the draft
  // has to be reset from the saved value each time — otherwise a cancelled
  // pick would still be sitting there next open.
  useEffect(() => {
    if (open) setSelected(initial);
  }, [open, initial]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-[440px] rounded-lg bg-white p-6 shadow-[0_20px_60px_rgba(23,23,58,0.25)]">
        <div className="flex items-start justify-between">
          <h2 className="font-manrope text-xl font-bold text-[#17173A]">Reply-to email ID</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            className="grid size-8 place-items-center rounded-full text-[#8A8AA3] hover:bg-[#F0F3F9] hover:text-[#17173A]"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>
        <p className="mt-1 font-manrope text-sm text-[#6F6F8D]">
          Replies to this campaign land in the inbox you pick here.
        </p>

        <div className="mt-5">
          <label className="mb-1.5 block font-manrope text-sm font-semibold text-[#17173A]">
            Email ID
          </label>
          <ReplyToSelect
            value={selected}
            onChange={setSelected}
            extraOptions={extraOptions}
            onCreate={onCreate}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 items-center rounded-md border border-[#2F68E5] px-5 font-manrope text-sm font-bold uppercase tracking-[0.4px] text-[#2F68E5] transition-colors hover:bg-[#F4F8FF]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => onSave(selected)}
            className="inline-flex h-10 items-center rounded-md bg-[#2F68E5] px-5 font-manrope text-sm font-bold uppercase tracking-[0.4px] text-white transition-colors enabled:hover:bg-[#255ad2] disabled:cursor-not-allowed disabled:bg-[#C3CAD9]"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Pools the Subject/Pre-header sparkle draws from — three shown at a time. */
const SUBJECT_SUGGESTIONS = [
  "Your exclusive invite is here!",
  "Check out what's in your cart",
  "Shop the latest styles today",
  "Don't miss this weekend's drop",
  "A little something just for you",
  "Your favourites are back in stock",
];
const PREHEADER_SUGGESTIONS = [
  "Open now for early access",
  "Free shipping on orders over ₹999",
  "Limited stock — shop before it's gone",
  "Handpicked picks, just for you",
  "Exclusive deals inside",
  "Offer ends soon — don't wait",
];

/** Swapped in for a campaign the AI drafted end-to-end — on-theme with the
 *  free-shipping win-back goal it was generated for, rather than the
 *  generic pool above. */
const AI_GENERATED_SUBJECT_SUGGESTIONS = [
  "Your picks are waiting for you 🛍️",
  "Free shipping, just for you",
  "Your next favorite is still waiting 💫",
];
const AI_GENERATED_PREHEADER_SUGGESTIONS = [
  "Complete your purchase with free shipping. ✨",
  "That product you loved is still waiting. 💙",
  "Enjoy free shipping and make it yours today.",
];

/** Collapsible wrapper, same accordion the setup and audience steps use. */
function Reveal({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className="t-acc" data-open={open ? "true" : "false"}>
      <div className="t-acc-panel">
        <div className="t-acc-panel-inner">
          <div className="pt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Pager({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
}) {
  // A window of five around the current page, so long lists don't spill.
  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  const pages = Array.from({ length: Math.min(5, pageCount) }, (_, i) => start + i);

  const arrow = (label: string, Icon: LucideIcon, to: number, disabled: boolean) => (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => onPage(to)}
      className={cn(
        "grid h-full w-5 place-items-center",
        disabled ? "text-[#C3CAD9]" : "text-[#6F6F8D] hover:text-[#17173A]"
      )}
    >
      <Icon className="h-[15px] w-[15px]" strokeWidth={2} />
    </button>
  );

  return (
    <div className="flex h-10 items-center gap-1 rounded-[5px] border border-[#DDE2EE] bg-white px-2.5">
      {arrow("First page", ChevronsLeft, 1, page === 1)}
      {arrow("Previous page", ChevronLeft, page - 1, page === 1)}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPage(p)}
          aria-current={p === page ? "page" : undefined}
          className="relative grid h-full w-8 place-items-center font-manrope text-sm tracking-[0.29px]"
        >
          <span className={p === page ? "text-[#2F68E5]" : "text-[#6F6F8D]"}>{p}</span>
          {p === page && (
            <span className="absolute bottom-1 h-[3px] w-[22px] rounded-[1.5px] bg-[#2F68E5]" />
          )}
        </button>
      ))}
      {arrow("Next page", ChevronRight, page + 1, page === pageCount)}
      {arrow("Last page", ChevronsRight, pageCount, page === pageCount)}
    </div>
  );
}


/**
 * Content step — who the email comes from, what it says on the tin, and which
 * template carries it. Sender details sit above the picker because the subject
 * line is what a template gets chosen against, not the other way round.
 */
export default function CampaignContentStep({
  values,
  onChange,
  highlight,
  reach = 0,
  aiGenerated = false,
  channel = "Email",
  hasTargetApps = true,
  audienceMode,
}: {
  values: ContentValues;
  onChange: (patch: Partial<ContentValues>) => void;
  /** Field keys just written by a co-marketer apply — briefly flashed. */
  highlight?: Partial<Record<keyof ContentValues, boolean>>;
  /** Audience reach — the base the variant test's "Est. profiles" is drawn from. */
  reach?: number;
  /** Swaps the Subject/Pre-header AI suggestions for ones on-theme with the
   *  goal this campaign was drafted from. */
  aiGenerated?: boolean;
  /** From/Subject/Pre-header are email-specific header fields — every other
   *  channel skips straight to the rest of the step. */
  channel?: string;
  /** Whether the Send to step's "Target app(s)" field has a selection yet —
   *  push channels can't use or create a template until it does. */
  hasTargetApps?: boolean;
  /** Audience selection mode — "table" switches Send test to an uploaded list. */
  audienceMode?: string;
}) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [perPageOpen, setPerPageOpen] = useState(false);
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [replyToModalOpen, setReplyToModalOpen] = useState(false);
  // Addresses added via "Create" in the reply-to picker — kept for the rest
  // of this session so a re-opened picker still offers them.
  const [customReplyEmails, setCustomReplyEmails] = useState<string[]>([]);
  const [sourceTab, setSourceTab] = useState<TemplateSourceTab>("saved");
  const [foldersExpanded, setFoldersExpanded] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("mobile");
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("light");
  // Push has no desktop rendering and no light/dark chrome — instead the
  // preview's own toggles are the OS it's mocked up for and whether the
  // notification is shown expanded or collapsed.
  const [previewOS, setPreviewOS] = useState<"ios" | "android">("ios");
  const [previewExpanded, setPreviewExpanded] = useState(true);
  // Test settings sit right under the variant tabs once there's a real test
  // to configure — closed by default so a fresh A/B test doesn't dump the
  // whole split/winner panel on the user immediately.
  const [testAllocationOpen, setTestAllocationOpen] = useState(false);
  const [blockedActionToast, setBlockedActionToast] = useState<string | null>(null);
  // Carousel (E2E) opens as its own full-screen overlay rather than inline —
  // tracked separately from starterId so closing it can either keep the
  // configuration (Use) or discard it (X) without the overlay popping back
  // open on its own.
  const [carouselEditorOpen, setCarouselEditorOpen] = useState(false);

  const requireTargetApp = (action: "use" | "create") => {
    if (channel === "Email" || hasTargetApps) return false;
    setBlockedActionToast(
      action === "use"
        ? "Select a target app to use a template."
        : "Select a target app to create a template."
    );
    return true;
  };

  // App Push has its own small saved-template set — a different channel
  // entirely, so it never shows email templates or vice versa.
  const templatePool = channel === "Email" ? emailTemplates : appPushTemplates;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templatePool;
    return templatePool.filter(
      (t) => t.name.toLowerCase().includes(q) || String(t.id).includes(q)
    );
  }, [query, templatePool]);

  const pageCount = Math.max(1, Math.ceil(matches.length / perPage));
  const current = Math.min(page, pageCount);
  const shown = matches.slice((current - 1) * perPage, current * perPage);
  const extrasOpen = values.replyEnabled || values.copyEnabled || values.attachmentsEnabled;
  const selectedTemplate =
    [...emailTemplates, ...templateLibrary, ...appPushTemplates].find(
      (t) => t.id === values.templateId
    ) ?? null;

  const nextUnusedLetter = (variants: string[]) => {
    for (let i = 0; i < MAX_VARIANTS; i++) {
      const letter = String.fromCharCode(65 + i);
      if (!variants.includes(letter)) return letter;
    }
    return null;
  };

  const variantTotal = values.variants.reduce((sum, v) => sum + (values.variantSplit[v] ?? 0), 0);
  const winnerShare = Math.max(0, 100 - variantTotal);
  // What the variants have to share between them. Once a winner send is in
  // play that's whatever it isn't holding, so re-splitting keeps its cut.
  const testPot = values.decideWinner ? Math.min(100, variantTotal) : 100;

  const splitEvenly = () => onChange({ variantSplit: evenSplit(values.variants, testPot) });

  const setVariantShare = (letter: string, next: number) =>
    onChange({
      variantSplit: {
        ...values.variantSplit,
        [letter]: Math.min(100, Math.max(0, next)),
      },
    });

  // The winner's cut is whatever the variants leave behind, so editing it
  // rescales them — their shares of the test stay in the same proportion.
  const setWinnerShare = (next: number) =>
    onChange({
      variantSplit: rescaleSplit(
        values.variants,
        values.variantSplit,
        100 - Math.min(100, Math.max(0, next))
      ),
    });

  const addVariant = () => {
    if (values.variants.length >= MAX_VARIANTS) return;
    const nextLetter = nextUnusedLetter(values.variants);
    if (!nextLetter) return;
    const nextVariants = [...values.variants, nextLetter];
    onChange({
      variants: nextVariants,
      activeVariant: nextLetter,
      variantSplit: evenSplit(nextVariants, testPot),
    });
  };

  const copyVariant = addVariant;

  const deleteVariant = (letter: string) => {
    if (values.variants.length <= 1) return;
    const nextVariants = values.variants.filter((v) => v !== letter);
    onChange({
      variants: nextVariants,
      activeVariant: values.activeVariant === letter ? nextVariants[0] : values.activeVariant,
      variantSplit: evenSplit(nextVariants, testPot),
    });
  };

  const toggleDecideWinner = (on: boolean) =>
    onChange({
      decideWinner: on,
      variantSplit: evenSplit(values.variants, on ? 100 - WINNER_RESERVE : 100),
    });

  return (
    <StepCard
      full
      {...(CONTENT_LAYOUT_V2
        ? {}
        : {
            title: "Sender details",
            description: "Define sender details to be used for sending the email",
          })}
    >
      {blockedActionToast && (
        <ErrorToast message={blockedActionToast} onDismiss={() => setBlockedActionToast(null)} />
      )}
      {CONTENT_LAYOUT_V2 ? (
        <>
          {(() => {
            // Bcc and the attachment icon stay pinned to the From row no
            // matter what — only the Cc toggle itself leaves it, once Cc has
            // opened its own row underneath.
            const ccToggle = !values.ccEnabled && (
              <button
                type="button"
                onClick={() => onChange({ ccEnabled: true })}
                className="font-manrope text-sm font-medium text-[#6F6F8D] transition-colors hover:text-[#17173A]"
              >
                Cc
              </button>
            );
            const bccToggle = !values.bccEnabled && (
              <button
                type="button"
                onClick={() => onChange({ bccEnabled: true })}
                className="font-manrope text-sm font-medium text-[#6F6F8D] transition-colors hover:text-[#17173A]"
              >
                Bcc
              </button>
            );
            const attachmentButton = (
              <button
                type="button"
                aria-label="Add attachments"
                onClick={() => setAttachModalOpen(true)}
                className="relative grid size-7 place-items-center rounded-md text-[#6F6F8D] transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
              >
                <Paperclip className="size-4" strokeWidth={2} />
                {values.attachments.length > 0 && (
                  <span className="absolute -right-1 -top-1 grid size-3.5 place-items-center rounded-full bg-[#00C48C] text-white">
                    <Check className="size-2" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
            const replyToButton = (
              <button
                type="button"
                aria-label="Reply-to email ID"
                onClick={() => setReplyToModalOpen(true)}
                className="relative grid size-7 place-items-center rounded-md text-[#6F6F8D] transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
              >
                <ReplyEmailIcon className="size-4" />
                {values.replyEmail && (
                  <span className="absolute -right-1 -top-1 grid size-3.5 place-items-center rounded-full bg-[#00C48C] text-white">
                    <Check className="size-2" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
            const removeButton = (label: string, onRemove: () => void) => (
              <button
                type="button"
                aria-label={`Remove ${label}`}
                onClick={onRemove}
                className="grid size-5 place-items-center rounded-full text-[#8A8AA3] hover:bg-[#F0F3F9] hover:text-[#17173A]"
              >
                <X className="size-3.5" strokeWidth={2.4} />
              </button>
            );

            const fromTrailing = (
              <div className="ml-auto flex shrink-0 items-center gap-4">
                {ccToggle}
                {bccToggle}
                {attachmentButton}
                {replyToButton}
              </div>
            );
            const ccTrailing = removeButton("Cc", () => onChange({ ccEnabled: false }));
            const bccTrailing = removeButton("Bcc", () => onChange({ bccEnabled: false }));

            return (
              <div>
                <div className="mb-5 flex items-center gap-2">
                  {values.variants.length === 1 ? (
                    // Nothing to compare yet with just "A" — offer to start the
                    // test instead of a lone, unlabelled tab. Starting it adds
                    // "B" straight onto the shared content fields, so it opens
                    // already holding what "A" has.
                    <button
                      type="button"
                      onClick={addVariant}
                      className="dc-btn dc-btn-secondary"
                    >
                      <SplitSquareHorizontal className="size-4" strokeWidth={2} />
                      Create A/B test
                    </button>
                  ) : (
                    <>
                      {values.variants.map((v) => (
                        <VariantTab
                          key={v}
                          letter={v}
                          active={values.activeVariant === v}
                          showMenu={values.variants.length > 1}
                          onSelect={() => onChange({ activeVariant: v })}
                          onCopy={() => copyVariant()}
                          onDelete={() => deleteVariant(v)}
                        />
                      ))}
                      {values.variants.length < MAX_VARIANTS && (
                        <TooltipProvider delayDuration={150}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label="Add variant"
                                onClick={addVariant}
                                className="grid size-9 shrink-0 place-items-center rounded border border-[#DDE2EE] text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
                              >
                                <Plus className="size-4" strokeWidth={2.4} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              sideOffset={8}
                              className="overflow-visible rounded-lg border-0 bg-black px-3 py-2.5 text-white shadow-none"
                            >
                              <p className="font-manrope text-xs leading-[18px]">Add variant</p>
                              <TooltipPrimitive.Arrow className="fill-black" width={10} height={6} />
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </>
                  )}

                  {values.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setTestAllocationOpen(true)}
                      className="ml-auto flex h-9 items-center rounded-md border border-[#DDE2EE] bg-white px-3 font-manrope text-sm font-semibold text-[#17173A] transition-colors hover:bg-[#F7F9FC]"
                    >
                      Test allocation
                    </button>
                  )}
                </div>

                {values.variants.length > 1 && (
                  <TestAllocationDrawer
                    open={testAllocationOpen}
                    onClose={() => setTestAllocationOpen(false)}
                  >
                    <div>
                      <p className="font-manrope text-sm font-semibold text-[#17173A]">
                        User distribution
                      </p>
                      <p className="mt-0.5 font-manrope text-xs text-[#6F6F8D]">
                        Set the percentage of users for each variant.
                      </p>

                      <div className="mt-4 flex flex-col items-start gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                          {values.variants.map((v) => {
                            const color = VARIANT_COLORS[v] ?? VARIANT_COLORS.A;
                            return (
                              <label
                                key={v}
                                className="flex h-11 cursor-text items-center gap-2 rounded-full border border-[#DDE2EE] bg-white py-1 pl-1 pr-4 transition-colors focus-within:border-[#2F68E5]"
                              >
                                <span
                                  className="grid size-8 shrink-0 place-items-center rounded-full font-manrope text-xs font-bold"
                                  style={{ background: color.bg, color: color.text }}
                                >
                                  {v}
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  aria-label={`Percentage for variant ${v}`}
                                  value={values.variantSplit[v] ?? 0}
                                  onChange={(e) => setVariantShare(v, Number(e.target.value))}
                                  className="cc-plain-number w-7 bg-transparent text-right font-manrope text-sm font-bold text-[#17173A] outline-none"
                                />
                                <span className="font-manrope text-sm text-[#8A8AA3]">%</span>
                              </label>
                            );
                          })}

                          {values.decideWinner && (
                            <label className="flex h-11 cursor-text items-center gap-2 rounded-full border border-[#DDE2EE] bg-white py-1 pl-1 pr-4 transition-colors focus-within:border-[#2F68E5]">
                              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#F5C542]">
                                <Trophy className="size-4 text-[#8A6100]" strokeWidth={2} />
                              </span>
                              <span className="font-manrope text-sm font-bold text-[#17173A]">
                                Winner
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                aria-label="Percentage for the winning variant"
                                value={winnerShare}
                                onChange={(e) => setWinnerShare(Number(e.target.value))}
                                className="cc-plain-number w-7 bg-transparent text-right font-manrope text-sm font-bold text-[#17173A] outline-none"
                              />
                              <span className="font-manrope text-sm text-[#8A8AA3]">%</span>
                            </label>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={splitEvenly}
                          className="font-manrope text-sm font-bold text-[#2F68E5] transition-colors hover:text-[#2455C0]"
                        >
                          Split evenly
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-2">
                      <MiniSwitch
                        checked={values.decideWinner}
                        onCheckedChange={toggleDecideWinner}
                      />
                      <p className="font-manrope text-sm font-semibold text-[#17173A]">
                        Decide a winner variant
                      </p>
                    </div>

                    {values.decideWinner && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 font-manrope text-sm text-[#17173A]">
                        <span>Decide winner on basis of</span>
                        <div className="w-[130px]">
                          <Dropdown
                            value={values.winningMetric}
                            options={["Open", "Clicks", "Conversion"]}
                            onChange={(v) =>
                              onChange({ winningMetric: v as ContentValues["winningMetric"] })
                            }
                          />
                        </div>
                        <span>after</span>
                        <div className="w-[90px]">
                          <Dropdown
                            value={values.testDurationValue}
                            options={durationOptionsFor(values.testDurationUnit)}
                            onChange={(v) => onChange({ testDurationValue: v })}
                          />
                        </div>
                        <div className="w-[100px]">
                          <Dropdown
                            value={values.testDurationUnit}
                            options={[...DURATION_UNITS]}
                            onChange={(v) => {
                              const unit = v as ContentValues["testDurationUnit"];
                              const options = durationOptionsFor(unit);
                              onChange({
                                testDurationUnit: unit,
                                testDurationValue: options.includes(values.testDurationValue)
                                  ? values.testDurationValue
                                  : options[0],
                              });
                            }}
                          />
                        </div>
                        <span>.</span>
                      </div>
                    )}
                  </TestAllocationDrawer>
                )}

                {channel === "Email" && (
                  <>
                    <FieldRow label="From" trailing={fromTrailing}>
                      <input
                        type="text"
                        value={values.senderName}
                        onChange={(e) => onChange({ senderName: e.target.value })}
                        placeholder="Sender name"
                        className={cn(lineInputClass, highlight?.senderName && "cmk-field-flash")}
                      />
                      <div className="relative flex shrink-0 items-center">
                        <select
                          value={values.domain}
                          onChange={(e) => onChange({ domain: e.target.value })}
                          className="appearance-none bg-transparent pr-6 font-manrope text-sm font-semibold text-[#17173A] outline-none"
                        >
                          {DOMAINS.map((d) => (
                            <option key={d} value={d}>{`@${d}`}</option>
                          ))}
                        </select>
                        <ChevronDown
                          className="pointer-events-none absolute right-0 size-4 text-[#8A8AA3]"
                          strokeWidth={2}
                        />
                      </div>
                    </FieldRow>

                    {values.ccEnabled && (
                      <FieldRow label="Cc" trailing={ccTrailing}>
                        <input
                          type="text"
                          autoFocus
                          value={values.ccEmails}
                          onChange={(e) => onChange({ ccEmails: e.target.value })}
                          placeholder="Cc email"
                          className={lineInputClass}
                        />
                      </FieldRow>
                    )}

                    {values.bccEnabled && (
                      <FieldRow label="Bcc" trailing={bccTrailing}>
                        <input
                          type="text"
                          autoFocus
                          value={values.bccEmails}
                          onChange={(e) => onChange({ bccEmails: e.target.value })}
                          placeholder="Bcc email"
                          className={lineInputClass}
                        />
                      </FieldRow>
                    )}

                    <FieldRow
                      label="Subject"
                      required
                      info="The line this campaign gets opened on — keep it under 60 characters."
                      trailing={
                        <AiSuggestPopover
                          pool={aiGenerated ? AI_GENERATED_SUBJECT_SUGGESTIONS : SUBJECT_SUGGESTIONS}
                          onPick={(text) => onChange({ subject: text })}
                        />
                      }
                    >
                      <input
                        type="text"
                        value={values.subject}
                        onChange={(e) => onChange({ subject: e.target.value })}
                        placeholder="Subject line"
                        className={cn(lineInputClass, highlight?.subject && "cmk-field-flash")}
                      />
                    </FieldRow>

                    <FieldRow
                      label="Pre-header"
                      trailing={
                        <AiSuggestPopover
                          pool={aiGenerated ? AI_GENERATED_PREHEADER_SUGGESTIONS : PREHEADER_SUGGESTIONS}
                          onPick={(text) => onChange({ preHeader: text })}
                        />
                      }
                    >
                      <input
                        type="text"
                        value={values.preHeader}
                        onChange={(e) => onChange({ preHeader: e.target.value })}
                        placeholder="Pre-header"
                        className={cn(lineInputClass, highlight?.preHeader && "cmk-field-flash")}
                      />
                    </FieldRow>
                  </>
                )}
              </div>
            );
          })()}

          <AttachmentsModal
            open={attachModalOpen}
            initial={values.attachments[0] ?? null}
            onCancel={() => setAttachModalOpen(false)}
            onSave={(fileName) => {
              onChange({
                attachments: fileName ? [fileName] : [],
                attachmentsEnabled: Boolean(fileName),
              });
              setAttachModalOpen(false);
            }}
          />

          <ReplyToEmailModal
            open={replyToModalOpen}
            initial={values.replyEmail}
            extraOptions={customReplyEmails}
            onCreate={(email) =>
              setCustomReplyEmails((prev) => (prev.includes(email) ? prev : [...prev, email]))
            }
            onCancel={() => setReplyToModalOpen(false)}
            onSave={(email) => {
              onChange({ replyEmail: email });
              setReplyToModalOpen(false);
            }}
          />
        </>
      ) : (
        <>
          {/* Sender details, laid out as the Content-section revamp: name, email
              and domain share a row; subject and pre-header sit below at 620px. */}
          <div className="grid max-w-[1120px] grid-cols-3 gap-x-3.5 gap-y-5">
            <Field label="Sender name" info="Shown as the from-name in the inbox.">
              <input
                type="text"
                value={values.senderName}
                onChange={(e) => onChange({ senderName: e.target.value })}
                placeholder="Enter your sender name"
                className={cn(fieldClass, highlight?.senderName && "cmk-field-flash")}
              />
            </Field>

            <Field label="Sender email" required info="The address this campaign is sent from.">
              <input
                type="text"
                value={values.senderEmail}
                onChange={(e) => onChange({ senderEmail: e.target.value })}
                placeholder="Enter sender's email address"
                className={cn(fieldClass, highlight?.senderEmail && "cmk-field-flash")}
              />
            </Field>

            <Field label="Domain" required>
              <div className="relative">
                <select
                  value={values.domain}
                  onChange={(e) => onChange({ domain: e.target.value })}
                  className={cn(fieldClass, "appearance-none pr-10")}
                >
                  {DOMAINS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#8A8AA3]"
                  strokeWidth={2}
                />
              </div>
            </Field>
          </div>

          <div className="mt-5 grid max-w-[620px] gap-y-5">
            <Field
              label="Subject"
              required
              info="The line this campaign gets opened on — keep it under 60 characters."
            >
              <input
                type="text"
                value={values.subject}
                onChange={(e) => onChange({ subject: e.target.value })}
                placeholder="Ex: Get an extra 20% off your next purchase"
                className={cn(fieldClass, highlight?.subject && "cmk-field-flash")}
              />
            </Field>

            <Field label="Pre-header">
              <input
                type="text"
                value={values.preHeader}
                onChange={(e) => onChange({ preHeader: e.target.value })}
                placeholder="Ex: Exclusive offer just for you!"
                className={cn(fieldClass, highlight?.preHeader && "cmk-field-flash")}
              />
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap gap-6">
            <AddButton
              label="Reply email id"
              active={values.replyEnabled}
              onClick={() => onChange({ replyEnabled: !values.replyEnabled })}
            />
            <AddButton
              label="Receive a copy"
              active={values.copyEnabled}
              onClick={() => onChange({ copyEnabled: !values.copyEnabled })}
            />
            <AddButton
              label="Attachments"
              active={values.attachmentsEnabled}
              onClick={() => onChange({ attachmentsEnabled: !values.attachmentsEnabled })}
            />
          </div>

          <Reveal open={extrasOpen}>
            <div className="grid grid-cols-3 gap-x-6 gap-y-5">
              {values.replyEnabled && (
                <Field label="Reply email id" info="Where replies to this campaign land.">
                  <input
                    type="text"
                    value={values.replyEmail}
                    onChange={(e) => onChange({ replyEmail: e.target.value })}
                    placeholder="reply@m3m.in"
                    className={fieldClass}
                  />
                </Field>
              )}
              {values.copyEnabled && (
                <Field label="Receive a copy" info="Comma-separated internal recipients.">
                  <input
                    type="text"
                    value={values.copyEmails}
                    onChange={(e) => onChange({ copyEmails: e.target.value })}
                    placeholder="marketing@m3m.in, ops@m3m.in"
                    className={fieldClass}
                  />
                </Field>
              )}
              {values.attachmentsEnabled && (
                <Field label="Attachments">
                  <button
                    type="button"
                    className="flex h-10 w-full items-center gap-2 rounded-md border border-dashed border-[#C3CAD9] bg-[#F7F9FC] px-3 font-manrope text-sm text-[#6F6F8D] transition-colors hover:border-[#2F68E5] hover:text-[#2F68E5]"
                  >
                    <Plus className="size-4" strokeWidth={2.4} />
                    Add a file (max 5 MB)
                  </button>
                </Field>
              )}
            </div>
          </Reveal>
        </>
      )}

      {carouselEditorOpen ? (
        <CarouselTemplateEditor
          onClose={() => {
            setCarouselEditorOpen(false);
            onChange({ starterId: "" });
          }}
          onUse={() => setCarouselEditorOpen(false)}
        />
      ) : values.templateId !== null ? (
        <TemplatePreviewPanel
          template={selectedTemplate}
          channel={channel}
          device={previewDevice}
          onDeviceChange={setPreviewDevice}
          theme={previewTheme}
          onThemeChange={setPreviewTheme}
          os={previewOS}
          onOSChange={setPreviewOS}
          expanded={previewExpanded}
          onExpandedChange={setPreviewExpanded}
          onChangeTemplate={() => onChange({ templateId: null })}
          defaultSubject={values.subject}
          defaultSenderName={values.senderName}
          defaultDomain={values.domain}
          testListMode={audienceMode === "table"}
        />
      ) : (
        <>
      {/* Template picker — same panel, its own heading, exactly as sender
          details and the template list sit together in the reference. */}
      {(() => {
        const searchControl = (
          <>
          {searchOpen ? (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8A8AA3]" />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                onBlur={() => !query && setSearchOpen(false)}
                placeholder="Search templates"
                className="h-8 w-[240px] rounded-md border border-[#2F68E5] bg-white pl-9 pr-8 font-manrope text-sm text-[#17173A] outline-none placeholder:text-[#A0A0A0]"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    setSearchOpen(false);
                    setPage(1);
                  }}
                  className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full text-[#8A8AA3] hover:bg-[#F0F3F9]"
                >
                  <X className="size-3.5" strokeWidth={2.4} />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              aria-label="Search templates"
              onClick={() => setSearchOpen(true)}
              className="grid size-8 place-items-center rounded-md border border-[#DDE2EE] bg-white text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
            >
              <Search className="size-4" strokeWidth={2} />
            </button>
          )}
          </>
        );
        return (
          <>
            <div className="mb-4 mt-10 flex items-center justify-between gap-4">
              <h2 className="font-manrope text-base font-bold text-[#17173A]">
                {channel === "Email" ? "Select template or create new" : "Select a template or create new"}
              </h2>
              {channel !== "Email" && (
                <div className="flex items-center gap-2">
                  {searchControl}
                  <button type="button" className="dc-btn dc-btn-secondary">
                    <SlidersHorizontal className="size-4" strokeWidth={2} />
                    Filters
                  </button>
                  <CreateNewMenu
                    channel={channel}
                    onPick={(starterId) => {
                      if (requireTargetApp("create")) return;
                      onChange({ starterId, templateId: null });
                      if (starterId === "carousel-e2e") setCarouselEditorOpen(true);
                    }}
                  />
                </div>
              )}
            </div>

            {channel === "Email" && (
              <div className="mb-6">
                <h3 className="mb-3 font-manrope text-base font-bold text-[#17173A]">Create a new</h3>
                <CreateNewMenu
                  tile
                  channel={channel}
                  onPick={(starterId) => {
                    onChange({ starterId, templateId: null });
                    if (starterId === "carousel-e2e") setCarouselEditorOpen(true);
                  }}
                />
              </div>
            )}

            {channel === "Email" && (
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="flex items-center gap-6">
                  {TEMPLATE_SOURCE_TABS.map((t) => {
                    const count =
                      t.id === "library"
                        ? templateLibrary.length
                        : t.id === "saved"
                          ? emailTemplates.length
                          : savedTemplateFolders.length;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSourceTab(t.id)}
                        className={cn(
                          "relative pb-2.5 font-manrope text-sm transition-colors",
                          sourceTab === t.id
                            ? "font-bold text-[var(--btn-primary)]"
                            : "font-medium text-[#6F6F8D] hover:text-[#17173A]"
                        )}
                      >
                        {t.label} ({String(count).padStart(2, "0")})
                        {sourceTab === t.id && (
                          <span className="absolute -bottom-px left-0 h-[3px] w-full rounded-[1.5px] bg-[var(--btn-primary)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 pb-2">
                  {searchControl}
                  <button
                    type="button"
                    aria-label="List view"
                    className="grid size-8 place-items-center rounded border border-[#DDE2EE] bg-white text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
                  >
                    <ListIcon className="size-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    aria-label="Filters"
                    className="grid size-8 place-items-center rounded border border-[#DDE2EE] bg-white text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
                  >
                    <SlidersHorizontal className="size-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
            )}
            {channel === "Email" && (
              <p className="mb-5 font-manrope text-sm text-[#6F6F8D]">
                Note: Only templates that can be used in email campaigns are shown.{" "}
                <a
                  href="https://cedocs.netcorecloud.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0A8FFD] hover:underline"
                >
                  Learn more
                </a>
              </p>
            )}
          </>
        );
      })()}

      {channel === "Email" ? (
        <>
          {sourceTab === "library" ? (
            <div className="grid grid-cols-6 gap-6">
              {templateLibrary.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  selected={values.templateId === t.id}
                  onSelect={() =>
                    onChange({ templateId: values.templateId === t.id ? null : t.id })
                  }
                />
              ))}
            </div>
          ) : sourceTab === "folders" ? (
            <>
              <div>
                <div className="grid grid-cols-3 gap-4">
                  {(foldersExpanded || !COLLAPSE_FOLDERS
                    ? savedTemplateFolders
                    : savedTemplateFolders.slice(0, FOLDERS_COLLAPSED_COUNT)
                  ).map((f) => (
                    <FolderCard key={f.id} folder={f} />
                  ))}
                </div>
                {COLLAPSE_FOLDERS && savedTemplateFolders.length > FOLDERS_COLLAPSED_COUNT && (
                  <button
                    type="button"
                    onClick={() => setFoldersExpanded((o) => !o)}
                    className="mt-3 flex items-center gap-1.5 font-manrope text-sm font-semibold text-[#2F68E5] transition-colors hover:text-[#255ad2]"
                  >
                    {foldersExpanded ? "View less" : "View more"}
                    <ChevronDown
                      className={cn("size-4 transition-transform", foldersExpanded && "rotate-180")}
                      strokeWidth={2}
                    />
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {shown.length === 0 ? (
                <p className="py-16 text-center font-manrope text-sm text-[#6F6F8D]">
                  No template matches “{query}”.
                </p>
              ) : (
                <div className="grid grid-cols-6 gap-6">
                  {shown.map((t) => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      selected={values.templateId === t.id}
                      onSelect={() =>
                        onChange({ templateId: values.templateId === t.id ? null : t.id })
                      }
                    />
                  ))}
                </div>
              )}

              <div className="mt-6 flex items-center justify-between">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setPerPageOpen((o) => !o)}
                    className="flex h-10 w-[215px] items-center justify-between rounded-[5px] border border-[#DDE2EE] bg-white px-2.5 font-manrope text-sm text-[#17173A]"
                  >
                    {perPage} per page
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 text-[#6F6F8D] transition-transform",
                        perPageOpen && "rotate-180"
                      )}
                      strokeWidth={1.8}
                    />
                  </button>
                  {perPageOpen && (
                    <div className="absolute bottom-11 left-0 z-20 w-[215px] overflow-hidden rounded-md border border-[#DDE2EE] bg-white py-1 shadow-[0_8px_24px_rgba(23,23,58,0.12)]">
                      {PER_PAGE_OPTIONS.map((n) => {
                        const enabled = PER_PAGE_ENABLED.includes(n);
                        return (
                          <button
                            key={n}
                            type="button"
                            disabled={!enabled}
                            onClick={() => {
                              if (!enabled) return;
                              setPerPage(n);
                              setPage(1);
                              setPerPageOpen(false);
                            }}
                            className={cn(
                              "block w-full px-3 py-2 text-left font-manrope text-sm transition-colors",
                              !enabled
                                ? "cursor-not-allowed text-[#B9BAC7]"
                                : n === perPage
                                  ? "bg-[#F4F8FF] font-semibold text-[#2F68E5]"
                                  : "text-[#17173A] hover:bg-[#F7F9FC]"
                            )}
                          >
                            {n} per page
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Pager page={current} pageCount={pageCount} onPage={setPage} />
              </div>
            </>
          )}
        </>
      ) : shown.length === 0 ? (
        <p className="py-16 text-center font-manrope text-sm text-[#6F6F8D]">
          No template matches “{query}”.
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {shown.map((t) => (
            <AppPushTemplateCard
              key={t.id}
              template={t}
              selected={values.templateId === t.id}
              onSelect={() => {
                if (requireTargetApp("use")) return;
                onChange({ templateId: values.templateId === t.id ? null : t.id });
              }}
            />
          ))}
        </div>
      )}
        </>
      )}

    </StepCard>
  );
}
