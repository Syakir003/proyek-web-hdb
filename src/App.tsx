/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { MessageCircle } from "lucide-react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Cart from "./pages/Cart";
import UserOrders from "./pages/UserOrders";
import AdminLayout from "./pages/admin/AdminLayout";
import TeknisiDashboard from "./pages/teknisi/TeknisiDashboard";
import Layanan from "./pages/Layanan";
import Karir from "./pages/Karir";
import Blog from "./pages/Blog";
import Privasi from "./pages/Privasi";
import Syarat from "./pages/Syarat";
import { Product, CartItem, Service } from "./data";

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const savedToken = localStorage.getItem("authToken");
    const savedRole = localStorage.getItem("userRole");
    if (savedToken) {
      if (savedRole === "admin") return "admin";
      if (savedRole === "teknisi") return "teknisi";
    }
    return "beranda";
  });
  const [previousPage, setPreviousPage] = useState("beranda");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedProductForCheckout, setSelectedProductForCheckout] =
    useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const [authToken, setAuthToken] = useState<string | null>(
    localStorage.getItem("authToken"),
  );
  const [userRole, setUserRole] = useState<"admin" | "user" | "teknisi" | null>(
    localStorage.getItem("userRole") as "admin" | "user" | "teknisi" | null,
  );

  useEffect(() => {
    // Check if user is trying to access admin page
    if (window.location.pathname === "/admin") {
      setCurrentPage("admin");
    } else if (window.location.pathname === "/teknisi") {
      setCurrentPage("teknisi");
    }
  }, []);

  useEffect(() => {
    if (
      (currentPage === "admin" || currentPage === "teknisi") &&
      !(
        (authToken && userRole === "admin" && currentPage === "admin") ||
        (authToken && userRole === "teknisi" && currentPage === "teknisi")
      )
    ) {
      setCurrentPage("beranda");
      setPreviousPage("beranda");
    }
  }, [currentPage, authToken, userRole]);

  const handleCheckout = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && item.itemType === "product",
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.itemType === "product"
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          itemType: "product" as const,
          image: product.image,
          brand: product.brand,
          capacity: product.capacity,
        },
      ];
    });
    setCurrentPage("checkout");
  };

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && item.itemType === "product",
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.itemType === "product"
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          itemType: "product" as const,
          image: product.image,
          brand: product.brand,
          capacity: product.capacity,
        },
      ];
    });
  };

  const handleAddServiceToCart = (service: Service) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === service.id && item.itemType === "service",
      );
      if (existing) {
        return prev.map((item) =>
          item.id === service.id && item.itemType === "service"
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: service.id,
          name: service.name,
          price: service.price,
          quantity: 1,
          itemType: "service" as const,
          icon: service.icon,
          description: service.description,
        },
      ];
    });
    setCurrentPage("cart");
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(id);
    } else {
      setCart((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item)),
      );
    }
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleLoginSuccess = (
    token: string,
    role: "admin" | "user" | "teknisi",
  ) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("userRole", role);
    setAuthToken(token);
    setUserRole(role);
    if (role === "admin") {
      setCurrentPage("admin");
    } else if (role === "teknisi") {
      setCurrentPage("teknisi");
    } else {
      setCurrentPage(previousPage === "login" ? "beranda" : previousPage);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    setAuthToken(null);
    setUserRole(null);
  };

  const openLogin = () => {
    setPreviousPage(currentPage);
    setCurrentPage("login");
  };

  const closeLogin = () => {
    setCurrentPage(previousPage === "login" ? "beranda" : previousPage);
  };

  // If the current page is 'admin' or 'teknisi', we don't show the standard Navbar/Footer
  if (currentPage === "admin" || currentPage === "teknisi") {
    if (authToken && userRole === "admin" && currentPage === "admin") {
      return <AdminLayout token={authToken} onLogout={handleLogout} />;
    }
    if (authToken && userRole === "teknisi" && currentPage === "teknisi") {
      return <TeknisiDashboard token={authToken} onLogout={handleLogout} />;
    }
    return null;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "beranda":
        return <Home setCurrentPage={setCurrentPage} />;
      case "katalog":
        return (
          <Catalog
            onCheckout={handleCheckout}
            onAddToCart={handleAddToCart}
            onAddServiceToCart={handleAddServiceToCart}
          />
        );
      case "tentang":
        return <About />;
      case "layanan":
        return <Layanan setCurrentPage={setCurrentPage} onAddServiceToCart={handleAddServiceToCart} />;
      case "karir":
        return <Karir setCurrentPage={setCurrentPage} />;
      case "blog":
        return <Blog setCurrentPage={setCurrentPage} />;
      case "privasi":
        return <Privasi />;
      case "syarat":
        return <Syarat />;
      case "kontak":
        return <Contact />;
      case "cart":
        return (
          <Cart
            cart={cart}
            onRemove={handleRemoveFromCart}
            onUpdateQuantity={handleUpdateQuantity}
            onCheckout={() => setCurrentPage("checkout")}
            onLogin={openLogin}
            authToken={authToken}
            onBrowse={() => setCurrentPage("katalog")}
          />
        );
      case "pesanan-saya":
        if (!authToken) {
          openLogin();
          return null;
        }
        return <UserOrders token={authToken} />;
      case "checkout":
        if (!authToken) {
          openLogin();
          return null;
        }
        return (
          <Checkout
            cart={cart}
            onClearCart={handleClearCart}
            onBack={() => setCurrentPage("cart")}
            onSuccess={() => setCurrentPage("pesanan-saya")}
            authToken={authToken}
          />
        );
      default:
        return <Home setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        authToken={authToken}
        userRole={userRole}
        onLogout={handleLogout}
        onOpenLogin={openLogin}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
      />

      <main className={`grow ${currentPage !== "beranda" ? "pt-20" : ""}`}>
        <AnimatePresence mode="wait">{renderPage()}</AnimatePresence>
      </main>

      <Footer setCurrentPage={setCurrentPage} />

      {/* Login Modal Overlay */}
      <AnimatePresence>
        {currentPage === "login" && (
          <Login onLoginSuccess={handleLoginSuccess} onBack={closeLogin} />
        )}
      </AnimatePresence>

      {/* WhatsApp Floating Button */}
      {currentPage !== "admin" && currentPage !== "teknisi" && (
        <a
          href="https://wa.me/6281515729739?text=Halo%20saya%20ingin%20bertanya"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 bg-green-500 text-white px-4 py-3 sm:px-5 rounded-full shadow-lg hover:bg-green-600 transition-all hover:-translate-y-1 flex items-center gap-2 font-medium"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Chat Kami</span>
        </a>
      )}
    </div>
  );
}
