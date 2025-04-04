import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, Users, LayoutDashboard, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function Header() {
  const navigate = useNavigate();
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

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/browse" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold">Pod Class</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link to="/referrals" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Users className="w-4 h-4" />
            Referrals
          </Link>
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          {user && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[75vw] sm:w-[350px]">
              <div className="flex flex-col space-y-4 mt-8">
                <Link 
                  to="/pricing" 
                  className="flex items-center text-base p-2 hover:bg-accent rounded-md transition-colors"
                  onClick={() => setOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  to="/referrals" 
                  className="flex items-center gap-2 text-base p-2 hover:bg-accent rounded-md transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <Users className="w-4 h-4" />
                  Referrals
                </Link>
                <Link 
                  to="/dashboard" 
                  className="flex items-center gap-2 text-base p-2 hover:bg-accent rounded-md transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                {user && (
                  <Button 
                    variant="ghost" 
                    className="flex items-center justify-start gap-2 text-base p-2 w-full h-auto font-normal"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
} 