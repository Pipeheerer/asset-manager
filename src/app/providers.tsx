'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getUserRole } from '@/lib/database'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  role: 'admin' | 'user' | null
  signOut: () => Promise<void>
  refreshData: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Event emitter for data refresh
type RefreshCallback = () => void
const refreshCallbacks = new Set<RefreshCallback>()

export function subscribeToRefresh(callback: RefreshCallback) {
  refreshCallbacks.add(callback)
  return () => refreshCallbacks.delete(callback)
}

export function triggerRefresh() {
  refreshCallbacks.forEach(cb => cb())
}

// Helper to add timeout to promises
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ])
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'admin' | 'user' | null>(null)

  const fetchUserRole = useCallback(async (userId: string, email?: string) => {
    try {
      // Add 3s timeout to prevent hanging
      const userRole = await withTimeout(getUserRole(userId, email), 3000, 'user' as const)
      setRole(userRole)
    } catch (error) {
      console.error('Error fetching user role:', error)
      setRole('user')
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Add timeout to session check to prevent hanging
        const sessionPromise = supabase.auth.getSession()
        const result = await withTimeout(sessionPromise, 3000, { data: { session: null }, error: null })
        
        if (!mounted) return
        
        const { data: { session }, error } = result
        
        if (error) {
          console.error('Error getting session:', error)
          // Handle invalid refresh token by signing out
          if (error.message?.includes('Refresh Token') || (error as any).code === 'refresh_token_not_found') {
            console.log('Invalid refresh token, signing out...')
            await supabase.auth.signOut()
          }
          setSession(null)
          setUser(null)
          setRole(null)
          setLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserRole(session.user.id, session.user.email ?? undefined)
        } else {
          setRole(null)
        }
      } catch (error: any) {
        console.error('Error initializing auth:', error)
        // Clear state on any error to prevent stuck loading
        if (mounted) {
          setSession(null)
          setUser(null)
          setRole(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        if (!mounted) return
        
        console.log('Auth state change:', event, newSession?.user?.id)
        
        // Handle sign out
        if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setRole(null)
          setLoading(false)
          return
        }

        // Handle sign in or token refresh
        setSession(newSession)
        setUser(newSession?.user ?? null)
        
        if (newSession?.user) {
          // For TOKEN_REFRESHED events, preserve existing role if same user
          // This prevents admin from becoming 'user' when tab wakes up
          if (event === 'TOKEN_REFRESHED') {
            // Only re-fetch role if we don't have one or user changed
            setLoading(false)
            return
          }
          
          // For SIGNED_IN or INITIAL_SESSION, fetch the role
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            setLoading(true)
            await fetchUserRole(newSession.user.id, newSession.user.email ?? undefined)
            if (mounted) setLoading(false)
          }
        } else {
          setRole(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchUserRole])

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null)
      setSession(null)
      setRole(null)
      setLoading(false)
      
      // Sign out from Supabase with scope 'local' to clear all sessions
      await supabase.auth.signOut({ scope: 'local' })
      
      // Clear any stale cookies by forcing a clean redirect
      window.location.href = '/auth/goodbye'
    } catch (error) {
      console.error('Error signing out:', error)
      // Force redirect even if signOut fails
      window.location.href = '/auth/goodbye'
    }
  }

  const refreshData = useCallback(() => {
    triggerRefresh()
  }, [])

  const value = {
    user,
    session,
    loading,
    role,
    signOut,
    refreshData
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
