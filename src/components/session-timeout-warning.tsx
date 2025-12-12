'use client'

import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import { Button } from '@/components/ui/button'
import { Clock, LogOut } from 'lucide-react'

interface SessionTimeoutWarningProps {
  timeoutMinutes?: number
  warningMinutes?: number
}

export function SessionTimeoutWarning({
  timeoutMinutes = 30,
  warningMinutes = 2
}: SessionTimeoutWarningProps) {
  const { showWarning, timeLeft, extendSession, logout } = useSessionTimeout({
    timeoutMinutes,
    warningMinutes
  })

  if (!showWarning) return null

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-amber-500/50 rounded-xl p-6 max-w-md mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Session Expiring</h3>
        </div>
        <p className="text-muted-foreground mb-2">
          Your session will expire due to inactivity.
        </p>
        <p className="text-2xl font-mono font-bold text-amber-600 dark:text-amber-400 mb-6 text-center">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </p>
        <div className="flex gap-3">
          <Button
            onClick={extendSession}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            Stay Logged In
          </Button>
          <Button
            onClick={logout}
            variant="outline"
            className="flex-1"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout Now
          </Button>
        </div>
      </div>
    </div>
  )
}
