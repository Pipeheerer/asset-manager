'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  iconClassName?: string
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  iconClassName,
}: MetricCardProps) {
  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-blue-500 dark:hover:bg-blue-600",
      className
    )}>
      {/* Background decoration - only visible on hover */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/20 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-150" />
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground group-hover:text-blue-100 transition-colors duration-300">
              {title}
            </p>
            <div className="flex flex-col gap-1">
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground group-hover:text-white transition-colors duration-300 truncate max-w-full">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </h3>
              {trend && (
                <span className={cn(
                  "flex items-center text-xs font-medium transition-colors duration-300",
                  trend.isPositive 
                    ? "text-green-600 group-hover:text-green-200" 
                    : "text-red-600 group-hover:text-red-200"
                )}>
                  {trend.isPositive ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {trend.value}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground group-hover:text-blue-100 transition-colors duration-300">
                {description}
              </p>
            )}
          </div>
          
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 bg-muted group-hover:bg-white/20",
            iconClassName
          )}>
            <Icon className="h-6 w-6 text-muted-foreground group-hover:text-white transition-colors duration-300" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton version for loading states
export function MetricCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-12 w-12 animate-pulse rounded-xl bg-muted" />
        </div>
      </CardContent>
    </Card>
  )
}
