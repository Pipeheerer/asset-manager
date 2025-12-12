'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number
  warningMinutes?: number
}

export function useSessionTimeout({
  timeoutMinutes = 30,
  warningMinutes = 2
}: UseSessionTimeoutOptions = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(warningMinutes * 60)

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/auth/login?reason=timeout')
  }, [router])

  const extendSession = useCallback(() => {
    setShowWarning(false)
    setTimeLeft(warningMinutes * 60)
  }, [warningMinutes])

  useEffect(() => {
    // Skip on auth pages
    if (pathname?.startsWith('/auth')) {
      return
    }

    const TIMEOUT = timeoutMinutes * 60 * 1000
    const WARNING_TIME = warningMinutes * 60 * 1000

    let timeoutId: NodeJS.Timeout
    let warningId: NodeJS.Timeout
    let countdownId: NodeJS.Timeout

    const startCountdown = () => {
      setTimeLeft(warningMinutes * 60)
      countdownId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownId)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    const resetTimer = () => {
      clearTimeout(timeoutId)
      clearTimeout(warningId)
      clearInterval(countdownId)
      setShowWarning(false)
      setTimeLeft(warningMinutes * 60)

      // Set warning timer
      warningId = setTimeout(() => {
        setShowWarning(true)
        startCountdown()
      }, TIMEOUT - WARNING_TIME)

      // Set logout timer
      timeoutId = setTimeout(logout, TIMEOUT)
    }

    // Activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      if (!showWarning) {
        resetTimer()
      }
    }

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Start the timer
    resetTimer()

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(warningId)
      clearInterval(countdownId)
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [pathname, timeoutMinutes, warningMinutes, logout, showWarning])

  return {
    showWarning,
    timeLeft,
    extendSession,
    logout
  }
}
