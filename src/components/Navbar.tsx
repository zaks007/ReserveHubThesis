import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  LayoutDashboard,
  Menu,
  X,
  LogIn,
  LogOut,
  ShieldCheck,
  MapPin,
  GraduationCap,
  User as UserIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth, roleLabel, roleBadgeClass } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const baseLinks = [
  { to: "/", label: "Home" },
  { to: "/institutions", label: "Explore" },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [...baseLinks];
  if (user && user.role !== "guest") {
    links.push({ to: "/my-bookings", label: "My Bookings" });
    links.push({ to: "/wallet", label: "Wallet" });
  }

  const adminLink = user?.canSuperAdmin
    ? { to: "/admin/super", label: "Super Admin", icon: ShieldCheck }
    : user?.role === "super_admin"
    ? { to: "/admin/super", label: "Super Admin", icon: ShieldCheck }
    : user?.role === "institution_admin" || user?.role === "institution_pending"
    ? { to: "/admin/institution", label: "Institution", icon: Building2 }
    : user?.role === "campus_admin"
    ? { to: "/admin/campus", label: "Campus", icon: MapPin }
    : user?.role === "teacher"
    ? { to: "/admin/teacher", label: "Teacher Portal", icon: GraduationCap }
    : null;

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
        <Link to="/" className="flex min-w-0 items-center gap-2 text-xl font-bold text-primary">
          <Building2 className="h-6 w-6 shrink-0" />
          <span className="truncate">ReserveHub</span>
        </Link>

        <nav className="hidden min-w-0 items-center justify-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {adminLink && (
            <Link
              to={adminLink.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                location.pathname === adminLink.to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <adminLink.icon className="h-4 w-4" />
              {adminLink.label}
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <UserIcon className="h-4 w-4" /> {user.name}
                  <span
                    className={`hidden lg:inline text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      roleBadgeClass[user.role]
                    }`}
                  >
                    {roleLabel[user.role]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground font-normal">{user.email}</p>
                  <p className="text-xs text-primary font-normal mt-0.5">{roleLabel[user.role]}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/account")}>
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/wallet")}>
                  My Wallet
                </DropdownMenuItem>
                {adminLink && (
                  <DropdownMenuItem onClick={() => navigate(adminLink.to)}>
                    {adminLink.label}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void logout()} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth/login")}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => navigate("/auth/signup")}>
                Sign Up
              </Button>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t p-4 bg-card space-y-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}
          {adminLink && (
            <Link
              to={adminLink.to}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-primary hover:bg-secondary"
            >
              <adminLink.icon className="h-4 w-4" /> {adminLink.label}
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
