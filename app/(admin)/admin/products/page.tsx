'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { adminCache } from '@/lib/cache'
import { TableSkeleton, MobileCardSkeleton } from '@/components/Skeleton'

export const dynamic = 'force-dynamic'

interface Product {
  id: string
  name: string
  price: number
  slug: string
  status: string
  brand: string
  description: string
  image_url?: string
  variants: Array<{
    size: string
    stock: number
  }>
}

export default function AdminProducts() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchProducts = useCallback(async (forceRefresh = false) => {
    if (!user) {
      console.log('No user authenticated')
      return
    }

    const cacheKey = `admin:products:${user.id}`
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = adminCache.get(cacheKey)
      if (cachedData) {
        console.log('Using cached products data')
        setProducts(cachedData)
        setLoading(false)
        return
      }
    }

    try {
      const supabase = createClient()
      console.log('Fetching products for user:', user.id)
      
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (productsError) {
        console.error('Error fetching products:', productsError)
        setError('Failed to fetch products: ' + productsError.message)
        return
      }

      console.log('Products fetched:', productsData)

      // Fetch variants for each product
      const productsWithVariants = await Promise.all(
        productsData.map(async (product: any) => {
          const { data: variants, error: variantsError } = await supabase
            .from('product_variants')
            .select('size, stock')
            .eq('product_id', product.id)

          if (variantsError) {
            console.error('Error fetching variants for product', product.id, ':', variantsError)
          }

          return {
            ...product,
            variants: variants || []
          }
        })
      )

      setProducts(productsWithVariants)
      
      // Cache the data for 30 seconds
      adminCache.set(cacheKey, productsWithVariants, 30000)
    } catch (err) {
      console.error('Fetch products error:', err)
      setError('Failed to fetch products: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user) {
      fetchProducts()
    }
  }, [user, authLoading, router, fetchProducts])

  const handleDelete = async (productId: string) => {
    if (!user) {
      setError('You must be logged in to delete products')
      return
    }

    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    setDeletingId(productId)
    setError('')
    try {
      const supabase = createClient()
      
      console.log('Deleting product:', productId, 'for user:', user.id)
      
      // First delete variants
      const { error: variantsError } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', productId)

      if (variantsError) {
        console.error('Error deleting variants:', variantsError)
        setError('Failed to delete product variants')
        return
      }

      // Then delete the product
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (productError) {
        console.error('Error deleting product:', productError)
        setError('Failed to delete product: ' + productError.message)
        return
      }

      console.log('Product deleted successfully')
      // Clear cache and refresh the products list
      const cacheKey = `admin:products:${user.id}`
      adminCache.delete(cacheKey)
      await fetchProducts(true)
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete product: ' + (err as Error).message)
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTotalStock = (variants: Array<{ stock: number }>) => {
    return variants.reduce((total, variant) => total + variant.stock, 0)
  }

  const getStockColor = (totalStock: number) => {
    if (totalStock === 0) return 'text-red-600 font-semibold'
    if (totalStock < 10) return 'text-yellow-600 font-semibold'
    return 'text-green-600 font-semibold'
  }

  if (authLoading || loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
              Manage Products
            </h1>
            <p className="text-slate-600">
              {authLoading ? 'Checking authentication...' : 'Loading products...'}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/50">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
              Access Denied
            </h1>
            <p className="text-slate-600">You must be logged in to access this page</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/50 text-center">
          <p className="text-slate-600 mb-4">Please log in to manage products</p>
          <Link 
            href="/login" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-2 lg:mb-4 tracking-tight">
              Product Management
            </h1>
            <p className="text-white/70 text-sm sm:text-base lg:text-lg">Add, edit, and manage your product catalog</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={async () => {
              if (!user) {
                setError('You must be logged in to create products')
                return
              }

              try {
                const supabase = createClient()
                console.log('Creating test product for user:', user.id)
                
                const { data, error } = await supabase
                  .from('products')
                  .insert([{
                    name: 'Test Product ' + Date.now(),
                    slug: 'test-product-' + Date.now(),
                    description: 'A test product for testing delete functionality',
                    price: 99.99,
                    brand: 'Test',
                    status: 'active'
                  }])
                  .select()
                  .single()

                if (error) {
                  console.error('Error creating test product:', error)
                  setError('Failed to create test product: ' + error.message)
                } else {
                  console.log('Test product created:', data)
                  // Clear cache and refresh
                  const cacheKey = `admin:products:${user.id}`
                  adminCache.delete(cacheKey)
                  await fetchProducts(true)
                }
              } catch (err) {
                console.error('Create test product error:', err)
                setError('Failed to create test product: ' + (err as Error).message)
              }
            }}
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            <span className="mr-2">🧪</span>
            Create Test Product
          </button>
          <Link 
            href="/admin/products/new" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            <span className="mr-2">➕</span>
            New Product
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-lg border border-white/50">
        {loading ? (
          <>
            {/* Desktop Table Skeleton */}
            <div className="hidden lg:block">
              <TableSkeleton />
            </div>
            {/* Mobile Card Skeletons */}
            <div className="lg:hidden space-y-4">
              <MobileCardSkeleton />
              <MobileCardSkeleton />
              <MobileCardSkeleton />
            </div>
          </>
        ) : products.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4 sm:px-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl mx-auto mb-4">
              📦
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">No products found</h3>
            <p className="text-sm sm:text-base text-slate-600 mb-6">Get started by creating your first product</p>
            <Link 
              href="/admin/products/new" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              Create Product
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Brand</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => {
                    const totalStock = getTotalStock(product.variants)
                    return (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-4">
                              {product.name.split(' ')[1]?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{product.name}</div>
                              <div className="text-xs text-slate-500">Slug: {product.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.brand}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-slate-900">${product.price.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-semibold ${getStockColor(totalStock)}`}>
                            {totalStock} units
                          </span>
                          <div className="text-xs text-slate-500">
                            {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(product.status)}`}>
                            {product.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Link
                              href={`/admin/products/edit/${product.id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              Edit
                            </Link>
                            <button 
                              onClick={() => handleDelete(product.id)}
                              disabled={deletingId === product.id}
                              className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              {deletingId === product.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              {products.map((product) => {
                const totalStock = getTotalStock(product.variants)
                return (
                  <div key={product.id} className="border-b border-slate-200 last:border-b-0 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center flex-1">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3">
                          {product.name.split(' ')[1]?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">{product.name}</div>
                          <div className="text-xs text-slate-500 truncate">Slug: {product.slug}</div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        product.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Brand</div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {product.brand}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Price</div>
                        <div className="text-sm font-semibold text-slate-900">${product.price.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Stock</div>
                      <div className={`text-sm font-semibold ${getStockColor(totalStock)}`}>{totalStock} units</div>
                      <div className="text-xs text-slate-500">{product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}</div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Link
                        href={`/admin/products/edit/${product.id}`}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium text-center hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {deletingId === product.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  )
}