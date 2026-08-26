import React, { useState } from "react";
import {
  Flame,
  Search,
  Heart,
  Store,
  Layers,
  Sparkles,
  TicketPercent,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { ActiveView } from "../types";

interface HeaderProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  favoritesCount: number;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onNavigate,
  favoritesCount,
  onOpenSearch,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ActiveView; label: string; icon: React.ElementType }[] = [
    { id: "home", label: "Home", icon: Flame },
    { id: "deals", label: "Latest Deals", icon: Zap },
    { id: "categories", label: "Categories", icon: Layers },
    { id: "stores", label: "Stores", icon: Store },
    { id: "coupons", label: "Coupons", icon: TicketPercent },
    { id: "trending", label: "Trending", icon: Sparkles },
    { id: "favorites", label: "Favorites", icon: Heart },
  ];

  const handleNavClick = (view: ActiveView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header
      id="dealtiki-main-header"
      className="sticky top-0 z-40 w-full bg-[#0F1219] border-b border-white/5 shadow-md transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo - Professional Polish Style */}
        <button
          id="brand-logo-btn"
          onClick={() => handleNavClick("home")}
          className="flex items-center gap-2.5 group focus:outline-none shrink-0"
        >
          <div className="bg-yellow-400 text-black font-black px-2 py-1 rounded text-lg italic tracking-tighter shadow-sm group-hover:bg-yellow-300 transition-colors">
            TIKI
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="text-xl font-bold text-white tracking-tight leading-none group-hover:text-yellow-400 transition-colors">
              Deal<span className="text-yellow-400">Tiki</span>
            </span>
            <span className="text-[9px] font-semibold text-slate-400 tracking-wider uppercase">
              India's Deal Engine
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`relative flex items-center gap-1.5 py-1 text-sm font-medium transition-all ${
                  isActive
                    ? "text-yellow-400 font-bold underline underline-offset-8 decoration-2 decoration-yellow-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-yellow-400" : "text-slate-500"}`} />
                <span>{item.label}</span>

                {item.id === "favorites" && favoritesCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-yellow-400 text-black text-[10px] font-black">
                    {favoritesCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Header Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Search Button on mobile/tablet */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              aria-label="Open Search"
              className="lg:hidden p-2 rounded-lg bg-slate-800/60 border border-white/10 text-slate-300 hover:text-white"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          {/* Favorites Button Shortcut (Tablet/Desktop) */}
          <button
            id="header-fav-shortcut"
            onClick={() => handleNavClick("favorites")}
            aria-label="Saved Deals"
            className="relative hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <Heart className={`w-4 h-4 ${favoritesCount > 0 ? "fill-yellow-400 text-yellow-400" : "text-slate-400"}`} />
            <span className="hidden md:inline">Saved</span>
            {favoritesCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-yellow-400 text-black text-[10px] font-bold">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Telegram Community Link / Pill */}
          <a
            href="https://t.me/dealtiki"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 text-xs font-bold transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span>Join Telegram</span>
          </a>

          {/* Mobile Menu Hamburger */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="lg:hidden p-2 rounded-lg bg-slate-800/60 border border-white/10 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/5 bg-[#0F1219] px-4 py-4 space-y-1 shadow-2xl animate-in slide-in-from-top-2 duration-150">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-bold transition-colors ${
                  isActive
                    ? "bg-yellow-400 text-black"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.id === "favorites" && favoritesCount > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                      isActive
                        ? "bg-black text-yellow-400"
                        : "bg-yellow-400 text-black"
                    }`}
                  >
                    {favoritesCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
