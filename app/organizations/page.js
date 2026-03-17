'use client';

import { useState, useEffect } from 'react';

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    org_name: '',
    org_type: 'manufacturer',
    country: '',
    contact_email: '',
    phone: ''
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations/getallorg');
      const data = await response.json();
      setOrganizations(data);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/organizations/createorg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchOrganizations();
        setShowCreateForm(false);
        setFormData({
          org_name: '',
          org_type: 'manufacturer',
          country: '',
          contact_email: '',
          phone: ''
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create organization');
      }
    } catch (error) {
      alert('Failed to create organization');
    }
  };

  const orgTypes = [
    { value: 'supplier', label: 'Supplier', icon: '🏭' },
    { value: 'manufacturer', label: 'Manufacturer', icon: '🏭' },
    { value: 'distributor', label: 'Distributor', icon: '🚚' },
    { value: 'retailer', label: 'Retailer', icon: '🏪' }
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
          <h1 className="text-3xl font-bold text-white">Organizations</h1>
          <p className="text-gray-300 mt-2">Manage supply chain partners</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="glass-button-primary px-6 py-3 font-semibold"
        >
          + Add Organization
        </button>
      </div>

      {/* Create Organization Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass-modal p-8 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Create Organization</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateOrganization} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.org_name}
                    onChange={(e) => setFormData({...formData, org_name: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, org_type: e.target.value})}
                    className="glass-input w-full"
                  >
                    {orgTypes.map(type => (
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
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
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

      {/* Organizations Grid */}
      {organizations.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Organizations Found</h3>
          <p className="text-gray-300">
            Start by adding your first supply chain partner
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => {
            const typeInfo = orgTypes.find(t => t.value === org.org_type);
            return (
              <div key={org.org_id} className="glass-card p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">
                      {typeInfo?.icon || '🏢'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {org.org_name}
                      </h3>
                      <p className="text-sm text-gray-300">
                        {typeInfo?.label}
                      </p>
                    </div>
                  </div>
                  <span className={`status-badge status-${org.is_active ? 'delivered' : 'retired'}`}>
                    {org.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {org.country && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">🌍</span>
                      <span className="text-gray-300">{org.country}</span>
                    </div>
                  )}
                  
                  {org.contact_email && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">✉️</span>
                      <span className="text-gray-300 text-sm">{org.contact_email}</span>
                    </div>
                  )}
                  
                  {org.phone && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">📞</span>
                      <span className="text-gray-300 text-sm">{org.phone}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-600">
                  <div className="text-sm text-gray-400">
                    Created: {new Date(org.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    <button className="glass-button text-sm px-3 py-1">
                      Edit
                    </button>
                    <button className="glass-button-warning text-sm px-3 py-1">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
