'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AuthProvider } from '@/context/AuthContext'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-900">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gradient-to-r from-royal-900/95 to-slate-900/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50 shadow-2xl">
          <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-xl mr-3 flex items-center justify-center text-white text-lg font-bold shadow-lg">
              S
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide">Slick Admin</h1>
          </div>
          <button
            onClick={toggleMobileMenu}
            className="p-3 text-white hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Fullscreen Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-gradient-to-br from-royal-900/98 to-slate-900/98 backdrop-blur-xl">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-xl mr-4 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                  S
                </div>
                <h1 className="text-2xl font-bold text-white tracking-wide">Slick Admin</h1>
              </div>
              <button
                onClick={closeMobileMenu}
                className="p-3 text-white hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <nav className="flex-1 p-8 space-y-6">
              <Link
                href="/admin/dashboard"
                onClick={closeMobileMenu}
                className="flex items-center px-6 py-5 text-white bg-gradient-to-r from-white/10 to-white/5 rounded-2xl hover:from-white/20 hover:to-white/10 transition-all duration-300 group shadow-lg hover:shadow-xl hover:scale-105"
              >
                <div className="w-8 h-8 mr-5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                  </svg>
                </div>
                <span className="text-xl font-semibold">Dashboard</span>
              </Link>
              <Link
                href="/admin/products"
                onClick={closeMobileMenu}
                className="flex items-center px-6 py-5 text-white bg-gradient-to-r from-white/10 to-white/5 rounded-2xl hover:from-white/20 hover:to-white/10 transition-all duration-300 group shadow-lg hover:shadow-xl hover:scale-105"
              >
                <div className="w-8 h-8 mr-5 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="text-xl font-semibold">Products</span>
              </Link>
              <Link
                href="/admin/orders"
                onClick={closeMobileMenu}
                className="flex items-center px-6 py-5 text-white bg-gradient-to-r from-white/10 to-white/5 rounded-2xl hover:from-white/20 hover:to-white/10 transition-all duration-300 group shadow-lg hover:shadow-xl hover:scale-105"
              >
                <div className="w-8 h-8 mr-5 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-xl font-semibold">Orders</span>
              </Link>
              <Link
                href="/admin/users"
                onClick={closeMobileMenu}
                className="flex items-center px-6 py-5 text-white bg-gradient-to-r from-white/10 to-white/5 rounded-2xl hover:from-white/20 hover:to-white/10 transition-all duration-300 group shadow-lg hover:shadow-xl hover:scale-105"
              >
                <div className="w-8 h-8 mr-5 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <span className="text-xl font-semibold">Admin Users</span>
              </Link>
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="flex items-center px-6 py-5 text-red-300 bg-gradient-to-r from-red-500/20 to-red-600/10 rounded-2xl hover:from-red-500/30 hover:to-red-600/20 transition-all duration-300 group shadow-lg hover:shadow-xl hover:scale-105 mt-8"
              >
                <div className="w-8 h-8 mr-5 bg-gradient-to-r from-red-400 to-red-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="text-xl font-semibold">Logout</span>
              </Link>
            </nav>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 bg-gradient-to-b from-royal-900/95 to-slate-900/95 backdrop-blur-md border-r border-white/10 shadow-2xl">
          <div className="p-8 border-b border-white/10">
            <h1 className="text-3xl font-bold text-white flex items-center tracking-wide">
              <span className="w-12 h-12 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-2xl mr-4 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                S
              </span>
              Slick Admin
            </h1>
          </div>
          
          <nav className="mt-8 space-y-4 p-6">
            <Link
              href="/admin/dashboard"
              className="flex items-center px-6 py-5 text-white bg-gradient-to-r from-white/10 to-white/5 rounded-2xl hover:from-white/20 hover:to-white/10 transition-all duration-300 group shadow-lg hover:shadow-xl hover:scale-105"
            >
              <div className="w-8 h-8 mr-5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                </svg>
              </div>
              <span className="text-lg font-semibold">Dashboard</span>
            </Link>
            <Link
              href="/admin/products"
              className="flex items-center px-6 py-5 text-white bg-gradient-to-r from-white/10 to-white/5 rounded-2xl hover:from-white/20 hover:to-white/10 transition-all duration-300 group shadow-lg hover:shadow-xl hover:scale-105"
            >
              <div className="w-8 h-8 mr-5 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-lg font-semibold">Products</span>
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center px-6 py-5 text-white bg-gradient-to-r from-white/10 to-white/5 rounded-2xl hover:from-white/20 hover:to-white/10 transition-all duration-300 group shadow-lg hover:shadow-xl hover:scale-105"
            >
              <div className="w-8 h-8 mr-5 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-lg font-semibold">Orders</span>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center px-6 py-5 text-white bg-gradient-to-r from-white/10 to-white/5 rounded-2xl hover:from-white/20 hover:to-white/10 transition-all duration-300 group shadow-lg hover:shadow-xl hover:scale-105"
            >
              <div className="w-8 h-8 mr-5 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <span className="text-lg font-semibold">Admin Users</span>
            </Link>
            <Link
              href="/"
              className="flex items-center px-6 py-5 text-red-300 bg-gradient-to-r from-red-500/20 to-red-600/10 rounded-2xl hover:from-red-500/30 hover:to-red-600/20 transition-all duration-300 group shadow-lg hover:shadow-xl hover:scale-105 mt-8"
            >
              <div className="w-8 h-8 mr-5 bg-gradient-to-r from-red-400 to-red-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className="text-lg font-semibold">Logout</span>
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-screen">
          <div className="p-6 lg:p-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
