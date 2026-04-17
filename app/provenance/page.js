"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Package,
  AlertCircle,
  Clock,
  MapPin,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Truck,
} from "lucide-react";

export default function ProvenancePage() {
  const [serialNumber, setSerialNumber] = useState("");
  const [provenanceData, setProvenanceData] = useState(null);
  const [productUnits, setProductUnits] = useState([]);
  const [allTransfers, setAllTransfers] = useState([]);
  const [allAssemblies, setAllAssemblies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [searchHistory, setSearchHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("provenanceSearchHistory");
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  const handleSearch = async () => {
    if (!serialNumber.trim()) {
      setError("Please enter a serial number");
      return;
    }

    setLoading(true);
    setError("");
    setProvenanceData(null);
    setProductUnits([]);
    setAllTransfers([]);
    setAllAssemblies([]);

    try {
      // First, get provenance data for the searched serial number
      const response = await fetch("/api/provenance/trace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serial_number: serialNumber.trim(),
          trace_depth: "full",
          include_assemblies: true,
          include_transfers: true,
          include_status_history: true,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setProvenanceData(data);
        console.log("Provenance data:", data);

        // Get all units of the same product
        const unitsResponse = await fetch(
          `/api/products/units?catalog_id=${data.component.catalog_id}`,
        );
        const unitsData = await unitsResponse.json();
        console.log("Units response:", unitsResponse);
        console.log("Units data:", unitsData);

        if (unitsResponse.ok) {
          console.log("Units data received:", unitsData);
          if (unitsData.length > 0) {
            setProductUnits(unitsData);
            console.log("Set product units:", unitsData.length);

            // Get transfers for all units
            const transferPromises = unitsData.map((unit) =>
              fetch(`/api/transfers?unit_id=${unit.unit_id}`),
            );
            const transferResponses = await Promise.all(transferPromises);
            const allTransferData = [];

            for (let i = 0; i < transferResponses.length; i++) {
              if (transferResponses[i].ok) {
                const transfers = await transferResponses[i].json();
                console.log(
                  `Transfers for unit ${unitsData[i].serial_number}:`,
                  transfers,
                );
                if (Array.isArray(transfers)) {
                  allTransferData.push(
                    ...transfers.map((t) => ({
                      ...t,
                      unit_serial: unitsData[i].serial_number,
                    })),
                  );
                }
              } else {
                console.log(
                  `Failed to get transfers for unit ${unitsData[i].serial_number}:`,
                  transferResponses[i].status,
                );
              }
            }
            console.log("All transfer data:", allTransferData);
            setAllTransfers(allTransferData);

            // Get assembly info for all units
            const assemblyPromises = unitsData.map((unit) =>
              fetch("/api/provenance/trace", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  serial_number: unit.serial_number,
                  trace_depth: "full",
                  include_assemblies: true,
                  include_transfers: false,
                  include_status_history: false,
                }),
              }),
            );
            const assemblyResponses = await Promise.all(assemblyPromises);
            const allAssemblyData = [];

            for (let i = 0; i < assemblyResponses.length; i++) {
              if (assemblyResponses[i].ok) {
                const assemblyData = await assemblyResponses[i].json();
                console.log(
                  `Assembly data for unit ${unitsData[i].serial_number}:`,
                  assemblyData,
                );
                allAssemblyData.push({
                  unit: unitsData[i],
                  assemblies: assemblyData.used_in_assemblies || [],
                });
              } else {
                console.log(
                  `Failed to get assembly data for unit ${unitsData[i].serial_number}:`,
                  assemblyResponses[i].status,
                );
              }
            }
            console.log("All assembly data:", allAssemblyData);
            setAllAssemblies(allAssemblyData);
          } else {
            console.log("No units found for this product");
          }
        } else {
          console.log("Failed to get units:", unitsResponse.status);
        }
      } else {
        setError(data.error || "Product not found");
      }

      // Update search history
      const newHistory = [
        serialNumber.trim(),
        ...searchHistory.filter((s) => s !== serialNumber.trim()),
      ].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem(
        "provenanceSearchHistory",
        JSON.stringify(newHistory),
      );
    } catch (err) {
      setError("Failed to fetch data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderAssemblyTree = (assemblies, level = 0, parentId = "root") => {
    if (!assemblies || assemblies.length === 0) return null;

    return assemblies.map((assembly) => {
      const nodeId = `${parentId}-${assembly.unit_id}`;
      const isExpanded = expandedNodes.has(nodeId);
      const hasChildren =
        assembly.parent_assemblies && assembly.parent_assemblies.length > 0;

      return (
        <div
          key={assembly.unit_id}
          className={`ml-${level === 0 ? 0 : 8} transition-all duration-200`}
        >
          <div className="provenance-node inline-block">
            <div
              className="flex items-center space-x-2 p-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
              onClick={() => hasChildren && toggleNode(nodeId)}
            >
              <span className="text-blue-300 text-xl">📦</span>
              {hasChildren && (
                <button className="text-gray-400 hover:text-white transition-colors">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}
              <div className="flex-1">
                <div className="font-semibold text-white">
                  {assembly.serial_number}
                </div>
                <div className="text-sm text-gray-300">
                  {assembly.product_name}
                </div>
                <div className="text-xs text-gray-400">
                  {assembly.manufacturer?.name} (
                  {assembly.manufacturer?.country})
                </div>
                {assembly.quantity_used && (
                  <div className="text-xs text-blue-300 mt-1">
                    Quantity Used: {assembly.quantity_used}
                  </div>
                )}
              </div>
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div className="ml-4 border-l-2 border-gray-600 pl-4 mt-2">
              {renderAssemblyTree(
                assembly.parent_assemblies,
                level + 1,
                nodeId,
              )}
            </div>
          )}
        </div>
      );
    });
  };

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

        /* Input styles */
        .glass-input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #E8EDF7;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          padding: 12px 16px;
          transition: all 0.3s ease;
          width: 100%;
        }
        .glass-input:focus {
          outline: none;
          border-color: rgba(79,142,247,0.5);
          background: rgba(255,255,255,0.06);
          box-shadow: 0 0 0 4px rgba(79,142,247,0.08);
        }
        .glass-input::placeholder {
          color: rgba(232,237,247,0.3);
        }

        /* Button styles */
        .glass-button {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #E8EDF7;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          padding: 12px 24px;
          transition: all 0.3s ease;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .glass-button:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-1px);
        }

        .glass-button-primary {
          background: linear-gradient(135deg, #4F8EF7, #00C9A7);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          padding: 12px 24px;
          transition: all 0.3s ease;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .glass-button-primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(79, 142, 247, 0.3);
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

        /* Loading spinner */
        .spinner {
          width: 20px; height: 20px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #4F8EF7;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Provenance tree */
        .provenance-tree {
          font-family: 'DM Sans', sans-serif;
        }
        .provenance-node {
          transition: all 0.2s ease;
        }
        .provenance-node:hover {
          background: rgba(255,255,255,0.05);
        }
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
            <div
              style={{ textAlign: "center", marginBottom: 60 }}
              className="fade-up"
            >
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
                Product Provenance Tracker
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
                Enter a product serial number to trace its complete journey
                through the supply chain
              </p>
            </div>

            {/* ─── SEARCH SECTION ─── */}
            <div
              className="card fade-up delay-1"
              style={{ padding: "40px 32px", marginBottom: 32 }}
            >
              <div style={{ spaceY: 16 }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      alignItems: "stretch",
                    }}
                  >
                    <div style={{ flex: 1, position: "relative" }}>
                      <Search
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                        style={{
                          position: "absolute",
                          left: 16,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "rgba(232,237,247,0.4)",
                          width: 20,
                          height: 20,
                        }}
                      />
                      <input
                        type="text"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                        className="glass-input"
                        style={{
                          paddingLeft: 52,
                          paddingRight: 20,
                          fontSize: "1rem",
                          padding: "16px 20px 16px 52px",
                        }}
                        placeholder="Enter product serial number (e.g., LAP-SN-1001)"
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      disabled={loading}
                      className="glass-button-primary"
                      style={{
                        fontSize: "1rem",
                        padding: "16px 32px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {loading ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div className="spinner" />
                          <span>Tracking...</span>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Search className="w-5 h-5" />
                          <span>Track Product</span>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Search History */}
                  {searchHistory.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        paddingTop: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: "rgba(232,237,247,0.4)",
                          alignSelf: "center",
                        }}
                      >
                        Recent:
                      </span>
                      {searchHistory.map((serial, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSerialNumber(serial);
                            handleSearch();
                          }}
                          className="glass-button"
                          style={{
                            fontSize: "0.8rem",
                            padding: "6px 12px",
                            hover: { backgroundColor: "rgba(255,255,255,0.1)" },
                          }}
                        >
                          {serial}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div
                    style={{
                      padding: "16px 20px",
                      background: "rgba(247, 79, 79, 0.1)",
                      border: "1px solid rgba(247, 79, 79, 0.3)",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <AlertCircle
                      className="w-5 h-5"
                      style={{ color: "#F74F4F" }}
                    />
                    <p style={{ color: "#F74F4F", margin: 0 }}>{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ─── RESULTS ─── */}

            {/* Product Units Information */}
            {productUnits.length > 0 && (
              <div style={{ spaceY: 32 }} className="fade-up delay-2">
                {/* Product Units Summary */}
                <div className="card" style={{ padding: "32px 28px" }}>
                  <div style={{ marginBottom: 24 }}>
                    <h2
                      className="syne"
                      style={{
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        color: "#fff",
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <Package
                        className="w-7 h-7"
                        style={{ color: "#4F8EF7" }}
                      />
                      All Units for This Product
                    </h2>
                    <p
                      style={{
                        fontSize: "1rem",
                        color: "rgba(232,237,247,0.6)",
                        marginBottom: 16,
                      }}
                    >
                      Found {productUnits.length} units for "
                      {provenanceData?.component?.product_name ||
                        "this product"}
                      "
                    </p>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {productUnits.map((unit, index) => (
                      <div
                        key={unit.unit_id}
                        style={{
                          padding: "16px",
                          borderRadius: "12px",
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.07)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: "#fff",
                            marginBottom: 8,
                          }}
                        >
                          {unit.serial_number}
                        </div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "rgba(232,237,247,0.7)",
                            marginBottom: 4,
                          }}
                        >
                          {unit.product_name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "rgba(232,237,247,0.5)",
                          }}
                        >
                          Status:{" "}
                          <span style={{ color: "#00C9A7" }}>
                            {unit.status}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "rgba(232,237,247,0.5)",
                          }}
                        >
                          Manufacturer: {unit.manufacturer_name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* All Transfers for Product Units */}
                {allTransfers.length > 0 && (
                  <div className="card" style={{ padding: "32px 28px" }}>
                    <h2
                      className="syne"
                      style={{
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        color: "#fff",
                        marginBottom: 24,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <Truck className="w-7 h-7" style={{ color: "#F7A84F" }} />
                      All Transfer History ({allTransfers.length} transfers)
                    </h2>
                    <div style={{ spaceY: 16 }}>
                      {allTransfers
                        .sort(
                          (a, b) =>
                            new Date(b.transfer_time) -
                            new Date(a.transfer_time),
                        )
                        .map((transfer, index) => (
                          <div key={index} style={{ position: "relative" }}>
                            {/* Timeline Line */}
                            {index < allTransfers.length - 1 && (
                              <div
                                style={{
                                  position: "absolute",
                                  left: 24,
                                  top: 64,
                                  width: 2,
                                  height: "100%",
                                  background: "rgba(255,255,255,0.1)",
                                }}
                              />
                            )}

                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 16,
                                padding: "16px 20px",
                                borderRadius: "12px",
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                transition: "all 0.2s ease",
                                hover: {
                                  background: "rgba(255,255,255,0.05)",
                                },
                              }}
                            >
                              <div
                                style={{
                                  flexShrink: 0,
                                  width: 48,
                                  height: 48,
                                  borderRadius: "12px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background:
                                    "linear-gradient(135deg, #4F8EF7, #B06EF7)",
                                  fontSize: "1.2rem",
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                                }}
                              >
                                {transfer.status === "shipped" && "📤"}
                                {transfer.status === "in_transit" && "🚚"}
                                {transfer.status === "received" && "📥"}
                                {transfer.status === "manufactured" && "🏭"}
                                {transfer.status === "quality_check" && "🔍"}
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    sm: {
                                      flexDirection: "row",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                    },
                                    gap: 8,
                                    marginBottom: 12,
                                  }}
                                >
                                  <span
                                    className={`status-badge status-${transfer.status}`}
                                  >
                                    {transfer.status
                                      .replace("_", " ")
                                      .toUpperCase()}
                                  </span>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      fontSize: "0.85rem",
                                      color: "rgba(232,237,247,0.4)",
                                    }}
                                  >
                                    <Clock className="w-4 h-4" />
                                    {new Date(
                                      transfer.transfer_time,
                                    ).toLocaleString()}
                                  </div>
                                </div>

                                <div style={{ spaceY: 8 }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      sm: {
                                        flexDirection: "row",
                                        alignItems: "center",
                                      },
                                      gap: 8,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "0.8rem",
                                        color: "rgba(232,237,247,0.6)",
                                        marginBottom: 4,
                                      }}
                                    >
                                      Unit: {transfer.unit_serial}
                                    </span>
                                    {transfer.from_org_name && (
                                      <>
                                        <span
                                          style={{
                                            color: "#F7A84F",
                                            fontWeight: 500,
                                          }}
                                        >
                                          {transfer.from_org_name}
                                        </span>
                                        <ArrowRight
                                          className="w-4 h-4"
                                          style={{
                                            color: "rgba(232,237,247,0.4)",
                                            display: "none",
                                            sm: { display: "block" },
                                          }}
                                        />
                                        <span
                                          style={{
                                            color: "rgba(232,237,247,0.4)",
                                            display: "block",
                                            sm: { display: "none" },
                                          }}
                                        >
                                          →
                                        </span>
                                      </>
                                    )}
                                    <span
                                      style={{
                                        color: "#00C9A7",
                                        fontWeight: 500,
                                      }}
                                    >
                                      {transfer.to_org_name}
                                    </span>
                                  </div>

                                  {transfer.location_name && (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        fontSize: "0.85rem",
                                        color: "#4F8EF7",
                                      }}
                                    >
                                      <MapPin className="w-4 h-4" />
                                      {transfer.location_name},{" "}
                                      {transfer.location_country}
                                    </div>
                                  )}

                                  {transfer.tracking_number && (
                                    <div
                                      style={{
                                        fontSize: "0.85rem",
                                        color: "rgba(232,237,247,0.4)",
                                        background: "rgba(0,0,0,0.2)",
                                        padding: "4px 12px",
                                        borderRadius: "50px",
                                        display: "inline-block",
                                      }}
                                    >
                                      📦 Tracking: {transfer.tracking_number}
                                    </div>
                                  )}

                                  {transfer.notes && (
                                    <div
                                      style={{
                                        fontSize: "0.85rem",
                                        color: "rgba(232,237,247,0.6)",
                                        fontStyle: "italic",
                                        marginTop: 8,
                                      }}
                                    >
                                      "{transfer.notes}"
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Assembly Information for All Units */}
                {allAssemblies.length > 0 && (
                  <div className="card" style={{ padding: "32px 28px" }}>
                    <h2
                      className="syne"
                      style={{
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        color: "#fff",
                        marginBottom: 24,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <Package
                        className="w-7 h-7"
                        style={{ color: "#00C9A7" }}
                      />
                      Assembly Information
                    </h2>
                    <div style={{ spaceY: 24 }}>
                      {allAssemblies.map((unitAssembly, index) => (
                        <div
                          key={index}
                          style={{
                            padding: "20px",
                            borderRadius: "12px",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.07)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "1.1rem",
                              fontWeight: 600,
                              color: "#fff",
                              marginBottom: 12,
                            }}
                          >
                            📦 {unitAssembly.unit.serial_number}
                          </div>
                          <div
                            style={{
                              fontSize: "0.9rem",
                              color: "rgba(232,237,247,0.8)",
                              marginBottom: 16,
                            }}
                          >
                            {unitAssembly.unit.product_name}
                          </div>

                          {unitAssembly.assemblies.length > 0 ? (
                            <div
                              className="provenance-tree"
                              style={{ marginLeft: 20 }}
                            >
                              {renderAssemblyTree(unitAssembly.assemblies)}
                            </div>
                          ) : (
                            <div
                              style={{
                                fontSize: "0.85rem",
                                color: "rgba(232,237,247,0.6)",
                                fontStyle: "italic",
                              }}
                            >
                              No assembly information available
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Original Serial Number Search Results */}
            {provenanceData && (
              <div style={{ spaceY: 32 }} className="fade-up delay-2">
                {/* Product Information */}
                <div className="card" style={{ padding: "32px 28px" }}>
                  <div style={{ marginBottom: 24 }}>
                    <h2
                      className="syne"
                      style={{
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        color: "#fff",
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <Package
                        className="w-7 h-7"
                        style={{ color: "#4F8EF7" }}
                      />
                      Product Information
                    </h2>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: 20,
                    }}
                  >
                    {[
                      {
                        label: "Serial Number",
                        value: provenanceData.component.serial_number,
                        color: "#4F8EF7",
                      },
                      {
                        label: "Product Name",
                        value: provenanceData.component.product_name,
                        color: "#00C9A7",
                      },
                      {
                        label: "Type",
                        value: provenanceData.component.product_type,
                        color: "#B06EF7",
                      },
                      {
                        label: "Status",
                        value: provenanceData.component.status,
                        color: "#F7A84F",
                        isBadge: true,
                      },
                      {
                        label: "Manufacturer",
                        value:
                          provenanceData.component.manufacturer?.name || "N/A",
                        color: "#00C9A7",
                      },
                      {
                        label: "Country",
                        value:
                          provenanceData.component.manufacturer?.country ||
                          "N/A",
                        color: "#B06EF7",
                      },
                      {
                        label: "Manufacturing Date",
                        value: new Date(
                          provenanceData.component.manufacturing_date,
                        ).toLocaleDateString(),
                        color: "#F7A84F",
                      },
                    ]
                      .filter(Boolean)
                      .map((item, index) => (
                        <div key={index} style={{ spaceY: 6 }}>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              fontSize: "0.85rem",
                              fontWeight: 500,
                              color: "rgba(232,237,247,0.7)",
                              marginBottom: 6,
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: item.color,
                              }}
                            />
                            <span>{item.label}</span>
                          </label>
                          {item.isBadge ? (
                            <span
                              className={`status-badge status-${item.value.toLowerCase().replace(" ", "-")}`}
                            >
                              {item.value}
                            </span>
                          ) : (
                            <p
                              style={{
                                color: "#fff",
                                fontWeight: 500,
                                fontSize: "0.9rem",
                                wordBreak: "break-all",
                              }}
                            >
                              {item.value}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Child Units (Assembly Components) */}
                {provenanceData.child_units &&
                  provenanceData.child_units.length > 0 && (
                    <div className="card" style={{ padding: "32px 28px" }}>
                      <h2
                        className="syne"
                        style={{
                          fontSize: "1.3rem",
                          fontWeight: 700,
                          color: "#fff",
                          marginBottom: 24,
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <Package
                          className="w-7 h-7"
                          style={{ color: "#4F8EF7" }}
                        />
                        Assembly Components ({provenanceData.child_units.length}
                        )
                      </h2>
                      <div
                        style={{
                          display: "grid",
                          gap: 16,
                        }}
                      >
                        {provenanceData.child_units.map((child, index) => (
                          <div
                            key={child.unit_id}
                            style={{
                              background: "rgba(255,255,255,0.02)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: 16,
                              padding: "20px 24px",
                              transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "rgba(255,255,255,0.04)";
                              e.currentTarget.style.borderColor =
                                "rgba(255,255,255,0.15)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                "rgba(255,255,255,0.02)";
                              e.currentTarget.style.borderColor =
                                "rgba(255,255,255,0.08)";
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: 12,
                              }}
                            >
                              <div>
                                <h3
                                  style={{
                                    fontSize: "1.1rem",
                                    fontWeight: 600,
                                    color: "#fff",
                                    marginBottom: 4,
                                  }}
                                >
                                  {child.product_name}
                                </h3>
                                <p
                                  style={{
                                    fontSize: "0.9rem",
                                    color: "rgba(232,237,247,0.7)",
                                    fontFamily: "monospace",
                                  }}
                                >
                                  {child.serial_number}
                                </p>
                              </div>
                              <div
                                className={`status-badge status-${child.status}`}
                                style={{ marginLeft: 12 }}
                              >
                                {child.status}
                              </div>
                            </div>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: 12,
                                fontSize: "0.85rem",
                                color: "rgba(232,237,247,0.6)",
                              }}
                            >
                              <div>
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color: "rgba(232,237,247,0.8)",
                                  }}
                                >
                                  Type:
                                </span>{" "}
                                {child.product_type}
                              </div>
                              <div>
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color: "rgba(232,237,247,0.8)",
                                  }}
                                >
                                  Quantity:
                                </span>{" "}
                                {child.quantity_used}
                              </div>
                              <div>
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color: "rgba(232,237,247,0.8)",
                                  }}
                                >
                                  Manufacturer:
                                </span>{" "}
                                {child.manufacturer?.name || "Unknown"}
                              </div>
                              <div>
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color: "rgba(232,237,247,0.8)",
                                  }}
                                >
                                  Country:
                                </span>{" "}
                                {child.manufacturer?.country || "Unknown"}
                              </div>
                              <div>
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color: "rgba(232,237,247,0.8)",
                                  }}
                                >
                                  Manufactured:
                                </span>{" "}
                                {child.manufacturing_date
                                  ? new Date(
                                      child.manufacturing_date,
                                    ).toLocaleDateString()
                                  : "Unknown"}
                              </div>
                              <div>
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color: "rgba(232,237,247,0.8)",
                                  }}
                                >
                                  Assembled:
                                </span>{" "}
                                {child.assembled_at
                                  ? new Date(
                                      child.assembled_at,
                                    ).toLocaleDateString()
                                  : "Unknown"}
                              </div>
                            </div>
                            {/* Transfer History for Child Unit */}
                            {child.transfer_history &&
                              child.transfer_history.length > 0 && (
                                <div
                                  style={{
                                    marginTop: 16,
                                    padding: "16px 20px",
                                    background: "rgba(255,255,255,0.015)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                    borderRadius: 12,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      marginBottom: 12,
                                      fontSize: "0.9rem",
                                      fontWeight: 600,
                                      color: "rgba(232,237,247,0.9)",
                                    }}
                                  >
                                    <Truck
                                      className="w-4 h-4"
                                      style={{ color: "#F7A84F" }}
                                    />
                                    Transfer History (
                                    {child.transfer_history.length})
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 12,
                                    }}
                                  >
                                    {child.transfer_history.map(
                                      (transfer, transferIndex) => (
                                        <div
                                          key={transferIndex}
                                          style={{
                                            display: "flex",
                                            gap: 12,
                                            alignItems: "flex-start",
                                            padding: "12px 16px",
                                            background:
                                              "rgba(255,255,255,0.02)",
                                            borderRadius: 8,
                                            border:
                                              "1px solid rgba(255,255,255,0.03)",
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: 32,
                                              height: 32,
                                              borderRadius: "50%",
                                              background:
                                                "rgba(247, 168, 79, 0.15)",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              flexShrink: 0,
                                            }}
                                          >
                                            <Truck
                                              className="w-4 h-4"
                                              style={{ color: "#F7A84F" }}
                                            />
                                          </div>
                                          <div
                                            style={{
                                              flex: 1,
                                              fontSize: "0.85rem",
                                            }}
                                          >
                                            <div
                                              style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginBottom: 8,
                                              }}
                                            >
                                              <div
                                                className={`status-badge status-${transfer.status}`}
                                                style={{ fontSize: "0.7rem" }}
                                              >
                                                {transfer.status}
                                              </div>
                                              <div
                                                style={{
                                                  color:
                                                    "rgba(232,237,247,0.5)",
                                                }}
                                              >
                                                {transfer.timestamp
                                                  ? new Date(
                                                      transfer.timestamp,
                                                    ).toLocaleDateString()
                                                  : "Unknown"}
                                              </div>
                                            </div>
                                            <div
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                color: "rgba(232,237,247,0.7)",
                                                marginBottom: 4,
                                              }}
                                            >
                                              {transfer.from?.organization && (
                                                <>
                                                  <span>
                                                    {transfer.from.organization}
                                                  </span>
                                                  <ArrowRight className="w-3 h-3" />
                                                </>
                                              )}
                                              <span>
                                                {transfer.to?.organization}
                                              </span>
                                            </div>
                                            {transfer.tracking_number && (
                                              <div
                                                style={{
                                                  fontSize: "0.8rem",
                                                  color:
                                                    "rgba(232,237,247,0.5)",
                                                  fontFamily: "monospace",
                                                }}
                                              >
                                                Tracking:{" "}
                                                {transfer.tracking_number}
                                              </div>
                                            )}
                                            {transfer.location && (
                                              <div
                                                style={{
                                                  fontSize: "0.8rem",
                                                  color:
                                                    "rgba(232,237,247,0.5)",
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: 4,
                                                }}
                                              >
                                                <MapPin className="w-3 h-3" />
                                                {transfer.location.name},{" "}
                                                {transfer.location.country}
                                              </div>
                                            )}
                                            {transfer.notes && (
                                              <div
                                                style={{
                                                  fontSize: "0.8rem",
                                                  color:
                                                    "rgba(232,237,247,0.6)",
                                                  fontStyle: "italic",
                                                  marginTop: 4,
                                                }}
                                              >
                                                {transfer.notes}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Assembly Hierarchy */}
                {provenanceData.used_in_assemblies &&
                  provenanceData.used_in_assemblies.length > 0 && (
                    <div className="card" style={{ padding: "32px 28px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 24,
                        }}
                      >
                        <h2
                          className="syne"
                          style={{
                            fontSize: "1.3rem",
                            fontWeight: 700,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <Package
                            className="w-7 h-7"
                            style={{ color: "#00C9A7" }}
                          />
                          Assembly Hierarchy
                        </h2>
                        <button
                          onClick={() => {
                            const allNodeIds = new Set();
                            const collectNodeIds = (
                              components,
                              parentId = "root",
                            ) => {
                              components.forEach((component) => {
                                const nodeId = `${parentId}-${component.unit_id}`;
                                allNodeIds.add(nodeId);
                                if (component.components) {
                                  collectNodeIds(component.components, nodeId);
                                }
                              });
                            };
                            collectNodeIds(provenanceData.used_in_assemblies);
                            setExpandedNodes(allNodeIds);
                          }}
                          className="glass-button"
                          style={{ fontSize: "0.85rem", padding: "8px 16px" }}
                        >
                          Expand All
                        </button>
                      </div>
                      <div
                        className="provenance-tree"
                        style={{ overflowX: "auto" }}
                      >
                        <div style={{ minWidth: "max-content" }}>
                          <div className="provenance-node">
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "16px 20px",
                                borderRadius: "12px",
                                background:
                                  "linear-gradient(135deg, rgba(0, 201, 167, 0.2), rgba(0, 201, 167, 0.1))",
                              }}
                            >
                              <span style={{ fontSize: "1.5rem" }}>📦</span>
                              <div>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    fontSize: "1.1rem",
                                    color: "#fff",
                                    marginBottom: 4,
                                  }}
                                >
                                  {provenanceData.component.serial_number}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.9rem",
                                    color: "rgba(232,237,247,0.8)",
                                  }}
                                >
                                  {provenanceData.component.product_name}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "rgba(232,237,247,0.6)",
                                  }}
                                >
                                  {provenanceData.component.manufacturer?.name}{" "}
                                  (
                                  {
                                    provenanceData.component.manufacturer
                                      ?.country
                                  }
                                  )
                                </div>
                              </div>
                            </div>
                          </div>
                          <div
                            style={{
                              marginLeft: 20,
                              borderLeft: "2px solid rgba(255,255,255,0.1)",
                              paddingLeft: 20,
                              marginTop: 16,
                            }}
                          >
                            {renderAssemblyTree(
                              provenanceData.used_in_assemblies,
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Transfer History */}
                {provenanceData.transfer_history &&
                  provenanceData.transfer_history.length > 0 && (
                    <div className="card" style={{ padding: "32px 28px" }}>
                      <h2
                        className="syne"
                        style={{
                          fontSize: "1.3rem",
                          fontWeight: 700,
                          color: "#fff",
                          marginBottom: 24,
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <Truck
                          className="w-7 h-7"
                          style={{ color: "#F7A84F" }}
                        />
                        Transfer History
                      </h2>
                      <div style={{ spaceY: 16 }}>
                        {provenanceData.transfer_history.map(
                          (transfer, index) => (
                            <div key={index} style={{ position: "relative" }}>
                              {/* Timeline Line */}
                              {index <
                                provenanceData.transfer_history.length - 1 && (
                                <div
                                  style={{
                                    position: "absolute",
                                    left: 24,
                                    top: 64,
                                    width: 2,
                                    height: "100%",
                                    background: "rgba(255,255,255,0.1)",
                                  }}
                                />
                              )}

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: 16,
                                  padding: "16px 20px",
                                  borderRadius: "12px",
                                  background: "rgba(255,255,255,0.03)",
                                  border: "1px solid rgba(255,255,255,0.07)",
                                  transition: "all 0.2s ease",
                                  hover: {
                                    background: "rgba(255,255,255,0.05)",
                                  },
                                }}
                              >
                                <div
                                  style={{
                                    flexShrink: 0,
                                    width: 48,
                                    height: 48,
                                    borderRadius: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background:
                                      "linear-gradient(135deg, #4F8EF7, #B06EF7)",
                                    fontSize: "1.2rem",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                                  }}
                                >
                                  {transfer.status === "shipped" && "📤"}
                                  {transfer.status === "in_transit" && "🚚"}
                                  {transfer.status === "received" && "📥"}
                                  {transfer.status === "manufactured" && "🏭"}
                                  {transfer.status === "quality_check" && "🔍"}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      sm: {
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                      },
                                      gap: 8,
                                      marginBottom: 12,
                                    }}
                                  >
                                    <span
                                      className={`status-badge status-${transfer.status}`}
                                    >
                                      {transfer.status
                                        .replace("_", " ")
                                        .toUpperCase()}
                                    </span>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        fontSize: "0.85rem",
                                        color: "rgba(232,237,247,0.4)",
                                      }}
                                    >
                                      <Clock className="w-4 h-4" />
                                      {new Date(
                                        transfer.timestamp,
                                      ).toLocaleString()}
                                    </div>
                                  </div>

                                  <div style={{ spaceY: 8 }}>
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        sm: {
                                          flexDirection: "row",
                                          alignItems: "center",
                                        },
                                        gap: 8,
                                      }}
                                    >
                                      {transfer.from?.organization && (
                                        <>
                                          <span
                                            style={{
                                              color: "#F7A84F",
                                              fontWeight: 500,
                                            }}
                                          >
                                            {transfer.from.organization}
                                          </span>
                                          <ArrowRight
                                            className="w-4 h-4"
                                            style={{
                                              color: "rgba(232,237,247,0.4)",
                                              display: "none",
                                              sm: { display: "block" },
                                            }}
                                          />
                                          <span
                                            style={{
                                              color: "rgba(232,237,247,0.4)",
                                              display: "block",
                                              sm: { display: "none" },
                                            }}
                                          >
                                            →
                                          </span>
                                        </>
                                      )}
                                      <span
                                        style={{
                                          color: "#00C9A7",
                                          fontWeight: 500,
                                        }}
                                      >
                                        {transfer.to.organization}
                                      </span>
                                    </div>

                                    {transfer.location && (
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 8,
                                          fontSize: "0.85rem",
                                          color: "#4F8EF7",
                                        }}
                                      >
                                        <MapPin className="w-4 h-4" />
                                        {transfer.location.name},{" "}
                                        {transfer.location.country}
                                      </div>
                                    )}

                                    {transfer.tracking_number && (
                                      <div
                                        style={{
                                          fontSize: "0.85rem",
                                          color: "rgba(232,237,247,0.4)",
                                          background: "rgba(0,0,0,0.2)",
                                          padding: "4px 12px",
                                          borderRadius: "50px",
                                          display: "inline-block",
                                        }}
                                      >
                                        📦 Tracking: {transfer.tracking_number}
                                      </div>
                                    )}

                                    {transfer.notes && (
                                      <div
                                        style={{
                                          fontSize: "0.85rem",
                                          color: "rgba(232,237,247,0.6)",
                                          fontStyle: "italic",
                                          marginTop: 8,
                                        }}
                                      >
                                        "{transfer.notes}"
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* Status History */}
                {provenanceData.status_history &&
                  provenanceData.status_history.length > 0 && (
                    <div className="card" style={{ padding: "32px 28px" }}>
                      <h2
                        className="syne"
                        style={{
                          fontSize: "1.3rem",
                          fontWeight: 700,
                          color: "#fff",
                          marginBottom: 24,
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <Clock
                          className="w-7 h-7"
                          style={{ color: "#B06EF7" }}
                        />
                        Status History
                      </h2>
                      <div style={{ spaceY: 12 }}>
                        {provenanceData.status_history.map((status, index) => (
                          <div
                            key={index}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 16,
                              padding: "16px 20px",
                              borderRadius: "12px",
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.07)",
                              transition: "all 0.2s ease",
                              hover: { background: "rgba(255,255,255,0.05)" },
                            }}
                          >
                            <div style={{ flexShrink: 0 }}>
                              {status.from && (
                                <span
                                  className={`status-badge status-${status.from}`}
                                >
                                  {status.from}
                                </span>
                              )}
                            </div>
                            <ArrowRight
                              className="w-5 h-5"
                              style={{
                                color: "rgba(232,237,247,0.4)",
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ flexShrink: 0 }}>
                              <span
                                className={`status-badge status-${status.to}`}
                              >
                                {status.to}
                              </span>
                            </div>
                            <div
                              style={{
                                flex: 1,
                                textAlign: "right",
                                minWidth: 0,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  sm: {
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                  },
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "0.85rem",
                                    color: "rgba(232,237,247,0.4)",
                                  }}
                                >
                                  {new Date(status.timestamp).toLocaleString()}
                                </div>
                                {status.changed_by_name && (
                                  <div
                                    style={{
                                      fontSize: "0.8rem",
                                      color: "rgba(232,237,247,0.4)",
                                    }}
                                  >
                                    by {status.changed_by_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Summary */}
                {provenanceData.summary && (
                  <div className="card" style={{ padding: "32px 28px" }}>
                    <h2
                      className="syne"
                      style={{
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        color: "#fff",
                        marginBottom: 24,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <Package
                        className="w-7 h-7"
                        style={{ color: "#4F8EF7" }}
                      />
                      Summary
                    </h2>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 20,
                      }}
                    >
                      {[
                        {
                          label: "Total Assemblies",
                          value: provenanceData.summary.total_assemblies,
                          color: "#4F8EF7",
                        },
                        {
                          label: "Direct Assemblies",
                          value: provenanceData.summary.direct_assemblies,
                          color: "#00C9A7",
                        },
                        {
                          label: "Transfers",
                          value: provenanceData.summary.transfer_count,
                          color: "#F7A84F",
                        },
                        {
                          label: "Status Changes",
                          value: provenanceData.summary.status_changes,
                          color: "#B06EF7",
                        },
                        {
                          label: "Max Assembly Level",
                          value: provenanceData.summary.max_assembly_level,
                          color: "#F74F4F",
                        },
                      ].map((stat, index) => (
                        <div
                          key={index}
                          style={{
                            textAlign: "center",
                            padding: "20px 16px",
                            borderRadius: "12px",
                            background: `linear-gradient(135deg, ${stat.color + "18"}, ${stat.color + "10"})`,
                            border: `1px solid ${stat.color + "30"}`,
                          }}
                        >
                          <div
                            style={{
                              fontSize: "1.8rem",
                              fontWeight: 700,
                              color: stat.color,
                              marginBottom: 8,
                            }}
                          >
                            {stat.value}
                          </div>
                          <div
                            style={{
                              fontSize: "0.85rem",
                              color: "rgba(232,237,247,0.7)",
                            }}
                          >
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
