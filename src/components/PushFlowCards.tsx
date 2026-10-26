import { useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import CoriQuestionsCard from "@/components/CoriQuestionsCard";
import AudienceDraftCard from "@/components/campaigns/campaign-creation/AudienceDraftCard";
import PushVariationsCard from "@/components/PushVariationsCard";
import { AndroidIcon, AppleIcon } from "@/components/campaigns/campaign-creation/PlatformIcons";
import { appPushTemplates } from "@/components/campaigns/campaign-creation/appPushTemplates.data";
import {
  COUNTDOWN_PREVIEW,
  PUSH_CART_TEMPLATE_ID,
  PUSH_CART_TEMPLATE_NAME,
  reachFor,
  resolvedTitle,
  type PushCartDraft,
  type PushFlowCard,
  type PushFlowEvent,
} from "@/data/pushCartFlow";

const template = appPushTemplates.find((t) => t.id === PUSH_CART_TEMPLATE_ID);
const nf = new Intl.NumberFormat("en-US");

const fieldClass =
  "w-full rounded-md border border-[#DDE2EE] bg-white px-3 py-2 font-manrope text-[13px] text-[#17173A] outline-none focus:border-[#2F68E5] disabled:bg-[#F7F7F9] disabled:text-[#6F6F8D]";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-manrope text-[12px] font-semibold text-[#6F6F8D]">{label}</span>
      {children}
    </label>
  );
}

type PreviewOS = "ios" | "android";

/** A small two-option toggle, sized for a card header. */
function MiniToggle<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; icon?: (props: { className?: string }) => ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex overflow-hidden rounded-md border border-[#DDE2EE] bg-white">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          aria-label={o.label}
          title={o.label}
          onClick={() => onChange(o.value)}
          className={cn(
            "grid min-w-[32px] place-items-center px-2.5 py-1 font-manrope text-[12px] font-semibold transition-colors",
            value === o.value ? "bg-[var(--btn-primary)] text-white" : "text-[#6F6F8D] hover:bg-[#F7F9FC] hover:text-[#17173A]"
          )}
        >
          {o.icon ? <o.icon className="size-4" /> : o.label}
        </button>
      ))}
    </div>
  );
}

/** The Coupon Expiry Reminder layout (ID 80006) as a live notification — the
 *  cart image is cropped out of the template's own thumbnail. Collapsed drops
 *  the image; Android has its own header row and squarer corners. */
