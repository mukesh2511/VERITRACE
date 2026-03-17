'use client';

import { useState, useEffect } from 'react';

export default function AssemblyPage() {
  const [assemblies, setAssemblies] = useState([]);
  const [units, setUnits] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    parent_unit_id: '',
    child_unit_id: '',
    quantity: 1
  });

  useEffect(() => {
    fetchAssemblies();
    fetchUnits();
    fetchOrganizations();
  }, []);

  const fetchAssemblies = async () => {
    try {
      const response = await fetch('/api/assembly');
      const data = await response.json();
      setAssemblies(data);
    } catch (error) {
      console.error('Failed to fetch assemblies:', error);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await fetch('/api/products/units');
      const data = await response.json();
      setUnits(data);
    } catch (error) {
      console.error('Failed to fetch units:', error);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations/getallorg');
      const data = await response.json();
      setOrganizations(data);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  };

  const handleCreateAssembly = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/assembly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          parent_unit_id: parseInt(formData.parent_unit_id),
          child_unit_id: parseInt(formData.child_unit_id),
          quantity: parseInt(formData.quantity)
        }),
      });

      if (response.ok) {
        await fetchAssemblies();
        setShowCreateForm(false);
        setFormData({
          parent_unit_id: '',
          child_unit_id: '',
          quantity: 1
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create assembly');
      }
    } catch (error) {
      alert('Failed to create assembly');
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Assembly Management</h1>
          <p className="text-gray-300 mt-2">Build product hierarchies and relationships</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="glass-button-primary px-6 py-3 font-semibold"
        >
          + Create Assembly
        </button>
      </div>

      {/* Assembly Visualization */}
      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
          <span>🔗</span>
          <span>Assembly Hierarchy</span>
        </h2>
        <div className="flex justify-center">
          <div className="provenance-tree p-6 max-w-4xl">
            <p className="text-gray-400 text-center">
              Assembly relationships will appear here once you create them
            </p>
          </div>
        </div>
      </div>

      {/* Create Assembly Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass-modal p-8 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Create Assembly Relationship</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateAssembly} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Parent Product Unit *
                  </label>
                  <select
                    value={formData.parent_unit_id}
                    onChange={(e) => setFormData({...formData, parent_unit_id: e.target.value})}
                    className="glass-input w-full"
                    required
                  >
                    <option value="">Select Parent Unit</option>
                    {units.filter(u => u.status === 'created' || u.status === 'assembled').map(unit => (
                      <option key={unit.unit_id} value={unit.unit_id}>
                        {unit.serial_number} - {unit.product_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Child Product Unit *
                  </label>
                  <select
                    value={formData.child_unit_id}
                    onChange={(e) => setFormData({...formData, child_unit_id: e.target.value})}
                    className="glass-input w-full"
                    required
                  >
                    <option value="">Select Child Unit</option>
                    {units.filter(u => u.status === 'created').map(unit => (
                      <option key={unit.unit_id} value={unit.unit_id}>
                        {unit.serial_number} - {unit.product_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  className="glass-input w-full"
                  placeholder="1"
                />
              </div>
              
              <div className="bg-blue-500 bg-opacity-10 border border-blue-400 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">🔗 Assembly Information</h3>
                <p className="text-gray-300 text-sm">
                  <strong>Parent Unit:</strong> The main product that will contain the child component
                </p>
                <p className="text-gray-300 text-sm">
                  <strong>Child Unit:</strong> The component that will be added to the parent
                </p>
                <p className="text-gray-300 text-sm">
                  <strong>Quantity:</strong> How many of the child components are used in the parent
                </p>
                <p className="text-yellow-300 text-sm mt-3">
                  ⚠️ <strong>Note:</strong> The system will automatically prevent circular dependencies and update the parent status to 'assembled'
                </p>
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
                  Create Assembly
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assemblies List */}
      {assemblies.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Assemblies Found</h3>
          <p className="text-gray-300">
            Start by creating your first product assembly
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assemblies.map((assembly) => (
            <div key={assembly.assembly_id} className="glass-card p-6 hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">🔗</div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Assembly #{assembly.assembly_id}
                    </h3>
                    <p className="text-sm text-gray-300">
                      {assembly.quantity} component(s)
                    </p>
                  </div>
                </div>
                <span className="status-badge status-assembled">
                  Active
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">🏷️</span>
                  <div>
                    <div className="text-white font-medium">Parent:</div>
                    <div className="text-sm text-gray-300">
                      {assembly.parent_serial_number}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">🔧</span>
                  <div>
                    <div className="text-white font-medium">Child:</div>
                    <div className="text-sm text-gray-300">
                      {assembly.child_serial_number}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">📊</span>
                  <div>
                    <div className="text-white font-medium">Quantity:</div>
                    <div className="text-sm text-gray-300">
                      {assembly.quantity}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-600">
                <div className="text-sm text-gray-400">
                  Created: {new Date(assembly.created_at).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <button className="glass-button text-sm px-3 py-1">
                    View Details
                  </button>
                  <button className="glass-button-warning text-sm px-3 py-1">
                    Disassemble
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
