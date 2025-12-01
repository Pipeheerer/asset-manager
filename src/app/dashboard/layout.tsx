'use client'

import { useAuth } from '@/app/providers'
import { AdminLayout } from '@/components/layout/admin-layout'
import { UserLayout } from '@/components/layout/user-layout'
import { Loader2 } from 'lucide-react'

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { role, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Admin users get the full admin layout
  if (role === 'admin') {
    return <AdminLayout>{children}</AdminLayout>
  }

  // Regular users get the user layout
  return <UserLayout>{children}</UserLayout>
}
