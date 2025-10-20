'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { adminCache } from '@/lib/cache'

export const dynamic = 'force-dynamic'

interface OrderItem {
  id: string
  product_name: string
  price: number
  quantity: number
  size: number
}

interface Order {
  id: string
  order_number: string
  total_amount: number
  status: string
  payment_status: string
  shipping_address: any
  created_at: string
  updated_at: string
  order_items: OrderItem[]
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const supabase = createClient()

  const fetchOrders = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'admin:orders'
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = adminCache.get(cacheKey)
      if (cachedData) {
        console.log('Using cached orders data')
        setOrders(cachedData)
        setLoading(false)
        return
      }
    }

    try {
      // Fetch orders first (avoid embedded join with RLS)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, status, payment_status, shipping_address, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError
      const baseOrders = ordersData || []

      if (baseOrders.length === 0) {
        setOrders([])
        adminCache.set(cacheKey, [], 30000)
        return
      }

      const ids = baseOrders.map((o: any) => o.id)
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('id, order_id, product_name, product_price, quantity, size')
        .in('order_id', ids)

      if (itemsError) throw itemsError

      const byOrder: Record<string, OrderItem[]> = {}
      ;(itemsData || []).forEach((i: any) => {
        const list = byOrder[i.order_id] || []
        list.push({ id: i.id, product_name: i.product_name, price: i.product_price, quantity: i.quantity, size: i.size })
        byOrder[i.order_id] = list
      })

      const composed = baseOrders.map((o: any) => ({
        ...o,
        order_items: byOrder[o.id] || [],
      })) as Order[]

      setOrders(composed)
      
      // Cache the data for 30 seconds
      adminCache.set(cacheKey, composed, 30000)
    } catch (err) {
      try { console.error('Failed to fetch orders:', JSON.stringify(err)) } catch { console.error('Failed to fetch orders:', err) }
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.rpc('update_order_status', {
        p_order_id: orderId,
        p_status: newStatus,
        p_notes: 'Status updated by admin'
      })

      if (error) throw error

      // Clear cache and update local state
      adminCache.delete('admin:orders')
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ))
    } catch (err) {
      console.error('Failed to update order status:', err)
      alert('Failed to update order status')
    }
  }

  const deleteOrder = async (orderId: string) => {
    try {
      const confirmed = window.confirm('Delete this order? This cannot be undone.')
      if (!confirmed) return

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)

      if (error) throw error

      // Clear cache and update local state
      adminCache.delete('admin:orders')
      setOrders(prev => prev.filter(o => o.id !== orderId))
    } catch (err) {
      console.error('Failed to delete order:', err)
      alert('Failed to delete order')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded mb-8"></div>
            <div className="h-64 bg-white/20 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 lg:mb-8">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-2 lg:mb-4 tracking-tight">
                Order Management
              </h1>
              <p className="text-white/70 text-sm sm:text-base lg:text-lg">Manage and track all customer orders</p>
            </div>
            <div className="text-left lg:text-right">
              <div className="text-xs sm:text-sm font-medium text-white">
                {filteredOrders.length} Total Orders
              </div>
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 lg:mb-8">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-sm ${
                selectedStatus === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setSelectedStatus('pending')}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-sm ${
                selectedStatus === 'pending'
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/25'
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              Pending ({orders.filter(o => o.status === 'pending').length})
            </button>
            <button
              onClick={() => setSelectedStatus('processing')}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-sm ${
                selectedStatus === 'processing'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              Processing ({orders.filter(o => o.status === 'processing').length})
            </button>
            <button
              onClick={() => setSelectedStatus('shipped')}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-sm ${
                selectedStatus === 'shipped'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              Shipped ({orders.filter(o => o.status === 'shipped').length})
            </button>
            <button
              onClick={() => setSelectedStatus('delivered')}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-sm ${
                selectedStatus === 'delivered'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25'
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              Delivered ({orders.filter(o => o.status === 'delivered').length})
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Orders Table */}
        {/* Desktop/tablet table (md and up) */}
        <div className="hidden md:block bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 align-top">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm sm:text-base font-black text-white">
                          {order.order_number}
                        </div>
                        <div className="text-xs text-gray-300">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {order.shipping_address?.name || 'Guest'}
                        </div>
                        <div className="text-xs text-gray-300">
                          {order.shipping_address?.email || 'No email'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">
                        {order.order_items.length} item(s)
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-blue-300">
                        ₱{order.total_amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/order/${order.id}`}
                          className="text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          View
                        </Link>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="bg-white/10 text-white border border-white/20 rounded px-2 py-1 text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="text-red-400 hover:text-red-300 font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-300 text-lg">
                  {selectedStatus === 'all' ? 'No orders found' : `No ${selectedStatus} orders found`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile cards (below md) */}
        <div className="md:hidden space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-base font-black text-white">{order.order_number}</div>
                  <div className="text-xs text-gray-300">{new Date(order.created_at).toLocaleDateString()}</div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <div className="text-sm text-white mb-1">{order.shipping_address?.name || 'Guest'}</div>
              <div className="text-xs text-gray-300 mb-3">{order.shipping_address?.email || 'No email'}</div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-gray-300">
                  {order.order_items.length} item(s)
                </div>
                <div className="text-base font-black text-blue-300">₱{order.total_amount.toLocaleString()}</div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-3">
                  <Link href={`/order/${order.id}`} className="flex-1 text-center bg-white/10 text-white border border-white/20 rounded px-3 py-2 text-sm font-semibold">
                    View
                  </Link>
                  <button onClick={() => deleteOrder(order.id)} className="px-3 py-2 text-sm font-semibold text-red-300 border border-red-400/40 rounded">
                    Delete
                  </button>
                </div>
                <select
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                  className="bg-white/10 text-white border border-white/20 rounded px-3 py-2 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}