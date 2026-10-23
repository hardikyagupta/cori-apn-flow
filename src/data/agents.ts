import { Bot, ClipboardCheck, FileText, FlaskConical, Search, Share, LightbulbIcon, Calendar, Workflow } from "lucide-react";
import React from 'react';
import { generateAgentAvatar } from '@/lib/agentAvatar';

// Define a list of pastel background color classes
const pastelColorClasses = [
  "bg-blue-100 text-blue-800",
  "bg-purple-100 text-purple-800",
  "bg-green-100 text-green-800",
  "bg-yellow-100 text-yellow-800",
  "bg-pink-100 text-pink-800",
  "bg-indigo-100 text-indigo-800",
];

// Define the interface for a marketing agent
export interface MarketingAgent {
  id: string;
  name: string;
  description: string;
  avatarSrc?: string; // SVG file path for the agent's avatar
  icon?: React.ElementType; // Lucide icon as fallback
  initials: string; // Added initials for AvatarFallback
  colorClass: string; // Added color class property
}

// Define the array of marketing agents
export const marketingAgents: MarketingAgent[] = [
  {
    id: "co-marketer",
    name: "Zeno",
    description: "Helps plan and optimize marketing campaigns",
    avatarSrc: "/AgentIcons/Co-Marketer.svg",
    icon: Bot, // Lucide icon as fallback
    initials: "CO",
    colorClass: pastelColorClasses[0],
  },
  {
    id: "content-agent",
    name: "Content agent",
    description: "Assists with content creation and optimization",
    avatarSrc: "/AgentIcons/Content-agent.svg",
    icon: FileText, // Lucide icon as fallback
    initials: "CA",
    colorClass: pastelColorClasses[1],
  },
  {
    id: "segment-agent",
    name: "Segment agent",
    description: "Provides market research and customer segmentation",
    avatarSrc: "/AgentIcons/Segment-agent.svg",
    icon: Search, // Lucide icon as fallback
    initials: "SA",
    colorClass: pastelColorClasses[2],
  },
  {
    id: "scheduler-agent",
    name: "Scheduler agent",
    description: "Recommends the best times for your campaign",
    avatarSrc: "/AgentIcons/Scheduler-agent.svg",
    icon: Calendar, // Lucide icon as fallback
    initials: "SC",
    colorClass: pastelColorClasses[3],
  },
  {
    id: "insight-agent",
    name: "Insight agent",
    description: "Analyzes campaign performance and suggests improvements",
    avatarSrc: "/AgentIcons/Insight-agent.svg",
    icon: LightbulbIcon, // Lucide icon as fallback
    initials: "IA",
    colorClass: pastelColorClasses[4],
  },
  {
    id: "journey-agent",
    name: "Journey agent",
    description: "Designs multi-step, multi-channel customer journeys",
    icon: Workflow, // Lucide icon (no dedicated SVG avatar yet)
    initials: "JA",
    colorClass: pastelColorClasses[5],
  },
  {
    // Same identity (name + generated avatar) as the "starter-journey-review"
    // entry in customAgents.ts's /agents catalog — this id is what the
    // journey builder's docked co-marketer hands audit turns off to (see
    // JourneyBuilder.tsx's buildJourneyAuditReply/handleAuditFlow), so an
    // audit reads as the same agent whether it's opened from /agents or
    // triggered inline from the canvas.
    id: "journey-review-agent",
    name: "Journey review agent",
    description: "QAs a journey against its own trigger, node and branch rules before it goes live.",
    avatarSrc: generateAgentAvatar('Journey review agent'),
    icon: ClipboardCheck,
    initials: "JR",
    colorClass: pastelColorClasses[1],
  },
  {
    // Same identity (name + generated avatar) as the "starter-journey-experiment"
    // entry in customAgents.ts's /agents catalog — this id is what the journey
    // builder's docked co-marketer hands "Experiment" turns off to (see
    // JourneyBuilder.tsx's handleExperimentJourney/handleCoMarketerBeforeSend),
    // so an experiment reads as the same agent whether it's opened from
    // /agents or triggered inline from the canvas.
    id: "journey-experiment-agent",
    name: "Journey Optimization Agent",
    description:
      "Analyzes an existing Journey to identify optimization opportunities, explains the likely impact and cause in plain language, and helps marketers validate improvements through controlled experiments before rolling them out.",
    avatarSrc: generateAgentAvatar('Journey Optimization Agent'),
    icon: FlaskConical,
    initials: "JO",
    colorClass: pastelColorClasses[2],
  },
];