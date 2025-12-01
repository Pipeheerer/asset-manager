import { Loader2 } from 'lucide-react'

// This page is handled by middleware - it will redirect to /dashboard or /auth/login
export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-lg text-muted-foreground">Loading Asset Manager...</p>
      </div>
    </div>
  )
}
