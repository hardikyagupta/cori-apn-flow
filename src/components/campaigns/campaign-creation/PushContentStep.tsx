import { useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import PushTemplateDrawer from "./PushTemplateDrawer";
import PushRegularLayoutEditor, {
  EMPTY_REGULAR_DRAFT,
  type RegularLayoutDraft,
} from "./PushRegularLayoutEditor";
import { appPushTemplates } from "./appPushTemplates.data";
import type { ContentValues } from "./CampaignContentStep";
import iconAddCircle from "/campaign-assets/layouts/add-circle.svg";
import iconImage from "/campaign-assets/layouts/image.svg";
import iconCarousel1 from "/campaign-assets/layouts/image-carousel-1.svg";
import iconCarousel2 from "/campaign-assets/layouts/image-carousel-2.svg";
import iconEdge from "/campaign-assets/layouts/image-edge.svg";
import iconSmall from "/campaign-assets/layouts/image-small.svg";
import iconHeart from "/campaign-assets/layouts/heart.svg";
import iconMultiA from "/campaign-assets/layouts/multi-a.svg";
import iconMultiB from "/campaign-assets/layouts/multi-b.svg";
import iconQuickLines from "/campaign-assets/layouts/quick-lines.svg";
import iconQuickBubble from "/campaign-assets/layouts/quick-bubble.svg";
import iconProductCards from "/campaign-assets/layouts/product-cards.svg";
import iconProductDots from "/campaign-assets/layouts/product-dots.svg";
import iconNewTag from "/campaign-assets/layouts/new-tag.svg";

/**
 * Layout picker for App Push, built to the "Select layout" frame in the App
 * push notifications Figma (node 14349:37713): 149 × 144 cards on a 20px grid,
 * a 119 × 87 wireframe thumbnail on each, and the design's own artwork for the
 * image / heart / chat glyphs.
 */

type LayoutKind =
  | "overlay"
  | "timer"
  | "carousel"
  | "edge"
  | "rating"
  | "small"
  | "progress"
  | "multi"
  | "quick"
  | "product";

const ADVANCE_LAYOUTS: { id: LayoutKind; label: string; isNew?: boolean }[] = [
  { id: "overlay", label: "Overlay on image" },
  { id: "timer", label: "Timer" },
  { id: "carousel", label: "Carousel (E2E)" },
  { id: "edge", label: "Edge to edge" },
  { id: "rating", label: "Rating" },
  { id: "small", label: "Small image" },
  { id: "progress", label: "Progress bar" },
  { id: "multi", label: "Multi - icon", isNew: true },
  { id: "quick", label: "Quick reply", isNew: true },
  { id: "product", label: "Product set", isNew: true },
];

/* ---- wireframe pieces -------------------------------------------------- */

const White = ({
  w,
  h,
  className,
  style,
}: {
  w?: number;
  h: number;
  className?: string;
  style?: CSSProperties;
}) => (
  <span
    className={cn("block shrink-0 bg-white", className)}
    style={{ width: w, height: h, ...style }}
  />
);

/** Two stacked title bars — the Figma's 45 × 5 and 87 × 5 pair. */
const TitleBars = () => (
  <span className="flex flex-col gap-[4px] pl-[5px]">
    <White w={45} h={5} />
    <White w={87} h={5} />
  </span>
);

/** A white block with the image glyph set at the design's own offset. */
const ImageBlock = ({
  w,
  h,
  icon,
  ml,
  mt,
  iw,
  ih,
}: {
  w: number;
  h: number;
  icon: string;
  ml: number;
  mt: number;
  iw: number;
  ih: number;
}) => (
  <span
    className="relative block shrink-0 bg-white"
    style={{ width: w, height: h }}
  >
    <img
      src={icon}
      alt=""
      className="absolute max-w-none"
      style={{ left: ml, top: mt, width: iw, height: ih }}
    />
  </span>
);

const inset = (t: string, r: string, b: string, l: string): CSSProperties => ({
  inset: `${t} ${r} ${b} ${l}`,
});

function Wireframe({ kind }: { kind: LayoutKind }) {
  switch (kind) {
    case "overlay":
      return (
        <>
          <span
            className="absolute rounded-[5px] bg-white"
            style={inset("3.45%", "2.52%", "3.45%", "2.52%")}
          />
          <img
            src={iconImage}
            alt=""
            className="absolute block max-w-none"
            style={{
              ...inset("19.37%", "35.68%", "42.56%", "35.13%"),
              width: "28.7%",
              height: "38.07%",
            }}
          />
          <span
            className="absolute rounded-b-[5px]"
            style={{
              left: 3,
              top: 57,
              width: 113,
              height: 27,
              backgroundImage:
                "linear-gradient(89deg, rgb(221,226,238) 0.2%, rgb(255,255,255) 99.8%)",
            }}
          />
          <span
            className="absolute bg-[#6F6F8D] opacity-30"
            style={inset("72.41%", "64.53%", "23.49%", "8.4%")}
          />
          <span
            className="absolute bg-[#6F6F8D] opacity-30"
            style={inset("82.41%", "31.21%", "10.92%", "8.4%")}
          />
        </>
      );
    case "timer":
      return (
        <>
          <span
            className="absolute rounded-[5px] bg-white"
            style={inset("39.08%", "8.4%", "10.34%", "8.4%")}
          />
          <img
            src={iconImage}
            alt=""
            className="absolute block max-w-none"
            style={{
              ...inset("45.8%", "34.84%", "16.12%", "35.97%"),
              width: "29.2%",
              height: "38.1%",
            }}
          />
          <span
            className="absolute bg-white"
            style={inset("14.94%", "74.64%", "80.97%", "8.4%")}
          />
          <span
            className="absolute bg-white"
            style={inset("24.94%", "53.78%", "68.39%", "8.4%")}
          />
          <span className="absolute left-[67px] top-[8px] h-[20px] w-[42px] rounded-[5px] bg-[#6F6F8D]" />
          <span className="absolute left-[72px] top-[18px] flex h-[8px] w-[32px] -translate-y-1/2 items-center justify-center font-manrope text-[12px] font-bold leading-none text-white">
            01:02
          </span>
        </>
      );
    case "carousel":
      return (
        <span className="absolute inset-0 flex gap-[5px] overflow-hidden">
          {[
            { icon: iconCarousel1, h: 47.2, ml: 27.5, mt: 11.2, ih: 24.05 },
            { icon: iconCarousel2, h: 48, ml: 23.5, mt: 9.64, ih: 23.74 },
          ].map((p, i) => (
            <span
              key={i}
              className="flex h-[87px] shrink-0 flex-col gap-[10px] rounded-[5px] bg-[#DDE2EE] px-px py-[10px]"
            >
              <span className="flex flex-col gap-[4px] px-[10px]">
                <White w={26.842} h={2.967} />
                <White w={59.879} h={4.833} />
              </span>
              <ImageBlock
                w={80}
                h={p.h}
                icon={p.icon}
                ml={p.ml}
                mt={p.mt}
                iw={25.36}
                ih={p.ih}
              />
            </span>
          ))}
        </span>
      );
    case "edge":
      return (
        <span className="absolute inset-0 flex flex-col gap-[12px] px-px py-[6px]">
          <TitleBars />
          <ImageBlock
            w={117}
            h={48}
            icon={iconEdge}
            ml={45}
            mt={15}
            iw={21.73}
            ih={21.32}
          />
        </span>
      );
    case "rating":
      return (
        <span className="absolute inset-0 flex flex-col gap-[4px] px-[3px] py-[6px]">
          <span className="flex flex-col gap-[5px]">
            <TitleBars />
            <ImageBlock
              w={113}
              h={39}
              icon={iconEdge}
              ml={45}
              mt={9}
              iw={21.73}
              ih={21.32}
            />
          </span>
          <span className="flex gap-[10px] pl-[5px]">
            {[0, 1, 2, 3, 4].map((i) => (
              <img
                key={i}
                src={iconHeart}
                alt=""
                className="size-[12px] max-w-none"
              />
            ))}
          </span>
        </span>
      );
    case "small":
      return (
        <span className="absolute inset-0 flex flex-col gap-[15px] p-[10px]">
          <span className="flex gap-[10px]">
            <White w={25} h={4} />
            <White w={39} h={4} />
          </span>
          <span className="flex gap-[5px]">
            <span className="flex w-[37px] shrink-0 flex-col bg-white px-[6px] py-[7px] rounded-[5px]">
              <img
                src={iconSmall}
                alt=""
                className="max-w-none"
                style={{ width: 25.36, height: 23.74 }}
              />
            </span>
            <span className="flex flex-col gap-[10px]">
              <span className="flex w-[54px] flex-col gap-[5px]">
                <White w={32.211} h={3.56} />
                <White w={54} h={5} />
              </span>
              <span className="block h-[12px] w-[38px] rounded-[50px] bg-[#6F6F8D]" />
            </span>
          </span>
        </span>
      );
    case "progress":
      return (
        <span className="absolute inset-0 flex flex-col gap-[15px] px-[10px] pb-[8px] pt-[10px]">
          <span className="flex w-[54px] flex-col gap-[5px]">
            <White w={32.211} h={3.56} />
            <White w={54} h={13} />
          </span>
          <span className="flex items-end gap-[5px]">
            <span className="relative block h-[5px] w-[63px] rounded-[5px] bg-white">
              <span className="absolute left-0 top-0 h-[5px] w-[29px] rounded-[5px] bg-[#6F6F8D]" />
            </span>
            <span className="block w-[32px] font-manrope text-[12px] font-bold leading-none text-[#6F6F8D]">
              01:02
            </span>
          </span>
        </span>
      );
    case "multi":
      return (
        <>
          <span className="absolute left-[10px] top-[10px] flex w-[54px] flex-col gap-[5px]">
            <White w={32.211} h={3.56} />
            <White w={54} h={6} />
          </span>
          {[
            { dx: -42, icon: iconMultiA },
            { dx: -14, icon: iconMultiB },
            { dx: 14, icon: iconMultiA },
            { dx: 42, icon: iconMultiA },
          ].map((p, i) => (
            <img
              key={i}
              src={p.icon}
              alt=""
              className="absolute size-[24px] max-w-none -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `calc(50% + ${p.dx}px)`,
                top: "calc(50% + 17.5px)",
              }}
            />
          ))}
        </>
      );
    case "quick":
      return (
        <span className="absolute inset-0 flex flex-col gap-[6px] p-[10px]">
          <span className="flex w-[90px] flex-col gap-[5px]">
            <White w={32.211} h={3.56} />
            <White w={54} h={13} />
          </span>
          <span className="flex items-center gap-[6px]">
            <img
              src={iconQuickLines}
              alt=""
              className="max-w-none"
              style={{ width: 16, height: 18 }}
            />
            <img
              src={iconQuickBubble}
              alt=""
              className="-m-px max-w-none"
              style={{ width: 42, height: 42 }}
            />
          </span>
        </span>
      );
    case "product":
      return (
        <span className="absolute inset-0 flex flex-col gap-[12px] px-px py-[6px]">
          <TitleBars />
          <span className="flex flex-col items-center gap-[7px] pl-[5px]">
            <img
              src={iconProductCards}
              alt=""
              className="max-w-none"
              style={{ width: 102.75, height: 35 }}
            />
            <img
              src={iconProductDots}
              alt=""
              className="max-w-none"
              style={{ width: 26, height: 6 }}
            />
          </span>
        </span>
      );
  }
}

