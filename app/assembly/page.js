"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  X,
  ArrowRight,
  Search,
  Filter,
  Layers,
  GitBranch,
  Building2,
} from "lucide-react";

export default function AssemblyPage() {
  const [assemblies, setAssemblies] = useState([]);
  const [units, setUnits] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingAssembly, setEditingAssembly] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterParentUnit, setFilterParentUnit] = useState("");
  const [filterChildUnit, setFilterChildUnit] = useState("");
  const [formData, setFormData] = useState({
    parent_unit_id: "",
    child_unit_id: "",
    quantity: 1,
  });

  useEffect(() => {
    fetchAssemblies();
    fetchUnits();
    fetchOrganizations();
  }, []);

  const fetchAssemblies = async () => {
    try {
      const response = await fetch("/api/assembly");
      const data = await response.json();
      setAssemblies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch assemblies:", error);
      setAssemblies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await fetch("/api/products/units");
      const data = await response.json();
      setUnits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch units:", error);
      setUnits([]);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations/getallorg");
      const data = await response.json();
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
      setOrganizations([]);
    }
  };

  const handleCreateAssembly = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/assembly", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          parent_unit_id: parseInt(formData.parent_unit_id),
          child_unit_id: parseInt(formData.child_unit_id),
          quantity: parseInt(formData.quantity),
        }),
      });

      if (response.ok) {
        await fetchAssemblies();
        setShowCreateForm(false);
        setFormData({
          parent_unit_id: "",
          child_unit_id: "",
          quantity: 1,
        });
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create assembly");
      }
    } catch (error) {
      alert("Failed to create assembly");
    }
  };

  const handleEditAssembly = (assembly) => {
    setEditingAssembly(assembly);
    setFormData({
      parent_unit_id: assembly.parent_unit_id.toString(),
      child_unit_id: assembly.child_unit_id.toString(),
      quantity: assembly.quantity,
    });
    setShowEditForm(true);
  };

  const handleUpdateAssembly = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `/api/assembly/${editingAssembly.assembly_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity: parseInt(formData.quantity),
          }),
        },
      );

      if (response.ok) {
        await fetchAssemblies();
        setShowEditForm(false);
        setEditingAssembly(null);
        setFormData({
          parent_unit_id: "",
          child_unit_id: "",
          quantity: 1,
        });
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update assembly");
      }
    } catch (error) {
      alert("Failed to update assembly");
    }
  };

  const handleDeleteAssembly = async (assemblyId) => {
    if (!confirm("Are you sure you want to delete this assembly relationship?"))
      return;

    try {
      const response = await fetch(`/api/assembly/${assemblyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchAssemblies();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete assembly");
      }
    } catch (error) {
      alert("Failed to delete assembly");
    }
  };

  const getUnitById = (unitId) => {
    return units.find((unit) => unit.unit_id === unitId);
  };

  const getOrganizationById = (orgId) => {
    return organizations.find((org) => org.org_id === orgId);
  };

  const filteredAssemblies = assemblies.filter((assembly) => {
    const parentUnit = getUnitById(assembly.parent_unit_id);
    const childUnit = getUnitById(assembly.child_unit_id);

    const matchesSearch =
      searchTerm === "" ||
      (parentUnit &&
        parentUnit.serial_number
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (childUnit &&
        childUnit.serial_number
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (parentUnit &&
        parentUnit.product_name &&
        parentUnit.product_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (childUnit &&
        childUnit.product_name &&
        childUnit.product_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesParent =
      filterParentUnit === "" ||
      assembly.parent_unit_id.toString() === filterParentUnit;
    const matchesChild =
      filterChildUnit === "" ||
      assembly.child_unit_id.toString() === filterChildUnit;

    return matchesSearch && matchesParent && matchesChild;
  });

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
        .status-assembled { background: rgba(79, 142, 247, 0.15); color: #4F8EF7; border: 1px solid rgba(79, 142, 247, 0.3); }
        .status-inactive { background: rgba(247, 168, 79, 0.15); color: #F7A84F; border: 1px solid rgba(247, 168, 79, 0.3); }

        /* Assembly visualization */
        .assembly-flow {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(255,255,255,0.02);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .assembly-node {
          flex: 1;
          padding: 12px 16px;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          text-align: center;
        }

        .assembly-arrow {
          color: #4F8EF7;
          opacity: 0.7;
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

        /* Loading spinner */
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #4F8EF7;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="vt-root">
        <div className="grid-bg"></div>
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>

        <div className="vt-content">
          {/* Header */}
          <div
            className="card fade-up"
            style={{ margin: "40px", padding: "32px 40px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <div>
                <h1
                  className="syne"
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: "700",
                    color: "#fff",
                    marginBottom: "8px",
                  }}
                >
                  Assembly Management
                </h1>
                <p style={{ color: "rgba(232,237,247,0.6)", fontSize: "1rem" }}>
                  Manage product assembly relationships and build hierarchies
                </p>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="glass-button-primary"
              >
                <Plus size={20} />
                Create Assembly
              </button>
            </div>

            {/* Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px",
              }}
            >
              <div
                className="card"
                style={{ padding: "20px", textAlign: "center" }}
              >
                <Package
                  size={32}
                  color="#4F8EF7"
                  style={{ marginBottom: "12px" }}
                />
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "700",
                    color: "#fff",
                    marginBottom: "4px",
                  }}
                >
                  {assemblies.length}
                </div>
                <div
                  style={{ color: "rgba(232,237,247,0.6)", fontSize: "0.9rem" }}
                >
                  Total Assemblies
                </div>
              </div>
              <div
                className="card"
                style={{ padding: "20px", textAlign: "center" }}
              >
                <Layers
                  size={32}
                  color="#00C9A7"
                  style={{ marginBottom: "12px" }}
                />
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "700",
                    color: "#fff",
                    marginBottom: "4px",
                  }}
                >
                  {units.filter((u) => u.status === "assembled").length}
                </div>
                <div
                  style={{ color: "rgba(232,237,247,0.6)", fontSize: "0.9rem" }}
                >
                  Assembled Units
                </div>
              </div>
              <div
                className="card"
                style={{ padding: "20px", textAlign: "center" }}
              >
                <GitBranch
                  size={32}
                  color="#B06EF7"
                  style={{ marginBottom: "12px" }}
                />
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "700",
                    color: "#fff",
                    marginBottom: "4px",
                  }}
                >
                  {new Set(assemblies.map((a) => a.parent_unit_id)).size}
                </div>
                <div
                  style={{ color: "rgba(232,237,247,0.6)", fontSize: "0.9rem" }}
                >
                  Parent Units
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div
            className="card fade-up delay-1"
            style={{ margin: "0 40px 32px", padding: "24px 32px" }}
          >
            <div
              style={{
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div style={{ flex: 1, minWidth: "250px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: "12px",
                    padding: "8px 16px",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Search size={18} color="rgba(232,237,247,0.5)" />
                  <input
                    type="text"
                    placeholder="Search by serial number or product name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="glass-input"
                    style={{
                      border: "none",
                      background: "none",
                      padding: "4px",
                      flex: 1,
                    }}
                  />
                </div>
              </div>
              <select
                value={filterParentUnit}
                onChange={(e) => setFilterParentUnit(e.target.value)}
                className="glass-input"
                style={{ width: "200px" }}
              >
                <option value="">All Parent Units</option>
                {units.map((unit) => (
                  <option key={unit.unit_id} value={unit.unit_id}>
                    {unit.serial_number} - {unit.product_name}
                  </option>
                ))}
              </select>
              <select
                value={filterChildUnit}
                onChange={(e) => setFilterChildUnit(e.target.value)}
                className="glass-input"
                style={{ width: "200px" }}
              >
                <option value="">All Child Units</option>
                {units.map((unit) => (
                  <option key={unit.unit_id} value={unit.unit_id}>
                    {unit.serial_number} - {unit.product_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assemblies List */}
          <div
            className="card fade-up delay-2"
            style={{ margin: "0 40px 40px", padding: "32px" }}
          >
            <h2
              className="syne"
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#fff",
                marginBottom: "24px",
              }}
            >
              Assembly Relationships
            </h2>

            {filteredAssemblies.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "rgba(232,237,247,0.5)",
                }}
              >
                <Package
                  size={48}
                  style={{ marginBottom: "16px", opacity: 0.5 }}
                />
                <div style={{ fontSize: "1.1rem", marginBottom: "8px" }}>
                  {assemblies.length === 0
                    ? "No assemblies found"
                    : "No assemblies match your filters"}
                </div>
                <div style={{ fontSize: "0.9rem", opacity: 0.7 }}>
                  {assemblies.length === 0
                    ? "Create your first assembly relationship to get started"
                    : "Try adjusting your search or filters"}
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {filteredAssemblies.map((assembly) => {
                  const parentUnit = getUnitById(assembly.parent_unit_id);
                  const childUnit = getUnitById(assembly.child_unit_id);
                  const parentOrg = parentUnit
                    ? getOrganizationById(parentUnit.manufacturer_org_id)
                    : null;
                  const childOrg = childUnit
                    ? getOrganizationById(childUnit.manufacturer_org_id)
                    : null;

                  return (
                    <div
                      key={assembly.assembly_id}
                      className="card"
                      style={{ padding: "24px" }}
                    >
                      <div className="assembly-flow">
                        <div className="assembly-node">
                          <div
                            style={{
                              fontWeight: "600",
                              color: "#fff",
                              marginBottom: "8px",
                            }}
                          >
                            {parentUnit?.serial_number || "Unknown"}
                          </div>
                          <div
                            style={{
                              color: "rgba(232,237,247,0.7)",
                              fontSize: "0.9rem",
                              marginBottom: "4px",
                            }}
                          >
                            {parentUnit?.product_name || "Unknown Product"}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              justifyContent: "center",
                              marginBottom: "4px",
                            }}
                          >
                            <Building2
                              size={14}
                              color="rgba(232,237,247,0.5)"
                            />
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "rgba(232,237,247,0.5)",
                              }}
                            >
                              {parentOrg?.org_name || "Unknown"}
                            </span>
                          </div>
                          <span
                            className={`status-badge ${parentUnit?.status === "assembled" ? "status-assembled" : "status-active"}`}
                          >
                            {parentUnit?.status || "unknown"}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <ArrowRight size={24} className="assembly-arrow" />
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "rgba(232,237,247,0.5)",
                            }}
                          >
                            Qty: {assembly.quantity}
                          </div>
                        </div>

                        <div className="assembly-node">
                          <div
                            style={{
                              fontWeight: "600",
                              color: "#fff",
                              marginBottom: "8px",
                            }}
                          >
                            {childUnit?.serial_number || "Unknown"}
                          </div>
                          <div
                            style={{
                              color: "rgba(232,237,247,0.7)",
                              fontSize: "0.9rem",
                              marginBottom: "4px",
                            }}
                          >
                            {childUnit?.product_name || "Unknown Product"}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              justifyContent: "center",
                              marginBottom: "4px",
                            }}
                          >
                            <Building2
                              size={14}
                              color="rgba(232,237,247,0.5)"
                            />
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "rgba(232,237,247,0.5)",
                              }}
                            >
                              {childOrg?.org_name || "Unknown"}
                            </span>
                          </div>
                          <span
                            className={`status-badge ${childUnit?.status === "assembled" ? "status-assembled" : "status-active"}`}
                          >
                            {childUnit?.status || "unknown"}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "16px",
                          paddingTop: "16px",
                          borderTop: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "rgba(232,237,247,0.5)",
                          }}
                        >
                          Assembled on{" "}
                          {new Date(assembly.assembled_at).toLocaleDateString()}
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleEditAssembly(assembly)}
                            className="glass-button"
                            style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteAssembly(assembly.assembly_id)
                            }
                            className="glass-button-danger"
                            style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Assembly Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                className="syne"
                style={{ fontSize: "1.5rem", fontWeight: "600", color: "#fff" }}
              >
                Create Assembly Relationship
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(232,237,247,0.5)",
                  cursor: "pointer",
                }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateAssembly}>
              <div style={{ display: "grid", gap: "20px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "rgba(232,237,247,0.8)",
                      marginBottom: "8px",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                    }}
                  >
                    Parent Unit (Final Product)
                  </label>
                  <select
                    value={formData.parent_unit_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        parent_unit_id: e.target.value,
                      })
                    }
                    className="glass-input"
                    required
                  >
                    <option value="">Select Parent Unit</option>
                    {units.map((unit) => (
                      <option key={unit.unit_id} value={unit.unit_id}>
                        {unit.serial_number} - {unit.product_name} (
                        {unit.product_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      color: "rgba(232,237,247,0.8)",
                      marginBottom: "8px",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                    }}
                  >
                    Child Unit (Component)
                  </label>
                  <select
                    value={formData.child_unit_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        child_unit_id: e.target.value,
                      })
                    }
                    className="glass-input"
                    required
                  >
                    <option value="">Select Child Unit</option>
                    {units.map((unit) => (
                      <option key={unit.unit_id} value={unit.unit_id}>
                        {unit.serial_number} - {unit.product_name} (
                        {unit.product_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      color: "rgba(232,237,247,0.8)",
                      marginBottom: "8px",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                    }}
                  >
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999999"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="glass-input"
                    required
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                  marginTop: "32px",
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
                  <Plus size={20} />
                  Create Assembly
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Assembly Modal */}
      {showEditForm && editingAssembly && (
        <div className="modal-overlay" onClick={() => setShowEditForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                className="syne"
                style={{ fontSize: "1.5rem", fontWeight: "600", color: "#fff" }}
              >
                Edit Assembly Relationship
              </h2>
              <button
                onClick={() => setShowEditForm(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(232,237,247,0.5)",
                  cursor: "pointer",
                }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateAssembly}>
              <div style={{ display: "grid", gap: "20px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "rgba(232,237,247,0.8)",
                      marginBottom: "8px",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                    }}
                  >
                    Parent Unit
                  </label>
                  <div
                    className="glass-input"
                    style={{ color: "rgba(232,237,247,0.7)" }}
                  >
                    {getUnitById(editingAssembly.parent_unit_id)?.serial_number}{" "}
                    -{" "}
                    {getUnitById(editingAssembly.parent_unit_id)?.product_name}
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      color: "rgba(232,237,247,0.8)",
                      marginBottom: "8px",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                    }}
                  >
                    Child Unit
                  </label>
                  <div
                    className="glass-input"
                    style={{ color: "rgba(232,237,247,0.7)" }}
                  >
                    {getUnitById(editingAssembly.child_unit_id)?.serial_number}{" "}
                    - {getUnitById(editingAssembly.child_unit_id)?.product_name}
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      color: "rgba(232,237,247,0.8)",
                      marginBottom: "8px",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                    }}
                  >
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999999"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="glass-input"
                    required
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                  marginTop: "32px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="glass-button"
                >
                  Cancel
                </button>
                <button type="submit" className="glass-button-primary">
                  <Edit size={20} />
                  Update Assembly
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
