'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import CartIcon from './CartIcon'

export default function MobileBottomNav() {
  const [mounted, setMounted] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)

  useEffect(() => {
    setMounted(true)
    // Load cart count from localStorage
    const savedCart = localStorage.getItem('slick-cart')
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart)
        const total = items.reduce((sum: number, item: any) => sum + item.quantity, 0)
        setCartItemCount(total)
      } catch (error) {
        console.error('Error parsing cart:', error)
      }
    }
  }, [])

  // Listen for storage changes to update cart count
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCart = localStorage.getItem('slick-cart')
      if (savedCart) {
        try {
          const items = JSON.parse(savedCart)
          const total = items.reduce((sum: number, item: any) => sum + item.quantity, 0)
          setCartItemCount(total)
        } catch (error) {
          console.error('Error parsing cart:', error)
        }
      } else {
        setCartItemCount(0)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 shadow-xl">
      <div className="flex justify-around items-center py-3">
        {/* Home/Shop */}
        <Link href="/" className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-slate-800 transition-all duration-200">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs font-medium text-white">Shop</span>
        </Link>

        {/* Search */}
        <button className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-slate-800 transition-all duration-200">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-xs font-medium text-white">Search</span>
        </button>

        {/* Cart */}
        <Link href="/cart" className="flex flex-col items-center space-y-1 p-2 relative rounded-lg hover:bg-slate-800 transition-all duration-200">
          <CartIcon className="w-6 h-6 text-white" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium shadow-lg">
              {cartItemCount}
            </span>
          )}
          <span className="text-xs font-medium text-white">Cart</span>
        </Link>

        {/* Profile */}
        <Link href="/login" className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-slate-800 transition-all duration-200">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs font-medium text-white">Login</span>
        </Link>
      </div>
    </div>
  )
}
