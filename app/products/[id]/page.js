'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Users, Calendar, Weight, Ruler, Edit, Trash2, Plus } from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;
  
  const [product, setProduct] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUnitForm, setShowAddUnitForm] = useState(false);
  const [unitFormData, setUnitFormData] = useState({
    catalog_id: productId,
    serial_number: '',
    manufacturer_org_id: '',
    manufacturing_date: '',
    batch_number: '',
    expiry_date: ''
  });

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
      fetchProductUnits();
    }
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      const response = await fetch(`/api/products/catalog/${productId}`);
      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error('Failed to fetch product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductUnits = async () => {
    try {
      const response = await fetch(`/api/products/units?catalog_id=${productId}`);
      const data = await response.json();
      setUnits(data);
    } catch (error) {
      console.error('Failed to fetch product units:', error);
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
          ...unitFormData,
          catalog_id: parseInt(unitFormData.catalog_id),
          manufacturer_org_id: unitFormData.manufacturer_org_id ? parseInt(unitFormData.manufacturer_org_id) : null
        }),
      });

      if (response.ok) {
        await fetchProductUnits();
        setShowAddUnitForm(false);
        setUnitFormData({
          catalog_id: productId,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-300 border-t-transparent animate-spin rounded-full"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">Product Not Found</h2>
          <p className="text-gray-500">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/products')}
            className="mt-6 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3Cpattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl border-b border-white/20">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/products')}
                className="flex items-center text-white/70 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Products
              </button>
              <div className="flex-1"></div>
              <div className="flex items-center space-x-4">
                <button className="text-white/70 hover:text-white transition-colors">
                  <Edit className="w-5 h-5" />
                </button>
                <button className="text-white/70 hover:text-white transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Product Details */}
            <div className="lg:col-span-2">
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8">
                <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                  <Package className="w-8 h-8 mr-3" />
                  {product.product_name}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">Product Type</label>
                    <div className="text-white text-lg capitalize">
                      {product.product_type?.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">SKU</label>
                    <div className="text-white text-lg">
                      {product.sku || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">Description</label>
                    <div className="text-white">
                      {product.description || 'No description available'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">Organization</label>
                    <div className="text-white">
                      {product.org_name || 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">Weight</label>
                    <div className="text-white flex items-center">
                      <Weight className="w-4 h-4 mr-2" />
                      {product.weight ? `${product.weight} kg` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">Dimensions</label>
                    <div className="text-white flex items-center">
                      <Ruler className="w-4 h-4 mr-2" />
                      {product.dimensions || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">Created</label>
                    <div className="text-white flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(product.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-6 border-t border-white/20">
                  <button
                    onClick={() => setShowAddUnitForm(true)}
                    className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Unit
                  </button>
                  <button
                    onClick={() => router.push(`/assembly?parent_product=${productId}`)}
                    className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    Create Assembly
                  </button>
                </div>
              </div>
            </div>

            {/* Product Units Tree */}
            <div>
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Package className="w-6 h-6 mr-2" />
                  Product Units ({units.length})
                </h2>

                {/* Units List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {units.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-white/50 mx-auto mb-4" />
                      <p className="text-white/70">No units registered for this product</p>
                      <button
                        onClick={() => setShowAddUnitForm(true)}
                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                      >
                        Register First Unit
                      </button>
                    </div>
                  ) : (
                    units.map((unit) => (
                      <div
                        key={unit.unit_id}
                        className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                        onClick={() => router.push(`/provenance?serial=${unit.serial_number}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                                {unit.serial_number?.substring(0, 3)}
                              </div>
                              <div className="ml-3">
                                <div className="text-white font-semibold">{unit.serial_number}</div>
                                <div className="text-blue-200 text-sm capitalize">{unit.product_type}</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-blue-200">Status:</span>
                                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                  unit.status === 'created' ? 'bg-blue-500 text-white' :
                                  unit.status === 'assembled' ? 'bg-green-500 text-white' :
                                  unit.status === 'in_transit' ? 'bg-yellow-500 text-white' :
                                  unit.status === 'delivered' ? 'bg-purple-500 text-white' :
                                  'bg-gray-500 text-white'
                                }`}>
                                  {unit.status?.replace('_', ' ')}
                                </span>
                              </div>
                              <div>
                                <span className="text-blue-200">Manufactured:</span>
                                <span className="ml-2 text-white">
                                  {unit.manufacturing_date ? new Date(unit.manufacturing_date).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              {unit.batch_number && (
                                <div>
                                  <span className="text-blue-200">Batch:</span>
                                  <span className="ml-2 text-white">{unit.batch_number}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-white/50 group-hover:text-white transition-colors">
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Unit Button */}
                <div className="mt-6 pt-4 border-t border-white/20">
                  <button
                    onClick={() => setShowAddUnitForm(true)}
                    className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Register New Unit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Unit Modal */}
      {showAddUnitForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Register Product Unit</h2>
              <button
                onClick={() => setShowAddUnitForm(false)}
                className="text-white/70 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateUnit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Serial Number *</label>
                  <input
                    type="text"
                    required
                    value={unitFormData.serial_number}
                    onChange={(e) => setUnitFormData({...unitFormData, serial_number: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 outline-none focus:border-blue-400 focus:bg-white/20"
                    placeholder="UNIT-SN-001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Manufacturer</label>
                  <input
                    type="text"
                    value={unitFormData.manufacturer_org_id}
                    onChange={(e) => setUnitFormData({...unitFormData, manufacturer_org_id: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 outline-none focus:border-blue-400 focus:bg-white/20"
                    placeholder="Organization ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Manufacturing Date</label>
                  <input
                    type="date"
                    value={unitFormData.manufacturing_date}
                    onChange={(e) => setUnitFormData({...unitFormData, manufacturing_date: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 outline-none focus:border-blue-400 focus:bg-white/20"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Batch Number</label>
                  <input
                    type="text"
                    value={unitFormData.batch_number}
                    onChange={(e) => setUnitFormData({...unitFormData, batch_number: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 outline-none focus:border-blue-400 focus:bg-white/20"
                    placeholder="BATCH-001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Expiry Date</label>
                  <input
                    type="date"
                    value={unitFormData.expiry_date}
                    onChange={(e) => setUnitFormData({...unitFormData, expiry_date: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 outline-none focus:border-blue-400 focus:bg-white/20"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddUnitForm(false)}
                  className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Register Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
