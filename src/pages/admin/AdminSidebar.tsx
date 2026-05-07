import React, { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wrench,
  FileText,
  LogOut,
  X,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

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

  const handleResize = useCallback(() => {
    setIsDesktop(window.innerWidth >= 1024);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

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
    { id: "reports", label: "Laporan", icon: <FileText className="w-5 h-5" /> },
  ];

  const renderMenuItem = (item: MenuItem, mobile: boolean) => {
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => {
          onTabChange(item.id);
          if (mobile) onToggle();
        }}
        className={`
          group relative w-full flex items-center rounded-xl transition-all duration-200
          ${isOpen || mobile ? "px-4 py-3" : "justify-center py-3"}
          ${
            isActive
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
              : "hover:bg-slate-800/80 hover:text-white"
          }
        `}
      >
        {isActive && (
          <motion.div
            layoutId={mobile ? "activeMobile" : "activeDesktop"}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-r-full"
          />
        )}

        <span
          className={`
            ${isOpen || mobile ? "mr-3" : ""}
            ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}
          `}
        >
          {item.icon}
        </span>

        <AnimatePresence>
          {(isOpen || mobile) && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {!isOpen && !mobile && (
          <div className="absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
            {item.label}
          </div>
        )}
      </button>
    );
  };

  const sidebarContent = (mobile = false) => (
    <>
      {/* HEADER */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800/50 shrink-0">
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.div
              key="full"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 overflow-hidden flex-1"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">HDB</span>
              </div>
              <span className="text-white font-bold text-lg whitespace-nowrap">
                Admin
              </span>
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
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">HDB</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onToggle}
          className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
        >
          {mobile ? (
            <X className="w-5 h-5" />
          ) : isOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* NAV */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => renderMenuItem(item, mobile))}
      </nav>

      {/* FOOTER */}
      <div className="p-3 border-t border-slate-800/50 shrink-0">
        <button
          onClick={onLogout}
          className={`
            w-full flex items-center rounded-xl transition-all text-red-400
            hover:bg-red-500/10 hover:text-red-300
            ${isOpen || mobile ? "px-4 py-3" : "justify-center py-3"}
          `}
        >
          <LogOut className="w-5 h-5" />

          {(isOpen || mobile) && (
            <span className="ml-3 text-sm font-medium">Logout</span>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* MOBILE */}
      <AnimatePresence>
        {isOpen && !isDesktop && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-30"
              onClick={onToggle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-slate-900 z-40 flex flex-col"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP */}
      <aside className="hidden lg:flex h-full bg-slate-900 border-r border-slate-800">
        <motion.div
          animate={{ width: isOpen ? 280 : 80 }}
          className="flex flex-col h-full"
        >
          {sidebarContent(false)}
        </motion.div>
      </aside>
    </>
  );
}
