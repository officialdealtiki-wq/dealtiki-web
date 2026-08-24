import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
  Link,
} from "react-router-dom";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { LiveDealsSection } from "./components/LiveDealsSection";
import { DealDetailModal } from "./components/DealDetailModal";
import { DealDetailPage } from "./components/DealDetailPage";
import { StoresView } from "./components/StoresView";
import { CategoriesView } from "./components/CategoriesView";
import { CouponsView } from "./components/CouponsView";
import { FavoritesView } from "./components/FavoritesView";
import { RecentlyViewed } from "./components/RecentlyViewed";
import { Footer } from "./components/Footer";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { ToastContainer, showToast } from "./components/Toast";
import { Deal, ActiveView, SortOption } from "./types";
import { dealTikiClient } from "./lib/dealtiki-api";
import { getFavoriteIds } from "./lib/storage";
import { updatePageSEO } from "./lib/seo";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(60);

  // Search input state
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [debouncedKeyword, setDebouncedKeyword] = useState(searchParams.get("q") || "");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("latest");

  const [selectedModalDeal, setSelectedModalDeal] = useState<Deal | null>(null);
  const [favoritesCount, setFavoritesCount] = useState(() => getFavoriteIds().length);
  const [sourceBadge, setSourceBadge] = useState<string>("live_api");

  const debounceTimerRef = useRef<any>(null);

  // Sync search input with searchParams if visiting /search?q=xyz
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null && q !== searchInput) {
      setSearchInput(q);
      setDebouncedKeyword(q);
    }
  }, [searchParams]);

  // Listen to favorite updates
  useEffect(() => {
    const handleFavUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail.ids)) {
        setFavoritesCount(e.detail.ids.length);
      } else {
        setFavoritesCount(getFavoriteIds().length);
      }
    };

    window.addEventListener("dealtiki:favorites_updated", handleFavUpdate);
    return () => {
      window.removeEventListener("dealtiki:favorites_updated", handleFavUpdate);
    };
  }, []);

  // Fetch deals function with AbortController handling in dealtikiClient
  const fetchDeals = useCallback(
    async (isBackground = false, force = false) => {
      if (!isBackground) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const response = await dealTikiClient.searchDeals({
          keyword: debouncedKeyword,
          platform: selectedPlatform !== "all" ? selectedPlatform : undefined,
          category: selectedCategory || undefined,
          freshMinutes: 2880,
          forceRefresh: force,
        });

        setDeals(response.deals);
        setSourceBadge(response.source);

        if (force) {
          showToast("Live deals refreshed successfully!", "success", 2000);
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("[DealTiki] Error loading deals:", err);
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
        setSecondsUntilRefresh(60);
      }
    },
    [debouncedKeyword, selectedPlatform, selectedCategory]
  );

  // Trigger fetch whenever search keyword, platform, or category changes
  useEffect(() => {
    fetchDeals(false);
  }, [fetchDeals]);

  // 60-second auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          fetchDeals(true, true);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchDeals]);

  // Handle live search input with 400ms debounce
  const handleSearchChange = (kw: string) => {
    setSearchInput(kw);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedKeyword(kw);
      if (kw.trim() && location.pathname !== "/deals" && location.pathname !== "/search" && location.pathname !== "/") {
        navigate(`/deals`);
      }
    }, 400);
  };

  const handleQuickSearch = (tag: string) => {
    setSearchInput(tag);
    setDebouncedKeyword(tag);
    navigate("/deals");
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setDebouncedKeyword("");
    setSelectedPlatform("all");
    setSelectedCategory("");
    setSortBy("latest");
  };

  const handleSelectPlatform = (platform: string) => {
    setSelectedPlatform(platform);
  };

  const handleSelectCategory = (catSlug: string) => {
    setSelectedCategory(catSlug);
  };

  // Deal modal click handler
  const handleOpenDealModal = (deal: Deal) => {
    setSelectedModalDeal(deal);
  };

  // Determine active nav item from path
  const getActiveView = (): ActiveView => {
    const p = location.pathname;
    if (p === "/" || p === "") return "home";
    if (p.startsWith("/deals")) return "deals";
    if (p.startsWith("/category") || p === "/categories") return "categories";
    if (p.startsWith("/store") || p === "/stores") return "stores";
    if (p.startsWith("/coupons")) return "coupons";
    if (p.startsWith("/trending")) return "trending";
    if (p.startsWith("/favorites")) return "favorites";
    if (p.startsWith("/deal/")) return "deal-detail";
    if (p.startsWith("/search")) return "search";
    return "home";
  };

  const activeView = getActiveView();

  const handleNavigate = (view: ActiveView) => {
    const pathMap: Record<ActiveView, string> = {
      home: "/",
      deals: "/deals",
      categories: "/categories",
      stores: "/stores",
      coupons: "/coupons",
      trending: "/trending",
      favorites: "/favorites",
      search: "/deals",
      "deal-detail": "/deals",
    };
    navigate(pathMap[view] || "/");
  };

  // Deal counts by platform
  const countsByPlatform: Record<string, number> = {
    all: deals.length,
  };
  deals.forEach((d) => {
    const p = d.platform.toLowerCase();
    countsByPlatform[p] = (countsByPlatform[p] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-[#0F1219] text-slate-100 flex flex-col selection:bg-yellow-400 selection:text-black">
      {/* Global Toast System */}
      <ToastContainer />

      {/* Main Header */}
      <Header
        activeView={activeView}
        onNavigate={handleNavigate}
        favoritesCount={favoritesCount}
        onOpenSearch={() => {
          const el = document.getElementById("hero-search-input");
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
            el.focus();
          } else {
            navigate("/");
          }
        }}
      />

      {/* Routes Switcher */}
      <main className="flex-1 w-full flex flex-col">
        <Routes>
          {/* 1. Home Page */}
          <Route
            path="/"
            element={
              <>
                <Hero
                  keyword={searchInput}
                  onSearchChange={handleSearchChange}
                  onQuickSearch={handleQuickSearch}
                  totalDealsCount={deals.length}
                />
                <LiveDealsSection
                  deals={deals}
                  loading={loading}
                  isRefreshing={isRefreshing}
                  secondsUntilRefresh={secondsUntilRefresh}
                  onRefreshDeals={() => fetchDeals(true, true)}
                  selectedPlatform={selectedPlatform}
                  onSelectPlatform={handleSelectPlatform}
                  selectedCategory={selectedCategory}
                  onSelectCategory={handleSelectCategory}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  onOpenDetail={handleOpenDealModal}
                  onResetFilters={handleResetFilters}
                  countsByPlatform={countsByPlatform}
                  sourceBadge={sourceBadge}
                />
                <RecentlyViewed onOpenDetail={handleOpenDealModal} />
              </>
            }
          />

          {/* 2. Deals Page */}
          <Route
            path="/deals"
            element={
              <div className="pt-6">
                <LiveDealsSection
                  deals={deals}
                  loading={loading}
                  isRefreshing={isRefreshing}
                  secondsUntilRefresh={secondsUntilRefresh}
                  onRefreshDeals={() => fetchDeals(true, true)}
                  selectedPlatform={selectedPlatform}
                  onSelectPlatform={handleSelectPlatform}
                  selectedCategory={selectedCategory}
                  onSelectCategory={handleSelectCategory}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  onOpenDetail={handleOpenDealModal}
                  onResetFilters={handleResetFilters}
                  countsByPlatform={countsByPlatform}
                  sourceBadge={sourceBadge}
                />
              </div>
            }
          />

          {/* 3. Trending Deals Page */}
          <Route
            path="/trending"
            element={
              <div className="pt-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    <h1 className="text-2xl font-extrabold text-white">Trending Deals & Big Price Drops</h1>
                  </div>
                  <p className="text-xs text-slate-400">Ranked by discount percentage and freshness</p>
                </div>
                <LiveDealsSection
                  deals={deals}
                  loading={loading}
                  isRefreshing={isRefreshing}
                  secondsUntilRefresh={secondsUntilRefresh}
                  onRefreshDeals={() => fetchDeals(true, true)}
                  selectedPlatform={selectedPlatform}
                  onSelectPlatform={handleSelectPlatform}
                  selectedCategory={selectedCategory}
                  onSelectCategory={handleSelectCategory}
                  sortBy="popular"
                  onSortChange={setSortBy}
                  onOpenDetail={handleOpenDealModal}
                  onResetFilters={handleResetFilters}
                  countsByPlatform={countsByPlatform}
                  sourceBadge={sourceBadge}
                />
              </div>
            }
          />

          {/* 4. Categories Overview */}
          <Route
            path="/categories"
            element={
              <CategoriesView
                allDeals={deals}
                onOpenDetail={handleOpenDealModal}
                onSelectCategoryFilter={(cat) => {
                  setSelectedCategory(cat);
                  navigate(`/category/${cat}`);
                }}
              />
            }
          />

          {/* 5. Filtered Category Route */}
          <Route
            path="/category/:categorySlug"
            element={
              <CategoryRouteView
                allDeals={deals}
                loading={loading}
                isRefreshing={isRefreshing}
                secondsUntilRefresh={secondsUntilRefresh}
                onRefreshDeals={() => fetchDeals(true, true)}
                onOpenDetail={handleOpenDealModal}
                sortBy={sortBy}
                onSortChange={setSortBy}
                countsByPlatform={countsByPlatform}
              />
            }
          />

          {/* 6. Stores Overview */}
          <Route
            path="/stores"
            element={
              <StoresView
                allDeals={deals}
                onOpenDetail={handleOpenDealModal}
                onSelectStore={(plat) => {
                  setSelectedPlatform(plat);
                  navigate(`/store/${plat}`);
                }}
              />
            }
          />

          {/* 7. Filtered Store Route */}
          <Route
            path="/store/:storeSlug"
            element={
              <StoreRouteView
                allDeals={deals}
                loading={loading}
                isRefreshing={isRefreshing}
                secondsUntilRefresh={secondsUntilRefresh}
                onRefreshDeals={() => fetchDeals(true, true)}
                onOpenDetail={handleOpenDealModal}
                sortBy={sortBy}
                onSortChange={setSortBy}
                countsByPlatform={countsByPlatform}
              />
            }
          />

          {/* 8. Coupons View */}
          <Route
            path="/coupons"
            element={<CouponsView allDeals={deals} onOpenDetail={handleOpenDealModal} />}
          />

          {/* 9. Favorites View */}
          <Route
            path="/favorites"
            element={
              <FavoritesView
                allDeals={deals}
                onOpenDetail={handleOpenDealModal}
                onExploreDeals={() => navigate("/deals")}
              />
            }
          />

          {/* 10. Canonical Deal Detail Page */}
          <Route
            path="/deal/:slug"
            element={<DealDetailPage allDeals={deals} />}
          />

          {/* Fallback to Home */}
          <Route path="*" element={<Link to="/" replace />} />
        </Routes>
      </main>

      {/* Deal Detail Modal (when clicked from any grid) */}
      {selectedModalDeal && (
        <DealDetailModal
          deal={selectedModalDeal}
          onClose={() => setSelectedModalDeal(null)}
          onSelectDeal={(d) => setSelectedModalDeal(d)}
          allDeals={deals}
        />
      )}

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onSelectStore={(plat) => {
          setSelectedPlatform(plat);
          navigate(`/store/${plat}`);
        }}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          navigate(`/category/${cat}`);
        }}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeView={activeView}
        onNavigate={handleNavigate}
        favoritesCount={favoritesCount}
        onOpenSearch={() => {
          const el = document.getElementById("hero-search-input");
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
            el.focus();
          } else {
            navigate("/");
          }
        }}
      />
    </div>
  );
}

