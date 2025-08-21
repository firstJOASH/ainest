import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAccount, useDisconnect } from "@starknet-react/core";
import { useAppStore } from "@/stores/useAppStore";
import { useGSAP } from "@/hooks/useGSAP";
import { Moon, Sun, User, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletConnectionModal } from "@/components/WalletConnectionModal";

export const Header = () => {
  const location = useLocation();
  const headerRef = useRef<HTMLElement>(null);
  const { animatePageEnter, animateThemeTransition } = useGSAP();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { isDarkMode, toggleTheme, setProfileModalOpen } = useAppStore();

  const { connectWallet } = WalletConnectionModal();

  useEffect(() => {
    if (headerRef.current) {
      animatePageEnter(headerRef.current);
    }
  }, []);

  const handleThemeToggle = () => {
    animateThemeTransition();
    setTimeout(() => {
      toggleTheme();
    }, 100);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header
      ref={headerRef}
      className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
            <span className="text-primary-foreground font-bold text-lg">
              AI
            </span>
          </div>
          <span className="text-xl font-bold text-foreground">nest</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {isConnected && (
            <Link
              to="/profile"
              className={`ainest-nav-link ${
                location.pathname === "/profile" ? "text-foreground" : ""
              }`}
            >
              Profile
            </Link>
          )}
        </nav>

        {/* Right side actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleThemeToggle}
            className="transition-all duration-200 hover:bg-accent"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {isConnected ? (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:block">
                  {address ? formatAddress(address) : "Profile"}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => disconnect()}
                className="transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={connectWallet} className="ainest-btn-primary">
              Connect Wallet
            </Button>
          )}
        </div>
        {/* Mobile menu button */}
        <div className="md:hidden flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleThemeToggle}
            className="transition-all duration-200 hover:bg-accent"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {isConnected && (
              <Link
                to="/profile"
                className="block ainest-nav-link py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </Link>
            )}

            {isConnected ? (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setProfileModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>{address ? formatAddress(address) : "Profile"}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    disconnect();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Disconnect</span>
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => {
                  connectWallet();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full ainest-btn-primary"
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
