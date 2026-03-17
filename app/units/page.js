'use client';

import { useState, useEffect } from 'react';

export default function UnitsPage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    catalog_id: '',
    serial_number: '',
    manufacturer_org_id: '',
    manufacturing_date: '',
    batch_number: '',
    expiry_date: ''
  });

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('serial_number', searchTerm);
      if (filterStatus) params.append('status', filterStatus);
      
      const response = await fetch(`/api/products/units?${params}`);
      const data = await response.json();
      setUnits(data);
    } catch (error) {
      console.error('Failed to fetch units:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUnit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/products/units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          catalog_id: parseInt(formData.catalog_id),
          manufacturer_org_id: formData.manufacturer_org_id ? parseInt(formData.manufacturer_org_id) : null
        }),
      });

      if (response.ok) {
        await fetchUnits();
        setShowCreateForm(false);
        setFormData({
          catalog_id: '',
          serial_number: '',
          manufacturer_org_id: '',
          manufacturing_date: '',
          batch_number: '',
          expiry_date: ''
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create unit');
      }
    } catch (error) {
      alert('Failed to create unit');
    }
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'created', label: 'Created', color: 'status-created' },
    { value: 'assembled', label: 'Assembled', color: 'status-assembled' },
    { value: 'in_transit', label: 'In Transit', color: 'status-in-transit' },
    { value: 'delivered', label: 'Delivered', color: 'status-delivered' },
    { value: 'retired', label: 'Retired', color: 'status-retired' }
  ];

  const mockProducts = [
    { id: 1, name: 'Laptop Model X', sku: 'LAP-X-001' },
    { id: 2, name: 'Intel Core i7', sku: 'CPU-I7-001' },
    { id: 3, name: '16GB RAM Module', sku: 'RAM-16G-001' }
  ];

  const mockOrganizations = [
    { id: 1, name: 'Tech Manufacturing Inc' },
    { id: 2, name: 'Component Supplier Ltd' }
  ];

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
          <h1 className="text-3xl font-bold text-white">Product Units</h1>
          <p className="text-gray-300 mt-2">Track individual physical products</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="glass-button-primary px-6 py-3 font-semibold"
        >
          + Register Unit
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search by Serial Number
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full"
              placeholder="Enter serial number..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status Filter
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="glass-input w-full"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={fetchUnits}
              className="glass-button-primary px-6 py-3 w-full"
            >
              🔍 Search
            </button>
          </div>
        </div>
      </div>

      {/* Create Unit Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass-modal p-8 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Register Product Unit</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateUnit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Product *
                  </label>
                  <select
                    value={formData.catalog_id}
                    onChange={(e) => setFormData({...formData, catalog_id: e.target.value})}
                    className="glass-input w-full"
                    required
                  >
                    <option value="">Select Product</option>
                    {mockProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.serial_number}
                    onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                    className="glass-input w-full"
                    placeholder="UNIT-SN-001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Manufacturer
                  </label>
                  <select
                    value={formData.manufacturer_org_id}
                    onChange={(e) => setFormData({...formData, manufacturer_org_id: e.target.value})}
                    className="glass-input w-full"
                  >
                    <option value="">Select Manufacturer</option>
                    {mockOrganizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Manufacturing Date
                  </label>
                  <input
                    type="date"
                    value={formData.manufacturing_date}
                    onChange={(e) => setFormData({...formData, manufacturing_date: e.target.value})}
                    className="glass-input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                    className="glass-input w-full"
                    placeholder="BATCH-001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                    className="glass-input w-full"
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
                  Register Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Units Grid */}
      {units.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Units Found</h3>
          <p className="text-gray-300">
            Start by registering your first product unit
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit) => (
            <div key={unit.unit_id} className="glass-card p-6 hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">🏷️</div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {unit.serial_number}
                    </h3>
                    <p className="text-sm text-gray-300">
                      {unit.product_name}
                    </p>
                  </div>
                </div>
                <span className={`status-badge status-${unit.status}`}>
                  {unit.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">📦</span>
                  <span className="text-gray-300">{unit.product_type}</span>
                </div>
                
                {unit.manufacturer_name && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">🏭</span>
                    <span className="text-gray-300">{unit.manufacturer_name}</span>
                  </div>
                )}
                
                {unit.manufacturing_date && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">📅</span>
                    <span className="text-gray-300">
                      {new Date(unit.manufacturing_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                {unit.batch_number && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">📦</span>
                    <span className="text-gray-300">Batch: {unit.batch_number}</span>
                  </div>
                )}
                
                {unit.expiry_date && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">⏰</span>
                    <span className="text-gray-300">
                      Expires: {new Date(unit.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-600">
                <div className="text-sm text-gray-400">
                  Created: {new Date(unit.created_at).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <button className="glass-button text-sm px-3 py-1">
                    Track
                  </button>
                  <button className="glass-button-warning text-sm px-3 py-1">
                    Transfer
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