// Sub-component for `/category/:categorySlug` route
function CategoryRouteView({
  allDeals,
  loading,
  isRefreshing,
  secondsUntilRefresh,
  onRefreshDeals,
  onOpenDetail,
  sortBy,
  onSortChange,
  countsByPlatform,
}: any) {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (categorySlug) {
      updatePageSEO(
        `${categorySlug.toUpperCase()} Deals & Discounts | DealTiki`,
        `Explore verified ${categorySlug} discounts, offers and promo codes across Amazon, Flipkart and online stores.`
      );
    }
  }, [categorySlug]);

  return (
    <div className="pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate("/categories")}
            className="text-xs text-yellow-400 hover:underline inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Categories</span>
          </button>
          <h1 className="text-2xl font-extrabold text-white capitalize">
            {categorySlug?.replace(/-/g, " ")} Deals
          </h1>
        </div>
      </div>
      <LiveDealsSection
        deals={allDeals}
        loading={loading}
        isRefreshing={isRefreshing}
        secondsUntilRefresh={secondsUntilRefresh}
        onRefreshDeals={onRefreshDeals}
        selectedPlatform="all"
        onSelectPlatform={() => {}}
        selectedCategory={categorySlug || ""}
        onSelectCategory={(c) => navigate(`/category/${c}`)}
        sortBy={sortBy}
        onSortChange={onSortChange}
        onOpenDetail={onOpenDetail}
        onResetFilters={() => navigate("/deals")}
        countsByPlatform={countsByPlatform}
      />
    </div>
  );
}

