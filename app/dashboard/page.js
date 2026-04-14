"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Package,
  Eye,
  Truck,
  Activity,
  TrendingUp,
  BarChart3,
  Zap,
  Shield,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    totalProducts: 0,
    totalUnits: 0,
    activeTransfers: 0,
    recentProvenanceQueries: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [transferStats, setTransferStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Simulate API calls - in real implementation, these would be actual API calls
      const mockStats = {
        totalOrganizations: 156,
        totalProducts: 1248,
        totalUnits: 45632,
        activeTransfers: 234,
        recentProvenanceQueries: 1892,
      };

      const mockActivity = [
        {
          id: 1,
          type: "provenance_query",
          description: "Product LAP-SN-1001 traced by Consumer",
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          icon: "🔍",
          severity: "info",
        },
        {
          id: 2,
          type: "transfer",
          description: "Shipment TRK-2024-001 delivered to Retail Store",
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          icon: "🚚",
          severity: "success",
        },
        {
          id: 3,
          type: "assembly",
          description: "Laptop Model X assembled with 5 components",
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          icon: "🔗",
          severity: "info",
        },
        {
          id: 4,
          type: "alert",
          description:
            "Quality alert: CPU batch CPU-SN-2000 requires inspection",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          icon: "⚠️",
          severity: "warning",
        },
        {
          id: 5,
          type: "registration",
          description: "100 units of CPU-SN-2000 batch registered",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          icon: "📦",
          severity: "success",
        },
      ];

      const mockTransferStats = [
        { month: "Jan", transfers: 234, units: 1567 },
        { month: "Feb", transfers: 189, units: 1234 },
        { month: "Mar", transfers: 267, units: 1890 },
        { month: "Apr", transfers: 198, units: 1456 },
        { month: "May", transfers: 312, units: 2234 },
        { month: "Jun", transfers: 289, units: 2012 },
      ];

      setStats(mockStats);
      setRecentActivity(mockActivity);
      setTransferStats(mockTransferStats);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "success":
        return "text-green-300";
      case "warning":
        return "text-yellow-300";
      case "error":
        return "text-red-300";
      default:
        return "text-blue-300";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

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

        /* Status badges */
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .status-created { background: rgba(79, 142, 247, 0.15); color: #4F8EF7; border: 1px solid rgba(79, 142, 247, 0.3); }
        .status-assembled { background: rgba(0, 201, 167, 0.15); color: #00C9A7; border: 1px solid rgba(0, 201, 167, 0.3); }
        .status-in-transit { background: rgba(247, 168, 79, 0.15); color: #F7A84F; border: 1px solid rgba(247, 168, 79, 0.3); }
        .status-delivered { background: rgba(176, 110, 247, 0.15); color: #B06EF7; border: 1px solid rgba(176, 110, 247, 0.3); }
        .status-retired { background: rgba(247, 79, 79, 0.15); color: #F74F4F; border: 1px solid rgba(247, 79, 79, 0.3); }
      `}</style>

      <div className="vt-root">
        <div className="grid-bg" />
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div className="vt-content">
          <div
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "60px 40px 100px",
            }}
          >
            {/* ─── HEADER ─── */}
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <div className="fade-up">
                <div className="badge">
                  <span className="badge-dot" />
                  Supply Chain Intelligence Dashboard
                </div>
                <h1
                  className="syne"
                  style={{
                    fontSize: "clamp(2.5rem, 5vw, 4rem)",
                    fontWeight: 800,
                    lineHeight: 0.95,
                    letterSpacing: "-0.03em",
                    background:
                      "linear-gradient(135deg, #ffffff 0%, #a8c4f0 50%, #00C9A7 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    margin: "20px 0",
                  }}
                >
                  Real-Time Analytics
                </h1>
                <p
                  style={{
                    fontSize: "1.1rem",
                    color: "rgba(232,237,247,0.6)",
                    maxWidth: 600,
                    margin: "0 auto",
                    lineHeight: 1.6,
                    fontWeight: 300,
                  }}
                >
                  Monitor your supply chain operations with live data and
                  intelligent insights
                </p>
              </div>
            </div>

            {/* ─── KEY METRICS ─── */}
            <div
              className="card fade-up delay-1"
              style={{ padding: "36px 40px", marginBottom: 32 }}
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
                {[
                  {
                    label: "Organizations",
                    value: stats.totalOrganizations,
                    icon: <Users className="w-5 h-5" />,
                    color: "#4F8EF7",
                    growth: "+12%",
                  },
                  {
                    label: "Products",
                    value: stats.totalProducts,
                    icon: <Package className="w-5 h-5" />,
                    color: "#00C9A7",
                    growth: "+8.2%",
                  },
                  {
                    label: "Units",
                    value: stats.totalUnits,
                    icon: <Eye className="w-5 h-5" />,
                    color: "#F7A84F",
                    growth: "+15.3%",
                  },
                  {
                    label: "Active Transfers",
                    value: stats.activeTransfers,
                    icon: <Truck className="w-5 h-5" />,
                    color: "#B06EF7",
                    growth: "+5.7%",
                  },
                  {
                    label: "Queries Today",
                    value: stats.recentProvenanceQueries,
                    icon: <Activity className="w-5 h-5" />,
                    color: "#F74F4F",
                    growth: "+23.4%",
                  },
                ].map((stat, i) => (
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

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 24,
                marginBottom: 32,
              }}
            >
              {/* Recent Activity */}
              <div
                className="card fade-up delay-2"
                style={{ padding: "32px 28px" }}
              >
                <div style={{ marginBottom: 24 }}>
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
                    Recent Activity
                  </p>
                  <p
                    style={{
                      fontSize: "1.05rem",
                      color: "rgba(232,237,247,0.7)",
                    }}
                  >
                    Live system events
                  </p>
                </div>
                <div style={{ maxHeight: 400, overflowY: "auto" }}>
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div
                        className="activity-icon"
                        style={{
                          background:
                            activity.severity === "success"
                              ? "#00C9A718"
                              : activity.severity === "warning"
                                ? "#F7A84F18"
                                : activity.severity === "error"
                                  ? "#F74F4F18"
                                  : "#4F8EF718",
                        }}
                      >
                        <span
                          style={{
                            color:
                              activity.severity === "success"
                                ? "#00C9A7"
                                : activity.severity === "warning"
                                  ? "#F7A84F"
                                  : activity.severity === "error"
                                    ? "#F74F4F"
                                    : "#4F8EF7",
                          }}
                        >
                          {activity.icon}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            color: "#E8EDF7",
                            fontWeight: 500,
                            fontSize: "0.9rem",
                            marginBottom: 4,
                          }}
                        >
                          {activity.description}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            className="status-badge status-created"
                            style={{
                              fontSize: "0.7rem",
                              padding: "2px 8px",
                            }}
                          >
                            {activity.type.replace("_", " ").toUpperCase()}
                          </span>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "rgba(232,237,247,0.4)",
                            }}
                          >
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transfer Statistics */}
              <div
                className="card fade-up delay-3"
                style={{ padding: "32px 28px" }}
              >
                <div style={{ marginBottom: 24 }}>
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
                    Transfer Trends
                  </p>
                  <p
                    style={{
                      fontSize: "1.05rem",
                      color: "rgba(232,237,247,0.7)",
                    }}
                  >
                    Monthly volume analysis
                  </p>
                </div>
                <div style={{ spaceY: 16 }}>
                  {transferStats.map((stat, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: "12px",
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <div style={{ color: "#fff", fontWeight: 500 }}>
                          {stat.month}
                        </div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "rgba(232,237,247,0.5)",
                          }}
                        >
                          2024
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "1.1rem",
                            fontWeight: 700,
                            color: "#fff",
                          }}
                        >
                          {stat.transfers}
                        </div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "rgba(232,237,247,0.6)",
                          }}
                        >
                          {stat.units} units
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mini Chart Visualization */}
                <div
                  style={{
                    marginTop: 24,
                    paddingTop: 24,
                    borderTop: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "rgba(232,237,247,0.4)",
                      marginBottom: 16,
                    }}
                  >
                    Transfer Volume (Last 6 Months)
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: 8,
                      height: 80,
                    }}
                  >
                    {transferStats.map((stat, index) => {
                      const maxValue = Math.max(
                        ...transferStats.map((s) => s.transfers),
                      );
                      const height = (stat.transfers / maxValue) * 100;
                      return (
                        <div
                          key={index}
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              background:
                                "linear-gradient(to top, #4F8EF7, #00C9A7)",
                              borderRadius: "4px 4px 0 0",
                              height: `${height}%`,
                            }}
                          />
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "rgba(232,237,247,0.4)",
                              marginTop: 8,
                            }}
                          >
                            {stat.month}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── QUICK ACTIONS ─── */}
            <div
              className="card-flat fade-up delay-4"
              style={{ padding: "36px 40px", marginBottom: 32 }}
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
                {[
                  {
                    title: "Track Product",
                    description: "Enter serial number for instant trace",
                    icon: <Search className="w-7 h-7" />,
                    href: "/provenance",
                    accent: "#00C9A7",
                    label: "Provenance",
                  },
                  {
                    title: "Register Units",
                    description: "Add new product units to system",
                    icon: <Package className="w-7 h-7" />,
                    href: "/units",
                    accent: "#4F8EF7",
                    label: "Inventory",
                  },
                  {
                    title: "Create Assembly",
                    description: "Build product hierarchies",
                    icon: <Zap className="w-7 h-7" />,
                    href: "/assembly",
                    accent: "#F7A84F",
                    label: "Assembly",
                  },
                  {
                    title: "Log Transfer",
                    description: "Record product movements",
                    icon: <Truck className="w-7 h-7" />,
                    href: "/transfers",
                    accent: "#B06EF7",
                    label: "Logistics",
                  },
                ].map((action, i) => (
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
                      style={{ background: `${action.accent}18` }}
                    >
                      <span style={{ color: action.accent }}>
                        {action.icon}
                      </span>
                    </div>
                    <div className="action-title">{action.title}</div>
                    <div className="action-desc">{action.description}</div>
                    <div className="action-arrow">
                      Get Started <ArrowRight className="w-4 h-4" />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* ─── SYSTEM HEALTH ─── */}
            <div className="card fade-up" style={{ padding: "32px 40px" }}>
              <div style={{ marginBottom: 24 }}>
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
                  System Health
                </p>
                <p
                  style={{
                    fontSize: "1.05rem",
                    color: "rgba(232,237,247,0.7)",
                  }}
                >
                  Infrastructure status monitoring
                </p>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 20,
                }}
              >
                {[
                  {
                    title: "System Status",
                    status: "Healthy",
                    icon: <Shield className="w-6 h-6" />,
                    color: "#00C9A7",
                    details: "All systems operational",
                  },
                  {
                    title: "API Response",
                    status: "142ms",
                    icon: <Zap className="w-6 h-6" />,
                    color: "#4F8EF7",
                    details: "Average response time",
                  },
                  {
                    title: "Database",
                    status: "Connected",
                    icon: <Activity className="w-6 h-6" />,
                    color: "#B06EF7",
                    details: "Real-time sync active",
                  },
                ].map((health, index) => (
                  <div
                    key={index}
                    className="stat-card"
                    style={{ padding: "24px 20px" }}
                  >
                    <div
                      className="stat-icon"
                      style={{
                        background: `${health.color}18`,
                        marginBottom: 12,
                      }}
                    >
                      <span style={{ color: health.color }}>{health.icon}</span>
                    </div>
                    <h3
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        color: "rgba(232,237,247,0.7)",
                        marginBottom: 8,
                      }}
                    >
                      {health.title}
                    </h3>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: health.color,
                        marginBottom: 6,
                      }}
                    >
                      {health.status}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "rgba(232,237,247,0.5)",
                      }}
                    >
                      {health.details}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
