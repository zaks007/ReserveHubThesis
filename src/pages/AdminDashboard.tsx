import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Legacy /admin entry — redirects to the correct role-based dashboard.
 */
const AdminDashboard = () => {
  const { user } = useAuth();
  if (!user || user.role === "guest" || user.role === "user") return <Navigate to="/auth/login" replace />;
  if (user.role === "super_admin") return <Navigate to="/admin/super" replace />;
  if (user.role === "campus_admin") return <Navigate to="/admin/campus" replace />;
  return <Navigate to="/admin/institution" replace />;
};

export default AdminDashboard;
