import { cn } from "@/lib/utils";
import type { AudienceDraftView } from "@/data/audienceAgentFlow";

/**
 * The segment Cori has drafted, as it stands: what it includes, what it
 * holds back, the reach strategy and the count. Lives in the Cori chat, under
 * the message that built it — a first draft, then the refined one.
 */
export default function AudienceDraftCard({
  draft,
}: {
  draft: AudienceDraftView;
}) {
  const applied = draft.status === "applied";
  return (
    <section className="w-full rounded-lg border border-[#DDE2EE] bg-white p-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <h3 className="font-manrope text-[15px] font-bold text-[#17173A]">{draft.name}</h3>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 font-manrope text-[11px] font-bold uppercase tracking-[0.4px]",
            applied ? "bg-[#E1F7EE] text-[#00805A]" : "bg-[#EEF1F7] text-[#6F6F8D]"
          )}
        >
          {applied ? "Applied" : "Draft"}
        </span>
      </div>
      <p className="mt-0.5 font-manrope text-[13px] text-[#6F6F8D]">Custom audience · Created with Cori</p>

      <div className="mt-4">
        <p className="font-manrope text-sm font-semibold text-[#17173A]">Include users who</p>
        <p className="mt-1 font-manrope text-sm text-[#17173A]">{draft.include}</p>
      </div>

      {draft.refined && (
        <div className="mt-4">
          <p className="font-manrope text-sm font-semibold text-[#17173A]">Exclude users who</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 font-manrope text-sm text-[#17173A]">
            {draft.excludes.map((e) => (
              <li key={e.id}>{e.text}</li>
            ))}
            <li>Meet any separately configured recent-purchaser exclusion criteria</li>
          </ul>
        </div>
      )}

      <dl className="mt-4 space-y-1 font-manrope text-sm">
        <div className="flex gap-2">
          <dt className="text-[#6F6F8D]">Reach strategy</dt>
          <dd className="font-semibold text-[#17173A]">{draft.strategy}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-[#6F6F8D]">Audience count</dt>
          <dd className="font-semibold text-[#17173A]">
            {draft.reach.toLocaleString("en-US")}
            <span className="ml-1.5 font-normal text-[#6F6F8D]">· Calculated from validated segment conditions</span>
          </dd>
        </div>
      </dl>

    </section>
  );
}

