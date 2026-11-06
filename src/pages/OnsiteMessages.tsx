import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import abIcon from "/campaign-assets/qc-app-push-ab.svg";
import splitIcon from "/campaign-assets/qc-app-push-split.svg";
import OnsiteKindIcon from "@/components/campaigns/OnsiteKindIcon";
import { cn } from "@/lib/utils";
import L1Nav from "@/components/campaigns/L1Nav";
import TopNav from "@/components/campaigns/TopNav";
import PageHeader from "@/components/campaigns/PageHeader";
import TabBar from "@/components/campaigns/TabBar";
import TableToolbar from "@/components/campaigns/TableToolbar";
import OnsiteMessageTable from "@/components/campaigns/OnsiteMessageTable";
import Pagination from "@/components/campaigns/Pagination";
import { onsiteTabs } from "@/components/campaigns/onsiteMessages.data";
import ChatInterface from "@/components/ChatInterface";
import MarketingAgentsOverlay from "@/components/MarketingAgentsOverlay";
import { marketingAgents } from "@/data/agents";

const typeIcon = (src: string) => <img src={src} alt="" className="block size-4 shrink-0" />;

/** Regular campaign opens the wizard; A/B and Split aren't available yet. */
const campaignTypes = (go: (route: string) => void, route: string, regularIcon: JSX.Element) => [
  { label: "Regular campaign", icon: regularIcon, onSelect: () => go(route) },
  { label: "A/B campaign", icon: typeIcon(abIcon), disabled: true },
  { label: "Split campaign", icon: typeIcon(splitIcon), disabled: true },
];

/**
 * On-site messages listing page — same shell as Campaigns (reached via the Engage
 * L2 menu), with sample message data in the table.
 */
export default function OnsiteMessages() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);
  const [chatIn, setChatIn] = useState(false);
  const [chatSession, setChatSession] = useState(0);
  const [isAgentsOverlayOpen, setIsAgentsOverlayOpen] = useState(false);
  const [enabledAgents, setEnabledAgents] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (chatOpen) {
      setChatMounted(true);
      setChatSession((n) => n + 1);
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setChatIn(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    setChatIn(false);
    if (isAgentsOverlayOpen) setIsAgentsOverlayOpen(false);
  }, [chatOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleAgent = (agentId: string, agentName: string) => {
    const agent = marketingAgents.find((a) => a.id === agentId);
    if (!agent) return;

    setEnabledAgents((prev) => {
      const next = new Set(prev);
      const isJoining = !next.has(agentId);
      if (isJoining) next.add(agentId);
      else next.delete(agentId);

      window.dispatchEvent(
        new CustomEvent("agentStatusChange", {
          detail: {
            name: agentName,
            status: isJoining ? "join" : "leave",
            icon: agent.icon,
            colorClass: agent.colorClass,
          },
        })
      );
      return next;
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F4F8FF]">
      <L1Nav active="engage" activeEngageItem="onsite" />

      <div className="flex min-w-0 flex-1 flex-col p-2">
        <TopNav onOpenChat={() => setChatOpen(true)} showCoMarketerNudge={false} />

        <div className="mt-2 flex min-h-0 flex-1 gap-2">
          {/* Journeys content */}
          <div className="scroll-slim min-w-0 flex-1 overflow-y-auto px-2 pt-4">
            <PageHeader
              title="On-site messages"
              subtitle="Engage users with in-app and web messages to boost engagement and conversions"
              ctaLabel="Create new"
              ctaMenu={[
                {
                  label: "In-app message",
                  icon: <OnsiteKindIcon kind="inapp" className="size-5" />,
                  submenu: campaignTypes(navigate, "/campaigns/in-app-message", <OnsiteKindIcon kind="inapp" className="size-4" />),
                },
                {
                  label: "Web message",
                  icon: <OnsiteKindIcon kind="web" className="size-5" />,
                  submenu: campaignTypes(navigate, "/campaigns/web-message", <OnsiteKindIcon kind="web" className="size-4" />),
                },
              ]}
            />

            <div className="mt-5 flex items-end justify-between gap-6 border-b border-[#DDE2EE]">
              <TabBar compact={chatOpen} tabs={onsiteTabs} />
              <div className="shrink-0 pb-2">
                <TableToolbar compact={chatOpen} />
              </div>
            </div>

            <div className="mt-4">
              <OnsiteMessageTable />
            </div>

            <div className="mt-4 pb-8">
              <Pagination unitLabel="messages" />
            </div>
          </div>

          {/* Co-marketer chat — docked third column */}
          {chatMounted && (
            <div
              className={cn(
                "flex h-full min-h-0 shrink-0 justify-end overflow-hidden pr-1",
                "transition-[width,opacity] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                "motion-reduce:transition-none",
                chatIn ? "w-[474px] opacity-100" : "w-0 opacity-0"
              )}
              onTransitionEnd={(e) => {
                if (e.target === e.currentTarget && e.propertyName === "width" && !chatIn) {
                  setChatMounted(false);
                }
              }}
            >
              <MarketingAgentsOverlay
                isOpen={isAgentsOverlayOpen}
                onOpenChange={setIsAgentsOverlayOpen}
                enabledAgents={enabledAgents}
                onToggleAgent={handleToggleAgent}
              />
              <ChatInterface
                key={chatSession}
                initialExpanded={false}
                docked
                conversationVariant="campaigns"
                onBotIconClick={() => setIsAgentsOverlayOpen(true)}
                enabledAgents={enabledAgents}
                setEnabledAgents={setEnabledAgents}
                onCloseInterface={() => setChatOpen(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
