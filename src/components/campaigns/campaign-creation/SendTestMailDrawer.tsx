import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronLeft, ChevronRight, Info, Lightbulb, Plus, ThumbsUp, Upload, X } from "lucide-react";
import { RECENTLY_USED_TEST_EMAILS, TEST_CONTACT_COLUMNS, contactsFor } from "./testRecipients.data";
import { cn } from "@/lib/utils";

/** Verified sending domains on the account — kept in sync with the one in
 *  CampaignContentStep's own From row (duplicated rather than imported, to
 *  avoid a circular import between the two files). */
const DOMAINS = ["m3m.in", "mailer.m3m.in", "news.m3m.in", "offers.m3m.in"];

const fieldClass =
  "w-full rounded-md border-0 bg-[#F7F9FC] px-3 py-2.5 font-manrope text-sm text-[#17173A] outline-none transition-colors placeholder:text-[#A0A0A0] focus:bg-[#F0F3F9]";

const MAX_TEST_EMAILS = 10;
const MAX_TEST_LIST_USERS = 100;

/** Parked for now: the "N of M selected" line under the contact table. */
const SHOW_SELECTED_COUNT = false;

function parseEmails(value: string): string[] {
  return value
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

/** Right-side drawer reached from "Send a test email" — a one-off send that
 *  never touches the campaign draft, so all of its fields live locally. */
export default function SendTestMailDrawer({
  open,
  onClose,
  defaultSubject,
  defaultSenderName,
  defaultDomain,
  testListMode = false,
}: {
  open: boolean;
  onClose: () => void;
  defaultSubject: string;
  defaultSenderName: string;
  defaultDomain: string;
  /** The campaign's audience is a user data table, so the test goes to an
   *  uploaded list of test users rather than typed-in addresses. */
  testListMode?: boolean;
}) {
  const [shown, setShown] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [senderName, setSenderName] = useState(defaultSenderName);
  const [domain, setDomain] = useState(defaultDomain || DOMAINS[0]);
  const [usePreset, setUsePreset] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  // Which contact (row) is picked for each address that has several.
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [page, setPage] = useState(0);
  const [sentTo, setSentTo] = useState<string[] | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [inputMode, setInputMode] = useState<"emails" | "csv">("emails");
  const [testFile, setTestFile] = useState<{ name: string; users: number } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    setSubject(defaultSubject);
    setSenderName(defaultSenderName);
    setDomain(defaultDomain || DOMAINS[0]);
    setUsePreset(false);
    setEmailAddress("");
    setSelections({});
    setPage(0);
    setSentTo(null);
    setPickerOpen(false);
    setInputMode("emails");
    setTestFile(null);
    setFileError(null);
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
    // Only reset from the campaign's current values the moment the drawer
    // opens — not on every keystroke made to those fields afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const addRecentEmail = (email: string) => {
    const current = parseEmails(emailAddress);
    if (current.includes(email) || current.length >= MAX_TEST_EMAILS) return;
    setEmailAddress(current.length ? `${emailAddress}, ${email}` : email);
    setSentTo(null);
    setPickerOpen(false);
  };

  // With a user data table audience the test can go to an uploaded list instead.
  const useCsv = testListMode && inputMode === "csv";
  const emails = parseEmails(emailAddress);
  // Addresses that map to several contacts need one picked before sending.
  const ambiguous = emails.filter((e, i) => emails.indexOf(e) === i && contactsFor(e).length > 1);
  const needsContact = ambiguous.length > 0;
  const showPicker = !useCsv && needsContact && pickerOpen && !sentTo;
  const pageIndex = Math.min(page, Math.max(ambiguous.length - 1, 0));
  const current = ambiguous[pageIndex];
  // The first ID is selected until another is picked.
  const selectedFor = (e: string) => selections[e.toLowerCase()] ?? 0;
  const resolved = ambiguous.length; // every address starts on its first ID
  // Subject, sender email and domain are optional for a test send — only a
  // recipient is needed.
  const canSend = useCsv ? testFile !== null : emails.length > 0;

  const readTestList = async (file: File | undefined) => {
    if (!file) return;
    setSentTo(null);
    if (!/\.csv$/i.test(file.name)) {
      setTestFile(null);
      setFileError("Please upload a .CSV file.");
      return;
    }
    const rows = (await file.text()).split(/\r?\n/).filter((l) => l.trim());
    // First row is the header.
    const users = Math.max(rows.length - 1, 0);
    if (users === 0) {
      setTestFile(null);
      setFileError("This file has no users in it.");
      return;
    }
    if (users > MAX_TEST_LIST_USERS) {
      setTestFile(null);
      setFileError(`This file has ${users} users — the limit is ${MAX_TEST_LIST_USERS}.`);
      return;
    }
    setFileError(null);
    setTestFile({ name: file.name, users });
  };

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
          "relative flex h-full w-full max-w-[680px] flex-col bg-white shadow-[-20px_0_60px_rgba(23,23,58,0.15)] transition-transform duration-300 ease-out",
          shown ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-[#DDE2EE] px-6 py-5">
          <h2 className="font-manrope text-xl font-bold text-[#17173A]">Send test mail</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-full text-[#8A8AA3] transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>

        <div ref={bodyRef} className="flex-1 overflow-y-auto px-6 py-6">
          {testListMode && (
            <div role="radiogroup" aria-label="How to add test recipients" className="mb-5 flex flex-wrap items-center gap-x-8 gap-y-3">
              {(
                [
                  { id: "emails", label: "Add email IDs" },
                  { id: "csv", label: "Add a CSV file" },
                ] as const
              ).map((o) => {
                const on = inputMode === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      setInputMode(o.id);
                      setSentTo(null);
                    }}
                    className="flex items-center gap-2.5 text-left"
                  >
                    <span
                      className={cn(
                        "grid size-[18px] shrink-0 place-items-center rounded-full border-2 transition-colors",
                        on ? "border-[#2F68E5]" : "border-[#C3CAD9]"
                      )}
                    >
                      {on && <span className="size-2 rounded-full bg-[#2F68E5]" />}
                    </span>
                    <span className={cn("font-manrope text-sm text-[#17173A]", on ? "font-semibold" : "font-medium")}>
                      {o.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {useCsv ? (
          <div className="rounded-lg border border-[#DDE2EE] p-5">
            <p className="font-manrope text-sm font-semibold leading-6 text-[#6F6F8D]">
              Test your campaign on a set of specific test users. You can simply upload a test list in{" "}
              <span className="font-bold text-[#17173A]">.CSV format</span>
            </p>
            <p className="mt-1.5 flex items-center gap-2 font-manrope text-sm text-[#6F6F8D]">
              <Info className="size-4 shrink-0 fill-[#3B8EF3] text-white" strokeWidth={2} />
              Maximum of {MAX_TEST_LIST_USERS} users.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                void readTestList(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void readTestList(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "mt-5 flex min-h-[200px] flex-wrap items-center justify-center gap-4 rounded-md border border-dashed px-4 py-10 transition-colors",
                dragging ? "border-[#2F68E5] bg-[#F4F8FF]" : "border-[#DDE2EE] bg-white"
              )}
            >
              {testFile ? (
                <div className="flex items-center gap-3 font-manrope text-sm text-[#17173A]">
                  <Check className="size-4 text-[#00C48C]" strokeWidth={2.6} />
                  <span className="font-semibold">{testFile.name}</span>
                  <span className="text-[#6F6F8D]">· {testFile.users} users</span>
                  <button
                    type="button"
                    aria-label="Remove file"
                    onClick={() => {
                      setTestFile(null);
                      setSentTo(null);
                    }}
                    className="grid size-6 place-items-center rounded-full text-[#8A8AA3] transition-colors hover:bg-[#F0F3F9] hover:text-[#17173A]"
                  >
                    <X className="size-4" strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-manrope text-sm uppercase tracking-[0.42px] text-[#6F6F8D]">
                    Drag &amp; drop
                  </span>
                  <span className="font-manrope text-base uppercase text-[#6F6F8D]">or</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-[#DDE2EE] bg-white px-4 font-manrope text-sm font-bold uppercase tracking-[0.42px] text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
                  >
                    <Upload className="size-4" strokeWidth={2} />
                    Click to upload
                  </button>
                </>
              )}
            </div>
            {fileError && (
              <p role="alert" className="mt-2 font-manrope text-xs font-medium text-[#E5484D]">
                {fileError}
              </p>
            )}
          </div>

          ) : (
          <div className="rounded-lg border border-[#DDE2EE] p-5">
            <label className="flex items-center gap-2.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={usePreset}
                onClick={() => setUsePreset((v) => !v)}
                className={cn(
                  "grid size-[18px] shrink-0 place-items-center rounded border-2 transition-colors",
                  usePreset ? "border-[#2F68E5] bg-[#2F68E5]" : "border-[#C3CAD9] bg-white"
                )}
              >
                {usePreset && (
                  <svg viewBox="0 0 12 12" className="size-2.5 text-white" fill="none">
                    <path
                      d="M2.5 6.2 4.8 8.5 9.5 3.8"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              <span className="font-manrope text-sm text-[#17173A]">Use preset test email addresses</span>
            </label>

            <label className="mb-1.5 mt-5 flex items-center gap-1 font-manrope text-sm font-semibold text-[#17173A]">
              Email address
              <span className="text-[#FC5E02]">*</span>
            </label>
            <textarea
              value={emailAddress}
              onChange={(e) => {
                setEmailAddress(e.target.value);
                setSentTo(null);
                setPickerOpen(false);
              }}
              placeholder="for ex: john.doe@gmail.com"
              rows={4}
              className={cn(fieldClass, "resize-none")}
            />
            <p className="mt-3 font-manrope text-xs leading-[18px] text-[#8A8AA3]">
              Note: You can add upto {MAX_TEST_EMAILS} email addresses seperated by commas. Test emails
              are excluded from billing.
            </p>

            <div className="my-4 border-t border-[#EEF1F7]" />

            <p className="mb-3 font-manrope text-sm font-bold text-[#17173A]">Recently used</p>
            <div className="flex flex-wrap gap-2.5">
              {RECENTLY_USED_TEST_EMAILS.map((email) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => addRecentEmail(email)}
                  className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#DDE2EE] bg-white py-1.5 pl-3.5 pr-2.5 font-manrope text-sm text-[#17173A] transition-colors hover:border-[#2F68E5] hover:bg-[#F4F8FF]"
                >
                  <span className="truncate">{email}</span>
                  <Plus className="size-4 shrink-0 text-[#6F6F8D]" strokeWidth={2.2} />
                </button>
              ))}
            </div>
          </div>
          )}

          <div ref={slotRef} className={cn("scroll-mt-4", (sentTo || showPicker) && "mt-5")}>
            {sentTo && (
            <div className="rounded border border-dashed border-[#DDE2EE] px-5 py-5">
              <div className="flex items-start gap-2.5">
                <ThumbsUp className="mt-0.5 size-[18px] shrink-0 text-[#00C48C]" strokeWidth={2} />
                <div>
                  <p className="font-manrope text-sm font-bold leading-5 text-[#17173A]">
                    Test email sent successfully to:
                  </p>
                  <p className="mt-2 break-words font-manrope text-sm leading-5 text-[#17173A]">
                    {useCsv && testFile ? `${testFile.name} (${testFile.users} users)` : sentTo.join(", ")}
                  </p>
                </div>
              </div>
            </div>
          )}
            {showPicker && current && (
              <div className="rounded-lg border border-[#DDE2EE] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-manrope text-sm font-bold text-[#17173A]">
                      {ambiguous.length > 1
                        ? "We found multiple IDs for some email addresses"
                        : `We found ${contactsFor(current).length} IDs linked to ${current}`}
                    </p>
                    <p className="mb-3 mt-1 font-manrope text-sm text-[#6F6F8D]">
                      {ambiguous.length > 1
                        ? "Select the IDs to test."
                        : "Select the attributes to include in the test email."}
                    </p>
                  </div>
                  {ambiguous.length > 1 && (
                    <div className="flex shrink-0 items-center gap-1 font-manrope text-sm font-semibold text-[#17173A]">
                      <button
                        type="button"
                        aria-label="Previous email"
                        disabled={pageIndex === 0}
                        onClick={() => setPage(pageIndex - 1)}
                        className="grid size-7 place-items-center rounded text-[#6F6F8D] transition-colors hover:bg-[#F0F3F9] disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ChevronLeft className="size-4" strokeWidth={2.2} />
                      </button>
                      <span className="min-w-[2.25rem] text-center tabular-nums">
                        {pageIndex + 1}/{ambiguous.length}
                      </span>
                      <button
                        type="button"
                        aria-label="Next email"
                        disabled={pageIndex === ambiguous.length - 1}
                        onClick={() => setPage(pageIndex + 1)}
                        className="grid size-7 place-items-center rounded text-[#6F6F8D] transition-colors hover:bg-[#F0F3F9] disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ChevronRight className="size-4" strokeWidth={2.2} />
                      </button>
                    </div>
                  )}
                </div>

                {ambiguous.length > 1 && (
                  <p className="mb-2 flex items-center gap-2 font-manrope text-sm font-semibold text-[#17173A]">
                    {current}
                    <span className="font-medium text-[#6F6F8D]">
                      · {contactsFor(current).length} IDs
                    </span>
                  </p>
                )}

                <div className="overflow-x-auto rounded-[4px] border border-[#DDE2EE] shadow-[0_5px_6px_rgba(23,23,58,0.07)]">
                  <table className="w-full min-w-[560px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#DDE2EE]">
                        <th className="w-12" aria-label="Select" />
                        {TEST_CONTACT_COLUMNS.map((c) => (
                          <th
                            key={c}
                            className="px-4 py-3 font-manrope text-xs font-bold tracking-[0.3px] text-[#6F6F8D]"
                          >
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {contactsFor(current).map((c, i) => {
                        const active = selectedFor(current) === i;
                        return (
                          <tr
                            key={i}
                            onClick={() => {
                              setSelections((prev) => ({ ...prev, [current.toLowerCase()]: i }));
                              setSentTo(null);
                            }}
                            className="cursor-pointer border-b border-[#DDE2EE] last:border-b-0 hover:bg-[#F7F9FC]"
                          >
                            <td className="pl-4">
                              <span
                                role="radio"
                                aria-checked={active}
                                className={cn(
                                  "grid size-4 place-items-center rounded-full border-2",
                                  active ? "border-[#143F93]" : "border-[#C3CAD9]"
                                )}
                              >
                                {active && <span className="size-2 rounded-full bg-[#143F93]" />}
                              </span>
                            </td>
                            {[c.mobile, current, c.city, c.preference, c.affinity].map((v, j) => (
                              <td
                                key={j}
                                className="whitespace-nowrap px-4 py-[18px] font-manrope text-xs font-semibold text-[#17173A]"
                              >
                                {v}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {SHOW_SELECTED_COUNT && ambiguous.length > 1 && (
                  <p className="mt-3 font-manrope text-xs text-[#6F6F8D]">
                    {resolved} of {ambiguous.length} selected
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-5 rounded-lg border border-[#DDE2EE] p-5">
            <div className="flex items-center gap-2">
              <Lightbulb className="size-4 shrink-0 text-[#F5A623]" strokeWidth={2} />
              <p className="font-manrope text-sm font-bold text-[#17173A]">
                Points to remember while testing your email
              </p>
            </div>
            <ul className="mt-3 space-y-2">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-[#00C48C]" strokeWidth={2.6} />
                <span className="font-manrope text-sm text-[#17173A]">
                  {"A prefix of 'TEST - ' will be added in the subject line."}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-[#00C48C]" strokeWidth={2.6} />
                <span className="font-manrope text-sm text-[#17173A]">
                  {"Test emails bypass blocklist/suppression rules, unlike live campaigns."}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-[#00C48C]" strokeWidth={2.6} />
                <span className="font-manrope text-sm text-[#17173A]">
                  {"If the entered email ID is not present in the contact master, a non-personalized email is sent."}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#DDE2EE] px-6 py-4">
          <button
            type="button"
            disabled={!canSend}
            onClick={() => {
              // A shared email ID: the first click asks which contact's
              // attributes to use; the next one sends.
              if (!useCsv && needsContact && !pickerOpen) {
                setPickerOpen(true);
                setPage(0);
                window.setTimeout(() => slotRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
                return;
              }
              setSentTo(emails);
              setPickerOpen(false);
              setUsePreset(false);
              window.setTimeout(() => slotRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
            }}
            className="dc-btn dc-btn-primary"
          >
            Send test
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
