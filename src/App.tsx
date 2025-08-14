import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Contas from "./pages/Contas";
import Transacoes from "./pages/Transacoes";
import Cartoes from "./pages/Cartoes";
import Categorias from "./pages/Categorias";
import ProjecaoFluxo from "./pages/ProjecaoFluxo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/contas" element={<Contas />} />
          <Route path="/transacoes" element={<Transacoes />} />
          <Route path="/cartoes" element={<Cartoes />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/projecao-fluxo" element={<ProjecaoFluxo />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