// Sub-component for `/store/:storeSlug` route
function StoreRouteView({
  allDeals,
  loading,
  isRefreshing,
  secondsUntilRefresh,
  onRefreshDeals,
  onOpenDetail,
  sortBy,
  onSortChange,
  countsByPlatform,
}: any) {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (storeSlug) {
      updatePageSEO(
        `${storeSlug.toUpperCase()} Deals, Offers & Promo Codes | DealTiki`,
        `Find the latest verified deals and highest discount offers for ${storeSlug} on DealTiki.`
      );
    }
  }, [storeSlug]);

  return (
    <div className="pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate("/stores")}
            className="text-xs text-yellow-400 hover:underline inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Stores</span>
          </button>
          <h1 className="text-2xl font-extrabold text-white uppercase">
            {storeSlug} Offers & Deals
          </h1>
        </div>
      </div>
      <LiveDealsSection
        deals={allDeals}
        loading={loading}
        isRefreshing={isRefreshing}
        secondsUntilRefresh={secondsUntilRefresh}
        onRefreshDeals={onRefreshDeals}
        selectedPlatform={storeSlug || "all"}
        onSelectPlatform={(p) => navigate(`/store/${p}`)}
        selectedCategory=""
        onSelectCategory={() => {}}
        sortBy={sortBy}
        onSortChange={onSortChange}
        onOpenDetail={onOpenDetail}
        onResetFilters={() => navigate("/deals")}
        countsByPlatform={countsByPlatform}
      />
    </div>
  );
}
