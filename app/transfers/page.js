'use client';

import { useState, useEffect } from 'react';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    unit_id: '',
    from_org_id: '',
    to_org_id: '',
    location_id: '',
    status: 'shipped',
    tracking_number: '',
    estimated_arrival: '',
    notes: ''
  });

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('tracking_number', searchTerm);
      if (filterStatus) params.append('status', filterStatus);
      
      const response = await fetch(`/api/transfers?${params}`);
      const data = await response.json();
      setTransfers(data);
    } catch (error) {
      console.error('Failed to fetch transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          unit_id: parseInt(formData.unit_id),
          from_org_id: formData.from_org_id ? parseInt(formData.from_org_id) : null,
          to_org_id: parseInt(formData.to_org_id),
          location_id: formData.location_id ? parseInt(formData.location_id) : null
        }),
      });

      if (response.ok) {
        await fetchTransfers();
        setShowCreateForm(false);
        setFormData({
          unit_id: '',
          from_org_id: '',
          to_org_id: '',
          location_id: '',
          status: 'shipped',
          tracking_number: '',
          estimated_arrival: '',
          notes: ''
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create transfer');
      }
    } catch (error) {
      alert('Failed to create transfer');
    }
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'shipped', label: 'Shipped', color: 'status-created' },
    { value: 'in_transit', label: 'In Transit', color: 'status-in-transit' },
    { value: 'received', label: 'Received', color: 'status-delivered' }
  ];

  const mockUnits = [
    { id: 1001, serial_number: 'LAP-SN-1001', product_name: 'Laptop Model X' },
    { id: 1002, serial_number: 'CPU-SN-2001', product_name: 'Intel Core i7' },
    { id: 1003, serial_number: 'RAM-SN-3001', product_name: '16GB RAM Module' }
  ];

  const mockOrganizations = [
    { id: 1, name: 'Tech Manufacturing Inc' },
    { id: 2, name: 'Global Distributor' },
    { id: 3, name: 'Retail Store Chain' }
  ];

  const mockLocations = [
    { id: 1, name: 'Main Warehouse', country: 'USA' },
    { id: 2, name: 'Distribution Center', country: 'USA' },
    { id: 3, name: 'Retail Store #1', country: 'USA' }
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
          <h1 className="text-3xl font-bold text-white">Transfer Management</h1>
          <p className="text-gray-300 mt-2">Track product movements through supply chain</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="glass-button-primary px-6 py-3 font-semibold"
        >
          + Log Transfer
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search by Tracking Number
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full"
              placeholder="Enter tracking number..."
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
              onClick={fetchTransfers}
              className="glass-button-primary px-6 py-3 w-full"
            >
              🔍 Search
            </button>
          </div>
        </div>
      </div>

      {/* Create Transfer Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass-modal p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Log New Transfer</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateTransfer} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Product Unit *
                  </label>
                  <select
                    value={formData.unit_id}
                    onChange={(e) => setFormData({...formData, unit_id: e.target.value})}
                    className="glass-input w-full"
                    required
                  >
                    <option value="">Select Unit</option>
                    {mockUnits.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.serial_number} - {unit.product_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    From Organization
                  </label>
                  <select
                    value={formData.from_org_id}
                    onChange={(e) => setFormData({...formData, from_org_id: e.target.value})}
                    className="glass-input w-full"
                  >
                    <option value="">Select Source (Optional)</option>
                    {mockOrganizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    To Organization *
                  </label>
                  <select
                    value={formData.to_org_id}
                    onChange={(e) => setFormData({...formData, to_org_id: e.target.value})}
                    className="glass-input w-full"
                    required
                  >
                    <option value="">Select Destination</option>
                    {mockOrganizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location
                  </label>
                  <select
                    value={formData.location_id}
                    onChange={(e) => setFormData({...formData, location_id: e.target.value})}
                    className="glass-input w-full"
                  >
                    <option value="">Select Location (Optional)</option>
                    {mockLocations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name} ({location.country})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="glass-input w-full"
                  >
                    <option value="shipped">Shipped</option>
                    <option value="in_transit">In Transit</option>
                    <option value="received">Received</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={formData.tracking_number}
                    onChange={(e) => setFormData({...formData, tracking_number: e.target.value})}
                    className="glass-input w-full"
                    placeholder="TRK-2024-001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Estimated Arrival
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.estimated_arrival}
                    onChange={(e) => setFormData({...formData, estimated_arrival: e.target.value})}
                    className="glass-input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="glass-input w-full h-20 resize-none"
                    placeholder="Additional transfer notes..."
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
                  Log Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfers List */}
      {transfers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">🚚</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Transfers Found</h3>
          <p className="text-gray-300">
            Start by logging your first product transfer
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {transfers.map((transfer) => (
            <div key={transfer.transfer_id} className="glass-card p-6 hover:scale-102 transition-transform">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">
                    {transfer.status === 'shipped' && '📤'}
                    {transfer.status === 'in_transit' && '🚚'}
                    {transfer.status === 'received' && '📥'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {transfer.serial_number}
                    </h3>
                    <p className="text-sm text-gray-300">
                      {transfer.product_name}
                    </p>
                    {transfer.tracking_number && (
                      <p className="text-xs text-blue-300">
                        Tracking: {transfer.tracking_number}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`status-badge status-${transfer.status}`}>
                  {transfer.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">📤</span>
                  <div>
                    <div className="text-gray-300">From:</div>
                    <div className="text-white font-medium">
                      {transfer.from_org_name || 'Unknown'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">📥</span>
                  <div>
                    <div className="text-gray-300">To:</div>
                    <div className="text-white font-medium">
                      {transfer.to_org_name}
                    </div>
                  </div>
                </div>
                
                {transfer.location_name && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">📍</span>
                    <div>
                      <div className="text-gray-300">Location:</div>
                      <div className="text-white font-medium">
                        {transfer.location_name}
                        {transfer.location_country && ` (${transfer.location_country})`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-600">
                <div className="text-sm text-gray-400">
                  {new Date(transfer.transfer_time).toLocaleString()}
                </div>
                <div className="flex space-x-2">
                  <button className="glass-button text-sm px-3 py-1">
                    View Details
                  </button>
                  <button className="glass-button-success text-sm px-3 py-1">
                    Update Status
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
