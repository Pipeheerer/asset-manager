'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  ArrowRight, 
  Calendar, 
  DollarSign,
  Building2,
  Tag
} from 'lucide-react'
import Link from 'next/link'

interface Asset {
  id: string
  name: string
  category: { name: string }
  department: { name: string }
  cost: number
  date_purchased: string
}

interface RecentAssetsProps {
  assets: Asset[]
}

export function RecentAssets({ assets }: RecentAssetsProps) {
  if (assets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-blue-500" />
            Recent Assets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No assets yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by adding your first asset
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/assets">
                Add Asset
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5 text-blue-500" />
          Recent Assets
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/assets" className="flex items-center gap-1">
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assets.map((asset) => (
            <div 
              key={asset.id} 
              className="group flex items-center justify-between rounded-lg border p-4 transition-all hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
                  <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {asset.name}
                  </h4>
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {asset.category?.name || 'Uncategorized'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {asset.department?.name || 'No department'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 font-semibold text-green-600 dark:text-green-400">
                  <DollarSign className="h-4 w-4" />
                  {asset.cost?.toLocaleString() || '0'}
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {asset.date_purchased 
                    ? new Date(asset.date_purchased).toLocaleDateString()
                    : 'No date'
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
