import thumbExclusiveDeals from "/campaign-assets/template-thumbs/tpl-exclusive-deals.png";
import thumbWelcomeFamily from "/campaign-assets/template-thumbs/tpl-welcome-family.png";
import thumbPriceDrop from "/campaign-assets/template-thumbs/tpl-price-drop.png";
import thumbGiftCouple from "/campaign-assets/template-thumbs/tpl-gift-couple.png";
import thumbDoubleIndulgence from "/campaign-assets/template-thumbs/tpl-double-indulgence.jpg";
import thumbIndependenceDay from "/campaign-assets/template-thumbs/tpl-independence-day.png";
import thumbElevatedGrooming from "/campaign-assets/template-thumbs/tpl-elevated-grooming.jpg";
import thumbPanchpushp from "/campaign-assets/template-thumbs/tpl-panchpushp.jpg";
import thumbFragranceNotes from "/campaign-assets/template-thumbs/tpl-fragrance-notes.jpg";
import thumbCologneLaunch from "/campaign-assets/template-thumbs/tpl-cologne-launch.jpg";
import thumbAIWinbackShipping from "/campaign-assets/template-thumbs/tpl-ai-winback-shipping.png";
import thumbContinueWatching from "/campaign-assets/template-thumbs/tpl-continue-watching.png";
import thumbLibFlashSale from "/campaign-assets/template-thumbs/tpl-lib-flash-sale.png";
import thumbLibStreetwear from "/campaign-assets/template-thumbs/tpl-lib-streetwear.png";
import thumbLibBeautyGlow from "/campaign-assets/template-thumbs/tpl-lib-beauty-glow.png";
import thumbLibMonochrome from "/campaign-assets/template-thumbs/tpl-lib-monochrome.png";
import thumbLibSkincare from "/campaign-assets/template-thumbs/tpl-lib-skincare.png";
import thumbLibBirthday from "/campaign-assets/template-thumbs/tpl-lib-birthday.png";
import thumbLibGrocery from "/campaign-assets/template-thumbs/tpl-lib-grocery.png";
import thumbLibElectronics from "/campaign-assets/template-thumbs/tpl-lib-electronics.png";

/**
 * Saved email templates for the Content step's picker.
 *
 * `image` is a real, rendered thumbnail (cropped to the top of the template)
 * for the account's recent templates. `preview` decides what the card draws
 * instead when there's no `image` — most saved templates in a real account
 * have never had a thumbnail generated, which is why "none", the empty-frame
 * placeholder, is the common case rather than the exception there.
 */
export type TemplatePreview =
  | "none"
  | "launch"
  | "brand"
  | "heading"
  | "band"
  | "giftset"
  | "text"
  | "receipt"
  | "skincare"
  // App Push's own drawn mockups — a push notification card rather than an
  // email screenshot, but the same picker/card shell as everything above.
  | "push-regular"
  | "push-carousel"
  | "push-timer";

/** App Push's preview panel toggles between OS and expanded/collapsed — a
 *  template can carry a real mock for each combination it's been rendered for. */
export type PushPreviewKey =
  | "ios-expanded"
  | "ios-collapsed"
  | "android-expanded"
  | "android-collapsed";

export interface EmailTemplate {
  id: number;
  name: string;
  preview: TemplatePreview;
  /** A real rendered thumbnail; takes over from `preview` when set. */
  image?: string;
  /** Shown under "Create new" and in filters; also drives the AI badge. */
  aiGenerated?: boolean;
  /** Already running in a live campaign — badged on the thumbnail. */
  inUse?: boolean;
  /** App Push only — real mocks per OS/expanded combination. Falls back to
   *  `image` for any combination not covered here. */
  pushPreviews?: Partial<Record<PushPreviewKey, string>>;
  /** App Push — what the notification says, for templates without per-platform mocks. */
  pushCard?: import("./TemplatePushMock").PushCardContent;
}

/** The template the AI flow drafts for the "continue watching" prompt. */
export const CONTINUE_WATCHING_TEMPLATE_ID = 9102;

