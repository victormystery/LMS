import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import useNotifications from "@/hooks/useNotifications";
import NotificationsBell from "@/components/NotificationsBell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BookCatalog from "./pages/BookCatalog";
import UserDashboard from "./pages/UserDashboard";
import LibrarianDashboard from "./pages/LibrarianDashboard";
import BookDetail from "./pages/BookDetail";

const queryClient = new QueryClient();

const App = () => {
  useNotifications();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
          <Toaster />
          <Sonner />
          <NotificationsBell />
        </div>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/catalog" element={<BookCatalog />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="/my-books" element={<UserDashboard />} />
            <Route path="/librarian-dashboard" element={<LibrarianDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
