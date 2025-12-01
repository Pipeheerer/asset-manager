'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'admin' | 'user' | null>(null)
  const initializedRef = useRef(false)

  const fetchUserRole = useCallback(async (userId: string, email?: string) => {
    try {
      const userRole = await getUserRole(userId, email)
      setRole(userRole)
    } catch (error) {
      console.error('Error fetching user role:', error)
      setRole('user')
    }
  }, [])

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initializedRef.current) return
    initializedRef.current = true

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          // Handle invalid refresh token by signing out
          if (error.message?.includes('Refresh Token') || (error as any).code === 'refresh_token_not_found') {
            console.log('Invalid refresh token, signing out...')
            await supabase.auth.signOut()
            setSession(null)
            setUser(null)
            setRole(null)
          }
          setLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserRole(session.user.id, session.user.email ?? undefined)
        }
      } catch (error: any) {
        console.error('Error initializing auth:', error)
        // Handle auth errors by clearing state
        if (error?.code === 'refresh_token_not_found' || error?.message?.includes('Refresh Token')) {
          await supabase.auth.signOut()
          setSession(null)
          setUser(null)
          setRole(null)
        }
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // Handle sign out
        if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setRole(null)
          setLoading(false)
          return
        }

        // Handle sign in or token refresh
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserRole(session.user.id, session.user.email ?? undefined)
        } else {
          setRole(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUserRole])

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null)
      setSession(null)
      setRole(null)
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Redirect to goodbye page for a friendly farewell
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
