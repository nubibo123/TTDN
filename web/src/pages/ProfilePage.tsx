import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/authContext'
import { getAuthMe } from '@/lib/admin'
import { Loader2 } from 'lucide-react'
import StudentProfilePage from './StudentProfilePage'
import AdvisorProfilePage from './AdvisorProfilePage'

export default function ProfilePage() {
  const { user } = useAuth()
  const [roles, setRoles] = useState<string[] | null>(null)

  useEffect(() => {
    let active = true
    if (user) {
      getAuthMe()
        .then((res) => {
          if (active) setRoles(res.roles)
        })
        .catch(() => {
          if (active) setRoles([])
        })
    } else {
      setRoles([])
    }
    return () => {
      active = false
    }
  }, [user])

  if (roles === null) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    )
  }

  if (roles.includes('ADVISOR')) {
    return <AdvisorProfilePage />
  }

  return <StudentProfilePage />
}
