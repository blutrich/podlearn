import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthGuard } from "@/components/AuthGuard";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import Episodes from "./pages/Episodes";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import TestPayment from "./pages/TestPayment";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Index />} />
            
            {/* Protected routes */}
            <Route element={<AuthGuard />}>
              <Route path="/browse" element={<Browse />} />
              <Route path="/episodes/:podcastId" element={<Episodes />} />
              <Route path="/dashboard" element={<Navigate to="/browse" replace />} />
              <Route path="/test-payment" element={<TestPayment />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
