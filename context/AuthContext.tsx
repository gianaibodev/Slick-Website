'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  adminRole: string | null
  hasPermission: (permission: string) => boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminRole, setAdminRole] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      // Check admin status
      if (session?.user) {
        await checkAdminStatus(session.user)
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await checkAdminStatus(session.user)
        } else {
          setIsAdmin(false)
          setAdminRole(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const checkAdminStatus = async (user: User) => {
    try {
      // Check if user has admin role in user_metadata
      const userRole = user.user_metadata?.role || user.app_metadata?.role
      
      if (userRole === 'admin' || userRole === 'super_admin') {
        setIsAdmin(true)
        setAdminRole(userRole)
      } else {
        setIsAdmin(false)
        setAdminRole(null)
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsAdmin(false)
      setAdminRole(null)
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!isAdmin) return false
    
    // Basic permission logic - can be expanded
    const permissions = {
      'view_dashboard': ['admin', 'super_admin'],
      'manage_products': ['admin', 'super_admin'],
      'manage_orders': ['admin', 'super_admin'],
      'manage_users': ['super_admin'],
    }
    
    const allowedRoles = permissions[permission as keyof typeof permissions]
    return allowedRoles ? allowedRoles.includes(adminRole || '') : false
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    loading,
    isAdmin,
    adminRole,
    hasPermission,
    signIn,
    signUp,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
