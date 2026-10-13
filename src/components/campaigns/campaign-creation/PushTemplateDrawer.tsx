import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronsLeft, ChevronsRight, ChevronRight, Copy, Eye, MoreHorizontal, Pencil, Search, Send } from "lucide-react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import Dropdown from "../Dropdown";
import { ActionMenu, ActionMenuContent, ActionMenuTrigger } from "@/components/ui/action-menu";
import { DsButton } from "@/components/ui/ds-button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { appPushTemplates } from "./appPushTemplates.data";
import type { EmailTemplate } from "./emailTemplates.data";

/** Saved push templates in id order — 80001 to 80006. */
const TEMPLATES: EmailTemplate[] = [...appPushTemplates].sort((a, b) => a.id - b.id);

const CATEGORIES = ["All categories", "Promotional", "Alerts", "Reminders"];
const CATEGORY_BY_ID: Record<number, string> = {
  80001: "Promotional",
  80002: "Promotional",
  80003: "Promotional",
  80004: "Promotional",
  80005: "Alerts",
  80006: "Reminders",
};
const PAGE_SIZES = ["10 per page", "20 per page", "50 per page"];

/** One row of the card's "…" menu: icon first, label after, as in the template library. */
function MenuRow({
  icon: Icon,
  disabled,
  onSelect,
  children,
}: {
  icon: typeof Eye;
  disabled?: boolean;
  onSelect?: () => void;
  children: string;
}) {
  return (
    <DropdownMenuPrimitive.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        "flex h-11 cursor-pointer items-center gap-4 px-5 font-manrope text-[15px] font-medium text-[#6F6F8D] outline-none transition-colors",
        "data-[highlighted]:bg-[#F4F8FF] data-[highlighted]:text-[#17173A] data-[disabled]:pointer-events-none"
      )}
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
      {children}
    </DropdownMenuPrimitive.Item>
  );
}

