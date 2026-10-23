import { useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { DsButton } from "@/components/ui/ds-button";
import Dropdown from "../Dropdown";
import { AndroidIcon, AppleIcon } from "./PlatformIcons";
import imgAndroidPhone from "/campaign-assets/regular-layout/android-phone.png";
import imgPhoneShadow from "/campaign-assets/regular-layout/phone-shadow.svg";
import imgBrandIcon from "/campaign-assets/regular-layout/brand-icon.svg";
import imgLogo from "/campaign-assets/regular-layout/logo-placeholder.svg";
import imgChevron from "/campaign-assets/regular-layout/chevron.svg";
import imgIosNotch from "/campaign-assets/regular-layout/ios-notch.svg";

/**
 * App Push "Regular layout" editor — what "Create new" opens on the Content
 * step. Built to the Regular layout frames in the App push notifications Figma
 * (expanded / collapsed × Android / iOS): the notification form on the left,
 * the live phone preview on the right. Starts empty, so the preview is only as
 * full as what the marketer has typed.
 */

type Platform = "android" | "ios";
type View = "expanded" | "collapsed";
type MediaKind = "image" | "carousel" | "audio" | "gif";
type MediaSource = "url" | "upload";

export interface ActionButton {
  label: string;
  url: string;
}

/** What each platform's "APN interactions" can carry. */
export interface PlatformConfig {
  subtitle: boolean;
  subtitleText: string;
  richMedia: boolean;
  mediaKind: MediaKind;
  mediaSource: MediaSource;
  mediaUrl: string;
  /** Object URL of an uploaded file, and its name. */
  mediaFile: { name: string; src: string } | null;
  background: boolean;
  backgroundMode: "solid" | "gradient";
  backgroundColor: string;
  backgroundColor2: string;
  actionButtons: boolean;
  buttons: ActionButton[];
  /** Android only. */
  sticky: boolean;
  sound: boolean;
  soundFile: string;
}

export interface RegularLayoutDraft {
  /** A quick reply template is the same notification with a reply button the
   *  customer answers from. */
  kind: "regular" | "quickReply";
  /** Quick reply (Android): the hint in the reply box and the thank-you text. */
  replyPlaceholder: string;
  replySubmission: string;
  title: string;
  message: string;
  landing: string;
  customUrl: string;
  apnInteractions: boolean;
  android: PlatformConfig;
  ios: PlatformConfig;
  addOns: boolean;
  addOnPairs: { key: string; value: string }[];
}

const EMPTY_PLATFORM: PlatformConfig = {
  subtitle: false,
  subtitleText: "",
  richMedia: false,
  mediaKind: "image",
  mediaSource: "url",
  mediaUrl: "",
  mediaFile: null,
  background: false,
  backgroundMode: "solid",
  backgroundColor: "#FFCF5C",
  backgroundColor2: "#FF8A5C",
  actionButtons: false,
  buttons: [{ label: "", url: "" }],
  sticky: false,
  sound: false,
  soundFile: "",
};

/** Has the marketer (or Zeno) written anything into the notification yet? */
export function hasDraftContent(d: RegularLayoutDraft): boolean {
  return d.title.trim() !== "" || d.message.trim() !== "";
}

export const EMPTY_REGULAR_DRAFT: RegularLayoutDraft = {
  kind: "regular",
  replyPlaceholder: "",
  replySubmission: "",
  title: "",
  message: "",
  landing: "App Homepage",
  customUrl: "",
  apnInteractions: false,
  android: EMPTY_PLATFORM,
  ios: EMPTY_PLATFORM,
  addOns: false,
  addOnPairs: [{ key: "", value: "" }],
};

/** The reply button's label as the preview shows it. */
const DEFAULT_REPLY_LABEL = "REPLY NOW";
function replyLabel(cfg: PlatformConfig): string {
  return (cfg.buttons[0]?.label ?? "").trim() || DEFAULT_REPLY_LABEL;
}

const LANDING_OPTIONS = [
  "App Homepage",
  "Product page",
  "Cart",
  "Offers",
  "Custom URL",
];
const MAX_BUTTONS = 3;
const MAX_PAIRS = 10;
/** An https image link, or one of the app's own images (a root-relative path). */
const IMAGE_URL = /^(https:\/\/|\/)\S+\.(png|jpe?g)(\?\S*)?$/i;

/** Grey-filled field, same as the Setup step's inputs. */
const fieldClass =
  "h-10 w-full rounded-md border border-transparent bg-[#F4F5F9] px-3 font-manrope text-sm text-[#17173A] outline-none transition-colors placeholder:text-[#8A8AA3] focus:border-[#2F68E5] focus:bg-white";

function Label({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <p className="mb-1.5 font-manrope text-sm font-semibold text-[#17173A]">
      {children}
      {required && <span className="ml-0.5 text-[#E5484D]">*</span>}
    </p>
  );
}

function Radio({
  checked,
  label,
  onSelect,
  name,
}: {
  checked: boolean;
  label: string;
  onSelect: () => void;
  name: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 font-manrope text-sm font-medium text-[#17173A]">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#2F68E5] peer-focus-visible:ring-offset-2",
          checked ? "border-[#2F68E5]" : "border-[#B8BFD3]",
        )}
      >
        {checked && <span className="size-2.5 rounded-full bg-[#2F68E5]" />}
      </span>
      {label}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Switch
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      aria-label={label}
      className="data-[state=checked]:bg-[#00C48C]"
    />
  );
}

