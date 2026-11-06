import { useState } from "react";
import { Check, MoreVertical } from "lucide-react";
import OnsiteKindIcon from "./OnsiteKindIcon";
import {
  onsiteMessages,
  type OnsiteKind,
  type OnsiteMessage,
  type OnsiteStatus,
} from "./onsiteMessages.data";

const GRID = "grid-cols-[358px_1.4fr_1fr_1fr_1fr_1fr_1.1fr_1fr]";

const HEADERS = [
  "Last modified",
  "Viewed",
  "Clicked",
  "Conversions",
  "Revenue",
  "Total responses",
  "Uplift (%)",
];

const STATUS_STYLES: Record<OnsiteStatus, string> = {
  DRAFT: "bg-[#E7EAFF] border-[#6F6F8D] text-[#6F6F8D]",
  RUNNING: "bg-[#E7F7F1] border-[#00C48C] text-[#00A674]",
  PAUSED: "bg-[#FFF8E7] border-[#FFCF5C] text-[#E7B231]",
  SCHEDULED: "bg-[#E7EDFF] border-[#0A8FFD] text-[#0084F4]",
  COMPLETED: "bg-[#EEF0F6] border-[#9AA3BC] text-[#5B6483]",
  SUSPENDED: "bg-[#FFF0E7] border-[#FC5E02] text-[#FC5E02]",
  ARCHIVED: "bg-[#F4F4F7] border-[#C7CEE0] text-[#8A8AA3]",
};

function Badge({ status }: { status: OnsiteStatus }) {
  return (
    <span
      className={`inline-flex h-[18px] items-center rounded-[2px] border px-2 font-manrope text-[10px] font-bold uppercase leading-none tracking-[0.6px] ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange?: () => void }) {
  return (
    <button
      onClick={onChange}
      aria-label="Select"
      className={`grid h-4 w-4 shrink-0 place-items-center rounded-[3px] border transition-colors ${
        checked ? "border-[#2F68E5] bg-[#2F68E5] text-white" : "border-[#C7CEE0] bg-white"
      }`}
    >
      {checked && <Check className="h-3 w-3" strokeWidth={3} />}
    </button>
  );
}

function KindGlyph({ kind }: { kind: OnsiteKind }) {
  return (
    <div className="grid h-7 w-7 place-items-center text-[#6F6F8D]">
      <OnsiteKindIcon kind={kind} />
    </div>
  );
}

function Cell({ value, first }: { value: string; first?: boolean }) {
  return (
    <div
      className={`px-5 font-manrope text-sm ${first ? "text-left" : "text-right"} ${
        value === "NA" ? "text-[#6F6F8D]" : "text-[#17173A]"
      }`}
    >
      {value}
    </div>
  );
}

function Row({ m }: { m: OnsiteMessage }) {
  const [checked, setChecked] = useState(false);
  return (
    <div className={`group grid ${GRID} h-[85px] items-center border-b border-[#EDF0F7] bg-white transition-colors hover:bg-[#F5F8FF]`}>
      <div className="sticky left-0 z-10 flex h-full items-center gap-3.5 border-r border-[#EDF0F7] bg-white pl-4 pr-4 group-hover:bg-[#F5F8FF]">
        <Checkbox checked={checked} onChange={() => setChecked((v) => !v)} />
        <KindGlyph kind={m.kind} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-manrope text-[13px] font-medium tracking-[0.29px] text-[#17173A]">{m.name}</p>
          <div className="mt-1.5 flex items-center gap-2.5">
            <span className="font-manrope text-xs tracking-[0.25px] text-[#6F6F8D]">{m.refId}</span>
            <span className="h-3 w-px bg-[#DDE2EE]" />
            <Badge status={m.status} />
          </div>
        </div>
        <button
          aria-label="More actions"
          className="shrink-0 text-[#6F6F8D] opacity-0 transition-opacity group-hover:opacity-100"
        >
          <MoreVertical className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </div>
      <Cell value={m.lastModified} first />
      <Cell value={m.viewed} />
      <Cell value={m.clicked} />
      <Cell value={m.conversions} />
      <Cell value={m.revenue} />
      <Cell value={m.totalResponses} />
      <Cell value={m.uplift} />
    </div>
  );
}

export default function OnsiteMessageTable({ messages = onsiteMessages }: { messages?: OnsiteMessage[] }) {
  const [allChecked, setAllChecked] = useState(false);
  return (
    <div className="scroll-slim overflow-x-auto rounded-lg border border-[#DDE2EE] bg-white shadow-[0px_5px_10px_0px_rgba(23,23,58,0.05)]">
      <div className="min-w-[1180px]">
        <div className={`grid ${GRID} h-[52px] items-center border-b border-[#DDE2EE]`}>
          <div className="sticky left-0 z-10 flex h-full items-center gap-3.5 border-r border-[#EDF0F7] bg-white pl-4 pr-4">
            <Checkbox checked={allChecked} onChange={() => setAllChecked((v) => !v)} />
            <span className="font-manrope text-sm font-medium text-[#6F6F8D]">Message name</span>
          </div>
          {HEADERS.map((h, i) => (
            <div
              key={h}
              className={`px-5 font-manrope text-sm font-medium text-[#6F6F8D] ${i === 0 ? "text-left" : "text-right"}`}
            >
              {h}
            </div>
          ))}
        </div>
        <div>
          {messages.map((m) => (
            <Row key={m.id} m={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
