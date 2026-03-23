import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import LoginSelection from "./pages/LoginSelection";
import AdminLogin from "./pages/AdminLogin";
import CashierLogin from "./pages/CashierLogin";
import StaffLogin from "./pages/StaffLogin";
import BillView from "./pages/BillView";
import Index from "./pages/Index";
import Scanner from "./pages/Scanner";
import Stock from "./pages/Stock";
import Profit from "./pages/Profit";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ProductsExample from "./pages/ProductsExample";
import AIChat from "./pages/AIChat";
import ExpiryHistory from "./pages/ExpiryHistory";
import Description from "./pages/Description";
import InvoiceHistory from "./pages/InvoiceHistory";
import TeamMembers from "./pages/TeamMembers";
import StaffManagement from "./pages/StaffManagement";
import StaffProfile from "./pages/StaffProfile";
import DutiesManagement from "./pages/DutiesManagement";
import DutiesManagementAdvanced from "./pages/DutiesManagementAdvanced";
import CalendarManagement from "./pages/CalendarManagement";
import SecurityDashboard from "./pages/SecurityDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import WorkersDashboard from "./pages/WorkersDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginSelection />} />
            <Route path="/login/admin" element={<AdminLogin />} />
            <Route path="/login/cashier" element={<CashierLogin />} />
            <Route path="/login/staff" element={<StaffLogin />} />
            <Route path="/bill/:invoiceId" element={<BillView />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute allowedRoles={['admin']}><ProductsExample /></ProtectedRoute>} />
            <Route path="/products-test" element={<Navigate to="/products" replace />} />
            <Route path="/ai-chat" element={<ProtectedRoute allowedRoles={['admin', 'cashier']}><AIChat /></ProtectedRoute>} />
            <Route path="/scanner" element={<ProtectedRoute allowedRoles={['admin']}><Scanner /></ProtectedRoute>} />
            <Route path="/expiry-history" element={<ProtectedRoute allowedRoles={['admin']}><ExpiryHistory /></ProtectedRoute>} />
            <Route path="/description" element={<ProtectedRoute allowedRoles={['admin', 'cashier']}><Description /></ProtectedRoute>} />
            <Route path="/invoice-history" element={<ProtectedRoute allowedRoles={['admin', 'cashier']}><InvoiceHistory /></ProtectedRoute>} />
            <Route path="/team-members" element={<ProtectedRoute allowedRoles={['cashier', 'staff']}><TeamMembers /></ProtectedRoute>} />
            <Route path="/stock" element={<ProtectedRoute allowedRoles={['admin']}><Stock /></ProtectedRoute>} />
            <Route path="/profit" element={<ProtectedRoute allowedRoles={['admin']}><Profit /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
            <Route path="/staff-management" element={<ProtectedRoute allowedRoles={['admin']}><StaffManagement /></ProtectedRoute>} />
            <Route path="/staff-profile" element={<ProtectedRoute allowedRoles={['staff']}><StaffProfile /></ProtectedRoute>} />
            <Route path="/security-dashboard" element={<ProtectedRoute allowedRoles={['staff']}><SecurityDashboard /></ProtectedRoute>} />
            <Route path="/delivery-dashboard" element={<ProtectedRoute allowedRoles={['staff']}><DeliveryDashboard /></ProtectedRoute>} />
            <Route path="/workers-dashboard" element={<ProtectedRoute allowedRoles={['staff']}><WorkersDashboard /></ProtectedRoute>} />
            <Route path="/duties-management" element={<ProtectedRoute allowedRoles={['admin']}><DutiesManagement /></ProtectedRoute>} />
            <Route path="/duties-management-advanced" element={<ProtectedRoute allowedRoles={['admin']}><DutiesManagementAdvanced /></ProtectedRoute>} />
            <Route path="/calendar-management" element={<ProtectedRoute allowedRoles={['admin']}><CalendarManagement /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