function TemplateCard({
  template,
  selected,
  onUse,
  onView,
}: {
  template: EmailTemplate;
  selected: boolean;
  onUse: () => void;
  onView: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[5px] border bg-white transition-shadow hover:shadow-[0_4px_14px_rgba(23,23,58,0.1)]",
        selected ? "border-[#143F93] ring-1 ring-[#143F93]" : "border-[#DDE2EE]"
      )}
    >
      <button type="button" onClick={onUse} aria-pressed={selected} className="block w-full text-left">
        {/* The phone sits inset with air around it, fading out at the bottom —
            not stretched to the card's edges. */}
        <span className="relative block h-[200px] overflow-hidden bg-white">
          {template.image && (
            <img
              src={template.image}
              alt=""
              className="absolute left-1/2 top-[14px] w-[62%] max-w-none -translate-x-1/2"
            />
          )}
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/80 to-transparent" />
        </span>
        <span className="block border-t border-[#EEF1F7] px-5 py-3">
          <span className="block truncate font-manrope text-sm font-semibold tracking-[0.29px] text-[#17173A]">
            {template.name}
          </span>
          <span className="mt-0.5 block font-manrope text-[13px] text-[#6F6F8D]">ID:{template.id}</span>
        </span>
      </button>

      {/* Appears on hover, the way the template library shows its actions. */}
      <ActionMenu>
        <ActionMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Actions for ${template.name}`}
            className="absolute right-2 top-2 grid size-9 place-items-center rounded-[4px] bg-[#143F93] text-white opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal className="size-5" strokeWidth={2.4} />
          </button>
        </ActionMenuTrigger>
        <ActionMenuContent
          align="end"
          side="bottom"
          sideOffset={6}
          className="z-[130] w-[210px] gap-0 overflow-hidden rounded-[6px] border-[#DDE2EE] bg-white p-0 shadow-[0_8px_24px_rgba(23,23,58,0.14)]"
        >
          <MenuRow icon={Eye} onSelect={onView}>
            View
          </MenuRow>
          <MenuRow icon={Send} onSelect={onUse}>
            Use
          </MenuRow>
          <MenuRow icon={Pencil} disabled>
            Edit
          </MenuRow>
          <MenuRow icon={Copy} disabled>
            Copy
          </MenuRow>
        </ActionMenuContent>
      </ActionMenu>
    </div>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-7 place-items-center rounded text-[#6F6F8D] transition-colors enabled:hover:text-[#17173A] disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/**
 * "existing templates" drawer, built to the Figma "Side drawer" frame: a
 * header with the back arrow, title and CREATE NEW; "Template details" with
 * the campaigns-only note and a search; a category field; a four-up card
 * grid; and the per-page + pagination row. Each card carries a "…" menu
 * (View / Use / Edit / Copy). Picking a template selects it and closes.
 */
export default function PushTemplateDrawer({
  open,
  selectedId,
  onSelect,
  onClose,
  onCreateNew,
}: {
  open: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onClose: () => void;
  /** "Create new" — build a notification from scratch instead of from a template. */
  onCreateNew: () => void;
}) {
  const [shown, setShown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    const id = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !viewing && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, viewing]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATES.filter(
      (t) =>
        (!category || category === CATEGORIES[0] || CATEGORY_BY_ID[t.id] === category) &&
        (!q || t.name.toLowerCase().includes(q) || String(t.id).includes(q))
    );
  }, [query, category]);

  const per = parseInt(pageSize, 10);
  const pages = Math.max(1, Math.ceil(filtered.length / per));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * per, current * per);

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
      <aside
        role="dialog"
        aria-label="Existing templates"
        className={cn(
          "relative flex h-full w-full flex-col bg-[#F4F8FF] shadow-[-20px_0_60px_rgba(23,23,58,0.15)] transition-transform duration-300 ease-out",
          shown ? "translate-x-0" : "translate-x-full"
        )}
      >
        <header className="flex h-[61px] shrink-0 items-center justify-between border-b border-[#DDE2EE] bg-white px-[34px]">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              aria-label="Back"
              onClick={onClose}
              className="grid size-[30px] place-items-center rounded text-[#17173A] transition-colors hover:bg-[#F0F3F9]"
            >
              <ChevronLeft className="size-6" strokeWidth={2.4} />
            </button>
            <h2 className="truncate font-manrope text-[20px] font-bold leading-7 tracking-[0.42px] text-black">
              Choose from existing templates or create new
            </h2>
          </div>
          <DsButton onClick={onCreateNew}>Create new</DsButton>
        </header>

        <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-[34px] pb-6 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-manrope text-[20px] font-bold leading-normal tracking-[0.42px] text-[#17173A]">
                Template details
              </h3>
              <p className="mt-1 font-manrope text-sm font-semibold leading-5 tracking-[0.42px] text-[#6F6F8D]">
                Note: Showing templates that can be only used in campaigns.{" "}
                <a
                  href="https://cedocs.netcore.ai/docs/product-set-in-app-push"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0A8FFD] hover:underline"
                >
                  Learn more
                </a>
              </p>
            </div>
            <button
              type="button"
              aria-label="Search templates"
              onClick={() => setSearching((v) => !v)}
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-[5px] border bg-white text-[#17173A] transition-colors hover:bg-[#F7F9FC]",
                searching ? "border-[#143F93]" : "border-[#DDE2EE]"
              )}
            >
              <Search className="size-4" strokeWidth={2} />
            </button>
          </div>

          {searching && (
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or ID"
              className="mt-4 h-10 w-full rounded-[5px] border border-[#DDE2EE] bg-white px-4 font-manrope text-sm text-[#17173A] outline-none placeholder:text-[#8A8AA3] focus:border-[#143F93]"
            />
          )}

          <div className="mt-6">
            <Dropdown
              value={category}
              options={CATEGORIES}
              onChange={(v) => {
                setCategory(v);
                setPage(1);
              }}
              placeholder="Select category"
              widthClass="w-full"
              heightClass="h-[50px]"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-[30px] sm:grid-cols-2 xl:grid-cols-4">
            {visible.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                selected={t.id === selectedId}
                onUse={() => onSelect(t.id)}
                onView={() => setViewing(t)}
              />
            ))}
          </div>
          {visible.length === 0 && (
            <p className="py-16 text-center font-manrope text-sm text-[#6F6F8D]">No templates match.</p>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-4 px-[34px] pb-6 pt-2">
          <Dropdown
            value={pageSize}
            options={PAGE_SIZES}
            onChange={(v) => {
              setPageSize(v);
              setPage(1);
            }}
            widthClass="w-[259px]"
            heightClass="h-10"
          />
          <nav
            aria-label="Pagination"
            className="flex h-10 items-center gap-1 rounded-[5px] border border-[#DDE2EE] bg-white px-3 font-manrope text-sm"
          >
            <PageButton label="First page" disabled={current === 1} onClick={() => setPage(1)}>
              <ChevronsLeft className="size-4" strokeWidth={2.2} />
            </PageButton>
            <PageButton label="Previous page" disabled={current === 1} onClick={() => setPage(current - 1)}>
              <ChevronLeft className="size-4" strokeWidth={2.2} />
            </PageButton>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                aria-current={n === current ? "page" : undefined}
                onClick={() => setPage(n)}
                className={cn(
                  "relative px-2.5 py-1 tabular-nums transition-colors",
                  n === current ? "text-[#17173A]" : "text-[#6F6F8D] hover:text-[#17173A]"
                )}
              >
                {String(n).padStart(2, "0")}
                {n === current && (
                  <span className="absolute inset-x-1.5 -bottom-[3px] h-[3px] rounded-[1.5px] bg-[#143F93] shadow-[0_1px_4px_rgba(20,63,147,0.5)]" />
                )}
              </button>
            ))}
            <PageButton label="Next page" disabled={current === pages} onClick={() => setPage(current + 1)}>
              <ChevronRight className="size-4" strokeWidth={2.2} />
            </PageButton>
            <PageButton label="Last page" disabled={current === pages} onClick={() => setPage(pages)}>
              <ChevronsRight className="size-4" strokeWidth={2.2} />
            </PageButton>
          </nav>
        </footer>
      </aside>

      {/* View: a larger look at the template on the phone. */}
      <Dialog open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)}>
        {/* Escape closes just this preview — not the drawer behind it. */}
        <DialogContent
          onEscapeKeyDown={(e) => e.stopPropagation()}
          className="z-[140] max-h-[90vh] w-auto max-w-[560px] overflow-y-auto p-6"
        >
          <DialogTitle className="font-manrope text-base font-bold text-[#17173A]">
            {viewing?.name} <span className="font-normal text-[#6F6F8D]">· ID {viewing?.id}</span>
          </DialogTitle>
          {viewing && (
            <img
              src={viewing.pushPreviews?.["ios-expanded"] ?? viewing.image}
              alt={viewing.name}
              className="mx-auto mt-3 max-h-[70vh] w-auto"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>,
    document.body
  );
}
