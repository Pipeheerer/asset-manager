'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart
} from 'recharts'
import { BarChart3, PieChartIcon, TrendingUp } from 'lucide-react'

// Default sample data - used as fallback
const defaultAssetsByDepartment = [
  { name: 'IT', assets: 45, color: '#3b82f6' },
  { name: 'HR', assets: 12, color: '#10b981' },
  { name: 'Finance', assets: 28, color: '#f59e0b' },
  { name: 'Marketing', assets: 35, color: '#8b5cf6' },
  { name: 'Sales', assets: 22, color: '#ef4444' },
  { name: 'Operations', assets: 18, color: '#06b6d4' },
]

const defaultAssetsByCategory = [
  { name: 'Laptop', value: 35, color: '#3b82f6' },
  { name: 'Desktop', value: 25, color: '#10b981' },
  { name: 'Monitor', value: 20, color: '#f59e0b' },
  { name: 'Phone', value: 12, color: '#8b5cf6' },
  { name: 'Other', value: 8, color: '#6b7280' },
]

const defaultMonthlySpend = [
  { month: 'Jan', spend: 0, assets: 0 },
  { month: 'Feb', spend: 0, assets: 0 },
  { month: 'Mar', spend: 0, assets: 0 },
  { month: 'Apr', spend: 0, assets: 0 },
  { month: 'May', spend: 0, assets: 0 },
  { month: 'Jun', spend: 0, assets: 0 },
  { month: 'Jul', spend: 0, assets: 0 },
  { month: 'Aug', spend: 0, assets: 0 },
  { month: 'Sep', spend: 0, assets: 0 },
  { month: 'Oct', spend: 0, assets: 0 },
  { month: 'Nov', spend: 0, assets: 0 },
  { month: 'Dec', spend: 0, assets: 0 },
]

interface MonthlySpendData {
  month: string
  spend: number
  assets: number
}

interface AnalyticsChartsProps {
  assetsByCategory?: Record<string, number>
  assetsByDepartment?: Record<string, number>
  monthlySpending?: MonthlySpendData[]
}

export function AnalyticsCharts({ 
  assetsByCategory: categoryData, 
  assetsByDepartment: departmentData,
  monthlySpending
}: AnalyticsChartsProps) {
  // Transform data if provided, otherwise use sample data
  const pieData = categoryData 
    ? Object.entries(categoryData).map(([name, value], index) => ({
        name,
        value,
        color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'][index % 6]
      }))
    : defaultAssetsByCategory

  const barData = departmentData
    ? Object.entries(departmentData).map(([name, assets], index) => ({
        name,
        assets,
        color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'][index % 6]
      }))
    : defaultAssetsByDepartment

  // Use real monthly spending data if provided
  const monthlySpendData = monthlySpending && monthlySpending.length > 0 
    ? monthlySpending 
    : defaultMonthlySpend

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Assets by Department - Bar Chart */}
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Assets by Department
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={80}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--card-foreground))'
                  }}
                  labelStyle={{ color: 'hsl(var(--card-foreground))' }}
                  itemStyle={{ color: 'hsl(var(--card-foreground))' }}
                />
                <Bar 
                  dataKey="assets" 
                  radius={[0, 4, 4, 0]}
                  fill="#3b82f6"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Assets by Category - Pie Chart */}
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChartIcon className="h-5 w-5 text-purple-500" />
            Assets by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--card-foreground))'
                  }}
                  labelStyle={{ color: 'hsl(var(--card-foreground))' }}
                  itemStyle={{ color: 'hsl(var(--card-foreground))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-muted-foreground">{entry.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Spend - Area Chart */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Monthly Asset Spendings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySpendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number | undefined) => value !== undefined ? [`$${value.toLocaleString()}`, 'Spent'] : ['N/A', 'Spent']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--card-foreground))'
                  }}
                  labelStyle={{ color: 'hsl(var(--card-foreground))' }}
                  itemStyle={{ color: 'hsl(var(--card-foreground))' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="spend" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSpend)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
