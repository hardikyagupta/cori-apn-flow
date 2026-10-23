import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AtmosphereProvider } from "@/contexts/AtmosphereContext";
import { ReportThemeProvider } from "@/contexts/ReportThemeContext";
import { DecisioningSetupProvider } from "@/contexts/DecisioningSetupContext";
import { CustomAgentsProvider } from "@/contexts/CustomAgentsContext";
import Index from "./pages/Index";
import AiDashboard from "./pages/AiDashboard";
import Agents from "./pages/Agents";
import Settings from "./pages/Settings";
import Campaigns from "./pages/Campaigns";
import AudienceSegments from "./pages/AudienceSegments";
import AnalyticsFunnel from "./pages/AnalyticsFunnel";
import Products from "./pages/Products";
import Journeys from "./pages/Journeys";
import JourneyCreate from "./pages/JourneyCreate";
import JourneyBuilder from "./pages/JourneyBuilder";
import JourneyReport from "./pages/JourneyReport";
import DecisioningEngine from "./pages/DecisioningEngine";
import DecisioningEnginePreview from "./pages/DecisioningEnginePreview";
import DecisioningConfiguration from "./pages/DecisioningConfiguration";
import DecisioningPerformance from "./pages/DecisioningPerformance";
import DecisioningSetup from "./pages/DecisioningSetup";
import ObjectiveCreationFlow from "./components/decisioning/ObjectiveCreationFlow";
import ObjectiveCreationFlowV2 from "./components/decisioning/objective-v2/ObjectiveCreationFlowV2";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AtmosphereProvider>
        <ReportThemeProvider>
        <DecisioningSetupProvider>
        <CustomAgentsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/ai-dashboard" element={<AiDashboard />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/campaigns" element={<Campaigns />} />
              {/* /campaigns/email, /campaigns/app-push, … open that creation wizard. */}
              <Route path="/campaigns/:channel" element={<Campaigns />} />
              <Route path="/audience/segments" element={<AudienceSegments />} />
              <Route path="/analytics/funnel" element={<AnalyticsFunnel />} />
              <Route path="/content/products" element={<Products />} />
              <Route path="/journeys" element={<Journeys />} />
              <Route path="/journeys/create" element={<JourneyCreate />} />
              <Route path="/journeys/new" element={<JourneyBuilder />} />
              <Route path="/journeys/:journeyId/report" element={<JourneyReport />} />
              <Route path="/decisioning-engine" element={<DecisioningEngine />} />
              <Route path="/decisioning-engine/preview" element={<DecisioningEnginePreview />} />
              <Route path="/decisioning-engine/configuration" element={<DecisioningConfiguration />} />
              <Route path="/decisioning-engine/objective/performance" element={<DecisioningPerformance />} />
              <Route path="/decisioning-engine/setup" element={<DecisioningSetup />} />
              <Route path="/decisioning-engine/objective/new" element={<ObjectiveCreationFlow />} />
              <Route path="/decisioning-engine/objective/v2" element={<ObjectiveCreationFlowV2 />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CustomAgentsProvider>
        </DecisioningSetupProvider>
        </ReportThemeProvider>
      </AtmosphereProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
