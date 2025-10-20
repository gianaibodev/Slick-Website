'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { adminCache } from '@/lib/cache'
import { CardSkeleton } from '@/components/Skeleton'

export const dynamic = 'force-dynamic'

interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  newCustomers: number
  productsInStock: number
  pendingOrders: number
  shippedOrders: number
  deliveredOrders: number
}

interface RecentOrder {
  id: string
  order_number: string
  total_amount: number
  status: string
  customer_name: string
  shipping_address?: {
    name?: string
    email?: string
  }
  created_at: string
  order_items: any[]
}

interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: string
}

export default function AdminDashboard() {
  const { user, isAdmin, adminRole, hasPermission, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    newCustomers: 0,
    productsInStock: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
  }, [])

  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    if (!user) return

    const cacheKey = `admin:dashboard:${user.id}`
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = adminCache.get(cacheKey)
      if (cachedData) {
        console.log('Using cached dashboard data')
        setStats(cachedData.stats)
        setRecentOrders(cachedData.recentOrders)
        setRecentActivity(cachedData.recentActivity)
        setLoading(false)
        return
      }
    }

    try {
      const supabase = createClient()
      
      // Fetch orders for revenue and order count
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          status,
          shipping_address,
          created_at,
          order_items (
            id,
            product_name,
            quantity,
            price
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (ordersError) {
        setError('Failed to fetch orders data')
        return
      }

      // Fetch products for stock count
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, status')

      if (productsError) {
        setError('Failed to fetch products data')
        return
      }

      // Fetch product variants for stock calculation
      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select('stock, product_id, products!inner(status)')

      if (variantsError) {
        setError('Failed to fetch variants data')
        return
      }

      // Fetch profiles for customer count
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('created_at')

      if (profilesError) {
        setError('Failed to fetch customer data')
        return
      }

      // Calculate stats
      const totalRevenue = orders
        ?.filter((order: any) => order.status === 'paid' || order.status === 'delivered')
        .reduce((sum: number, order: any) => sum + order.total_amount, 0) || 0

      const totalOrders = orders?.length || 0
      const pendingOrders = orders?.filter((order: any) => order.status === 'pending').length || 0
      const shippedOrders = orders?.filter((order: any) => order.status === 'shipped').length || 0
      const deliveredOrders = orders?.filter((order: any) => order.status === 'delivered').length || 0

      // Count customers created in the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const newCustomers = profiles?.filter((profile: any) => 
        new Date(profile.created_at) > thirtyDaysAgo
      ).length || 0

      // Count total stock for active products
      const productsInStock = variants
        ?.filter((variant: any) => (variant.products as any)?.status === 'active')
        .reduce((sum: number, variant: any) => sum + variant.stock, 0) || 0

      const newStats = {
        totalRevenue,
        totalOrders,
        newCustomers,
        productsInStock,
        pendingOrders,
        shippedOrders,
        deliveredOrders
      }

      setStats(newStats)

      // Set recent orders
      const recentOrdersData = orders?.slice(0, 5).map(order => ({
        ...order,
        customer_name: order.shipping_address?.name || 'Unknown Customer'
      })) || []
      setRecentOrders(recentOrdersData)

      // Generate recent activity
      const activity: RecentActivity[] = []
      
      // Add recent orders
      const recentOrders = orders?.slice(0, 3) || []
      recentOrders.forEach((order: any) => {
        activity.push({
          id: `order-${order.created_at}`,
          type: 'order',
          description: `New order received - $${order.total_amount.toFixed(2)}`,
          timestamp: order.created_at
        })
      })

      // Add recent products
      const recentProducts = products?.slice(0, 2) || []
      recentProducts.forEach((product: any) => {
        activity.push({
          id: `product-${product.id}`,
          type: 'product',
          description: `Product updated - ${product.id}`,
          timestamp: new Date().toISOString()
        })
      })

      // Sort by timestamp and take latest 4
      const recentActivityData = activity
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 4)

      setRecentActivity(recentActivityData)

      // Cache the data for 60 seconds (dashboard data changes less frequently)
      adminCache.set(cacheKey, { 
        stats: newStats, 
        recentOrders: recentOrdersData, 
        recentActivity: recentActivityData 
      }, 60000)

    } catch (err) {
      setError('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    // Check admin access - for demo mode, just check if user is authenticated
    if (!authLoading && !user) {
      router.push('/admin/login')
      return
    }

    if (user) {
      fetchDashboardData()
      
      // Update time every second
      const timeInterval = setInterval(() => {
        setCurrentTime(new Date())
      }, 1000)

      return () => clearInterval(timeInterval)
    }
  }, [user, authLoading, router, fetchDashboardData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return '🛒'
      case 'product':
        return '📦'
      case 'customer':
        return '👤'
      default:
        return '📋'
    }
  }

      // Show loading while checking authentication
      if (authLoading || loading) {
        return (
          <div>
            <div className="mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                    Dashboard
                  </h1>
                  <p className="text-slate-600">
                    {authLoading ? 'Checking authentication...' : 'Loading dashboard data...'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-600">
                    {mounted && currentTime ? currentTime.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'Loading...'}
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {mounted && currentTime ? currentTime.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit',
                      hour12: true 
                    }) : '--:--:-- --'}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-200 h-32 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          </div>
        )
      }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-2xl sm:text-3xl sm:text-2xl sm:text-4xl font-bold text-white mb-2">
                Dashboard
              </h1>
              <p className="text-gray-300 text-sm sm:text-base">Welcome back! Here's what's happening with your store.</p>
            </div>
            <div className="text-left lg:text-right">
              <div className="text-xs sm:text-sm font-medium text-gray-300">
                {mounted && currentTime ? currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Loading...'}
              </div>
              <div className="text-base sm:text-lg font-bold text-white">
                {mounted && currentTime ? currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit',
                  hour12: true 
                }) : '--:--:-- --'}
              </div>
            </div>
          </div>
        </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <div className="group bg-white p-4 sm:p-6 lg:p-8 rounded-3xl border border-gray-200 hover:border-blue-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              💰
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                ↗ +12.5%
              </span>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-2 uppercase tracking-wide">Total Revenue</h3>
          <p className="text-2xl sm:text-4xl font-black text-blue-700 mb-2">
            {formatCurrency(stats.totalRevenue)}
          </p>
          <p className="text-xs text-slate-700">All time earnings</p>
        </div>

        <div className="group bg-white p-4 sm:p-6 lg:p-8 rounded-3xl border border-gray-200 hover:border-green-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              📦
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                ↗ +8.2%
              </span>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-2 uppercase tracking-wide">Total Orders</h3>
          <p className="text-2xl sm:text-4xl font-black text-green-700 mb-2">
            {stats.totalOrders}
          </p>
          <p className="text-xs text-slate-700">All time orders</p>
        </div>

        <div className="group bg-white p-4 sm:p-6 lg:p-8 rounded-3xl border border-gray-200 hover:border-purple-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              👥
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                ↗ +15.3%
              </span>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-2 uppercase tracking-wide">New Customers</h3>
          <p className="text-2xl sm:text-4xl font-black text-purple-700 mb-2">
            {stats.newCustomers}
          </p>
          <p className="text-xs text-slate-700">This month</p>
        </div>

        <div className="group bg-white p-4 sm:p-6 lg:p-8 rounded-3xl border border-gray-200 hover:border-orange-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              📦
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                In Stock
              </span>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-2 uppercase tracking-wide">Products in Stock</h3>
          <p className="text-2xl sm:text-4xl font-black text-orange-700 mb-2">
            {stats.productsInStock}
          </p>
          <p className="text-xs text-slate-700">Available items</p>
        </div>
          </>
        )}
      </div>

      {/* Order Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:p-6 lg:p-8 mb-12">
        <div className="group bg-white p-4 sm:p-6 lg:p-8 rounded-3xl border border-gray-200 hover:border-yellow-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              ⏳
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                Pending
              </span>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-2 uppercase tracking-wide">Pending Orders</h3>
          <p className="text-2xl sm:text-4xl font-black text-yellow-700 mb-2">
            {stats.pendingOrders}
          </p>
          <p className="text-xs text-slate-700">Awaiting processing</p>
        </div>

        <div className="group bg-white p-4 sm:p-6 lg:p-8 rounded-3xl border border-gray-200 hover:border-blue-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              🚚
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                Shipped
              </span>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-2 uppercase tracking-wide">Shipped Orders</h3>
          <p className="text-2xl sm:text-4xl font-black text-blue-700 mb-2">
            {stats.shippedOrders}
          </p>
          <p className="text-xs text-slate-700">In transit</p>
        </div>

        <div className="group bg-white p-4 sm:p-6 lg:p-8 rounded-3xl border border-gray-200 hover:border-green-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              ✅
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                Delivered
              </span>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-2 uppercase tracking-wide">Delivered Orders</h3>
          <p className="text-2xl sm:text-4xl font-black text-green-700 mb-2">
            {stats.deliveredOrders}
          </p>
          <p className="text-xs text-slate-700">Successfully completed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/50">
          <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg mr-3 flex items-center justify-center text-white text-sm font-bold">
              📦
            </span>
            Recent Orders
          </h3>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-gray-400 text-sm">No recent orders</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-slate-900">#{order.order_number}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">
                      {order.shipping_address?.name || 'Guest Customer'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {order.order_items?.length || 0} item(s) • {formatTimeAgo(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">
                      {formatCurrency(order.total_amount)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/50">
          <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mr-3 flex items-center justify-center text-white text-sm font-bold">
              ⚡
            </span>
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl hover:from-blue-100 hover:to-purple-100 transition-all duration-200 group">
              <div className="flex items-center">
                <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">➕</span>
                <div>
                  <p className="font-medium text-slate-900">Add New Product</p>
                  <p className="text-sm text-slate-600">Create a new product listing</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-200 group">
              <div className="flex items-center">
                <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">📊</span>
                <div>
                  <p className="font-medium text-slate-900">View Analytics</p>
                  <p className="text-sm text-slate-600">Check detailed sales reports</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl hover:from-orange-100 hover:to-red-100 transition-all duration-200 group">
              <div className="flex items-center">
                <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">📦</span>
                <div>
                  <p className="font-medium text-slate-900">Manage Orders</p>
                  <p className="text-sm text-slate-600">Process pending orders</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/50">
          <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg mr-3 flex items-center justify-center text-white text-sm font-bold">
              📈
            </span>
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-slate-500 text-sm">No recent activity</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center p-3 bg-slate-50 rounded-xl">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{activity.description}</p>
                    <p className="text-xs text-slate-500">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                  <span className="text-lg">{getActivityIcon(activity.type)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}