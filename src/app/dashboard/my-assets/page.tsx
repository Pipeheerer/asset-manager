'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/providers'
import { getUserAssignedAssets, AssetWithDetails } from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Search, 
  MapPin,
  Shield,
  FileWarning,
  AlertCircle,
  Loader2,
  Eye,
  ShieldCheck,
  ExternalLink
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function MyAssetsPage() {
  const { user, role } = useAuth()
  const [assets, setAssets] = useState<AssetWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<AssetWithDetails | null>(null)
  const [warrantyStatus, setWarrantyStatus] = useState<Record<string, 'registered' | 'not_registered' | 'checking'>>({}) 
  const [isRegisteringWarranty, setIsRegisteringWarranty] = useState(false)

  useEffect(() => {
    const fetchAssets = async () => {
      if (!user) return
      
      try {
        const userAssets = await getUserAssignedAssets(user.id)
        setAssets(userAssets)
        
        // Check warranty status for each asset
        for (const asset of userAssets) {
          try {
            const response = await fetch(`/api/warranty/register?assetId=${asset.id}`)
            const data = await response.json()
            if (data.success && data.data) {
              setWarrantyStatus(prev => ({ ...prev, [asset.id]: 'registered' }))
            } else {
              setWarrantyStatus(prev => ({ ...prev, [asset.id]: 'not_registered' }))
            }
          } catch {
            setWarrantyStatus(prev => ({ ...prev, [asset.id]: 'not_registered' }))
          }
        }
      } catch (error) {
        console.error('Error fetching assets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
  }, [user])

  const registerWarranty = async (asset: AssetWithDetails) => {
    if (!user?.email) return
    
    setIsRegisteringWarranty(true)
    try {
      const response = await fetch('/api/warranty/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: asset.id,
          asset_name: asset.name,
          serial_number: asset.serial_number || null,
          category: asset.category?.name || null,
          department: asset.department?.name || null,
          location: asset.location || null,
          date_purchased: asset.date_purchased || null,
          cost: asset.cost || null,
          warranty_start: asset.date_purchased || null,
          warranty_expiry: asset.warranty_expiry || null,
          warranty_notes: asset.warranty_notes || null,
          warranty_provider: null,
          warranty_type: 'manufacturer',
          warranty_terms: null,
          warranty_contact: null,
          warranty_claim_url: null,
          registered_by_email: user.email
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setWarrantyStatus(prev => ({ ...prev, [asset.id]: 'registered' }))
        alert('Warranty registered successfully! You can add more details in the Warranty Centre.')
      } else {
        alert(data.message || 'Failed to register warranty')
      }
    } catch (error) {
      console.error('Warranty registration error:', error)
      alert('Failed to connect to warranty service')
    } finally {
      setIsRegisteringWarranty(false)
    }
  }

  // Redirect admin users
  if (role === 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Admin users should use the Assets page.</p>
        <Link href="/dashboard/assets">
          <Button>Go to Assets</Button>
        </Link>
      </div>
    )
  }

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  // Stats
  const warrantyExpiring = assets.filter(a => 
    a.warranty_expiry && new Date(a.warranty_expiry) <= thirtyDaysFromNow
  ).length
  const insuranceExpiring = assets.filter(a => 
    a.insurance_expiry && new Date(a.insurance_expiry) <= thirtyDaysFromNow
  ).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assets</h1>
          <p className="text-muted-foreground">
            Assets currently assigned to you
          </p>
        </div>
        <div className="flex gap-2">
          <a href="https://server11.eport.ws/logout" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2 border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Warranty Centre
              <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
          <Link href="/dashboard/requests?action=new">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Request New Asset
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <p className="text-xl font-bold">{assets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={warrantyExpiring > 0 ? 'border-orange-300' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <FileWarning className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Warranty Expiring</p>
                <p className="text-xl font-bold">{warrantyExpiring}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={insuranceExpiring > 0 ? 'border-red-300' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Insurance Expiring</p>
                <p className="text-xl font-bold">{insuranceExpiring}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search assets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Assets List */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Assets</CardTitle>
          <CardDescription>{filteredAssets.length} asset(s) found</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No assets found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try a different search term.' : 'No assets are currently assigned to you.'}
              </p>
              {!searchTerm && (
                <Link href="/dashboard/requests/new">
                  <Button variant="outline">Request an Asset</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssets.map((asset) => {
                const warrantyExpired = asset.warranty_expiry && new Date(asset.warranty_expiry) < now
                const warrantyExpiringSoon = asset.warranty_expiry && !warrantyExpired && new Date(asset.warranty_expiry) <= thirtyDaysFromNow
                const insuranceExpired = asset.insurance_expiry && new Date(asset.insurance_expiry) < now
                const insuranceExpiringSoon = asset.insurance_expiry && !insuranceExpired && new Date(asset.insurance_expiry) <= thirtyDaysFromNow

                return (
                  <div 
                    key={asset.id} 
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">{asset.name}</h4>
                          {(warrantyExpired || warrantyExpiringSoon) && (
                            <Badge variant={warrantyExpired ? 'destructive' : 'outline'} className="text-xs">
                              <FileWarning className="h-3 w-3 mr-1" />
                              {warrantyExpired ? 'Warranty Expired' : 'Warranty Expiring'}
                            </Badge>
                          )}
                          {(insuranceExpired || insuranceExpiringSoon) && (
                            <Badge variant={insuranceExpired ? 'destructive' : 'outline'} className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              {insuranceExpired ? 'Insurance Expired' : 'Insurance Expiring'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{asset.category?.name}</span>
                          {asset.serial_number && <span>SN: {asset.serial_number}</span>}
                          {asset.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {asset.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Warranty Status/Register Button */}
                      {warrantyStatus[asset.id] === 'registered' ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Warranty Registered
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); registerWarranty(asset); }}
                          disabled={isRegisteringWarranty}
                          className="h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white border-0"
                        >
                          {isRegisteringWarranty ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <ShieldCheck className="h-3 w-3 mr-1" />
                          )}
                          Register Warranty
                        </Button>
                      )}
                      <div className="text-right">
                        <p className="font-medium text-foreground">${asset.cost?.toLocaleString() || 0}</p>
                        <p className="text-xs text-muted-foreground">
                          {asset.date_purchased && format(new Date(asset.date_purchased), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Asset Detail Dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {selectedAsset?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedAsset?.category?.name} • {selectedAsset?.department?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAsset && (
            <div className="grid gap-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Serial Number</p>
                  <p className="font-medium">{selectedAsset.serial_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge>{selectedAsset.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cost</p>
                  <p className="font-medium">${selectedAsset.cost?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Purchase Date</p>
                  <p className="font-medium">
                    {selectedAsset.date_purchased 
                      ? format(new Date(selectedAsset.date_purchased), 'MMMM d, yyyy')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedAsset.location || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assigned Date</p>
                  <p className="font-medium">
                    {selectedAsset.assigned_date 
                      ? format(new Date(selectedAsset.assigned_date), 'MMMM d, yyyy')
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedAsset.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{selectedAsset.description}</p>
                </div>
              )}

              {/* Warranty Info */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileWarning className="h-4 w-4" />
                  Warranty Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <p className="font-medium">
                      {selectedAsset.warranty_expiry 
                        ? format(new Date(selectedAsset.warranty_expiry), 'MMMM d, yyyy')
                        : 'No warranty'}
                    </p>
                  </div>
                  {selectedAsset.warranty_notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="text-sm">{selectedAsset.warranty_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Insurance Info */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Insurance Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Provider</p>
                    <p className="font-medium">{selectedAsset.insurance_provider || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Policy Number</p>
                    <p className="font-medium">{selectedAsset.insurance_policy_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <p className="font-medium">
                      {selectedAsset.insurance_expiry 
                        ? format(new Date(selectedAsset.insurance_expiry), 'MMMM d, yyyy')
                        : 'No insurance'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Coverage</p>
                    <p className="font-medium">
                      {selectedAsset.insurance_coverage 
                        ? `$${selectedAsset.insurance_coverage.toLocaleString()}`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-4 space-y-3">
                {/* Warranty Registration */}
                {warrantyStatus[selectedAsset.id] === 'registered' ? (
                  <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium">Warranty Registered in Warranty Centre</span>
                  </div>
                ) : (
                  <Button
                    onClick={() => registerWarranty(selectedAsset)}
                    disabled={isRegisteringWarranty}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isRegisteringWarranty ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 mr-2" />
                    )}
                    Register Warranty
                  </Button>
                )}
                
                <Link href={`/dashboard/issues/new?asset=${selectedAsset.id}`}>
                  <Button variant="outline" className="w-full">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Report an Issue with this Asset
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
