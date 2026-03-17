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
} from "lucide-react";

export default function ProvenancePage() {
  const [serialNumber, setSerialNumber] = useState("");
  const [provenanceData, setProvenanceData] = useState(null);
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

    try {
      const response = await fetch(
        `/api/provenance/${encodeURIComponent(serialNumber.trim())}`,
      );
      const data = await response.json();

      if (response.ok) {
        setProvenanceData(data);
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
      } else {
        setError(data.error || "Product not found");
        setProvenanceData(null);
      }
    } catch (err) {
      setError(
        "Failed to fetch provenance data. Please check your connection.",
      );
      setProvenanceData(null);
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

  const renderComponentTree = (components, level = 0, parentId = "root") => {
    if (!components || components.length === 0) return null;

    return components.map((component) => {
      const nodeId = `${parentId}-${component.unit_id}`;
      const isExpanded = expandedNodes.has(nodeId);
      const hasChildren =
        component.components && component.components.length > 0;

      return (
        <div
          key={component.unit_id}
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
                  {component.serial_number}
                </div>
                <div className="text-sm text-gray-300">
                  {component.product_name}
                </div>
                <div className="text-xs text-gray-400">
                  {component.manufacturer?.name} (
                  {component.manufacturer?.country})
                </div>
                {component.quantity > 1 && (
                  <div className="text-xs text-blue-300 mt-1">
                    Quantity: {component.quantity}
                  </div>
                )}
              </div>
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div className="ml-4 border-l-2 border-gray-600 pl-4 mt-2">
              {renderComponentTree(component.components, level + 1, nodeId)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Product Provenance Tracker
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Enter a product serial number to trace its complete journey through
          the supply chain
        </p>
      </div>

      {/* Search Section */}
      <div className="glass-card p-6 md:p-8 max-w-4xl mx-auto">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter product serial number (e.g., LAP-SN-1001)"
                className="glass-input w-full pl-12 pr-4 py-4 text-lg"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="glass-button-primary px-8 py-4 text-lg font-semibold disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="loading-spinner w-5 h-5"></div>
                  <span>Tracking...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Search className="w-5 h-5" />
                  <span>Track Product</span>
                </div>
              )}
            </button>
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-sm text-gray-400 self-center">Recent:</span>
              {searchHistory.map((serial, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSerialNumber(serial);
                    handleSearch();
                  }}
                  className="glass-button text-xs px-3 py-1 hover:bg-white hover:bg-opacity-20"
                >
                  {serial}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-500 bg-opacity-20 border border-red-400 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-300" />
            <p className="text-red-200">{error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      {provenanceData && (
        <div className="space-y-8 slide-in">
          {/* Product Information */}
          <div className="glass-card p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center space-x-3">
              <Package className="w-8 h-8 text-blue-400" />
              <span>Product Information</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-400 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>Serial Number</span>
                </label>
                <p className="text-white font-semibold text-sm md:text-base break-all">
                  {provenanceData.product.serial_number}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Product Name</span>
                </label>
                <p className="text-white font-semibold text-sm md:text-base">
                  {provenanceData.product.product_name}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  <span>Type</span>
                </label>
                <p className="text-white font-semibold text-sm md:text-base">
                  {provenanceData.product.product_type}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                  <span>Status</span>
                </label>
                <span
                  className={`status-badge status-${provenanceData.product.status} inline-block`}
                >
                  {provenanceData.product.status}
                </span>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                  <span>Manufacturer</span>
                </label>
                <p className="text-white font-semibold text-sm md:text-base">
                  {provenanceData.product.manufacturer?.name || "N/A"}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                  <span>Country</span>
                </label>
                <p className="text-white font-semibold text-sm md:text-base">
                  {provenanceData.product.manufacturer?.country || "N/A"}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                  <span>Manufacturing Date</span>
                </label>
                <p className="text-white font-semibold text-sm md:text-base">
                  {new Date(
                    provenanceData.product.manufacturing_date,
                  ).toLocaleDateString()}
                </p>
              </div>
              {provenanceData.product.batch_info && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-400 flex items-center space-x-2">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                    <span>Batch</span>
                  </label>
                  <p className="text-white font-semibold text-sm md:text-base">
                    {provenanceData.product.batch_info.batch_number} (
                    {provenanceData.product.batch_info.units_in_batch} units)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Component Hierarchy */}
          {provenanceData.components &&
            provenanceData.components.length > 0 && (
              <div className="glass-card p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center space-x-3">
                    <Package className="w-8 h-8 text-green-400" />
                    <span>Component Hierarchy</span>
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
                      collectNodeIds(provenanceData.components);
                      setExpandedNodes(allNodeIds);
                    }}
                    className="glass-button text-sm px-4 py-2"
                  >
                    Expand All
                  </button>
                </div>
                <div className="provenance-tree overflow-x-auto">
                  <div className="min-w-max">
                    <div className="provenance-node">
                      <div className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 bg-opacity-20">
                        <span className="text-2xl">📦</span>
                        <div>
                          <div className="font-bold text-lg text-white">
                            {provenanceData.product.serial_number}
                          </div>
                          <div className="text-sm text-gray-200">
                            {provenanceData.product.product_name}
                          </div>
                          <div className="text-xs text-gray-300">
                            {provenanceData.product.manufacturer?.name} (
                            {provenanceData.product.manufacturer?.country})
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 border-l-2 border-gray-600 pl-4">
                      {renderComponentTree(provenanceData.components)}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Supply Chain Journey */}
          {provenanceData.supply_chain_journey &&
            provenanceData.supply_chain_journey.length > 0 && (
              <div className="glass-card p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center space-x-3">
                  <Truck className="w-8 h-8 text-orange-400" />
                  <span>Supply Chain Journey</span>
                </h2>
                <div className="space-y-4">
                  {provenanceData.supply_chain_journey.map(
                    (transfer, index) => (
                      <div key={index} className="relative">
                        {/* Timeline Line */}
                        {index <
                          provenanceData.supply_chain_journey.length - 1 && (
                          <div className="absolute left-6 top-16 w-0.5 h-full bg-gray-600"></div>
                        )}

                        <div className="flex items-start space-x-4 p-4 bg-white bg-opacity-5 rounded-lg hover:bg-opacity-10 transition-all duration-200">
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                            {transfer.status === "shipped" && "📤"}
                            {transfer.status === "in_transit" && "🚚"}
                            {transfer.status === "received" && "📥"}
                            {transfer.status === "manufactured" && "🏭"}
                            {transfer.status === "quality_check" && "🔍"}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                              <span
                                className={`status-badge status-${transfer.status} inline-block`}
                              >
                                {transfer.status
                                  .replace("_", " ")
                                  .toUpperCase()}
                              </span>
                              <div className="flex items-center text-sm text-gray-400">
                                <Clock className="w-4 h-4 mr-1" />
                                {new Date(transfer.timestamp).toLocaleString()}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                                {transfer.from?.organization && (
                                  <>
                                    <span className="text-orange-300 font-medium">
                                      {transfer.from.organization}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-gray-400 hidden sm:block" />
                                    <span className="text-gray-400 sm:hidden">
                                      →
                                    </span>
                                  </>
                                )}
                                <span className="text-green-300 font-medium">
                                  {transfer.to.organization}
                                </span>
                              </div>

                              {transfer.location && (
                                <div className="flex items-center text-sm text-blue-300">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {transfer.location.name},{" "}
                                  {transfer.location.country}
                                </div>
                              )}

                              {transfer.tracking_number && (
                                <div className="text-sm text-gray-400 bg-black bg-opacity-20 px-3 py-1 rounded-full inline-block">
                                  📦 Tracking: {transfer.tracking_number}
                                </div>
                              )}

                              {transfer.notes && (
                                <div className="text-sm text-gray-300 italic mt-2">
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
              <div className="glass-card p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center space-x-3">
                  <Clock className="w-8 h-8 text-purple-400" />
                  <span>Status History</span>
                </h2>
                <div className="space-y-3">
                  {provenanceData.status_history.map((status, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-4 bg-white bg-opacity-5 rounded-lg hover:bg-opacity-10 transition-all duration-200"
                    >
                      <div className="flex-shrink-0">
                        {status.from && (
                          <span
                            className={`status-badge status-${status.from}`}
                          >
                            {status.from}
                          </span>
                        )}
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-shrink-0">
                        <span className={`status-badge status-${status.to}`}>
                          {status.to}
                        </span>
                      </div>
                      <div className="flex-1 text-right min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-1 sm:space-y-0 sm:space-x-2">
                          <div className="text-sm text-gray-400">
                            {new Date(status.timestamp).toLocaleString()}
                          </div>
                          {status.changed_by_name && (
                            <div className="text-xs text-gray-400">
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
          <div className="glass-card p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center space-x-3">
              <Package className="w-8 h-8 text-indigo-400" />
              <span>Summary</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-blue-500 to-blue-600 bg-opacity-20 rounded-lg">
                <div className="text-2xl md:text-3xl font-bold text-blue-300 mb-2">
                  {provenanceData.summary.total_components}
                </div>
                <div className="text-sm text-gray-300">Total Components</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-500 to-green-600 bg-opacity-20 rounded-lg">
                <div className="text-2xl md:text-3xl font-bold text-green-300 mb-2">
                  {provenanceData.summary.direct_components}
                </div>
                <div className="text-sm text-gray-300">Direct Components</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-500 to-orange-600 bg-opacity-20 rounded-lg">
                <div className="text-2xl md:text-3xl font-bold text-orange-300 mb-2">
                  {provenanceData.summary.transfer_count}
                </div>
                <div className="text-sm text-gray-300">Transfers</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-500 to-purple-600 bg-opacity-20 rounded-lg">
                <div className="text-2xl md:text-3xl font-bold text-purple-300 mb-2">
                  {provenanceData.summary.status_changes}
                </div>
                <div className="text-sm text-gray-300">Status Changes</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-pink-500 to-pink-600 bg-opacity-20 rounded-lg">
                <div className="text-2xl md:text-3xl font-bold text-pink-300 mb-2">
                  {provenanceData.summary.deepest_component_level}
                </div>
                <div className="text-sm text-gray-300">Deepest Level</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
