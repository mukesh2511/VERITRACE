'use client';

import { useState, useEffect } from 'react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '',
    product_type: 'finished_product',
    description: '',
    sku: '',
    weight: '',
    dimensions: '',
    org_id: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterType) params.append('product_type', filterType);
      
      const response = await fetch(`/api/products/catalog?${params}`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/products/catalog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          org_id: formData.org_id ? parseInt(formData.org_id) : 1
        }),
      });

      if (response.ok) {
        await fetchProducts();
        setShowCreateForm(false);
        setFormData({
          product_name: '',
          product_type: 'finished_product',
          description: '',
          sku: '',
          weight: '',
          dimensions: '',
          org_id: ''
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create product');
      }
    } catch (error) {
      alert('Failed to create product');
    }
  };

  const productTypes = [
    { value: 'raw_material', label: 'Raw Material', icon: '🪨', color: 'from-gray-500 to-gray-700' },
    { value: 'component', label: 'Component', icon: '🔧', color: 'from-blue-500 to-blue-700' },
    { value: 'finished_product', label: 'Finished Product', icon: '📦', color: 'from-green-500 to-green-700' }
  ];

  const mockOrganizations = [
    { id: 1, name: 'Tech Manufacturing Inc' },
    { id: 2, name: 'Component Supplier Ltd' },
    { id: 3, name: 'Raw Materials Co' }
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
          <h1 className="text-3xl font-bold text-white">Product Catalog</h1>
          <p className="text-gray-300 mt-2">Manage product templates and specifications</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="glass-button-primary px-6 py-3 font-semibold"
        >
          + Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Products
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full"
              placeholder="Search by name, SKU, or description..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Product Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="glass-input w-full"
            >
              <option value="">All Types</option>
              {productTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={fetchProducts}
              className="glass-button-primary px-6 py-3 w-full"
            >
              🔍 Search
            </button>
          </div>
        </div>
      </div>

      {/* Create Product Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass-modal p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Create Product</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateProduct} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.product_name}
                    onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                    className="glass-input w-full"
                    placeholder="Enter product name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Product Type *
                  </label>
                  <select
                    value={formData.product_type}
                    onChange={(e) => setFormData({...formData, product_type: e.target.value})}
                    className="glass-input w-full"
                  >
                    {productTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    className="glass-input w-full"
                    placeholder="PROD-001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Organization
                  </label>
                  <select
                    value={formData.org_id}
                    onChange={(e) => setFormData({...formData, org_id: e.target.value})}
                    className="glass-input w-full"
                  >
                    <option value="">Select Organization</option>
                    {mockOrganizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="glass-input w-full h-24 resize-none"
                    placeholder="Enter product description..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      className="glass-input w-full"
                      placeholder="0.000"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Dimensions (L×W×H)
                    </label>
                    <input
                      type="text"
                      value={formData.dimensions}
                      onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
                      className="glass-input w-full"
                      placeholder="100×50×20"
                    />
                  </div>
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
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Products Found</h3>
          <p className="text-gray-300">
            Start by adding your first product to the catalog
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const typeInfo = productTypes.find(t => t.value === product.product_type);
            return (
              <div key={product.catalog_id} className="glass-card p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${typeInfo?.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                    {typeInfo?.icon}
                  </div>
                  <span className={`status-badge status-${typeInfo?.value || 'created'}`}>
                    {typeInfo?.label}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {product.product_name}
                    </h3>
                    {product.sku && (
                      <p className="text-sm text-gray-400">
                        SKU: {product.sku}
                      </p>
                    )}
                  </div>
                  
                  {product.description && (
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {product.weight && (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">⚖️</span>
                        <span className="text-gray-300">{product.weight} kg</span>
                      </div>
                    )}
                    
                    {product.dimensions && (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">📏</span>
                        <span className="text-gray-300">{product.dimensions}</span>
                      </div>
                    )}
                  </div>
                  
                  {product.org_name && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">🏢</span>
                      <span className="text-gray-300 text-sm">{product.org_name}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-600">
                  <div className="text-sm text-gray-400">
                    Created: {new Date(product.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    <button className="glass-button text-sm px-3 py-1">
                      Edit
                    </button>
                    <button className="glass-button-success text-sm px-3 py-1">
                      Create Unit
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
