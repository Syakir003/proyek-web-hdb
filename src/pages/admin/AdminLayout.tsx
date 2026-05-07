import React, { useState } from "react";
import { Menu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AdminDashboard from "./AdminDashboard";
import AdminOrders from "./AdminOrders";
import AdminProducts from "./AdminProducts";
import AdminServices from "./AdminServices";
import AdminReports from "./AdminReports";
import AdminUsers from "./AdminUsers";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  onLogout: () => void;
  token: string;
}

export default function AdminLayout({ onLogout, token }: AdminLayoutProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const menuItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "orders", label: "Pesanan & Pembayaran" },
    { id: "products", label: "Kelola Produk" },
    { id: "services", label: "Kelola Layanan" },
    { id: "users", label: "Kelola Pengguna" },
    { id: "reports", label: "Laporan" },
  ];

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
        <header className="bg-white shadow-sm h-16 flex items-center px-6 shrink-0 z-10">
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="mr-4 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
          <h2 className="text-xl font-semibold text-slate-800">
            {menuItems.find((m) => m.id === activeTab)?.label || "Dashboard"}
          </h2>
          <div className="ml-auto flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm ring-2 ring-blue-200">
              A
            </div>
            <span className="ml-3 font-medium text-sm text-slate-700 hidden sm:block">
              Administrator
            </span>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
