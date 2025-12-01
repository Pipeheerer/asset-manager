'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, LogOut, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const farewellMessages = [
  { emoji: '👋', message: 'See you soon!' },
  { emoji: '🌟', message: 'Great work today!' },
  { emoji: '✨', message: 'Until next time!' },
  { emoji: '🚀', message: 'Keep being awesome!' },
  { emoji: '💪', message: 'Take care!' },
]

export default function GoodbyePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [farewell, setFarewell] = useState(farewellMessages[0]) // Default to first message
  const hasRedirected = useRef(false)

  // Set random farewell message on client only to avoid hydration mismatch
  useEffect(() => {
    setFarewell(farewellMessages[Math.floor(Math.random() * farewellMessages.length)])
    setMounted(true)
  }, [])

  // Separate effect for countdown and redirect
  useEffect(() => {
    if (!mounted) return
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [mounted])

  // Handle redirect when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && !hasRedirected.current) {
      hasRedirected.current = true
      router.push('/auth/login')
    }
  }, [countdown, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className={`text-center transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        {/* Animated logo */}
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full animate-pulse" />
          <div className="relative">
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-6 rounded-full border border-slate-600 shadow-2xl">
              <LogOut className="h-12 w-12 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Farewell message */}
        <div className="mb-8">
          <span className="text-6xl mb-4 block animate-bounce">{farewell.emoji}</span>
          <h1 className="text-3xl font-bold text-white mb-2">
            {farewell.message}
          </h1>
          <p className="text-slate-400 text-lg">
            You've been signed out successfully
          </p>
        </div>

        {/* Stats or fun fact */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8 max-w-sm mx-auto">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Shield className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-medium text-white">Session ended securely</span>
          </div>
          <p className="text-xs text-slate-500">
            Your data is protected and all sessions have been terminated.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Button
            onClick={() => router.push('/auth/login')}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-6 text-lg shadow-lg shadow-emerald-500/25"
          >
            Sign in again
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <p className="text-sm text-slate-500">
            Redirecting to login in {countdown} seconds...
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  )
}
