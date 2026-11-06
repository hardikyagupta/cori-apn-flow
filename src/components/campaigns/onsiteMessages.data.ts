export type OnsiteStatus =
  | "DRAFT"
  | "RUNNING"
  | "PAUSED"
  | "SCHEDULED"
  | "COMPLETED"
  | "SUSPENDED"
  | "ARCHIVED";

export type OnsiteKind = "inapp" | "web";

export interface OnsiteMessage {
  id: string;
  name: string;
  refId: string;
  status: OnsiteStatus;
  kind: OnsiteKind;
  lastModified: string;
  viewed: string;
  clicked: string;
  conversions: string;
  revenue: string;
  totalResponses: string;
  uplift: string;
}

const NA = "NA";

const row = (
  id: string,
  name: string,
  refId: string,
  kind: OnsiteKind,
  status: OnsiteStatus,
  lastModified: string,
  m: [string, string, string, string, string, string] = ["0", "0", NA, NA, NA, NA]
): OnsiteMessage => ({
  id,
  name,
  refId,
  kind,
  status,
  lastModified,
  viewed: m[0],
  clicked: m[1],
  conversions: m[2],
  revenue: m[3],
  totalResponses: m[4],
  uplift: m[5],
});

// [viewed, clicked, conversions, revenue, total responses, uplift %]
export const onsiteMessages: OnsiteMessage[] = [
  row("1", "Flash_Sale_Countdown_Banner", "ID - 2748", "web", "RUNNING", "Oct 28, 2026 10:54 AM", ["182,450", "14,208", "3,112", "$48,920", "16,540", "12.4"]),
  row("2", "Diwali_Offer_Popup", "ID - 2741", "web", "SCHEDULED", "Oct 27, 2026 06:12 PM", ["0", "0", "0", "$0", NA, NA]),
  row("3", "Cart_Exit_Intent_Discount", "ID - 2736", "web", "RUNNING", "Oct 27, 2026 02:40 PM", ["64,300", "5,871", "902", "$11,260", "6,204", "6.8"]),
  row("4", "Welcome_Tooltip_Tour", "ID - 1934", "inapp", "COMPLETED", "Oct 26, 2026 11:05 AM", ["92,010", "21,774", "8,430", "$0", "22,310", "18.1"]),
  row("5", "Rate_Us_After_Purchase", "ID - 1931", "inapp", "PAUSED", "Oct 25, 2026 04:48 PM", ["12,880", "1,023", "211", "$0", "1,140", "2.3"]),
  row("6", "Free_Shipping_Threshold_Bar", "ID - 2729", "web", "RUNNING", "Oct 25, 2026 09:30 AM", ["238,760", "9,552", "2,874", "$36,415", "10,201", "8.9"]),
  row("7", "Loyalty_Points_Nudge", "ID - 1927", "inapp", "RUNNING", "Oct 24, 2026 01:22 PM", ["45,120", "6,318", "1,540", "$9,870", "6,702", "9.6"]),
  row("8", "Newsletter_Signup_Overlay", "ID - 2718", "web", "SUSPENDED", "Oct 22, 2026 05:15 PM", ["40,120", "2,980", "640", "$0", "3,260", "4.9"]),
  row("9", "Back_In_Stock_Alert", "ID - 1922", "inapp", "DRAFT", "Oct 21, 2026 12:36 PM"),
  row("10", "Black_Friday_Early_Access", "ID - 2711", "web", "DRAFT", "Oct 20, 2026 03:57 PM"),
  row("11", "App_Update_Reminder", "ID - 1915", "inapp", "COMPLETED", "Oct 15, 2026 10:28 AM", ["71,430", "8,214", "3,092", "$0", "8,560", "14.2"]),
  row("12", "Summer_Sale_Hero_Banner", "ID - 2587", "web", "ARCHIVED", "Sep 30, 2026 05:15 PM", ["310,550", "18,903", "4,411", "$62,180", "20,114", "7.5"]),
];

export const onsiteTabs = [
  { label: "All", count: 4616 },
  { label: "Draft", count: 2719 },
  { label: "Running", count: 78 },
  { label: "Paused", count: 1638 },
  { label: "Scheduled", count: 1 },
  { label: "Completed", count: 120 },
  { label: "Suspended", count: 54 },
  { label: "Archived", count: 6 },
];