/** A 149 × 144 layout card: 14px title over a 119 × 87 thumbnail. */
function LayoutCard({
  label,
  selected,
  isNew,
  onClick,
  children,
}: {
  label: string;
  selected: boolean;
  isNew?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "relative flex h-[144px] w-[149px] shrink-0 cursor-pointer flex-col items-start gap-[15px] rounded-[5px] border border-solid bg-white p-[15px] text-left transition-shadow hover:shadow-[0_3px_12px_rgba(23,23,58,0.1)]",
        selected
          ? "border-[#2F68E5] ring-1 ring-[#2F68E5]"
          : "border-[#DDE2EE]",
      )}
    >
      <span
        className={cn(
          "flex h-[12px] w-[119px] items-center whitespace-nowrap font-manrope text-[14px] font-semibold leading-none tracking-[0.29px]",
          selected ? "text-[#2F68E5]" : "text-[#17173A]",
        )}
      >
        {label}
      </span>
      <span className="relative block h-[87px] w-[119px] shrink-0 overflow-hidden rounded-[5px] bg-[#DDE2EE]">
        {children}
      </span>
      {isNew && (
        <img
          src={iconNewTag}
          alt="New"
          className="absolute left-[122px] top-[-4px] h-[16px] w-[28px] max-w-none"
        />
      )}
    </button>
  );
}

