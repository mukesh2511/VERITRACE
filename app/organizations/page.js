"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
} from "lucide-react";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [formData, setFormData] = useState({
    org_name: "",
    org_type: "manufacturer",
    country: "",
    contact_email: "",
    phone: "",
    address: "",
  });
  const [editFormData, setEditFormData] = useState({
    id: "",
    org_name: "",
    org_type: "manufacturer",
    country: "",
    contact_email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchOrganizations();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterStatus]);

  const fetchOrganizations = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      if (filterStatus) {
        params.append("status", filterStatus);
      }

      const url = `/api/organizations/getallorg${params.toString() ? "?" + params.toString() : ""}`;
      const response = await fetch(url);
      const data = await response.json();
      setOrganizations(data);
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/organizations/createorg", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchOrganizations();
        setShowCreateForm(false);
        setFormData({
          org_name: "",
          org_type: "manufacturer",
          country: "",
          contact_email: "",
          phone: "",
          address: "",
        });
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create organization");
      }
    } catch (error) {
      alert("Failed to create organization");
    }
  };

  const handleEditOrganization = async (org) => {
    try {
      const response = await fetch(`/api/organizations/${org.org_id}`);
      if (response.ok) {
        const orgData = await response.json();
        setEditingOrg(orgData);
        setEditFormData({
          id: orgData.org_id,
          org_name: orgData.org_name || "",
          org_type: orgData.org_type || "manufacturer",
          country: orgData.country || "",
          contact_email: orgData.contact_email || "",
          phone: orgData.phone || "",
          address: orgData.address || "",
        });
        setShowEditForm(true);
      } else {
        alert("Failed to fetch organization details");
      }
    } catch (error) {
      alert("Failed to fetch organization details");
    }
  };

  const handleUpdateOrganization = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/organizations/updateorg", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        await fetchOrganizations();
        setShowEditForm(false);
        setEditingOrg(null);
        setEditFormData({
          id: "",
          org_name: "",
          org_type: "manufacturer",
          country: "",
          contact_email: "",
          phone: "",
          address: "",
        });
      } else {
        const error = await response.json();
        alert(error.message || "Failed to update organization");
      }
    } catch (error) {
      alert("Failed to update organization");
    }
  };

  const handleDeleteOrganization = async (orgId, orgName) => {
    if (
      !confirm(
        `Are you sure you want to delete ${orgName}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${orgId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchOrganizations();
        alert("Organization deleted successfully");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to delete organization");
      }
    } catch (error) {
      alert("Failed to delete organization");
    }
  };

  const orgTypes = [
    { value: "supplier", label: "Supplier", icon: "🏭" },
    { value: "manufacturer", label: "Manufacturer", icon: "🏭" },
    { value: "distributor", label: "Distributor", icon: "🚚" },
    { value: "retailer", label: "Retailer", icon: "🏪" },
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
        .main { padding: 20px; }

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

        /* Select element specific styling */
        select.glass-input {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M2 2 L6 6 L10 2' stroke='%23E8EDF7' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          background-size: 12px 8px;
          padding-right: 40px;
          cursor: pointer;
        }

        select.glass-input:hover {
          background-color: rgba(255,255,255,0.08);
          border-color: rgba(79,142,247,0.4);
        }

        /* Select option styling */
        select.glass-input option {
          background: #0A0F1E;
          color: #E8EDF7;
          padding: 12px 16px;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
        }

        select.glass-input option:hover {
          background: rgba(79,142,247,0.2);
          color: #fff;
        }

        select.glass-input option:checked {
          background: linear-gradient(135deg, #4F8EF7, #00C9A7);
          color: #fff;
          font-weight: 600;
        }

        select.glass-input:focus {
          outline: none;
          border-color: rgba(79,142,247,0.5);
          background: rgba(255,255,255,0.06);
          box-shadow: 0 0 0 4px rgba(79,142,247,0.08);
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

        .glass-button-danger {
          background: linear-gradient(135deg, #F74F4F, #DC2626);
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
        .glass-button-danger:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(247, 79, 79, 0.3);
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
        .status-active { background: rgba(0, 201, 167, 0.15); color: #00C9A7; border: 1px solid rgba(0, 201, 167, 0.3); }
        .status-inactive { background: rgba(247, 168, 79, 0.15); color: #F7A84F; border: 1px solid rgba(247, 168, 79, 0.3); }
        .status-suspended { background: rgba(247, 79, 79, 0.15); color: #F74F4F; border: 1px solid rgba(247, 79, 79, 0.3); }

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
                    Organization Management
                  </h1>
                  <p
                    style={{
                      fontSize: "1.05rem",
                      color: "rgba(232,237,247,0.6)",
                      lineHeight: 1.6,
                      fontWeight: 300,
                    }}
                  >
                    Manage supply chain partners and organizations
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
                  Add Organization
                </button>
              </div>
            </div>

            {/* Create Organization Modal */}
            {showCreateForm && (
              <div className="main fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ">
                <div className="glass-modal main p-8 w-full max-w-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      Create Organization
                    </h2>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="text-gray-400 hover:text-white text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <form
                    onSubmit={handleCreateOrganization}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Organization Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.org_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              org_name: e.target.value,
                            })
                          }
                          className="glass-input w-full"
                          placeholder="Enter organization name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Organization Type *
                        </label>
                        <select
                          value={formData.org_type}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              org_type: e.target.value,
                            })
                          }
                          className="glass-input w-full"
                        >
                          {orgTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.icon} {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          value={formData.country}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              country: e.target.value,
                            })
                          }
                          className="glass-input w-full"
                          placeholder="Enter country"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          value={formData.contact_email}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              contact_email: e.target.value,
                            })
                          }
                          className="glass-input w-full"
                          placeholder="contact@organization.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="glass-input w-full"
                          placeholder="+1-555-0123"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-6">
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="glass-button px-6 py-3"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="glass-button-primary px-6 py-3 font-semibold"
                      >
                        Create Organization
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Organization Modal */}
            {showEditForm && (
              <div className="main fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ">
                <div className="glass-modal main p-8 w-full max-w-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      Edit Organization
                    </h2>
                    <button
                      onClick={() => setShowEditForm(false)}
                      className="text-gray-400 hover:text-white text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <form
                    onSubmit={handleUpdateOrganization}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Organization Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={editFormData.org_name}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              org_name: e.target.value,
                            })
                          }
                          className="glass-input w-full"
                          placeholder="Enter organization name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Organization Type *
                        </label>
                        <select
                          value={editFormData.org_type}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              org_type: e.target.value,
                            })
                          }
                          className="glass-input w-full"
                        >
                          {orgTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.icon} {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          value={editFormData.country}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              country: e.target.value,
                            })
                          }
                          className="glass-input w-full"
                          placeholder="Enter country"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          value={editFormData.contact_email}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              contact_email: e.target.value,
                            })
                          }
                          className="glass-input w-full"
                          placeholder="contact@organization.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={editFormData.phone}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              phone: e.target.value,
                            })
                          }
                          className="glass-input w-full"
                          placeholder="+1-555-0123"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          value={editFormData.address}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              address: e.target.value,
                            })
                          }
                          className="glass-input w-full"
                          placeholder="Enter address"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-6">
                      <button
                        type="button"
                        onClick={() => setShowEditForm(false)}
                        className="glass-button px-6 py-3"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="glass-button-primary px-6 py-3 font-semibold"
                      >
                        Update Organization
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

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
                  Find organizations by name or status
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
                    Search by Name
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
                      placeholder="Enter organization name..."
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
                    Status Filter
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
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="glass-input"
                      style={{ paddingLeft: 48, appearance: "none" }}
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button
                    onClick={fetchOrganizations}
                    className="glass-button-primary"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    <Search className="w-4 h-4" />
                    Search Organizations
                  </button>
                </div>
              </div>
            </div>

            {/* ─── ORGANIZATIONS LIST ─── */}
            {organizations.length === 0 ? (
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
                  🏢
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
                  No Organizations Found
                </h3>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "rgba(232,237,247,0.6)",
                    lineHeight: 1.6,
                  }}
                >
                  Start by adding your first supply chain partner
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                  gap: 24,
                }}
                className="fade-up delay-2"
              >
                {organizations.map((org) => (
                  <div
                    key={org.org_id}
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
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
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
                            background:
                              "linear-gradient(135deg, #4F8EF7, #00C9A7)",
                            fontSize: "1.2rem",
                          }}
                        >
                          🏢
                        </div>
                        <div>
                          <h3
                            style={{
                              fontSize: "1.1rem",
                              fontWeight: 600,
                              color: "#fff",
                              marginBottom: 4,
                              lineHeight: 1.3,
                            }}
                          >
                            {org.org_name}
                          </h3>
                          <p
                            style={{
                              fontSize: "0.85rem",
                              color: "rgba(232,237,247,0.6)",
                              fontFamily: "DM Sans",
                              textTransform: "capitalize",
                            }}
                          >
                            {org.org_type}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`status-badge status-${org.is_active ? "active" : "inactive"}`}
                      >
                        {org.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                        marginBottom: 20,
                        fontSize: "0.85rem",
                      }}
                    >
                      {org.contact_email && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Mail
                            style={{
                              color: "rgba(232,237,247,0.4)",
                              width: 16,
                              height: 16,
                            }}
                          />
                          <span style={{ color: "rgba(232,237,247,0.7)" }}>
                            Email:
                          </span>
                          <span style={{ color: "#fff", fontWeight: 500 }}>
                            {org.contact_email}
                          </span>
                        </div>
                      )}

                      {org.phone && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Phone
                            style={{
                              color: "rgba(232,237,247,0.4)",
                              width: 16,
                              height: 16,
                            }}
                          />
                          <span style={{ color: "rgba(232,237,247,0.7)" }}>
                            Phone:
                          </span>
                          <span style={{ color: "#fff", fontWeight: 500 }}>
                            {org.phone}
                          </span>
                        </div>
                      )}

                      {org.website && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Globe
                            style={{
                              color: "rgba(232,237,247,0.4)",
                              width: 16,
                              height: 16,
                            }}
                          />
                          <span style={{ color: "rgba(232,237,247,0.7)" }}>
                            Website:
                          </span>
                          <a
                            href={org.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#4F8EF7",
                              fontWeight: 500,
                              textDecoration: "none",
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.textDecoration = "underline";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.textDecoration = "none";
                            }}
                          >
                            {org.website.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      )}

                      {org.address && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                          }}
                        >
                          <MapPin
                            style={{
                              color: "rgba(232,237,247,0.4)",
                              width: 16,
                              height: 16,
                              marginTop: 2,
                            }}
                          />
                          <span style={{ color: "rgba(232,237,247,0.7)" }}>
                            Address:
                          </span>
                          <span
                            style={{ color: "#fff", fontWeight: 500, flex: 1 }}
                          >
                            {org.address}
                          </span>
                        </div>
                      )}
                    </div>

                    {org.description && (
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "rgba(232,237,247,0.6)",
                          fontStyle: "italic",
                          marginBottom: 20,
                          padding: "12px 16px",
                          background: "rgba(255,255,255,0.03)",
                          borderRadius: "8px",
                          border: "1px solid rgba(255,255,255,0.07)",
                        }}
                      >
                        "{org.description}"
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
                        Created: {new Date(org.created_at).toLocaleDateString()}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                        }}
                      >
                        <button
                          onClick={() => handleEditOrganization(org)}
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
                          onClick={() =>
                            handleDeleteOrganization(org.org_id, org.org_name)
                          }
                          className="glass-button-danger"
                          style={{
                            fontSize: "0.8rem",
                            padding: "8px 16px",
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
