/**
 * Stand-in for the contact master the Send test drawer looks addresses up in.
 * One email ID can belong to several contacts; when a test goes to such an
 * address the marketer picks which contact's attributes the test is built from.
 * Addresses not listed here resolve to a single, unambiguous contact.
 */
export interface TestContact {
  mobile: string;
  city: string;
  preference: string;
  affinity: string;
}

export const TEST_CONTACT_COLUMNS = ["Primary key (Mobile)", "Email ID", "City", "Product preference", "Product affinity"];

export const CONTACTS_BY_EMAIL: Record<string, TestContact[]> = {
  "sarah@gmail.com": [
    { mobile: "98765432109", city: "Mumbai", preference: "Face wash", affinity: "High" },
    { mobile: "98765432110", city: "Mumbai", preference: "Face cream", affinity: "Medium" },
  ],
  "rahul.mehta@gmail.com": [
    { mobile: "98200 11457", city: "Pune", preference: "Hair oil", affinity: "High" },
    { mobile: "98200 11458", city: "Pune", preference: "Shampoo", affinity: "Low" },
    { mobile: "99877 02314", city: "Nagpur", preference: "Beard kit", affinity: "Medium" },
  ],
  "priya.sharma@outlook.com": [
    { mobile: "97300 55621", city: "Delhi", preference: "Face serum", affinity: "High" },
    { mobile: "97300 55622", city: "Gurugram", preference: "Sunscreen", affinity: "Medium" },
  ],
  "amit.verma@gmail.com": [
    { mobile: "90040 88213", city: "Lucknow", preference: "Face wash", affinity: "Medium" },
    { mobile: "90040 88214", city: "Lucknow", preference: "Body lotion", affinity: "High" },
    { mobile: "88790 14502", city: "Kanpur", preference: "Face cream", affinity: "Medium" },
  ],
};

/** Addresses to offer under "Recently used". */
export const RECENTLY_USED_TEST_EMAILS = [
  "hardik.shah@example.com",
  "rahul.mehta@gmail.com",
  "priya.sharma@outlook.com",
  "neha.patel@hotmail.com",
  "amit.verma@gmail.com",
];

/** The contacts behind an address — only worth asking about when it's several. */
export function contactsFor(email: string): TestContact[] {
  return CONTACTS_BY_EMAIL[email.trim().toLowerCase()] ?? [];
}
