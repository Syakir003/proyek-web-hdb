import React, { useState } from "react";
import { Menu, Bell } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AdminDashboard from "./AdminDashboard";
import AdminOrders from "./AdminOrders";
import AdminProducts from "./AdminProducts";
import AdminServices from "./AdminServices";
import AdminReports from "./AdminReports";
import AdminUsers from "./AdminUsers";
import AdminTeam from "./AdminTeam";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  onLogout: () => void;
  token: string;
}

const menuItems = [
  { id: "dashboard",  label: "Dashboard",             emoji: "⊞" },
  { id: "orders",     label: "Pesanan & Pembayaran",  emoji: "🛒" },
  { id: "products",   label: "Kelola Produk",         emoji: "📦" },
  { id: "services",   label: "Kelola Layanan",        emoji: "🔧" },
  { id: "users",      label: "Kelola Pengguna",       emoji: "👥" },
  { id: "team",       label: "Kelola Tim",            emoji: "👤" },
  { id: "reports",    label: "Laporan",               emoji: "📊" },
];

export default function AdminLayout({ onLogout, token }: AdminLayoutProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const activeMenu = menuItems.find((m) => m.id === activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboard token={token} />;
      case "orders":
        return <AdminOrders token={token} />;
      case "products":
        return <AdminProducts token={token} />;
      case "services":
        return <AdminServices token={token} />;
      case "users":
        return <AdminUsers token={token} />;
      case "team":
        return <AdminTeam token={token} />;
      case "reports":
        return <AdminReports token={token} />;
      default:
        return <AdminDashboard token={token} />;
    }
  };

  return (
    <div className="h-screen bg-slate-100 flex overflow-hidden">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-4 sm:px-6 shrink-0 z-10 gap-4">
          {/* Mobile hamburger */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title */}
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-none">
                {activeMenu?.label ?? "Dashboard"}
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">HDB Airconds Admin</p>
            </div>
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            <button className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all relative">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md shadow-sky-200">
                A
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-700 leading-none">Administrator</p>
                <p className="text-xs text-slate-400 mt-0.5">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-slate-50 p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
