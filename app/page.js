"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Package,
  Truck,
  Users,
  TrendingUp,
  BarChart3,
  Eye,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Activity,
} from "lucide-react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

export default function HomePage() {
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    totalProducts: 0,
    totalUnits: 0,
    activeTransfers: 0,
    recentProvenanceQueries: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          setStats({
            totalOrganizations: 156,
            totalProducts: 1248,
            totalUnits: 45632,
            activeTransfers: 234,
            recentProvenanceQueries: 1892,
          });
        }
      } catch (error) {
        setStats({
          totalOrganizations: 156,
          totalProducts: 1248,
          totalUnits: 45632,
          activeTransfers: 234,
          recentProvenanceQueries: 1892,
        });
      }
    };
    fetchStats();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    setShowResults(false);
    try {
      const [productsResponse, unitsResponse, orgsResponse] = await Promise.all(
        [
          fetch(
            `/api/products/catalog?search=${encodeURIComponent(searchTerm)}`,
          ),
          fetch(
            `/api/products/units?serial_number=${encodeURIComponent(searchTerm)}`,
          ),
          fetch(
            `/api/organizations/getallorg?search=${encodeURIComponent(searchTerm)}`,
          ),
        ],
      );

      // Check each response individually and handle errors
      let productsData = [];
      let unitsData = [];
      let orgsData = [];

      try {
        if (productsResponse.ok) {
          const products = await productsResponse.json();
          productsData = Array.isArray(products) ? products : [];
        } else {
          console.error(
            "Products API failed:",
            productsResponse.status,
            productsResponse.statusText,
          );
        }
      } catch (error) {
        console.error("Error parsing products response:", error);
      }

      try {
        if (unitsResponse.ok) {
          const units = await unitsResponse.json();
          unitsData = Array.isArray(units) ? units : [];
        } else {
          console.error(
            "Units API failed:",
            unitsResponse.status,
            unitsResponse.statusText,
          );
        }
      } catch (error) {
        console.error("Error parsing units response:", error);
      }

      try {
        if (orgsResponse.ok) {
          const organizations = await orgsResponse.json();
          orgsData = Array.isArray(organizations) ? organizations : [];
        } else {
          console.error(
            "Organizations API failed:",
            orgsResponse.status,
            orgsResponse.statusText,
          );
        }
      } catch (error) {
        console.error("Error parsing organizations response:", error);
      }

      const combinedResults = [
        ...productsData.map((p) => ({ ...p, type: "product", icon: "📦" })),
        ...unitsData.map((u) => ({ ...u, type: "unit", icon: "🏷️" })),
        ...orgsData.map((o) => ({
          ...o,
          type: "organization",
          icon: "🏢",
        })),
      ];

      setSearchResults(combinedResults);
      setShowResults(true);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
      setShowResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleResultClick = (result) => {
    setShowResults(false);
    setSearchTerm("");
    switch (result.type) {
      case "product":
        window.location.href = `/products?id=${result.catalog_id}`;
        break;
      case "unit":
        window.location.href = `/provenance?serial=${result.serial_number}`;
        break;
      case "organization":
        window.location.href = `/organizations?id=${result.org_id}`;
        break;
    }
  };

  const quickActions = [
    {
      title: "Track Product",
      description:
        "Trace the complete journey of any product unit by serial number",
      icon: <Search className="w-7 h-7" />,
      href: "/provenance",
      accent: "#00C9A7",
      label: "Provenance",
    },
    {
      title: "Register Products",
      description: "Add and manage new product units across your supply chain",
      icon: <Package className="w-7 h-7" />,
      href: "/units",
      accent: "#4F8EF7",
      label: "Inventory",
    },
    {
      title: "Create Assembly",
      description:
        "Build product hierarchies and define component relationships",
      icon: <Zap className="w-7 h-7" />,
      href: "/assembly",
      accent: "#F7A84F",
      label: "Assembly",
    },
    {
      title: "Log Transfer",
      description: "Record and verify product movement between locations",
      icon: <Truck className="w-7 h-7" />,
      href: "/transfers",
      accent: "#B06EF7",
      label: "Logistics",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: "query",
      description: "Product LAP-SN-1001 traced by Consumer",
      timestamp: "2 min ago",
      icon: <Eye className="w-4 h-4" />,
      color: "#00C9A7",
    },
    {
      id: 2,
      type: "transfer",
      description: "Shipment TRK-2024-001 delivered to Retail Store",
      timestamp: "15 min ago",
      icon: <Truck className="w-4 h-4" />,
      color: "#4F8EF7",
    },
    {
      id: 3,
      type: "assembly",
      description: "Laptop Model X assembled with 5 components",
      timestamp: "1 hr ago",
      icon: <Package className="w-4 h-4" />,
      color: "#F7A84F",
    },
    {
      id: 4,
      type: "alert",
      description: "Quality alert: CPU batch CPU-SN-2000 requires inspection",
      timestamp: "2 hr ago",
      icon: <BarChart3 className="w-4 h-4" />,
      color: "#F74F4F",
    },
    {
      id: 5,
      type: "query",
      description: "Organization TechCorp verified by auditor",
      timestamp: "3 hr ago",
      icon: <Shield className="w-4 h-4" />,
      color: "#B06EF7",
    },
  ];

  const statsConfig = [
    {
      label: "Organizations",
      value: stats.totalOrganizations,
      icon: <Users className="w-5 h-5" />,
      color: "#4F8EF7",
      growth: "+8%",
    },
    {
      label: "Products",
      value: stats.totalProducts,
      icon: <Package className="w-5 h-5" />,
      color: "#00C9A7",
      growth: "+12%",
    },
    {
      label: "Units Tracked",
      value: stats.totalUnits,
      icon: <Eye className="w-5 h-5" />,
      color: "#F7A84F",
      growth: "+23%",
    },
    {
      label: "Active Transfers",
      value: stats.activeTransfers,
      icon: <Truck className="w-5 h-5" />,
      color: "#B06EF7",
      growth: "+5%",
    },
    {
      label: "Queries Today",
      value: stats.recentProvenanceQueries,
      icon: <Activity className="w-5 h-5" />,
      color: "#F74F4F",
      growth: "+31%",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        * { box-sizing: border-box; }

        .vt-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #0A0F1E;
          color: #E8EDF7;
          overflow-x: hidden;
        }

        .syne { font-family: 'Syne', sans-serif; }

        /* Noise texture overlay */
        .vt-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.025;
          pointer-events: none;
          z-index: 0;
        }

        .vt-content { position: relative; z-index: 1; }

        /* Grid background */
        .grid-bg {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(79, 142, 247, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(79, 142, 247, 0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
          z-index: 0;
        }

        /* Glow blobs */
        .blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.15;
        }
        .blob-1 { width: 600px; height: 600px; background: #4F8EF7; top: -200px; right: -100px; }
        .blob-2 { width: 500px; height: 500px; background: #00C9A7; bottom: 100px; left: -150px; }
        .blob-3 { width: 400px; height: 400px; background: #B06EF7; top: 40%; left: 40%; transform: translate(-50%, -50%); opacity: 0.08; }

        /* Cards */
        .card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          backdrop-filter: blur(10px);
          transition: all 0.35s ease;
        }
        .card:hover {
          background: rgba(255,255,255,0.055);
          border-color: rgba(255,255,255,0.13);
          transform: translateY(-3px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.35);
        }

        .card-flat {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
        }

        /* Logo */
        .logo-mark {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: linear-gradient(135deg, #4F8EF7, #00C9A7);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 0 40px rgba(79, 142, 247, 0.4), 0 0 80px rgba(0,201,167,0.15);
        }
        .logo-mark::after {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 19px;
          background: linear-gradient(135deg, rgba(79,142,247,0.6), rgba(0,201,167,0.6));
          z-index: -1;
          filter: blur(8px);
        }

        /* Hero title */
        .hero-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(3.5rem, 8vw, 7rem);
          font-weight: 800;
          line-height: 0.95;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #ffffff 0%, #a8c4f0 50%, #00C9A7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Search */
        .search-wrap {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 18px;
          display: flex;
          align-items: center;
          transition: all 0.3s ease;
          overflow: hidden;
        }
        .search-wrap:focus-within {
          border-color: rgba(79,142,247,0.5);
          background: rgba(255,255,255,0.06);
          box-shadow: 0 0 0 4px rgba(79,142,247,0.08), 0 0 40px rgba(79,142,247,0.1);
        }
        .search-input {
          background: transparent;
          border: none;
          outline: none;
          color: #E8EDF7;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          flex: 1;
          padding: 18px 16px;
        }
        .search-input::placeholder { color: rgba(232,237,247,0.3); }
        .search-btn {
          background: linear-gradient(135deg, #4F8EF7, #00C9A7);
          border: none;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 14px 28px;
          margin: 6px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        .search-btn:hover { opacity: 0.9; transform: scale(1.02); }
        .search-btn:disabled { opacity: 0.5; }

        /* Stat cards */
        .stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 28px 24px;
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          background: rgba(255,255,255,0.055);
          transform: translateY(-4px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.4);
        }
        .stat-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }
        .stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 2.25rem;
          font-weight: 700;
          line-height: 1;
          color: #fff;
          margin-bottom: 6px;
        }
        .stat-label {
          font-size: 0.85rem;
          color: rgba(232,237,247,0.5);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .stat-growth {
          font-size: 0.78rem;
          font-weight: 600;
          color: #00C9A7;
          margin-top: 8px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        /* Action cards */
        .action-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px;
          padding: 36px 32px;
          text-decoration: none;
          display: block;
          transition: all 0.35s ease;
          position: relative;
          overflow: hidden;
        }
        .action-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .action-card:hover {
          background: rgba(255,255,255,0.055);
          border-color: rgba(255,255,255,0.13);
          transform: translateY(-5px);
          box-shadow: 0 30px 70px rgba(0,0,0,0.4);
        }
        .action-card:hover::before { opacity: 1; }

        .action-icon-wrap {
          width: 60px; height: 60px;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
        }
        .action-label {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 10px;
          opacity: 0.6;
        }
        .action-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.3rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 10px;
        }
        .action-desc {
          font-size: 0.9rem;
          color: rgba(232,237,247,0.5);
          line-height: 1.6;
        }
        .action-arrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(232,237,247,0.4);
          transition: all 0.2s ease;
        }
        .action-card:hover .action-arrow {
          color: #fff;
          gap: 10px;
        }

        /* Activity */
        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 18px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: all 0.2s ease;
        }
        .activity-item:last-child { border-bottom: none; padding-bottom: 0; }
        .activity-item:first-child { padding-top: 0; }

        .activity-icon {
          width: 38px; height: 38px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* Section title */
        .section-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.6rem;
          color: #fff;
          margin-bottom: 6px;
        }
        .section-sub {
          font-size: 0.9rem;
          color: rgba(232,237,247,0.4);
          margin-bottom: 28px;
        }

        /* Search results */
        .results-panel {
          background: rgba(10,15,30,0.95);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 18px;
          backdrop-filter: blur(20px);
          overflow: hidden;
        }
        .result-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .result-item:last-child { border-bottom: none; }
        .result-item:hover { background: rgba(255,255,255,0.05); }

        /* Navbar */
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(10,15,30,0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 16px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-links {
          display: flex;
          gap: 4px;
        }
        .nav-link {
          color: rgba(232,237,247,0.5);
          text-decoration: none;
          font-size: 0.88rem;
          font-weight: 500;
          padding: 8px 14px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .nav-link:hover {
          color: #fff;
          background: rgba(255,255,255,0.05);
        }

        /* Badge */
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(79,142,247,0.1);
          border: 1px solid rgba(79,142,247,0.2);
          color: #4F8EF7;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 50px;
          margin-bottom: 20px;
        }
        .badge-dot {
          width: 6px; height: 6px;
          background: #4F8EF7;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* Animations */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.2s; opacity: 0; }
        .delay-3 { animation-delay: 0.3s; opacity: 0; }
        .delay-4 { animation-delay: 0.4s; opacity: 0; }

        /* Divider */
        .section-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
          margin: 0;
        }

        /* Spinner */
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Live indicator */
        .live-dot {
          display: inline-block;
          width: 8px; height: 8px;
          background: #00C9A7;
          border-radius: 50%;
          margin-right: 8px;
          animation: pulse 1.5s infinite;
          box-shadow: 0 0 0 0 rgba(0,201,167,0.4);
        }
        @keyframes pulse2 {
          0% { box-shadow: 0 0 0 0 rgba(0,201,167,0.4); }
          70% { box-shadow: 0 0 0 8px rgba(0,201,167,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,201,167,0); }
        }
      `}</style>

      <div className="vt-root">
        <div className="grid-bg" />
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div className="vt-content">
          {/* Navbar */}
          <Navbar />

          {/* Main Layout */}
          <div
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "60px 40px 100px",
            }}
          >
            {/* ─── HERO SECTION ─── */}
            <div style={{ textAlign: "center", marginBottom: 80 }}>
              <div
                className="fade-up"
                style={{
                  marginBottom: 24,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div className="logo-mark">
                    <Shield size={28} color="#fff" strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              <div className="fade-up delay-1">
                <div className="badge">
                  <span className="badge-dot" />
                  Supply Chain Intelligence Platform
                </div>
                <h1 className="hero-title">VeriTrace</h1>
                <p
                  style={{
                    fontSize: "1.2rem",
                    color: "rgba(232,237,247,0.5)",
                    marginTop: 20,
                    maxWidth: 560,
                    margin: "20px auto 0",
                    lineHeight: 1.7,
                    fontWeight: 300,
                  }}
                >
                  Complete supply chain transparency and real-time product
                  provenance tracking — from factory floor to end consumer.
                </p>
              </div>
            </div>

            {/* ─── SEARCH CARD ─── */}
            <div
              className="card fade-up delay-2"
              style={{ padding: "40px 40px 36px", marginBottom: 28 }}
            >
              <div style={{ marginBottom: 20 }}>
                <p
                  className="syne"
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(232,237,247,0.35)",
                    marginBottom: 8,
                  }}
                >
                  Global Search
                </p>
                <p
                  style={{
                    fontSize: "1.05rem",
                    color: "rgba(232,237,247,0.7)",
                    fontWeight: 400,
                  }}
                >
                  Find any product, unit, or organization instantly
                </p>
              </div>

              <div className="search-wrap">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 52,
                    height: 52,
                    marginLeft: 8,
                    flexShrink: 0,
                  }}
                >
                  <Search size={20} color="rgba(232,237,247,0.35)" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter serial number, product name, or organization..."
                  className="search-input"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="search-btn"
                >
                  {isSearching ? <div className="spinner" /> : "Search"}
                </button>
              </div>

              {/* Search Results */}
              {showResults && (
                <div className="results-panel" style={{ marginTop: 12 }}>
                  {searchResults.length > 0 ? (
                    <>
                      <div
                        style={{
                          padding: "12px 20px 8px",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "rgba(232,237,247,0.4)",
                            fontWeight: 500,
                          }}
                        >
                          {searchResults.length} results found
                        </span>
                      </div>
                      {searchResults.map((result, index) => (
                        <div
                          key={index}
                          className="result-item"
                          onClick={() => handleResultClick(result)}
                        >
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              background: "rgba(255,255,255,0.04)",
                              borderRadius: 10,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1rem",
                              flexShrink: 0,
                            }}
                          >
                            {result.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                color: "#E8EDF7",
                                fontWeight: 500,
                                fontSize: "0.9rem",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {result.product_name ||
                                result.serial_number ||
                                result.org_name}
                            </div>
                            <div
                              style={{
                                color: "rgba(232,237,247,0.4)",
                                fontSize: "0.78rem",
                                marginTop: 2,
                              }}
                            >
                              {result.type === "product" &&
                                `SKU: ${result.sku}`}
                              {result.type === "unit" &&
                                `Serial: ${result.serial_number}`}
                              {result.type === "organization" &&
                                `${result.org_type} · ${result.country}`}
                            </div>
                          </div>
                          <ArrowRight
                            size={15}
                            color="rgba(232,237,247,0.25)"
                          />
                        </div>
                      ))}
                    </>
                  ) : (
                    <div
                      style={{
                        padding: "40px 20px",
                        textAlign: "center",
                        color: "rgba(232,237,247,0.4)",
                        fontSize: "0.9rem",
                      }}
                    >
                      No results found for "{searchTerm}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── STATS ROW ─── */}
            <div
              className="card fade-up delay-3"
              style={{ padding: "36px 40px", marginBottom: 28 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 28,
                }}
              >
                <div>
                  <p
                    className="syne"
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "rgba(232,237,247,0.35)",
                      marginBottom: 4,
                    }}
                  >
                    Platform Metrics
                  </p>
                  <p
                    style={{
                      fontSize: "1.05rem",
                      color: "rgba(232,237,247,0.7)",
                    }}
                  >
                    Live system overview
                  </p>
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "rgba(232,237,247,0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span className="live-dot" style={{ width: 6, height: 6 }} />
                  Updated just now
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 16,
                }}
              >
                {statsConfig.map((stat, i) => (
                  <div className="stat-card" key={i}>
                    <div
                      className="stat-icon"
                      style={{ background: `${stat.color}18` }}
                    >
                      <span style={{ color: stat.color }}>{stat.icon}</span>
                    </div>
                    <div className="stat-value">
                      {stat.value.toLocaleString()}
                    </div>
                    <div className="stat-label">{stat.label}</div>
                    <div className="stat-growth">
                      ↑ {stat.growth} this month
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── QUICK ACTIONS ─── */}
            <div
              className="card-flat fade-up"
              style={{ padding: "36px 40px", marginBottom: 28 }}
            >
              <div style={{ marginBottom: 32 }}>
                <p
                  className="syne"
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(232,237,247,0.35)",
                    marginBottom: 4,
                  }}
                >
                  Quick Actions
                </p>
                <p
                  style={{
                    fontSize: "1.05rem",
                    color: "rgba(232,237,247,0.7)",
                  }}
                >
                  Jump into the most common workflows
                </p>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 16,
                }}
              >
                {quickActions.map((action, i) => (
                  <a
                    key={i}
                    href={action.href}
                    className="action-card"
                    style={{ "--accent": action.accent }}
                  >
                    <div
                      className="action-label"
                      style={{ color: action.accent }}
                    >
                      {action.label}
                    </div>
                    <div
                      className="action-icon-wrap"
                      style={{ background: `${action.accent}15` }}
                    >
                      <span style={{ color: action.accent }}>
                        {action.icon}
                      </span>
                    </div>
                    <div className="action-title">{action.title}</div>
                    <div className="action-desc">{action.description}</div>
                    <div className="action-arrow">
                      Go to {action.label}
                      <ArrowRight size={14} />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* ─── BOTTOM ROW: Activity + Feature Highlights ─── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 28,
              }}
            >
              {/* Recent Activity */}
              <div className="card" style={{ padding: "36px 36px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 28,
                  }}
                >
                  <div>
                    <p
                      className="syne"
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "rgba(232,237,247,0.35)",
                        marginBottom: 4,
                      }}
                    >
                      Activity Feed
                    </p>
                    <p
                      style={{
                        fontSize: "1.05rem",
                        color: "rgba(232,237,247,0.7)",
                      }}
                    >
                      Recent system events
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "0.78rem",
                      color: "#00C9A7",
                      background: "rgba(0,201,167,0.08)",
                      border: "1px solid rgba(0,201,167,0.15)",
                      padding: "5px 12px",
                      borderRadius: 50,
                    }}
                  >
                    <span
                      className="live-dot"
                      style={{ width: 6, height: 6, background: "#00C9A7" }}
                    />
                    Live
                  </div>
                </div>
                <div>
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div
                        className="activity-icon"
                        style={{ background: `${activity.color}15` }}
                      >
                        <span style={{ color: activity.color }}>
                          {activity.icon}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            color: "rgba(232,237,247,0.85)",
                            fontSize: "0.88rem",
                            lineHeight: 1.5,
                            marginBottom: 4,
                          }}
                        >
                          {activity.description}
                        </p>
                        <p
                          style={{
                            color: "rgba(232,237,247,0.3)",
                            fontSize: "0.78rem",
                          }}
                        >
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Highlights */}
              <div className="card" style={{ padding: "36px 36px" }}>
                <div style={{ marginBottom: 28 }}>
                  <p
                    className="syne"
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "rgba(232,237,247,0.35)",
                      marginBottom: 4,
                    }}
                  >
                    Why VeriTrace
                  </p>
                  <p
                    style={{
                      fontSize: "1.05rem",
                      color: "rgba(232,237,247,0.7)",
                    }}
                  >
                    Built for modern supply chains
                  </p>
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  {[
                    {
                      icon: <Shield size={18} />,
                      color: "#4F8EF7",
                      title: "End-to-End Provenance",
                      desc: "Full chain-of-custody tracking from raw materials to consumer.",
                    },
                    {
                      icon: <Zap size={18} />,
                      color: "#F7A84F",
                      title: "Real-Time Transfers",
                      desc: "Instant visibility into product movement and location changes.",
                    },
                    {
                      icon: <Globe size={18} />,
                      color: "#00C9A7",
                      title: "Multi-Org Collaboration",
                      desc: "Connect suppliers, manufacturers, distributors in one platform.",
                    },
                    {
                      icon: <Activity size={18} />,
                      color: "#B06EF7",
                      title: "Smart Alerts",
                      desc: "Automated quality checks and anomaly detection across batches.",
                    },
                  ].map((feature, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 16,
                        padding: "18px 0",
                        borderBottom:
                          i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: `${feature.color}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: feature.color,
                          flexShrink: 0,
                        }}
                      >
                        {feature.icon}
                      </div>
                      <div>
                        <div
                          className="syne"
                          style={{
                            fontWeight: 600,
                            fontSize: "0.95rem",
                            color: "#fff",
                            marginBottom: 4,
                          }}
                        >
                          {feature.title}
                        </div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "rgba(232,237,247,0.45)",
                            lineHeight: 1.6,
                          }}
                        >
                          {feature.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </>
  );
}