/** One feature row inside "Enable APN interactions": label, switch, and — once
 *  it's on — the controls it unlocks. */
function FeatureRow({
  title,
  hint,
  checked,
  onChange,
  disabled,
  children,
}: {
  title: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "border-t border-[#DDE2EE] px-6 py-6",
        disabled && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between gap-6">
        <p className="font-manrope text-sm font-semibold text-[#17173A]">
          {title}
          {hint && (
            <span className="ml-2 text-xs font-normal text-[#6F6F8D]">
              {hint}
            </span>
          )}
        </p>
        <Toggle
          checked={checked}
          onChange={onChange}
          label={title}
          disabled={disabled}
        />
      </div>
      {checked && children && (
        <div className="mt-6 flex flex-col gap-6">{children}</div>
      )}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="w-[279px]">
      <Label>{label}</Label>
      <div className="flex h-10 items-center overflow-hidden rounded-md border border-[#DDE2EE] bg-white">
        <label
          className="relative block h-full w-[93px] shrink-0 cursor-pointer"
          style={{ background: value }}
        >
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            aria-label={`${label} picker`}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          maxLength={7}
          aria-label={label}
          className="h-full min-w-0 flex-1 bg-transparent px-[10px] font-manrope text-sm font-semibold text-[#17173A] outline-none"
        />
      </div>
    </div>
  );
}

