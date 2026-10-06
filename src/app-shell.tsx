import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import DevRoleSwitcher from "@/components/DevRoleSwitcher";
import { AuthProvider } from "@/contexts/AuthContext";
import { BookingsProvider } from "@/contexts/BookingsContext";
import { InstitutionsProvider } from "@/contexts/InstitutionsContext";
import { PaymentMethodsProvider } from "@/contexts/PaymentMethodsContext";

import AccountSettings from "./pages/AccountSettings";
import Index from "./pages/Index";
import InstitutionList from "./pages/InstitutionList";
import InstitutionDetail from "./pages/InstitutionDetail";
import SpaceDetail from "./pages/SpaceDetail";
import MyBookings from "./pages/MyBookings";
import AdminDashboard from "./pages/AdminDashboard";
import InstitutionAdminDashboard from "./pages/InstitutionAdminDashboard";
import CampusAdminDashboard from "./pages/CampusAdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import InstitutionEditPage from "./pages/InstitutionEditPage";
import Wallet from "./pages/Wallet";
import AddCard from "./pages/AddCard";
import Signup from "./pages/auth/Signup";
import SignupUser from "./pages/auth/SignupUser";
import SignupInstitution from "./pages/auth/SignupInstitution";
import SignupSuperAdmin from "./pages/auth/SignupSuperAdmin";
import Verify from "./pages/auth/Verify";
import AuthCallback from "./pages/auth/AuthCallback";
import Login from "./pages/auth/Login";
import NotFound from "./pages/NotFound";

export function AppShell() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <InstitutionsProvider>
            <BookingsProvider>
              <PaymentMethodsProvider>
                <Navbar />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/account" element={<AccountSettings />} />
                  <Route path="/account/cards/new" element={<AddCard />} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/institutions" element={<InstitutionList />} />
                  <Route path="/institutions/:id" element={<InstitutionDetail />} />
                  <Route path="/spaces/:spaceId" element={<SpaceDetail />} />
                  <Route path="/my-bookings" element={<MyBookings />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/institution" element={<InstitutionAdminDashboard />} />
                  <Route path="/admin/campus" element={<CampusAdminDashboard />} />
                  <Route path="/admin/super" element={<SuperAdminDashboard />} />
                  <Route path="/admin/institutions/new" element={<InstitutionEditPage />} />
                  <Route path="/admin/institutions/:id/edit" element={<InstitutionEditPage />} />
                  <Route path="/auth/signup" element={<Signup />} />
                  <Route path="/auth/signup/user" element={<SignupUser />} />
                  <Route path="/auth/signup/institution" element={<SignupInstitution />} />
                  <Route path="/auth/signup/super-admin" element={<SignupSuperAdmin />} />
                  <Route path="/auth/verify" element={<Verify />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/auth/login" element={<Login />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <DevRoleSwitcher />
              </PaymentMethodsProvider>
            </BookingsProvider>
          </InstitutionsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  );
}
