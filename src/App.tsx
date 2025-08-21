import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StarknetConfig, voyager } from "@starknet-react/core";
import { connectors, provider, chains } from "@/lib/starknet";
import { useAppStore } from "@/stores/useAppStore";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { UploadDatasetModal } from "@/components/UploadDatasetModal";
import { Landing } from "./pages/Landing";
import { Marketplace } from "./pages/Marketplace";
import { Profile } from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isDarkMode, setDarkMode, isUploadModalOpen, setUploadModalOpen } =
    useAppStore();

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setDarkMode(savedTheme === "dark");
    } else {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setDarkMode(mediaQuery.matches);
    }

    // Apply theme on initial load
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          {/* git push second main git@github.com: Permission denied (publickey).
          fatal: Could not read from remote repository. Please make sure you
          have the correct access rights and the repository exists. */}
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/index" element={<Landing />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />

      {/* Global Modals */}
      <UploadDatasetModal
        isOpen={isUploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />
    </div>
  );
};

const App = () => (
  <StarknetConfig
    chains={chains}
    provider={provider}
    connectors={connectors}
    explorer={voyager}
    autoConnect={true}
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </StarknetConfig>
);

export default App;
