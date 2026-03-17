'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalTransfers: 0,
      totalUnits: 0,
      activeOrganizations: 0,
      averageTransferTime: 0
    },
    transferStats: [],
    productStats: [],
    organizationActivity: [],
    componentUsage: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      const mockData = {
        overview: {
          totalTransfers: 1234,
          totalUnits: 45632,
          activeOrganizations: 156,
          averageTransferTime: 2.4
        },
        transferStats: [
          { month: 'Jan', transfers: 234, units: 1567, avgTime: 2.1 },
          { month: 'Feb', transfers: 189, units: 1234, avgTime: 2.3 },
          { month: 'Mar', transfers: 267, units: 1890, avgTime: 2.5 },
          { month: 'Apr', transfers: 198, units: 1456, avgTime: 2.2 },
          { month: 'May', transfers: 312, units: 2234, avgTime: 2.6 },
          { month: 'Jun', transfers: 289, units: 2012, avgTime: 2.4 }
        ],
        productStats: [
          { type: 'Raw Materials', count: 234, percentage: 18.7 },
          { type: 'Components', count: 456, percentage: 36.5 },
          { type: 'Finished Products', count: 558, percentage: 44.8 }
        ],
        organizationActivity: [
          { name: 'Tech Manufacturing Inc', transfers: 456, units: 3234, efficiency: 94.2 },
          { name: 'Component Supplier Ltd', transfers: 234, units: 1876, efficiency: 87.6 },
          { name: 'Global Distributor', transfers: 567, units: 4123, efficiency: 91.8 },
          { name: 'Retail Store Chain', transfers: 189, units: 1567, efficiency: 89.3 }
        ],
        componentUsage: [
          { component: 'CPU Intel i7', usage: 1234, trend: 'up' },
          { component: '16GB RAM Module', usage: 2345, trend: 'up' },
          { component: '512GB SSD', usage: 1876, trend: 'stable' },
          { component: '15.6" Display', usage: 987, trend: 'down' },
          { component: 'Laptop Chassis', usage: 654, trend: 'up' }
        ]
      };
      
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];

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
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-300 mt-2">Business intelligence and insights</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="glass-input px-4 py-2"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="1y">Last Year</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Transfers',
            value: analyticsData.overview.totalTransfers.toLocaleString(),
            icon: '🚚',
            color: 'from-blue-500 to-purple-600',
            change: '+12.3% vs last period'
          },
          {
            title: 'Total Units',
            value: analyticsData.overview.totalUnits.toLocaleString(),
            icon: '🏷️',
            color: 'from-green-500 to-teal-600',
            change: '+8.7% vs last period'
          },
          {
            title: 'Active Organizations',
            value: analyticsData.overview.activeOrganizations,
            icon: '🏢',
            color: 'from-orange-500 to-red-600',
            change: '+2 new this month'
          },
          {
            title: 'Avg Transfer Time',
            value: `${analyticsData.overview.averageTransferTime} days`,
            icon: '⏱️',
            color: 'from-pink-500 to-purple-600',
            change: '-0.2 days vs last period'
          }
        ].map((stat, index) => (
          <div key={index} className="glass-card p-6 text-center">
            <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center text-white text-xl mb-4 mx-auto`}>
              {stat.icon}
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {stat.value}
            </div>
            <div className="text-sm text-gray-300 mb-2">
              {stat.title}
            </div>
            <div className="text-xs text-green-300">
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Transfer Volume Chart */}
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
            <span>📈</span>
            <span>Transfer Volume Trends</span>
          </h2>
          <div className="h-80">
            <BarChart width={500} height={300} data={analyticsData.transferStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="#ffffff" 
                tick={{ fill: '#ffffff' }}
              />
              <YAxis 
                stroke="#ffffff" 
                tick={{ fill: '#ffffff' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid #667eea',
                  borderRadius: '8px'
                }}
              />
              <Legend 
                wrapperStyle={{ color: '#ffffff' }}
              />
              <Bar dataKey="transfers" fill="#667eea" />
              <Bar dataKey="units" fill="#764ba2" />
            </BarChart>
          </div>
        </div>

        {/* Product Distribution */}
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
            <span>📦</span>
            <span>Product Type Distribution</span>
          </h2>
          <div className="h-80">
            <PieChart width={500} height={300}>
              <Pie
                data={analyticsData.productStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analyticsData.productStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid #667eea',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </div>
        </div>
      </div>

      {/* Organization Activity Table */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
          <span>🏢</span>
          <span>Organization Performance</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-white">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left p-4">Organization</th>
                <th className="text-center p-4">Transfers</th>
                <th className="text-center p-4">Units</th>
                <th className="text-center p-4">Efficiency</th>
                <th className="text-center p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.organizationActivity.map((org, index) => (
                <tr key={index} className="border-b border-gray-700 hover:bg-white hover:bg-opacity-5">
                  <td className="p-4">
                    <div className="font-medium">{org.name}</div>
                  </td>
                  <td className="text-center p-4">
                    {org.transfers.toLocaleString()}
                  </td>
                  <td className="text-center p-4">
                    {org.units.toLocaleString()}
                  </td>
                  <td className="text-center p-4">
                    <span className={org.efficiency >= 90 ? 'text-green-300' : 'text-yellow-300'}>
                      {org.efficiency}%
                    </span>
                  </td>
                  <td className="text-center p-4">
                    <span className="status-badge status-delivered">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Component Usage */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
          <span>🔧</span>
          <span>Component Usage Trends</span>
        </h2>
        <div className="space-y-4">
          {analyticsData.componentUsage.map((component, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-lg">
              <div>
                <div className="text-white font-medium">{component.component}</div>
                <div className="text-sm text-gray-400">Used in assemblies</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white mb-2">
                  {component.usage.toLocaleString()}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${
                    component.trend === 'up' ? 'text-green-300' : 
                    component.trend === 'down' ? 'text-red-300' : 'text-yellow-300'
                  }`}>
                    {component.trend === 'up' && '↑'}
                    {component.trend === 'down' && '↓'}
                    {component.trend === 'stable' && '→'}
                  </span>
                  <span className="text-sm text-gray-400">
                    {component.trend === 'up' && 'Increasing'}
                    {component.trend === 'down' && 'Decreasing'}
                    {component.trend === 'stable' && 'Stable'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
          <span>📊</span>
          <span>Export Reports</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Transfer Report',
              description: 'Complete transfer history with details',
              format: 'CSV',
              icon: '📋'
            },
            {
              title: 'Performance Metrics',
              description: 'KPIs and efficiency metrics',
              format: 'PDF',
              icon: '📄'
            },
            {
              title: 'Component Analysis',
              description: 'Component usage and trends',
              format: 'Excel',
              icon: '📈'
            }
          ].map((report, index) => (
            <button key={index} className="glass-card p-6 text-center hover:scale-105 transition-transform">
              <div className="text-3xl mb-3">{report.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {report.title}
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                {report.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Format: {report.format}
                </span>
                <button className="glass-button-primary px-4 py-2 text-sm">
                  Export
                </button>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