/**
 * App Push's Content step: pick a layout to build from, or use a saved
 * template. "existing templates" opens the template drawer; whichever
 * template is picked there is kept on the campaign and shown up top.
 */
export default function PushContentStep({
  values,
  onChange,
}: {
  values: ContentValues;
  onChange: (patch: Partial<ContentValues>) => void;
}) {
  const [layout, setLayout] = useState<LayoutKind | "new" | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // "Create new" opens the Regular layout editor; the draft lives here so it
  // survives a trip back to the layout picker.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<RegularLayoutDraft>(EMPTY_REGULAR_DRAFT);
  const template = appPushTemplates.find((t) => t.id === values.templateId);

  const drawer = (
    <PushTemplateDrawer
      open={drawerOpen}
      selectedId={values.templateId}
      onClose={() => setDrawerOpen(false)}
      onCreateNew={() => {
        setDrawerOpen(false);
        setLayout("new");
        setEditing(true);
      }}
      onSelect={(id) => {
        onChange({ templateId: id });
        setDrawerOpen(false);
      }}
    />
  );

  if (editing) {
    return (
      <>
        <PushRegularLayoutEditor
          draft={draft}
          onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          onChangeLayout={() => setEditing(false)}
        />
        {drawer}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-[40px] rounded-lg border border-[#DDE2EE] bg-white p-[40px]">
      <div className="flex flex-wrap items-baseline gap-x-[14px] gap-y-1">
        <h2 className="font-manrope text-[20px] font-bold leading-none tracking-[0.42px] text-[#17173A]">
          Select layout
        </h2>
        <p className="font-manrope text-[14px] leading-none tracking-[0.29px] text-[#6F6F8D]">
          or use from{" "}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="cursor-pointer text-[#0A8FFD] hover:underline"
          >
            existing templates
          </button>
        </p>
      </div>

      {template && (
        <div className="-mt-4 flex items-center gap-4 rounded-lg border border-[#C9D7F5] bg-[#F4F8FF] p-3">
          <span className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-white">
            {template.image && (
              <img
                src={template.image}
                alt=""
                className="h-full w-full object-cover object-top"
              />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-manrope text-xs font-semibold uppercase tracking-[0.4px] text-[#6F6F8D]">
              Using template
            </p>
            <p className="truncate font-manrope text-sm font-semibold text-[#17173A]">
              {template.name}{" "}
              <span className="font-normal text-[#6F6F8D]">
                · ID {template.id}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="dc-btn dc-btn-secondary shrink-0"
          >
            Change
          </button>
        </div>
      )}

      <div className="flex flex-col gap-[10px]">
        <div className="flex flex-col gap-[20px]">
          <p className="font-manrope text-[16px] font-semibold leading-none tracking-[0.33px] text-black">
            Regular layouts{" "}
            <span className="font-normal text-[#6F6F8D]">
              (Create customized templates with rich media like images, audio
              files, GIFs etc.)
            </span>
          </p>
          <div>
            <LayoutCard
              label="Create new"
              selected={layout === "new"}
              onClick={() => {
                setLayout("new");
                setEditing(true);
              }}
            >
              <span className="grid h-full w-full place-items-center">
                <img
                  src={iconAddCircle}
                  alt=""
                  className="size-[40px] max-w-none"
                />
              </span>
            </LayoutCard>
          </div>
        </div>

        <div className="mt-[30px] flex flex-col gap-[20px]">
          <p className="font-manrope text-[16px] font-semibold leading-none tracking-[0.33px] text-black">
            Advance layouts
          </p>
          {/* 1163px is the Figma row: seven 149px cards on a 20px grid, so the other
              three wrap to a second row however wide the window gets. */}
          <div className="flex max-w-[1163px] flex-wrap gap-[20px]">
            {ADVANCE_LAYOUTS.map((l) => (
              <LayoutCard
                key={l.id}
                label={l.label}
                isNew={l.isNew}
                selected={layout === l.id}
                onClick={() => setLayout(l.id)}
              >
                <Wireframe kind={l.id} />
              </LayoutCard>
            ))}
          </div>
        </div>
      </div>

      {drawer}
    </div>
  );
}
