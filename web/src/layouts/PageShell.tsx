import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

export default function PageShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  return (
    <div key={location.pathname} className="mb-page">
      {children}
    </div>
  )
}