/** The platform's interactions: subtitle, rich media, colours, buttons, sound. */
function PlatformFields({
  platform,
  cfg,
  set,
  quickReply,
}: {
  platform: Platform;
  cfg: PlatformConfig;
  set: (patch: Partial<PlatformConfig>) => void;
  /** Quick reply templates swap "Action buttons" for one always-on reply button. */
  quickReply?: {
    placeholder: string;
    submission: string;
    onChange: (patch: Partial<Pick<RegularLayoutDraft, "replyPlaceholder" | "replySubmission">>) => void;
  };
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const urlBad =
    cfg.mediaUrl.trim() !== "" && !IMAGE_URL.test(cfg.mediaUrl.trim());

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    if (cfg.mediaFile) URL.revokeObjectURL(cfg.mediaFile.src);
    set({ mediaFile: { name: file.name, src: URL.createObjectURL(file) } });
  };

  return (
    <>
      <FeatureRow
        title="Subtitle"
        hint="( For SDK 3.4.0+ and above)"
        checked={cfg.subtitle}
        onChange={(subtitle) => set({ subtitle })}
      >
        <div>
          <Label>Subtitle text</Label>
          <input
            className={fieldClass}
            value={cfg.subtitleText}
            onChange={(e) => set({ subtitleText: e.target.value })}
            placeholder="Enter a subtitle"
          />
        </div>
      </FeatureRow>

      <FeatureRow
        title="Rich media"
        hint="( Image, Carousel, Audio, Gif )"
        checked={cfg.richMedia}
        onChange={(richMedia) => set({ richMedia })}
      >
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {(
            [
              ["image", "Image"],
              ["carousel", "Carousel"],
              ["audio", "Audio"],
              ["gif", "GIF"],
            ] as const
          ).map(([id, label]) => (
            <Radio
              key={id}
              name={`${platform}-media-kind`}
              label={label}
              checked={cfg.mediaKind === id}
              onSelect={() => set({ mediaKind: id })}
            />
          ))}
        </div>
        <div className="border-t border-[#DDE2EE]" />
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Radio
            name={`${platform}-media-source`}
            label="URL"
            checked={cfg.mediaSource === "url"}
            onSelect={() => set({ mediaSource: "url" })}
          />
          <Radio
            name={`${platform}-media-source`}
            label="Upload image"
            checked={cfg.mediaSource === "upload"}
            onSelect={() => set({ mediaSource: "upload" })}
          />
        </div>
        {cfg.mediaSource === "url" ? (
          <div>
            <Label required>Media URL</Label>
            <div className="relative">
              <input
                className={cn(
                  fieldClass,
                  "pr-10",
                  urlBad && "border-[#E5484D] bg-white",
                )}
                value={cfg.mediaUrl}
                onChange={(e) => set({ mediaUrl: e.target.value })}
                placeholder="https://website.com/image.png"
                aria-invalid={urlBad}
              />
              <PersonalizeIcon className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-[#6F6F8D]" />
            </div>
            <p
              className={cn(
                "mt-3 font-manrope text-xs leading-4",
                urlBad ? "text-[#E5484D]" : "text-[#6F6F8D]",
              )}
            >
              PNG, JPG &amp; JPEG file formats are supported.
              <br />
              URL must include an HTTPS protocol ending with a supported file
              format (ex: https://website.com/image.png )
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              className="sr-only"
              onChange={(e) => {
                pickFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {cfg.mediaFile ? (
              <>
                <p className="min-w-0 truncate font-manrope text-sm font-semibold text-[#17173A]">
                  {cfg.mediaFile.name}
                </p>
                <DsButton
                  variant="link"
                  onClick={() => fileRef.current?.click()}
                >
                  Change image
                </DsButton>
              </>
            ) : (
              <DsButton
                variant="secondary"
                onClick={() => fileRef.current?.click()}
              >
                Upload image
              </DsButton>
            )}
          </div>
        )}
      </FeatureRow>

      <FeatureRow
        title="Background colour"
        checked={cfg.background}
        onChange={(background) => set({ background })}
      >
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Radio
            name={`${platform}-bg-mode`}
            label="Solid"
            checked={cfg.backgroundMode === "solid"}
            onSelect={() => set({ backgroundMode: "solid" })}
          />
          <Radio
            name={`${platform}-bg-mode`}
            label="Gradient"
            checked={cfg.backgroundMode === "gradient"}
            onSelect={() => set({ backgroundMode: "gradient" })}
          />
        </div>
        <div className="flex flex-wrap gap-5">
          <ColorField
            label="Colour"
            value={cfg.backgroundColor}
            onChange={(backgroundColor) => set({ backgroundColor })}
          />
          {cfg.backgroundMode === "gradient" && (
            <ColorField
              label="Second colour"
              value={cfg.backgroundColor2}
              onChange={(backgroundColor2) => set({ backgroundColor2 })}
            />
          )}
        </div>
      </FeatureRow>

      {quickReply ? (
        <div className="border-t border-[#DDE2EE] px-6 py-6">
          <p className="font-manrope text-sm font-semibold text-[#17173A]">
            Action button
          </p>
          <div className="mt-5 flex flex-col gap-5">
            <div>
              <Label required>Button text</Label>
              <input
                className={fieldClass}
                value={cfg.buttons[0]?.label ?? ""}
                maxLength={20}
                onChange={(e) =>
                  set({
                    actionButtons: true,
                    buttons: [{ url: "", ...cfg.buttons[0], label: e.target.value }],
                  })
                }
                placeholder="Ex: REPLY NOW"
              />
            </div>
            {platform === "android" && (
              <>
                <div>
                  <Label>Placeholder text for response</Label>
                  <input
                    className={fieldClass}
                    value={quickReply.placeholder}
                    onChange={(e) => quickReply.onChange({ replyPlaceholder: e.target.value })}
                    placeholder="Ex: Type your message here"
                  />
                </div>
                <div>
                  <Label>Message submission text</Label>
                  <input
                    className={fieldClass}
                    value={quickReply.submission}
                    onChange={(e) => quickReply.onChange({ replySubmission: e.target.value })}
                    placeholder="Ex: Thank you for your message"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
      <FeatureRow
        title="Action buttons"
        checked={cfg.actionButtons}
        onChange={(actionButtons) => set({ actionButtons })}
      >
        {cfg.buttons.map((b, i) => (
          <div key={i} className="flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <Label>Button {i + 1} text</Label>
              <input
                className={fieldClass}
                value={b.label}
                maxLength={20}
                onChange={(e) =>
                  set({
                    buttons: cfg.buttons.map((x, j) =>
                      j === i ? { ...x, label: e.target.value } : x,
                    ),
                  })
                }
                placeholder="e.g. Shop now"
              />
            </div>
            <div className="min-w-0 flex-1">
              <Label>Landing page URL</Label>
              <input
                className={fieldClass}
                value={b.url}
                onChange={(e) =>
                  set({
                    buttons: cfg.buttons.map((x, j) =>
                      j === i ? { ...x, url: e.target.value } : x,
                    ),
                  })
                }
                placeholder="https://"
              />
            </div>
            {cfg.buttons.length > 1 && (
              <button
                type="button"
                aria-label={`Remove button ${i + 1}`}
                onClick={() =>
                  set({ buttons: cfg.buttons.filter((_, j) => j !== i) })
                }
                className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-md text-[#6F6F8D] hover:bg-[#F4F5F9]"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        ))}
        {cfg.buttons.length < MAX_BUTTONS && (
          <DsButton
            variant="link"
            className="self-start"
            onClick={() =>
              set({ buttons: [...cfg.buttons, { label: "", url: "" }] })
            }
          >
            <Plus /> Add button
          </DsButton>
        )}
      </FeatureRow>
      )}

      {platform === "android" && (
        <FeatureRow
          title="Enable sticky notification"
          checked={cfg.sticky}
          onChange={(sticky) => set({ sticky })}
        />
      )}

      {/* Greyed out in every frame of the design — collapsed-state styling isn't wired up yet. */}
      <FeatureRow
        title="Customize collapsed state"
        checked={false}
        onChange={() => {}}
        disabled
      />

      <FeatureRow
        title="Sound"
        checked={cfg.sound}
        onChange={(sound) => set({ sound })}
      >
        <div>
          <Label>Sound file name</Label>
          <input
            className={fieldClass}
            value={cfg.soundFile}
            onChange={(e) => set({ soundFile: e.target.value })}
            placeholder="Leave empty for the default sound"
          />
        </div>
      </FeatureRow>
    </>
  );
}

/** The personalisation glyph: a person inside a scan frame. */
function PersonalizeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 8V6a3 3 0 0 1 3-3h2M16 3h2a3 3 0 0 1 3 3v2M21 16v2a3 3 0 0 1-3 3h-2M8 21H6a3 3 0 0 1-3-3v-2" />
      <circle cx="12" cy="10" r="2.6" />
      <path d="M7.4 17.2c.8-2.1 2.4-3.2 4.6-3.2s3.8 1.1 4.6 3.2" />
    </svg>
  );
}

/* ---- preview ----------------------------------------------------------- */

function backgroundFor(cfg: PlatformConfig): string | undefined {
  if (!cfg.background) return undefined;
  return cfg.backgroundMode === "gradient"
    ? `linear-gradient(135deg, ${cfg.backgroundColor}, ${cfg.backgroundColor2})`
    : cfg.backgroundColor;
}

function mediaSrc(cfg: PlatformConfig): string | null {
  if (!cfg.richMedia) return null;
  if (cfg.mediaSource === "upload") return cfg.mediaFile?.src ?? null;
  return IMAGE_URL.test(cfg.mediaUrl.trim()) ? cfg.mediaUrl.trim() : null;
}

/** Title, subtitle, message and the action buttons — shared by every card. */
function NotificationText({
  draft,
  cfg,
  compact,
  ios,
}: {
  draft: RegularLayoutDraft;
  cfg: PlatformConfig;
  compact?: boolean;
  /** iOS sets the regular layout's title and message larger than Android does. */
  ios?: boolean;
}) {
  const big = ios && draft.kind !== "quickReply";
  return (
    <div className="min-w-0 flex-1 break-words text-black">
      {draft.title && (
        <p
          className={cn(
            "font-manrope font-semibold leading-[1.2] tracking-[0.29px]",
            compact ? "text-[13px]" : "text-sm",
            big && "font-bold",
            draft.kind === "quickReply" && "truncate font-bold",
          )}
        >
          {draft.title}
        </p>
      )}
      {cfg.subtitle && cfg.subtitleText && (
        <p className="font-manrope text-xs font-medium leading-[1.3]">
          {cfg.subtitleText}
        </p>
      )}
      {draft.message && (
        <p
          className={cn(
            "font-manrope leading-[1.3] tracking-[0.25px]",
            compact ? "text-[11px]" : "text-xs",
            big && !compact && "text-sm leading-5 tracking-[0.42px] text-[#17173A]",
            draft.kind === "quickReply" && "truncate",
          )}
        >
          {draft.message}
        </p>
      )}
    </div>
  );
}

function ActionRow({
  draft,
  cfg,
}: {
  draft: RegularLayoutDraft;
  cfg: PlatformConfig;
}) {
  if (draft.kind === "quickReply") {
    return (
      <p className="px-[15px] pb-3 pt-1 font-manrope text-xs font-semibold uppercase tracking-[0.42px] text-black">
        {replyLabel(cfg)}
      </p>
    );
  }
  const buttons = cfg.actionButtons
    ? cfg.buttons.filter((b) => b.label.trim())
    : [];
  if (buttons.length === 0) return null;
  return (
    <div className="flex gap-4 border-t border-[#DDE2EE] px-[15px] py-2">
      {buttons.map((b, i) => (
        <span
          key={i}
          className="font-manrope text-xs font-bold uppercase tracking-[0.4px] text-[#2F68E5]"
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}

export function AndroidPreview({
  draft,
  view,
}: {
  draft: RegularLayoutDraft;
  view: View;
}) {
  const cfg = draft.android;
  const expanded = view === "expanded";
  const src = mediaSrc(cfg);
  const quick = draft.kind === "quickReply";
  return (
    <div className="relative h-[654px] w-[348px] shrink-0">
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <img
          src={imgAndroidPhone}
          alt=""
          className="pointer-events-none absolute max-w-none"
          style={{
            height: "110.76%",
            left: "-60.38%",
            top: "-5.68%",
            width: "220.75%",
          }}
        />
      </div>
      <span className="absolute left-[16.76px] top-[32.83px] h-[592px] w-[315px] rounded-[10px] bg-[#F4F8FF]" />
      <img
        src={imgPhoneShadow}
        alt=""
        className="absolute left-px top-[654px] h-[39px] w-[320px] max-w-none"
      />
      <div
        className="absolute left-[24px] top-[42px] w-[299px] overflow-hidden rounded-[5px] border border-solid border-[#DDE2EE] bg-white shadow-[0_5px_6px_rgba(0,0,0,0.07)]"
        style={{ background: backgroundFor(cfg) }}
      >
        <div className="flex items-center justify-between border-b border-[#DDE2EE] px-[15px] py-2">
          <div className="flex items-center gap-2">
            <span className="grid size-4 place-items-center rounded-[2px] bg-[#DDE2EE]">
              <img src={imgBrandIcon} alt="" className="size-3 max-w-none" />
            </span>
            <span className="font-manrope text-xs leading-none tracking-[0.25px] text-black">
              Brand name
            </span>
          </div>
          <img
            src={imgChevron}
            alt=""
            className={cn(
              "size-[7px] max-w-none",
              expanded ? "-rotate-90" : "rotate-90",
            )}
          />
        </div>
        <div className="flex min-h-[49px] items-center justify-between gap-[10px] px-[15px] py-[10px]">
          <NotificationText draft={draft} cfg={cfg} />
          {quick && !expanded && src ? (
            <img
              src={src}
              alt=""
              className="size-[33px] shrink-0 rounded-[6px] object-cover"
            />
          ) : (
            <span className="grid size-[33px] shrink-0 place-items-center rounded-[7px] border border-[#DDE2EE] bg-[#DDE2EE]">
              <img src={imgLogo} alt="" className="size-6 max-w-none" />
            </span>
          )}
        </div>
        {expanded && src && (
          <img
            src={src}
            alt=""
            className={cn(
              "block object-cover",
              quick
                ? "mx-[15px] mb-2 h-[98px] w-[269px] rounded-[3px]"
                : "mx-px mb-px h-[137px] w-[297px] rounded-[3px]",
            )}
          />
        )}
        {(expanded || quick) && <ActionRow draft={draft} cfg={cfg} />}
      </div>
    </div>
  );
}

export function IosPreview({
  draft,
  view,
}: {
  draft: RegularLayoutDraft;
  view: View;
}) {
  const cfg = draft.ios;
  const expanded = view === "expanded";
  const src = mediaSrc(cfg);
  const quick = draft.kind === "quickReply";
  return (
    <div className="relative h-[582px] w-[305px] shrink-0">
      <div className="absolute inset-0 overflow-hidden rounded-[32px] border-4 border-solid border-black bg-[#F4F8FF]">
        <img
          src={imgIosNotch}
          alt=""
          className="absolute left-1/2 top-[-4px] h-[17px] w-[106px] max-w-none -translate-x-1/2"
        />
      </div>
      <div
        className={cn(
          "absolute left-[11.5px] w-[282px]",
          expanded ? "top-[27px]" : "top-[25px]",
        )}
      >
        <div
          className={cn(
            "overflow-hidden bg-white",
            expanded ? "rounded-[14px]" : "rounded-[18px]",
          )}
          style={{ background: backgroundFor(cfg) }}
        >
          <div className="flex items-center gap-[10px] p-[10px]">
            <span className="grid size-[33px] shrink-0 place-items-center rounded-[7px] border border-[#DDE2EE] bg-[#DDE2EE]">
              <img src={imgLogo} alt="" className="size-6 max-w-none" />
            </span>
            <NotificationText draft={draft} cfg={cfg} compact={!expanded} ios />
            {/* Collapsed iOS keeps the banner as a thumbnail on the right. */}
            {!expanded && src && (
              <img
                src={src}
                alt=""
                className="size-[33px] shrink-0 rounded-[6px] object-cover"
              />
            )}
          </div>
          {expanded && src && (
            <img
              src={src}
              alt=""
              className="block h-[167px] w-[282px] rounded-b-[14px] object-cover"
            />
          )}
          {expanded && !quick && <ActionRow draft={draft} cfg={cfg} />}
        </div>
        {/* A quick reply's button sits in its own bar under the notification. */}
        {quick && (
          <p className="mt-1 rounded-[10px] bg-white px-[10px] py-2 font-manrope text-sm font-medium uppercase tracking-[0.42px] text-black">
            {replyLabel(cfg)}
          </p>
        )}
      </div>
    </div>
  );
}

function SegmentedIcons({
  value,
  onChange,
}: {
  value: Platform;
  onChange: (p: Platform) => void;
}) {
  return (
    <div className="inline-flex">
      {(
        [
          ["android", AndroidIcon, "Android preview"],
          ["ios", AppleIcon, "iOS preview"],
        ] as const
      ).map(([id, Icon, label], i) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          aria-label={label}
          onClick={() => onChange(id)}
          className={cn(
            "flex h-8 w-10 cursor-pointer items-center justify-center border transition-colors",
            i === 0 ? "rounded-l-md" : "-ml-px rounded-r-md",
            value === id
              ? "relative z-[1] border-[#2F68E5] bg-[#2F68E5] text-white"
              : "border-[#DDE2EE] bg-white text-[#6F6F8D] hover:bg-[#F7F9FC]",
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}

function SegmentedText({
  value,
  onChange,
}: {
  value: View;
  onChange: (v: View) => void;
}) {
  return (
    <div className="inline-flex">
      {(
        [
          ["expanded", "Expanded"],
          ["collapsed", "Collapsed"],
        ] as const
      ).map(([id, label], i) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "flex h-8 cursor-pointer items-center border px-4 font-manrope text-sm font-semibold transition-colors",
            i === 0 ? "rounded-l-md" : "-ml-px rounded-r-md",
            value === id
              ? "relative z-[1] border-[#2F68E5] bg-[#2F68E5] text-white"
              : "border-[#DDE2EE] bg-white text-[#6F6F8D] hover:bg-[#F7F9FC]",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ---- the editor -------------------------------------------------------- */

export default function PushRegularLayoutEditor({
  draft,
  onChange,
  onChangeLayout,
}: {
  draft: RegularLayoutDraft;
  onChange: (patch: Partial<RegularLayoutDraft>) => void;
  onChangeLayout: () => void;
}) {
  const [tab, setTab] = useState<Platform>("android");
  const [previewOs, setPreviewOs] = useState<Platform>("android");
  const [view, setView] = useState<View>("expanded");
  const [primaryKey, setPrimaryKey] = useState("");
  const [userPreview, setUserPreview] = useState<string | null>(null);

  const setPlatform =
    (platform: Platform) => (patch: Partial<PlatformConfig>) =>
      onChange({
        [platform]: { ...draft[platform], ...patch },
      } as Partial<RegularLayoutDraft>);
  const other: Platform = tab === "android" ? "ios" : "android";

  return (
    <div className="flex items-start gap-5">
      {/* Form */}
      <section className="min-w-0 flex-1 rounded-[5px] border border-[#DDE2EE] bg-white">
        <button
          type="button"
          onClick={onChangeLayout}
          className="flex w-full cursor-pointer items-center gap-[10px] border-b border-[#DDE2EE] px-10 py-5 font-manrope text-sm font-semibold text-[#6F6F8D] hover:text-[#17173A]"
        >
          <ArrowLeft className="size-5 text-[#2F68E5]" />
          Change layout
        </button>

        <div className="flex flex-col gap-[30px] px-10 pb-10 pt-8">
          <h2 className="font-manrope text-base font-bold text-[#17173A]">
            {draft.kind === "quickReply"
              ? "Customize your quick reply template"
              : "Customise your notification"}
          </h2>

          <div className="flex max-w-[620px] flex-col gap-[26px]">
            <div>
              <Label required>Title</Label>
              <input
                className={fieldClass}
                value={draft.title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="Enter a title for your notification"
              />
            </div>
            <div>
              <Label required>Message</Label>
              <input
                className={fieldClass}
                value={draft.message}
                onChange={(e) => onChange({ message: e.target.value })}
                placeholder="Enter a message for your notification"
              />
            </div>
            <div className="flex flex-col gap-3">
              <div className="w-[342px] max-w-full">
                <Label required>Landing page URL</Label>
                <Dropdown
                  value={draft.landing}
                  options={LANDING_OPTIONS}
                  widthClass="w-full"
                  heightClass="h-10"
                  onChange={(landing) => onChange({ landing })}
                />
              </div>
              {draft.landing === "Custom URL" && (
                <input
                  className={fieldClass}
                  value={draft.customUrl}
                  onChange={(e) => onChange({ customUrl: e.target.value })}
                  placeholder="https://"
                  aria-label="Custom landing page URL"
                />
              )}
            </div>
          </div>

          {/* Enable APN interactions */}
          <section className="max-w-[620px] overflow-hidden rounded-[5px] border border-[#DDE2EE] bg-white">
            <div className="flex items-start justify-between gap-6 px-6 py-6">
              <div>
                <h3 className="font-manrope text-[15px] font-bold text-[#17173A]">
                  Enable APN interactions
                </h3>
                <p className="mt-1 font-manrope text-[13px] leading-[1.4] text-[#6F6F8D]">
                  Include rich media, action buttons, etc.
                </p>
              </div>
              <Toggle
                checked={draft.apnInteractions}
                onChange={(apnInteractions) => onChange({ apnInteractions })}
                label="Enable APN interactions"
              />
            </div>

            {draft.apnInteractions && (
              <>
                <div className="flex items-center justify-between gap-4 px-6">
                  <div className="flex items-center gap-8">
                    {(
                      [
                        ["android", "Android", AndroidIcon],
                        ["ios", "iOS", AppleIcon],
                      ] as const
                    ).map(([id, label, Icon]) => (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={tab === id}
                        onClick={() => setTab(id)}
                        className={cn(
                          "relative flex cursor-pointer items-center gap-2 px-1 pb-3 pt-1 font-manrope text-sm transition-colors",
                          tab === id
                            ? "font-bold text-[#2F68E5]"
                            : "font-medium text-[#6F6F8D] hover:text-[#17173A]",
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-4",
                            id === "android" && tab !== id && "text-[#6F6F8D]",
                          )}
                        />
                        {label}
                        {tab === id && (
                          <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#2F68E5]" />
                        )}
                      </button>
                    ))}
                  </div>
                  <DsButton
                    variant="link"
                    className="h-auto gap-1.5 whitespace-nowrap pb-3 text-sm"
                    onClick={() =>
                      onChange({
                        [tab]: {
                          ...draft[other],
                          mediaFile: draft[other].mediaFile,
                        },
                      } as Partial<RegularLayoutDraft>)
                    }
                  >
                    <Copy className="size-4" strokeWidth={1.75} />
                    Copy from {other === "android" ? "Android" : "iOS"}
                  </DsButton>
                </div>
                <PlatformFields
                  platform={tab}
                  cfg={draft[tab]}
                  set={setPlatform(tab)}
                  quickReply={
                    draft.kind === "quickReply"
                      ? {
                          placeholder: draft.replyPlaceholder,
                          submission: draft.replySubmission,
                          onChange,
                        }
                      : undefined
                  }
                />
              </>
            )}
          </section>

          {/* Add-on options */}
          <section className="max-w-[620px] overflow-hidden rounded-[5px] border border-[#DDE2EE] bg-white">
            <div className="flex items-start justify-between gap-6 px-6 py-6">
              <div>
                <h3 className="font-manrope text-[15px] font-bold text-[#17173A]">
                  Add-on options
                </h3>
                <p className="mt-1 font-manrope text-[13px] leading-[1.4] text-[#6F6F8D]">
                  Enable custom key value or overwrite the comment of the
                  notification
                </p>
              </div>
              <Toggle
                checked={draft.addOns}
                onChange={(addOns) => onChange({ addOns })}
                label="Add-on options"
              />
            </div>
            {draft.addOns && (
              <div className="flex flex-col gap-4 border-t border-[#DDE2EE] px-6 py-6">
                {draft.addOnPairs.map((p, i) => (
                  <div key={i} className="flex items-end gap-3">
                    <div className="min-w-0 flex-1">
                      <Label>Key</Label>
                      <input
                        className={fieldClass}
                        value={p.key}
                        onChange={(e) =>
                          onChange({
                            addOnPairs: draft.addOnPairs.map((x, j) =>
                              j === i ? { ...x, key: e.target.value } : x,
                            ),
                          })
                        }
                        placeholder="Key"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Label>Value</Label>
                      <input
                        className={fieldClass}
                        value={p.value}
                        onChange={(e) =>
                          onChange({
                            addOnPairs: draft.addOnPairs.map((x, j) =>
                              j === i ? { ...x, value: e.target.value } : x,
                            ),
                          })
                        }
                        placeholder="Value"
                      />
                    </div>
                    {draft.addOnPairs.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Remove pair ${i + 1}`}
                        onClick={() =>
                          onChange({
                            addOnPairs: draft.addOnPairs.filter(
                              (_, j) => j !== i,
                            ),
                          })
                        }
                        className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-md text-[#6F6F8D] hover:bg-[#F4F5F9]"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
                {draft.addOnPairs.length < MAX_PAIRS && (
                  <DsButton
                    variant="link"
                    className="self-start"
                    onClick={() =>
                      onChange({
                        addOnPairs: [
                          ...draft.addOnPairs,
                          { key: "", value: "" },
                        ],
                      })
                    }
                  >
                    <Plus /> Add key value pair
                  </DsButton>
                )}
              </div>
            )}
          </section>
        </div>
      </section>

      {/* Preview */}
      <aside className="sticky top-0 w-[440px] shrink-0 self-start rounded-[5px] border border-[#DDE2EE] bg-white px-5 py-8">
        <div className="flex flex-col items-center gap-6">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <SegmentedIcons value={previewOs} onChange={setPreviewOs} />
              <SegmentedText value={view} onChange={setView} />
            </div>
            <DsButton
              variant="secondary"
              className="h-8 px-3"
              disabled
              aria-label="Send a test notification"
            >
              <Send /> Test
            </DsButton>
          </div>

          <div className="w-full">
            <Label required>Preview for a specific user</Label>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setUserPreview(primaryKey.trim() || null);
              }}
            >
              <input
                className={fieldClass}
                value={primaryKey}
                onChange={(e) => setPrimaryKey(e.target.value)}
                placeholder="Enter primary key"
              />
              <DsButton
                type="submit"
                className="w-10 shrink-0 px-0"
                disabled={!primaryKey.trim()}
                aria-label="Preview for this user"
              >
                <ArrowRight />
              </DsButton>
            </form>
            {userPreview && (
              <p className="mt-2 font-manrope text-xs text-[#6F6F8D]">
                Personalised values for{" "}
                <span className="font-semibold text-[#17173A]">
                  {userPreview}
                </span>{" "}
                will show here once the attribute lookup is connected.
              </p>
            )}
          </div>

          {previewOs === "android" ? (
            <AndroidPreview draft={draft} view={view} />
          ) : (
            <IosPreview draft={draft} view={view} />
          )}

          <p className="text-center font-manrope text-xs leading-4 tracking-[0.42px] text-[#6F6F8D]">
            Note: This preview is for reference purposes only. The actual
            display may vary across devices with different resolutions.
          </p>
        </div>
      </aside>
    </div>
  );
}
