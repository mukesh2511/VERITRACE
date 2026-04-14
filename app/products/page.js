"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Package,
  Plus,
  Edit,
  ArrowRight,
  Filter,
  X,
  Trash2,
  Eye,
  Box,
  Calendar,
  MapPin,
  Building,
  AlertCircle,
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [showCreateUnitForm, setShowCreateUnitForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productUnits, setProductUnits] = useState([]);
  const [formData, setFormData] = useState({
    product_name: "",
    product_type: "finished_product",
    description: "",
    sku: "",
    weight: "",
    dimensions: "",
    org_id: "",
  });
  const [unitFormData, setUnitFormData] = useState({
    catalog_id: "",
    serial_number: "",
    manufacturer_org_id: "",
    manufacturing_date: "",
    batch_number: "",
    expiry_date: "",
    current_location_id: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (filterType) params.append("product_type", filterType);

      const response = await fetch(`/api/products/catalog?${params}`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/products/catalog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          org_id: formData.org_id ? parseInt(formData.org_id) : 1,
        }),
      });

      if (response.ok) {
        await fetchProducts();
        setShowCreateForm(false);
        setFormData({
          product_name: "",
          product_type: "finished_product",
          description: "",
          sku: "",
          weight: "",
          dimensions: "",
          org_id: "",
        });
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create product");
      }
    } catch (error) {
      alert("Failed to create product");
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `/api/products/catalog/${selectedProduct.catalog_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            org_id: formData.org_id
              ? parseInt(formData.org_id)
              : selectedProduct.org_id,
          }),
        },
      );

      if (response.ok) {
        await fetchProducts();
        setShowEditForm(false);
        setSelectedProduct(null);
        setFormData({
          product_name: "",
          product_type: "finished_product",
          description: "",
          sku: "",
          weight: "",
          dimensions: "",
          org_id: "",
        });
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update product");
      }
    } catch (error) {
      alert("Failed to update product");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (
      !confirm(
        "Are you sure you want to delete this product? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/products/catalog/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchProducts();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete product");
      }
    } catch (error) {
      alert("Failed to delete product");
    }
  };

  const handleCreateUnit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/products/units", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...unitFormData,
          manufacturer_org_id: unitFormData.manufacturer_org_id
            ? parseInt(unitFormData.manufacturer_org_id)
            : null,
          current_location_id: unitFormData.current_location_id
            ? parseInt(unitFormData.current_location_id)
            : null,
        }),
      });

      if (response.ok) {
        await fetchProductUnits(selectedProduct.catalog_id);
        setShowCreateUnitForm(false);
        setUnitFormData({
          catalog_id: "",
          serial_number: "",
          manufacturer_org_id: "",
          manufacturing_date: "",
          batch_number: "",
          expiry_date: "",
          current_location_id: "",
        });
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create unit");
      }
    } catch (error) {
      alert("Failed to create unit");
    }
  };

  const fetchProductUnits = async (catalogId) => {
    try {
      const response = await fetch(
        `/api/products/units?catalog_id=${catalogId}`,
      );
      const data = await response.json();
      setProductUnits(data);
    } catch (error) {
      console.error("Failed to fetch product units:", error);
    }
  };

  const openEditForm = (product) => {
    setSelectedProduct(product);
    setFormData({
      product_name: product.product_name,
      product_type: product.product_type,
      description: product.description || "",
      sku: product.sku || "",
      weight: product.weight ? product.weight.toString() : "",
      dimensions: product.dimensions || "",
      org_id: product.org_id ? product.org_id.toString() : "",
    });
    setShowEditForm(true);
  };

  const openUnitsModal = (product) => {
    setSelectedProduct(product);
    setUnitFormData({
      ...unitFormData,
      catalog_id: product.catalog_id.toString(),
    });
    fetchProductUnits(product.catalog_id);
    setShowUnitsModal(true);
  };

  const productTypes = [
    {
      value: "raw_material",
      label: "Raw Material",
      icon: "🪨",
      color: "from-gray-500 to-gray-700",
    },
    {
      value: "component",
      label: "Component",
      icon: "🔧",
      color: "from-blue-500 to-blue-700",
    },
    {
      value: "finished_product",
      label: "Finished Product",
      icon: "📦",
      color: "from-green-500 to-green-700",
    },
  ];

  const mockOrganizations = [
    { id: 1, name: "Tech Manufacturing Inc" },
    { id: 2, name: "Component Supplier Ltd" },
    { id: 3, name: "Raw Materials Co" },
  ];

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

        .glass-button-success {
          background: linear-gradient(135deg, #00C9A7, #00B894);
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
        .glass-button-success:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(0, 201, 167, 0.3);
        }

        /* Modal styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: rgba(10,15,30,0.95);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          backdrop-filter: blur(20px);
          padding: 32px;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px rgba(0,0,0,0.5);
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

        /* Product type badges */
        .type-raw_material { background: rgba(107, 114, 128, 0.15); color: #9CA3AF; border: 1px solid rgba(107, 114, 128, 0.3); }
        .type-component { background: rgba(59, 130, 246, 0.15); color: #3B82F6; border: 1px solid rgba(59, 130, 246, 0.3); }
        .type-finished_product { background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); }

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
          width: 40px; height: 40px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #4F8EF7;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
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
            <div style={{ marginBottom: 48 }} className="fade-up">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div>
                  <h1
                    className="syne"
                    style={{
                      fontSize: "clamp(2rem, 4vw, 3rem)",
                      fontWeight: 800,
                      lineHeight: 0.95,
                      letterSpacing: "-0.03em",
                      background:
                        "linear-gradient(135deg, #ffffff 0%, #a8c4f0 50%, #00C9A7 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      marginBottom: 8,
                    }}
                  >
                    Product Catalog
                  </h1>
                  <p
                    style={{
                      fontSize: "1.05rem",
                      color: "rgba(232,237,247,0.6)",
                      lineHeight: 1.6,
                      fontWeight: 300,
                    }}
                  >
                    Manage product templates and specifications
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="glass-button-primary"
                  style={{
                    padding: "14px 28px",
                    fontSize: "1rem",
                  }}
                >
                  <Plus className="w-5 h-5" />
                  Add Product
                </button>
              </div>
            </div>

            {/* ─── FILTERS ─── */}
            <div
              className="card fade-up delay-1"
              style={{ padding: "32px 28px", marginBottom: 32 }}
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
                    marginBottom: 4,
                  }}
                >
                  Search & Filter
                </p>
                <p
                  style={{
                    fontSize: "1.05rem",
                    color: "rgba(232,237,247,0.7)",
                  }}
                >
                  Find products by name, SKU, or type
                </p>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 20,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: "rgba(232,237,247,0.7)",
                      marginBottom: 8,
                    }}
                  >
                    Search Products
                  </label>
                  <div style={{ position: "relative" }}>
                    <Search
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
                      style={{
                        position: "absolute",
                        left: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "rgba(232,237,247,0.4)",
                        width: 16,
                        height: 16,
                      }}
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="glass-input"
                      style={{ paddingLeft: 48 }}
                      placeholder="Search by name, SKU, or description..."
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: "rgba(232,237,247,0.7)",
                      marginBottom: 8,
                    }}
                  >
                    Product Type
                  </label>
                  <div style={{ position: "relative" }}>
                    <Filter
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
                      style={{
                        position: "absolute",
                        left: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "rgba(232,237,247,0.4)",
                        width: 16,
                        height: 16,
                      }}
                    />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="glass-input"
                      style={{ paddingLeft: 48, appearance: "none" }}
                    >
                      <option value="">All Types</option>
                      {productTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button
                    onClick={fetchProducts}
                    className="glass-button-primary"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    <Search className="w-4 h-4" />
                    Search Products
                  </button>
                </div>
              </div>
            </div>

            {/* ─── CREATE PRODUCT MODAL ─── */}
            {showCreateForm && (
              <div className="modal-overlay">
                <div
                  className="modal-content"
                  style={{ width: "100%", maxWidth: "800px" }}
                >
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
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      Create Product
                    </h2>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "rgba(232,237,247,0.4)",
                        fontSize: "1.5rem",
                        cursor: "pointer",
                        padding: 8,
                        borderRadius: 8,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.color = "#fff";
                        e.target.style.background = "rgba(255,255,255,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.color = "rgba(232,237,247,0.4)";
                        e.target.style.background = "none";
                      }}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateProduct} style={{ spaceY: 24 }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 24,
                        marginBottom: 24,
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            color: "rgba(232,237,247,0.7)",
                            marginBottom: 8,
                          }}
                        >
                          Product Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.product_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              product_name: e.target.value,
                            })
                          }
                          className="glass-input"
                          placeholder="Enter product name"
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            color: "rgba(232,237,247,0.7)",
                            marginBottom: 8,
                          }}
                        >
                          Product Type *
                        </label>
                        <select
                          value={formData.product_type}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              product_type: e.target.value,
                            })
                          }
                          className="glass-input"
                          style={{ appearance: "none" }}
                        >
                          {productTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.icon} {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            color: "rgba(232,237,247,0.7)",
                            marginBottom: 8,
                          }}
                        >
                          SKU
                        </label>
                        <input
                          type="text"
                          value={formData.sku}
                          onChange={(e) =>
                            setFormData({ ...formData, sku: e.target.value })
                          }
                          className="glass-input"
                          placeholder="PROD-001"
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            color: "rgba(232,237,247,0.7)",
                            marginBottom: 8,
                          }}
                        >
                          Organization
                        </label>
                        <select
                          value={formData.org_id}
                          onChange={(e) =>
                            setFormData({ ...formData, org_id: e.target.value })
                          }
                          className="glass-input"
                          style={{ appearance: "none" }}
                        >
                          <option value="">Select Organization</option>
                          {mockOrganizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          color: "rgba(232,237,247,0.7)",
                          marginBottom: 8,
                        }}
                      >
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="glass-input"
                        style={{
                          height: 100,
                          resize: "none",
                          fontFamily: "DM Sans",
                        }}
                        placeholder="Enter product description..."
                      />
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 24,
                        marginBottom: 32,
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            color: "rgba(232,237,247,0.7)",
                            marginBottom: 8,
                          }}
                        >
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={formData.weight}
                          onChange={(e) =>
                            setFormData({ ...formData, weight: e.target.value })
                          }
                          className="glass-input"
                          placeholder="0.000"
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            color: "rgba(232,237,247,0.7)",
                            marginBottom: 8,
                          }}
                        >
                          Dimensions (L×W×H)
                        </label>
                        <input
                          type="text"
                          value={formData.dimensions}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dimensions: e.target.value,
                            })
                          }
                          className="glass-input"
                          placeholder="100×50×20"
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 16,
                        paddingTop: 24,
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="glass-button"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="glass-button-primary">
                        Create Product
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ─── PRODUCTS GRID ─── */}
            {products.length === 0 ? (
              <div
                className="card fade-up delay-2"
                style={{
                  padding: "60px 40px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    background: "rgba(79, 142, 247, 0.1)",
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                    fontSize: "2rem",
                  }}
                >
                  📦
                </div>
                <h3
                  className="syne"
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: 12,
                  }}
                >
                  No Products Found
                </h3>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "rgba(232,237,247,0.6)",
                    lineHeight: 1.6,
                  }}
                >
                  Start by adding your first product to the catalog
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                  gap: 24,
                }}
                className="fade-up delay-2"
              >
                {products.map((product) => {
                  const typeInfo = productTypes.find(
                    (t) => t.value === product.product_type,
                  );
                  return (
                    <div
                      key={product.catalog_id}
                      className="card"
                      style={{ padding: "28px 24px" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 20,
                        }}
                      >
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: typeInfo
                              ? `${typeInfo.color.replace("from-", "").replace("to-", "").split(" ")[0]}18`
                              : "rgba(255,255,255,0.1)",
                            fontSize: "1.2rem",
                          }}
                        >
                          {typeInfo?.icon || "📦"}
                        </div>
                        <span
                          className={`status-badge type-${product.product_type}`}
                        >
                          {typeInfo?.label || "Unknown"}
                        </span>
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <h3
                          style={{
                            fontSize: "1.1rem",
                            fontWeight: 600,
                            color: "#fff",
                            marginBottom: 6,
                            lineHeight: 1.3,
                          }}
                        >
                          {product.product_name}
                        </h3>
                        {product.sku && (
                          <p
                            style={{
                              fontSize: "0.85rem",
                              color: "rgba(232,237,247,0.5)",
                              fontFamily: "DM Sans",
                            }}
                          >
                            SKU: {product.sku}
                          </p>
                        )}
                      </div>

                      {product.description && (
                        <p
                          style={{
                            color: "rgba(232,237,247,0.6)",
                            fontSize: "0.9rem",
                            lineHeight: 1.5,
                            marginBottom: 16,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {product.description}
                        </p>
                      )}

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: 12,
                          marginBottom: 20,
                          fontSize: "0.85rem",
                        }}
                      >
                        {product.weight && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span style={{ color: "rgba(232,237,247,0.4)" }}>
                              ⚖️
                            </span>
                            <span style={{ color: "rgba(232,237,247,0.7)" }}>
                              {product.weight} kg
                            </span>
                          </div>
                        )}

                        {product.dimensions && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span style={{ color: "rgba(232,237,247,0.4)" }}>
                              📏
                            </span>
                            <span style={{ color: "rgba(232,237,247,0.7)" }}>
                              {product.dimensions}
                            </span>
                          </div>
                        )}
                      </div>

                      {product.org_name && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 20,
                            fontSize: "0.85rem",
                          }}
                        >
                          <span style={{ color: "rgba(232,237,247,0.4)" }}>
                            🏢
                          </span>
                          <span style={{ color: "rgba(232,237,247,0.7)" }}>
                            {product.org_name}
                          </span>
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingTop: 20,
                          borderTop: "1px solid rgba(255,255,255,0.07)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "rgba(232,237,247,0.4)",
                          }}
                        >
                          Created:{" "}
                          {new Date(product.created_at).toLocaleDateString()}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                          }}
                        >
                          <button
                            onClick={() => openEditForm(product)}
                            className="glass-button"
                            style={{
                              fontSize: "0.8rem",
                              padding: "8px 16px",
                            }}
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => openUnitsModal(product)}
                            className="glass-button-success"
                            style={{
                              fontSize: "0.8rem",
                              padding: "8px 16px",
                            }}
                          >
                            <Eye className="w-3 h-3" />
                            Units
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteProduct(product.catalog_id)
                            }
                            className="glass-button"
                            style={{
                              fontSize: "0.8rem",
                              padding: "8px 16px",
                              background: "rgba(247, 79, 79, 0.15)",
                              borderColor: "rgba(247, 79, 79, 0.3)",
                              color: "#F74F4F",
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background =
                                "rgba(247, 79, 79, 0.25)";
                              e.target.style.borderColor =
                                "rgba(247, 79, 79, 0.5)";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background =
                                "rgba(247, 79, 79, 0.15)";
                              e.target.style.borderColor =
                                "rgba(247, 79, 79, 0.3)";
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── EDIT PRODUCT MODAL ─── */}
            {showEditForm && (
              <div className="modal-overlay">
                <div
                  className="modal-content"
                  style={{ width: "100%", maxWidth: "800px" }}
                >
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
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      Edit Product
                    </h2>
                    <button
                      onClick={() => {
                        setShowEditForm(false);
                        setSelectedProduct(null);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "rgba(232,237,247,0.4)",
                        fontSize: "1.5rem",
                        cursor: "pointer",
                        padding: 8,
                        borderRadius: 8,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.color = "#fff";
                        e.target.style.background = "rgba(255,255,255,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.color = "rgba(232,237,247,0.4)";
                        e.target.style.background = "none";
                      }}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleEditProduct} style={{ spaceY: 24 }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 24,
                        marginBottom: 24,
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            color: "rgba(232,237,247,0.7)",
                            marginBottom: 8,
                          }}
                        >
                          Product Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.product_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              product_name: e.target.value,
                            })
                          }
                          className="glass-input"
                          placeholder="Enter product name"
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            color: "rgba(232,237,247,0.7)",
                            marginBottom: 8,
                          }}
                        >
                          Product Type *
                        </label>
                        <select
                          value={formData.product_type}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              product_type: e.target.value,
                            })
                          }
                          className="glass-input"
                          style={{ appearance: "none" }}
                        >
                          {productTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.icon} {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            color: "rgba(232,237,247,0.7)",
                            marginBottom: 8,
                          }}
                        >
                          SKU
                        </label>
                        <input
                          type="text"
                          value={formData.sku}
                          onChange={(e) =>
                            setFormData({ ...formData, sku: e.target.value })
                          }
                          className="glass-input"
                          placeholder="PROD-001"
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            color: "rgba(232,237,247,0.7)",
                            marginBottom: 8,
                          }}
                        >
                          Organization
                        </label>
                        <select
                          value={formData.org_id}
                          onChange={(e) =>
                            setFormData({ ...formData, org_id: e.target.value })
                          }
                          className="glass-input"
                          style={{ appearance: "none" }}
                        >
                          <option value="">Select Organization</option>
                          {mockOrganizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          color: "rgba(232,237,247,0.7)",
                          marginBottom: 8,
                        }}
                      >
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="glass-input"
                        style={{
                          height: 100,
                          resize: "none",
                          fontFamily: "DM Sans",
                        }}
                        placeholder="Enter product description..."
                      />
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 24,
                        marginBottom: 32,
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            color: "rgba(232,237,247,0.7)",
                            marginBottom: 8,
                          }}
                        >
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={formData.weight}
                          onChange={(e) =>
                            setFormData({ ...formData, weight: e.target.value })
                          }
                          className="glass-input"
                          placeholder="0.000"
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            color: "rgba(232,237,247,0.7)",
                            marginBottom: 8,
                          }}
                        >
                          Dimensions (L×W×H)
                        </label>
                        <input
                          type="text"
                          value={formData.dimensions}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dimensions: e.target.value,
                            })
                          }
                          className="glass-input"
                          placeholder="100×50×20"
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 16,
                        paddingTop: 24,
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditForm(false);
                          setSelectedProduct(null);
                        }}
                        className="glass-button"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="glass-button-primary">
                        Update Product
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ─── UNITS MODAL ─── */}
            {showUnitsModal && (
              <div className="modal-overlay">
                <div
                  className="modal-content"
                  style={{ width: "100%", maxWidth: "1200px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 24,
                    }}
                  >
                    <div>
                      <h2
                        className="syne"
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: 700,
                          color: "#fff",
                          marginBottom: 4,
                        }}
                      >
                        Product Units - {selectedProduct?.product_name}
                      </h2>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: "rgba(232,237,247,0.6)",
                        }}
                      >
                        Manage individual product units and track their status
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <button
                        onClick={() => setShowCreateUnitForm(true)}
                        className="glass-button-primary"
                      >
                        <Plus className="w-4 h-4" />
                        Create Unit
                      </button>
                      <button
                        onClick={() => {
                          setShowUnitsModal(false);
                          setShowCreateUnitForm(false);
                          setSelectedProduct(null);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "rgba(232,237,247,0.4)",
                          fontSize: "1.5rem",
                          cursor: "pointer",
                          padding: 8,
                          borderRadius: 8,
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.color = "#fff";
                          e.target.style.background = "rgba(255,255,255,0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = "rgba(232,237,247,0.4)";
                          e.target.style.background = "none";
                        }}
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  {/* Units List */}
                  <div style={{ marginBottom: 24 }}>
                    {productUnits.length === 0 ? (
                      <div
                        className="card"
                        style={{
                          padding: "40px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 60,
                            height: 60,
                            background: "rgba(79, 142, 247, 0.1)",
                            borderRadius: "15px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 16px",
                            fontSize: "1.5rem",
                          }}
                        >
                          <Box
                            className="w-8 h-8"
                            style={{ color: "#4F8EF7" }}
                          />
                        </div>
                        <h3
                          style={{
                            fontSize: "1.1rem",
                            fontWeight: 600,
                            color: "#fff",
                            marginBottom: 8,
                          }}
                        >
                          No Units Found
                        </h3>
                        <p
                          style={{
                            fontSize: "0.9rem",
                            color: "rgba(232,237,247,0.6)",
                          }}
                        >
                          Create your first unit to start tracking this product
                        </p>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gap: 16,
                        }}
                      >
                        {productUnits.map((unit) => (
                          <div
                            key={unit.unit_id}
                            className="card"
                            style={{ padding: "20px" }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 16,
                                    marginBottom: 12,
                                  }}
                                >
                                  <div>
                                    <h4
                                      style={{
                                        fontSize: "1rem",
                                        fontWeight: 600,
                                        color: "#fff",
                                        marginBottom: 4,
                                      }}
                                    >
                                      Serial: {unit.serial_number}
                                    </h4>
                                    <span
                                      className={`status-badge status-${unit.status}`}
                                    >
                                      {unit.status}
                                    </span>
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                      "repeat(auto-fit, minmax(200px, 1fr))",
                                    gap: 16,
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  {unit.batch_number && (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                      }}
                                    >
                                      <Package
                                        className="w-4 h-4"
                                        style={{
                                          color: "rgba(232,237,247,0.4)",
                                        }}
                                      />
                                      <span
                                        style={{
                                          color: "rgba(232,237,247,0.7)",
                                        }}
                                      >
                                        Batch: {unit.batch_number}
                                      </span>
                                    </div>
                                  )}
                                  {unit.manufacturing_date && (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                      }}
                                    >
                                      <Calendar
                                        className="w-4 h-4"
                                        style={{
                                          color: "rgba(232,237,247,0.4)",
                                        }}
                                      />
                                      <span
                                        style={{
                                          color: "rgba(232,237,247,0.7)",
                                        }}
                                      >
                                        Mfg:{" "}
                                        {new Date(
                                          unit.manufacturing_date,
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                  {unit.expiry_date && (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                      }}
                                    >
                                      <AlertCircle
                                        className="w-4 h-4"
                                        style={{
                                          color: "rgba(247, 168, 79, 0.6)",
                                        }}
                                      />
                                      <span
                                        style={{
                                          color: "rgba(247, 168, 79, 0.8)",
                                        }}
                                      >
                                        Exp:{" "}
                                        {new Date(
                                          unit.expiry_date,
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                  {unit.manufacturer_name && (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                      }}
                                    >
                                      <Building
                                        className="w-4 h-4"
                                        style={{
                                          color: "rgba(232,237,247,0.4)",
                                        }}
                                      />
                                      <span
                                        style={{
                                          color: "rgba(232,237,247,0.7)",
                                        }}
                                      >
                                        {unit.manufacturer_name}
                                      </span>
                                    </div>
                                  )}
                                  {unit.current_location_name && (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                      }}
                                    >
                                      <MapPin
                                        className="w-4 h-4"
                                        style={{
                                          color: "rgba(232,237,247,0.4)",
                                        }}
                                      />
                                      <span
                                        style={{
                                          color: "rgba(232,237,247,0.7)",
                                        }}
                                      >
                                        {unit.current_location_name}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── CREATE UNIT MODAL ─── */}
            {showCreateUnitForm && (
              <div className="modal-overlay">
                <div
                  className="modal-content"
                  style={{ width: "100%", maxWidth: "600px" }}
                >
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
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      Create Product Unit
                    </h2>
                    <button
                      onClick={() => setShowCreateUnitForm(false)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "rgba(232,237,247,0.4)",
                        fontSize: "1.5rem",
                        cursor: "pointer",
                        padding: 8,
                        borderRadius: 8,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.color = "#fff";
                        e.target.style.background = "rgba(255,255,255,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.color = "rgba(232,237,247,0.4)";
                        e.target.style.background = "none";
                      }}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateUnit}>
                    <div style={{ marginBottom: 24 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          color: "rgba(232,237,247,0.7)",
                          marginBottom: 8,
                        }}
                      >
                        Serial Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={unitFormData.serial_number}
                        onChange={(e) =>
                          setUnitFormData({
                            ...unitFormData,
                            serial_number: e.target.value,
                          })
                        }
                        className="glass-input"
                        placeholder="Enter unique serial number"
                      />
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 20,
                        marginBottom: 24,
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            color: "rgba(232,237,247,0.7)",
                            marginBottom: 8,
                          }}
                        >
                          Batch Number
                        </label>
                        <input
                          type="text"
                          value={unitFormData.batch_number}
                          onChange={(e) =>
                            setUnitFormData({
                              ...unitFormData,
                              batch_number: e.target.value,
                            })
                          }
                          className="glass-input"
                          placeholder="BATCH-001"
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            color: "rgba(232,237,247,0.7)",
                            marginBottom: 8,
                          }}
                        >
                          Manufacturer
                        </label>
                        <select
                          value={unitFormData.manufacturer_org_id}
                          onChange={(e) =>
                            setUnitFormData({
                              ...unitFormData,
                              manufacturer_org_id: e.target.value,
                            })
                          }
                          className="glass-input"
                          style={{ appearance: "none" }}
                        >
                          <option value="">Select Manufacturer</option>
                          {mockOrganizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 20,
                        marginBottom: 24,
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            color: "rgba(232,237,247,0.7)",
                            marginBottom: 8,
                          }}
                        >
                          Manufacturing Date
                        </label>
                        <input
                          type="date"
                          value={unitFormData.manufacturing_date}
                          onChange={(e) =>
                            setUnitFormData({
                              ...unitFormData,
                              manufacturing_date: e.target.value,
                            })
                          }
                          className="glass-input"
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            color: "rgba(232,237,247,0.7)",
                            marginBottom: 8,
                          }}
                        >
                          Expiry Date
                        </label>
                        <input
                          type="date"
                          value={unitFormData.expiry_date}
                          onChange={(e) =>
                            setUnitFormData({
                              ...unitFormData,
                              expiry_date: e.target.value,
                            })
                          }
                          className="glass-input"
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: 32 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          color: "rgba(232,237,247,0.7)",
                          marginBottom: 8,
                        }}
                      >
                        Current Location
                      </label>
                      <select
                        value={unitFormData.current_location_id}
                        onChange={(e) =>
                          setUnitFormData({
                            ...unitFormData,
                            current_location_id: e.target.value,
                          })
                        }
                        className="glass-input"
                        style={{ appearance: "none" }}
                      >
                        <option value="">Select Location</option>
                        <option value="1">Warehouse A</option>
                        <option value="2">Warehouse B</option>
                        <option value="3">Factory Floor</option>
                        <option value="4">Shipping Dock</option>
                      </select>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 16,
                        paddingTop: 24,
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setShowCreateUnitForm(false)}
                        className="glass-button"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="glass-button-primary">
                        Create Unit
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
