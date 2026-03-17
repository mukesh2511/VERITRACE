'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    totalProducts: 0,
    totalUnits: 0,
    activeTransfers: 0,
    recentProvenanceQueries: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [transferStats, setTransferStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Simulate API calls - in real implementation, these would be actual API calls
      const mockStats = {
        totalOrganizations: 156,
        totalProducts: 1248,
        totalUnits: 45632,
        activeTransfers: 234,
        recentProvenanceQueries: 1892
      };

      const mockActivity = [
        {
          id: 1,
          type: 'provenance_query',
          description: 'Product LAP-SN-1001 traced by Consumer',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          icon: '🔍',
          severity: 'info'
        },
        {
          id: 2,
          type: 'transfer',
          description: 'Shipment TRK-2024-001 delivered to Retail Store',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          icon: '🚚',
          severity: 'success'
        },
        {
          id: 3,
          type: 'assembly',
          description: 'Laptop Model X assembled with 5 components',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          icon: '🔗',
          severity: 'info'
        },
        {
          id: 4,
          type: 'alert',
          description: 'Quality alert: CPU batch CPU-SN-2000 requires inspection',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          icon: '⚠️',
          severity: 'warning'
        },
        {
          id: 5,
          type: 'registration',
          description: '100 units of CPU-SN-2000 batch registered',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          icon: '📦',
          severity: 'success'
        }
      ];

      const mockTransferStats = [
        { month: 'Jan', transfers: 234, units: 1567 },
        { month: 'Feb', transfers: 189, units: 1234 },
        { month: 'Mar', transfers: 267, units: 1890 },
        { month: 'Apr', transfers: 198, units: 1456 },
        { month: 'May', transfers: 312, units: 2234 },
        { month: 'Jun', transfers: 289, units: 2012 }
      ];

      setStats(mockStats);
      setRecentActivity(mockActivity);
      setTransferStats(mockTransferStats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'success': return 'text-green-300';
      case 'warning': return 'text-yellow-300';
      case 'error': return 'text-red-300';
      default: return 'text-blue-300';
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
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Supply Chain Dashboard
        </h1>
        <p className="text-lg text-gray-300">
          Real-time overview of your supply chain operations
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {[
          { 
            label: 'Organizations', 
            value: stats.totalOrganizations, 
            icon: '🏢', 
            color: 'from-blue-500 to-purple-600',
            change: '+12 this month'
          },
          { 
            label: 'Products', 
            value: stats.totalProducts, 
            icon: '📦', 
            color: 'from-green-500 to-teal-600',
            change: '+8.2% this month'
          },
          { 
            label: 'Units', 
            value: stats.totalUnits, 
            icon: '🏷️', 
            color: 'from-orange-500 to-red-600',
            change: '+15.3% this month'
          },
          { 
            label: 'Active Transfers', 
            value: stats.activeTransfers, 
            icon: '🚚', 
            color: 'from-pink-500 to-purple-600',
            change: '+5.7% this month'
          },
          { 
            label: 'Queries Today', 
            value: stats.recentProvenanceQueries, 
            icon: '🔍', 
            color: 'from-indigo-500 to-blue-600',
            change: '+23.4% vs yesterday'
          }
        ].map((stat, index) => (
          <div key={index} className="glass-card p-6 text-center floating-animation">
            <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center text-white text-xl mb-4 mx-auto`}>
              {stat.icon}
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {stat.value.toLocaleString()}
            </div>
            <div className="text-sm text-gray-300 mb-2">
              {stat.label}
            </div>
            <div className="text-xs text-green-300">
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
            <span>📊</span>
            <span>Recent Activity</span>
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-custom">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-4 hover:bg-white hover:bg-opacity-5 rounded-lg transition-colors">
                <div className="text-2xl mt-1">
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium mb-1">
                    {activity.description}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${getSeverityColor(activity.severity)}`}>
                      {activity.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transfer Statistics */}
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
            <span>📈</span>
            <span>Transfer Trends</span>
          </h2>
          <div className="space-y-4">
            {transferStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-lg">
                <div>
                  <div className="text-white font-medium">{stat.month}</div>
                  <div className="text-sm text-gray-400">2024</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{stat.transfers}</div>
                  <div className="text-sm text-gray-300">{stat.units} units</div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Mini Chart Visualization */}
          <div className="mt-6 pt-6 border-t border-gray-600">
            <div className="text-sm text-gray-400 mb-4">Transfer Volume (Last 6 Months)</div>
            <div className="flex items-end space-x-2 h-24">
              {transferStats.map((stat, index) => {
                const maxValue = Math.max(...transferStats.map(s => s.transfers));
                const height = (stat.transfers / maxValue) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-500 to-purple-600 rounded-t"
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="text-xs text-gray-400 mt-2">{stat.month}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
          <span>⚡</span>
          <span>Quick Actions</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Track Product',
              description: 'Enter serial number for instant trace',
              icon: '🔍',
              href: '/provenance',
              color: 'from-blue-500 to-purple-600'
            },
            {
              title: 'Register Units',
              description: 'Add new product units to system',
              icon: '🏷️',
              href: '/units',
              color: 'from-green-500 to-teal-600'
            },
            {
              title: 'Create Assembly',
              description: 'Build product hierarchies',
              icon: '🔗',
              href: '/assembly',
              color: 'from-orange-500 to-red-600'
            },
            {
              title: 'Log Transfer',
              description: 'Record product movements',
              icon: '🚚',
              href: '/transfers',
              color: 'from-pink-500 to-purple-600'
            }
          ].map((action, index) => (
            <a
              key={index}
              href={action.href}
              className="glass-card p-6 text-center group cursor-pointer block"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center text-white text-2xl mb-4 mx-auto transform transition-transform duration-300 group-hover:scale-110`}>
                {action.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {action.title}
              </h3>
              <p className="text-sm text-gray-300">
                {action.description}
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'System Status',
            status: 'Healthy',
            icon: '✅',
            color: 'text-green-300',
            details: 'All systems operational'
          },
          {
            title: 'API Response',
            status: '142ms',
            icon: '⚡',
            color: 'text-blue-300',
            details: 'Average response time'
          },
          {
            title: 'Database',
            status: 'Connected',
            icon: '🗄️',
            color: 'text-purple-300',
            details: 'Real-time sync active'
          }
        ].map((health, index) => (
          <div key={index} className="glass-card p-6 text-center">
            <div className="text-3xl mb-3">{health.icon}</div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {health.title}
            </h3>
            <div className={`text-2xl font-bold ${health.color} mb-2`}>
              {health.status}
            </div>
            <div className="text-sm text-gray-300">
              {health.details}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