/** The most recently touched templates — these carry real thumbnails. */
const RECENT: EmailTemplate[] = [
  {
    id: CONTINUE_WATCHING_TEMPLATE_ID,
    name: "Continue Watching — Viva One",
    preview: "none",
    image: thumbContinueWatching,
    aiGenerated: true,
  },
  {
    id: 9101,
    name: "Still Thinking About It? — Free Shipping",
    preview: "none",
    image: thumbAIWinbackShipping,
    aiGenerated: true,
  },
  { id: 868, name: "Exclusive Deals — Gold Members", preview: "none", image: thumbExclusiveDeals },
  { id: 8289, name: "Welcome to the Family", preview: "none", image: thumbWelcomeFamily, inUse: true },
  { id: 8286, name: "Price Drop Alert", preview: "none", image: thumbPriceDrop },
  { id: 8284, name: "Festive Gifting — Couple", preview: "none", image: thumbGiftCouple },
  { id: 8283, name: "Double the Indulgence", preview: "none", image: thumbDoubleIndulgence },
  { id: 8281, name: "Independence Day Delight", preview: "none", image: thumbIndependenceDay },
  { id: 8280, name: "Elevated Grooming Rituals", preview: "none", image: thumbElevatedGrooming },
  { id: 8278, name: "Panchpushp Launch", preview: "none", image: thumbPanchpushp },
  { id: 8273, name: "Fragrance Notes — Cologne", preview: "none", image: thumbFragranceNotes },
  { id: 8275, name: "Introducing the New Cologne", preview: "none", image: thumbCologneLaunch },
];

export const emailTemplates: EmailTemplate[] = RECENT;

/** Netcore-provided starting points — shown under the "Template library" tab,
 *  as opposed to the account's own "Saved templates". Real thumbnails, same
 *  as the account's recent templates below. */
export const templateLibrary: EmailTemplate[] = [
  { id: 90001, name: "Flash Sale — 40% Off", preview: "none", image: thumbLibFlashSale },
  { id: 90002, name: "We Haven't Seen You Lately", preview: "none", image: thumbLibStreetwear },
  { id: 90003, name: "Glow Up Beauty Drop", preview: "none", image: thumbLibBeautyGlow },
  { id: 90004, name: "Be You — Monochrome Edit", preview: "none", image: thumbLibMonochrome },
  { id: 90005, name: "Skincare Ritual Launch", preview: "none", image: thumbLibSkincare },
  { id: 90006, name: "Birthday Surprise Offer", preview: "none", image: thumbLibBirthday },
  { id: 90007, name: "Fresh From The Garden", preview: "none", image: thumbLibGrocery },
  { id: 90008, name: "New Year Audio Drop", preview: "none", image: thumbLibElectronics },
];

export interface TemplateFolder {
  id: string;
  name: string;
  templateCount: number;
  folderCount: number;
}

/** Folders under "Saved templates" — organizing the account's own templates.
 *  Everything not filed into one of these shows under "Unorganized templates". */
export const savedTemplateFolders: TemplateFolder[] = [
  { id: "newsletters", name: "Newsletters", templateCount: 6, folderCount: 0 },
  { id: "promotions", name: "Promotions", templateCount: 9, folderCount: 0 },
  { id: "abandoned-cart", name: "Abandoned cart", templateCount: 3, folderCount: 0 },
  { id: "welcome-series", name: "Welcome series", templateCount: 4, folderCount: 0 },
  { id: "product-launches", name: "Product launches", templateCount: 5, folderCount: 0 },
  { id: "seasonal-sales", name: "Seasonal sales", templateCount: 7, folderCount: 0 },
  { id: "loyalty-program", name: "Loyalty program", templateCount: 2, folderCount: 0 },
  { id: "re-engagement", name: "Re-engagement", templateCount: 4, folderCount: 0 },
  { id: "order-updates", name: "Order updates", templateCount: 3, folderCount: 0 },
  { id: "event-invites", name: "Event invites", templateCount: 2, folderCount: 0 },
  { id: "customer-feedback", name: "Customer feedback", templateCount: 1, folderCount: 0 },
  { id: "vip-offers", name: "VIP offers", templateCount: 5, folderCount: 0 },
];
