import React, { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wrench,
  LogOut,
  X,
  Users,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Wind,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    id: "orders",
    label: "Pesanan & Pembayaran",
    icon: <ShoppingCart className="w-5 h-5" />,
  },
  {
    id: "products",
    label: "Kelola Produk",
    icon: <Package className="w-5 h-5" />,
  },
  {
    id: "services",
    label: "Kelola Layanan",
    icon: <Wrench className="w-5 h-5" />,
  },
  {
    id: "users",
    label: "Kelola Pengguna",
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: "team",
    label: "Kelola Tim",
    icon: <UserCheck className="w-5 h-5" />,
  },
  {
    id: "reports",
    label: "Laporan",
    icon: <TrendingUp className="w-5 h-5" />,
  },
];

export default function AdminSidebar({
  activeTab,
  onTabChange,
  onLogout,
  isOpen,
  onToggle,
}: AdminSidebarProps) {
  const [isDesktop, setIsDesktop] = useState<boolean>(
    () => typeof window !== "undefined" && window.innerWidth >= 1024,
  );
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleResize = useCallback(() => {
    setIsDesktop(window.innerWidth >= 1024);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  const renderMenuItem = (item: MenuItem, mobile: boolean) => {
    const isActive = activeTab === item.id;
    const showLabel = isOpen || mobile;

    return (
      <div key={item.id} className="relative group/item">
        <button
          onClick={() => {
            onTabChange(item.id);
            if (mobile) onToggle();
          }}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
          className={`
            relative w-full flex items-center rounded-xl transition-all duration-200 overflow-hidden
            ${showLabel ? "px-3 py-3" : "justify-center py-3 px-2"}
            ${isActive
              ? "text-white shadow-lg shadow-sky-500/20"
              : "text-slate-400 hover:text-white"
            }
          `}
        >
          {/* Active background */}
          {isActive && (
            <motion.div
              layoutId={mobile ? "activeBgMobile" : "activeBgDesktop"}
              className="absolute inset-0 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}

          {/* Hover background */}
          {!isActive && (
            <div className="absolute inset-0 bg-white/0 hover:bg-white/5 rounded-xl transition-colors duration-200" />
          )}

          {/* Left accent bar for active */}
          {isActive && showLabel && (
            <motion.div
              layoutId={mobile ? "accentMobile" : "accentDesktop"}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/60 rounded-r-full"
            />
          )}

          {/* Icon */}
          <motion.span
            className={`relative z-10 flex-shrink-0 ${showLabel ? "mr-3" : ""}`}
            animate={{ scale: isActive ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            {item.icon}
          </motion.span>

          {/* Label */}
          <AnimatePresence initial={false}>
            {showLabel && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 text-sm font-medium whitespace-nowrap overflow-hidden flex-1 text-left"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Badge */}
          {item.badge !== undefined && item.badge > 0 && showLabel && (
            <span className="relative z-10 ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </button>

        {/* Tooltip for collapsed mode */}
        {!showLabel && hoveredItem === item.id && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-slate-800 border border-slate-700 text-white text-xs font-medium rounded-lg z-50 shadow-xl pointer-events-none whitespace-nowrap"
          >
            {item.label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
          </motion.div>
        )}
      </div>
    );
  };

  const sidebarContent = (mobile = false) => {
    const showLabel = isOpen || mobile;
    return (
      <div className="flex flex-col h-full">
        {/* HEADER */}
        <div className="h-16 flex items-center px-3 border-b border-white/5 shrink-0">
          <AnimatePresence mode="wait" initial={false}>
            {showLabel ? (
              <motion.div
                key="full"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/30">
                  <Wind className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-white font-bold text-sm leading-none whitespace-nowrap">
                    HDB<span className="text-sky-400">Airconds</span>
                  </div>
                  <div className="text-slate-500 text-[10px] font-medium tracking-wider uppercase mt-0.5">
                    Admin Panel
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="mini"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex justify-center"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/30">
                  <Wind className="w-4 h-4 text-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!mobile && (
            <button
              onClick={onToggle}
              className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all duration-200 shrink-0"
            >
              {isOpen ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}

          {mobile && (
            <button
              onClick={onToggle}
              className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all duration-200 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* PROFILE SECTION */}
        <AnimatePresence initial={false}>
          {showLabel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mx-3 my-3 p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                  A
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold leading-none whitespace-nowrap">Administrator</p>
                  <p className="text-slate-500 text-[11px] mt-0.5 whitespace-nowrap">admin@hdbac.com</p>
                </div>
                <div className="ml-auto shrink-0 w-2 h-2 bg-emerald-400 rounded-full shadow-sm shadow-emerald-400/50" title="Online" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divider with label */}
        {showLabel && (
          <div className="px-4 pb-2">
            <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest">
              Menu Utama
            </p>
          </div>
        )}

        {/* NAV */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {menuItems.map((item) => renderMenuItem(item, mobile))}
        </nav>

        {/* FOOTER */}
        <div className="p-2 border-t border-white/5 shrink-0">
          {showLabel && (
            <div className="px-2 pb-2">
              <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest">
                Akun
              </p>
            </div>
          )}
          <div className="relative group/logout">
            <button
              onClick={onLogout}
              className={`
                w-full flex items-center rounded-xl transition-all duration-200
                text-slate-400 hover:text-red-400 hover:bg-red-500/10
                ${showLabel ? "px-3 py-3 gap-3" : "justify-center py-3"}
              `}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {showLabel && (
                <span className="text-sm font-medium">Logout</span>
              )}
            </button>
            {/* Tooltip for collapsed logout */}
            {!showLabel && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-slate-800 border border-slate-700 text-white text-xs font-medium rounded-lg z-50 shadow-xl pointer-events-none whitespace-nowrap opacity-0 group-hover/logout:opacity-100 transition-opacity">
                Logout
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {isOpen && !isDesktop && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
              onClick={onToggle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.aside
              className="fixed left-0 top-0 bottom-0 w-[280px] z-40 flex flex-col"
              style={{
                background:
                  "linear-gradient(180deg, #0d1b2e 0%, #0f1f35 50%, #0d1b2e 100%)",
                borderRight: "1px solid rgba(255,255,255,0.05)",
              }}
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <aside
        className="hidden lg:flex h-full flex-col"
        style={{
          background:
            "linear-gradient(180deg, #0d1b2e 0%, #0f1f35 50%, #0d1b2e 100%)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <motion.div
          animate={{ width: isOpen ? 260 : 72 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex flex-col h-full overflow-hidden"
        >
          {sidebarContent(false)}
        </motion.div>
      </aside>
    </>
  );
}
