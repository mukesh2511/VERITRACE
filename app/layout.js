"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Organizations", href: "/organizations", icon: "🏢" },
  { name: "Products", href: "/products", icon: "📦" },
  { name: "Units", href: "/units", icon: "🏷️" },
  { name: "Assembly", href: "/assembly", icon: "🔗" },
  { name: "Transfers", href: "/transfers", icon: "🚚" },
  { name: "Provenance", href: "/provenance", icon: "🔍" },
  { name: "Analytics", href: "/analytics", icon: "📈" },
];

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="min-h-screen relative">
      {/* Sidebar */}
      <aside
        className={`glass-sidebar w-64 transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              V
            </div>
            <h1 className="text-xl font-bold text-white">VeriTrace</h1>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-white bg-opacity-20 text-white"
                      : "text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 glass-button md:hidden"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"} md:ml-64`}
      >
        {/* Top Navigation */}
        <header className="glass-navbar px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-white">
                {navigation.find((item) => pathname === item.href)?.name ||
                  "VeriTrace"}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              <button className="glass-button text-sm">🔔</button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-300">Admin User</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <div className="slide-in">{children}</div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
