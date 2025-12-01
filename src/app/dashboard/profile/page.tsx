'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/providers'
import { getUserProfile, updateUserProfile, User as UserProfile } from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Shield, Calendar, Settings, Loader2, Check, Pencil } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default function ProfilePage() {
  const { user, role } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return
      const data = await getUserProfile(user.id)
      setProfile(data)
      setFirstName(data?.first_name || '')
      setLastName(data?.last_name || '')
      setLoading(false)
    }
    fetchProfile()
  }, [user?.id])

  const handleSave = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      const updated = await updateUserProfile(user.id, {
        first_name: firstName || undefined,
        last_name: lastName || undefined
      })
      setProfile(updated)
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const displayName = profile?.first_name 
    ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
    : user?.email?.split('@')[0]

  const initials = profile?.first_name 
    ? `${profile.first_name.charAt(0)}${profile.last_name?.charAt(0) || ''}`
    : user?.email?.charAt(0).toUpperCase()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground">
          View and edit your account information
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-2xl font-bold text-white">
                {initials}
              </div>
              <div>
                <CardTitle className="text-xl">
                  {displayName}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
                    {role === 'admin' ? 'Administrator' : 'Employee'}
                  </Badge>
                </div>
              </div>
            </div>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name Fields (Editable) */}
          {editing ? (
            <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter your first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Enter your last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => {
                  setEditing(false)
                  setFirstName(profile?.first_name || '')
                  setLastName(profile?.last_name || '')
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* First Name */}
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">
                    {profile?.first_name || profile?.last_name 
                      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                      : <span className="text-muted-foreground italic">Not set - click Edit to add</span>
                    }
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Mail className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email Address</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Account Role</p>
              <p className="font-medium capitalize">{role}</p>
            </div>
          </div>

          {/* Account Created */}
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Account Created</p>
              <p className="font-medium">
                {user?.created_at 
                  ? format(new Date(user.created_at), 'MMMM d, yyyy')
                  : 'Unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Link */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Account Settings</p>
                <p className="text-sm text-muted-foreground">
                  Change password, preferences and more
                </p>
              </div>
            </div>
            <Link href="/dashboard/settings">
              <Button variant="outline">
                Go to Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
