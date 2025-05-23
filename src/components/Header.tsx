import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, Users, LayoutDashboard, Menu, Library, Coins, Search, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/");
      setOpen(false);
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({ 
    to, 
    children, 
    icon: Icon, 
    className = "" 
  }: { 
    to: string; 
    children: React.ReactNode; 
    icon?: any; 
    className?: string;
  }) => (
    <Link 
      to={to} 
      className={cn(
        "relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
        "hover:bg-accent/80 hover:text-foreground",
        isActive(to) 
          ? "bg-primary/10 text-primary shadow-sm" 
          : "text-muted-foreground",
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
      {isActive(to) && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
      )}
    </Link>
  );

  const MobileNavLink = ({ 
    to, 
    children, 
    icon: Icon, 
    badge 
  }: { 
    to: string; 
    children: React.ReactNode; 
    icon: any;
    badge?: string;
  }) => (
    <Link 
      to={to} 
      className={cn(
        "flex items-center justify-between p-4 rounded-xl transition-all duration-200",
        "hover:bg-accent/80",
        isActive(to) 
          ? "bg-primary/10 text-primary shadow-sm border border-primary/20" 
          : "text-foreground hover:text-foreground"
      )}
      onClick={() => setOpen(false)}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
          isActive(to) ? "bg-primary/20" : "bg-muted"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-medium">{children}</span>
      </div>
      {badge && (
        <Badge variant="secondary" className="ml-auto">
          {badge}
        </Badge>
      )}
    </Link>
  );

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Pod Class
          </span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          <NavLink to="/browse" icon={Search}>
            Browse
          </NavLink>
          <NavLink to="/transcriptions" icon={Library}>
            Learning Library
          </NavLink>
          <NavLink to="/dashboard" icon={LayoutDashboard}>
            Dashboard
          </NavLink>
          <NavLink to="/referrals" icon={Users}>
            Referrals
          </NavLink>
          <NavLink to="/pricing" icon={Zap}>
            Pricing
          </NavLink>
        </div>

        {/* User Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {user && (
            <>
              <div className="w-px h-6 bg-border" />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 px-6">
              <div className="flex flex-col gap-1 pt-8">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Navigation</h3>
                  <p className="text-sm text-muted-foreground">
                    Access all your learning tools
                  </p>
                </div>
                
                <div className="space-y-2">
                  <MobileNavLink to="/browse" icon={Search}>
                    Browse Podcasts
                  </MobileNavLink>
                  <MobileNavLink to="/transcriptions" icon={Library}>
                    Learning Library
                  </MobileNavLink>
                  <MobileNavLink to="/dashboard" icon={LayoutDashboard}>
                    Dashboard
                  </MobileNavLink>
                  <MobileNavLink to="/referrals" icon={Users}>
                    Referrals
                  </MobileNavLink>
                  <MobileNavLink to="/pricing" icon={Zap} badge="Pro">
                    Pricing
                  </MobileNavLink>
                </div>

                {user && (
                  <div className="mt-8 pt-6 border-t border-border">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      Sign Out
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
} 