function NotificationPreview({ draft, os, expanded }: { draft: PushCartDraft; os: PreviewOS; expanded: boolean }) {
  const android = os === "android";
  return (
    <div className="rounded-xl bg-[#F4F8FF] p-3">
      <div
        className={cn(
          "bg-white p-3 shadow-[0_1px_4px_rgba(23,23,58,0.12)]",
          android ? "rounded-[10px]" : "rounded-xl"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="grid size-5 place-items-center rounded-[5px] bg-[#E9D7C8] text-[9px] font-bold text-[#6B4A32]">P</span>
          {android ? (
            <p className="font-manrope text-[12px] text-[#6F6F8D]">
              <span className="text-[#17173A]">Pranaglow</span> · now
            </p>
          ) : (
            <>
              <p className="font-manrope text-[12px] text-[#17173A]">Pranaglow</p>
              <p className="ml-auto font-manrope text-[11px] text-[#6F6F8D]">now</p>
            </>
          )}
          {android && (
            <ChevronDown
              className={cn("ml-auto size-4 text-[#6F6F8D] transition-transform", expanded && "rotate-180")}
              strokeWidth={2}
            />
          )}
        </div>
        <div className="mt-2 flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate font-manrope text-[13px] font-bold text-[#17173A]">{resolvedTitle(draft) || "Title"}</p>
            <p
              className={cn(
                "mt-0.5 font-manrope text-[12px] leading-snug text-[#17173A]",
                expanded ? "line-clamp-2" : "truncate"
              )}
            >
              {draft.body || "Body"}
            </p>
          </div>
          {draft.countdown && (
            <span className="shrink-0 rounded-md bg-[#FFD35C] px-2 py-1 font-manrope text-[12px] font-bold tabular-nums text-[#17173A]">
              {COUNTDOWN_PREVIEW}
            </span>
          )}
        </div>
        {expanded && draft.richMedia && template && (
          <div className="relative mt-2 w-full overflow-hidden rounded-md bg-black" style={{ aspectRatio: "549 / 198" }}>
            <img
              src={template.image}
              alt="Shopping cart"
              className="absolute max-w-none"
              style={{ width: "121.7%", left: "-10.93%", top: "-162.6%" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/** Parked for now — changes to the draft go through the chat instead. */
const SHOW_DRAFT_EDITING = false;

function ContentCard({
  draft: initial,
  needsPromo,
  version,
  superseded,
  onEvent,
}: {
  draft: PushCartDraft;
  needsPromo: boolean;
  version?: number;
  /** A newer draft has replaced this one — it stays readable but can't be sent on. */
  superseded?: boolean;
  onEvent: (e: PushFlowEvent) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [sent, setSent] = useState(false);
  const [os, setOs] = useState<PreviewOS>("ios");
  const [expanded, setExpanded] = useState(true);
  const confirmed = sent || Boolean(superseded);
  const set = <K extends keyof PushCartDraft>(key: K, value: PushCartDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const hasVariable = /\{\{\s*disc_value\s*\}\}/.test(draft.title);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-[#DDE2EE] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-[#E8ECF4] px-4 py-3">
        <p className="font-manrope text-[15px] font-bold text-[#17173A]">
          Notification draft
          {version ? <span className="ml-2 font-semibold text-[#6F6F8D]">v{version}</span> : null}
        </p>
        <div className="flex items-center gap-2">
          <MiniToggle
            label="Platform"
            options={[
              { value: "ios", label: "iOS", icon: AppleIcon },
              { value: "android", label: "Android", icon: AndroidIcon },
            ]}
            value={os}
            onChange={(v) => setOs(v as PreviewOS)}
          />
          <MiniToggle
            label="Notification state"
            options={[
              { value: "expanded", label: "Expanded" },
              { value: "collapsed", label: "Collapsed" },
            ]}
            value={expanded ? "expanded" : "collapsed"}
            onChange={(v) => setExpanded(v === "expanded")}
          />
        </div>
      </div>
      <div className="space-y-3 px-4 py-4">
        <NotificationPreview draft={draft} os={os} expanded={expanded} />
        {SHOW_DRAFT_EDITING && (
          <>
            <Field label="Title">
              <input className={fieldClass} value={draft.title} disabled={confirmed} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <Field label="Body">
              <textarea className={cn(fieldClass, "resize-none")} rows={2} value={draft.body} disabled={confirmed} onChange={(e) => set("body", e.target.value)} />
            </Field>
          </>
        )}
        {hasVariable && (
          <Field label="Discount value ({{disc_value}})">
            <input
              className={fieldClass}
              value={draft.discountValue}
              disabled={confirmed}
              placeholder="e.g. 20%"
              onChange={(e) => set("discountValue", e.target.value)}
            />
          </Field>
        )}
        {needsPromo && (
          <Field label="Promo code">
            <input
              className={fieldClass}
              value={draft.promoCode ?? ""}
              disabled={confirmed}
              placeholder="e.g. CART20"
              onChange={(e) => set("promoCode", e.target.value)}
            />
          </Field>
        )}
        {SHOW_DRAFT_EDITING && (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="font-manrope text-[13px] text-[#17173A]">Rich media · Shopping cart image</p>
              <Switch checked={draft.richMedia} disabled={confirmed} onCheckedChange={(v) => set("richMedia", v)} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="font-manrope text-[13px] text-[#17173A]">
                Countdown timer <span className="text-[#6F6F8D]">· {COUNTDOWN_PREVIEW} (illustrative)</span>
              </p>
              <Switch checked={draft.countdown} disabled={confirmed} onCheckedChange={(v) => set("countdown", v)} />
            </div>
          </>
        )}
      </div>
      <div className="border-t border-[#E8ECF4] px-4 py-3">
        {superseded ? (
          <p className="font-manrope text-[13px] font-medium text-[#6F6F8D]">Replaced by the next draft</p>
        ) : confirmed ? (
          <p className="flex items-center gap-2 font-manrope text-[13px] font-semibold text-[#17173A]">
            <Check className="size-4 text-[#00A676]" strokeWidth={2.4} />
            Notification confirmed
          </p>
        ) : (
          <button
            type="button"
            className="dc-btn dc-btn-primary"
            onClick={() => {
              setSent(true);
              onEvent({ type: "content", draft });
            }}
          >
            Save &amp; continue
          </button>
        )}
      </div>
    </div>
  );
}

/** Parked for now: the brief's Rich media row and its "Make changes with Zeno" CTA. */
const SHOW_BRIEF_RICH_MEDIA = false;
const SHOW_BRIEF_CHANGES = false;

function BriefRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 py-2">
      <p className="w-[104px] shrink-0 font-manrope text-[12px] text-[#6F6F8D]">{label}</p>
      <div className="min-w-0 flex-1 font-manrope text-[13px] font-medium leading-snug text-[#17173A]">{children}</div>
    </div>
  );
}

function BriefCard({ draft, onEvent }: { draft: PushCartDraft; onEvent: (e: PushFlowEvent) => void }) {
  const [acted, setActed] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <div className="w-full overflow-hidden rounded-lg border border-[#DDE2EE] bg-white">
      <div className="border-b border-[#E8ECF4] px-4 py-3">
        <p className="font-manrope text-[15px] font-bold text-[#17173A]">Campaign brief</p>
      </div>
      <div className="divide-y divide-[#F0F2F8] px-4 py-1">
        <BriefRow label="Audience">
          {draft.qualify}
          <span className="block text-[12px] font-normal text-[#6F6F8D]">Excludes users who already purchased · ~{nf.format(reachFor(draft))} reach</span>
        </BriefRow>
        <BriefRow label="Devices">{draft.devices}</BriefRow>
        <BriefRow label="Notification">
          <span className="font-bold">{resolvedTitle(draft)}</span>
          <span className="block font-normal">{draft.body}</span>
          {draft.promoCode && <span className="block text-[12px] font-normal text-[#6F6F8D]">Promo code: {draft.promoCode}</span>}
        </BriefRow>
        {SHOW_BRIEF_RICH_MEDIA && (
          <BriefRow label="Rich media">
            {draft.richMedia ? "Shopping cart image" : "None"}
            {draft.countdown ? ` · Countdown ${COUNTDOWN_PREVIEW}` : ""}
          </BriefRow>
        )}
        <BriefRow label="Template">
          {PUSH_CART_TEMPLATE_NAME} · ID {PUSH_CART_TEMPLATE_ID}
        </BriefRow>
        <BriefRow label="Delivery">
          {draft.sendMode === "optimizer" ? `Send Time Optimizer · ${draft.sendLabel}` : draft.sendLabel}
        </BriefRow>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-[#E8ECF4] px-4 py-3">
        {SHOW_BRIEF_CHANGES && (
          <button
            type="button"
            className="dc-btn dc-btn-secondary"
            disabled={acted}
            onClick={() => {
              setActed(true);
              onEvent({ type: "changes" });
            }}
          >
            Make changes with Zeno
          </button>
        )}
        {saved ? (
          <p className="flex items-center gap-2 font-manrope text-[13px] font-semibold text-[#17173A]">
            <Check className="size-4 text-[#00A676]" strokeWidth={2.4} />
            Campaign saved
          </p>
        ) : (
          <button
            type="button"
            className="dc-btn dc-btn-primary"
            onClick={() => {
              setSaved(true);
              onEvent({ type: "save", draft });
            }}
          >
            Save campaign
          </button>
        )}
      </div>
    </div>
  );
}

function SavedCard({
  draft,
  campaignName,
  campaignId,
  onEvent,
}: {
  draft: PushCartDraft;
  campaignName: string;
  campaignId: string;
  onEvent: (e: PushFlowEvent) => void;
}) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-[#DDE2EE] bg-white">
      <div className="px-4 py-3">
        <p className="font-manrope text-[13px] font-semibold text-[#17173A]">{campaignName}</p>
        <p className="font-manrope text-[12px] text-[#6F6F8D]">ID {campaignId}</p>
      </div>
      <div className="border-t border-[#E8ECF4] px-4 py-3">
        <button type="button" className="dc-btn dc-btn-primary" onClick={() => onEvent({ type: "preview", draft })}>
          Preview campaign
        </button>
      </div>
    </div>
  );
}

/** Renders whichever card the push-cart flow attached to a Zeno message. */
export default function PushFlowCardView({
  card,
  onEvent,
}: {
  card: PushFlowCard;
  onEvent: (e: PushFlowEvent) => void;
}) {
  if (card.kind === "questions") {
    return (
      <CoriQuestionsCard
        questions={card.questions}
        onComplete={(answers) => onEvent({ type: "questions", stage: card.stage, answers, questions: card.questions })}
      />
    );
  }
  if (card.kind === "content")
    return (
      <ContentCard
        draft={card.draft}
        needsPromo={card.needsPromo}
        version={card.version}
        superseded={card.superseded}
        onEvent={onEvent}
      />
    );
  if (card.kind === "audience") return <AudienceDraftCard draft={card.draft} />;
  if (card.kind === "variations")
    return (
      <PushVariationsCard
        variations={card.variations}
        onApply={(field, value) => onEvent({ type: "field", field, value })}
        onUse={(variation, withImage) => onEvent({ type: "useVariation", variation, withImage })}
      />
    );
  if (card.kind === "saved")
    return <SavedCard draft={card.draft} campaignName={card.campaignName} campaignId={card.campaignId} onEvent={onEvent} />;
  return <BriefCard draft={card.draft} onEvent={onEvent} />;
}
