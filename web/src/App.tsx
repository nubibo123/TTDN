import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import PageShell from './layouts/PageShell'
import PageSkeleton from './components/PageSkeleton'

const HomePage             = lazy(() => import('./pages/HomePage'))
const TranscriptPage       = lazy(() => import('./pages/TranscriptPage'))
const UniversityListPage   = lazy(() => import('./pages/UniversityListPage'))
const UniversityDetailPage = lazy(() => import('./pages/UniversityDetailPage'))
const ScoreComparisonPage  = lazy(() => import('./pages/ScoreComparisonPage'))
const MajorAdvicePage      = lazy(() => import('./pages/MajorAdvicePage'))
const ForumPage            = lazy(() => import('./pages/ForumPage'))
const ForumThreadPage      = lazy(() => import('./pages/ForumThreadPage'))
const ProfilePage          = lazy(() => import('./pages/ProfilePage'))
const AdvisorDashboardPage = lazy(() => import('./pages/AdvisorDashboardPage'))
const AdminDashboardPage   = lazy(() => import('./pages/AdminDashboardPage'))
const LoginPage            = lazy(() => import('./pages/LoginPage'))

function Fallback() {
  return (
    <PageShell>
      <PageSkeleton />
    </PageShell>
  )
}

export default function App() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/dang-ky" element={<LoginPage initialMode="register" />} />
        <Route path="/dang-ky-tu-van" element={<LoginPage initialMode="advisor" />} />
        <Route element={<MainLayout />}>
          <Route path="/"            element={<PageShell><HomePage /></PageShell>} />
          <Route path="/diem-hoc-ky" element={<PageShell><TranscriptPage /></PageShell>} />
          <Route path="/truong"      element={<PageShell><UniversityListPage /></PageShell>} />
          <Route path="/truong/:id"  element={<PageShell><UniversityDetailPage /></PageShell>} />
          <Route path="/so-sanh"     element={<PageShell><ScoreComparisonPage /></PageShell>} />
          <Route path="/tu-van-nganh" element={<PageShell><MajorAdvicePage /></PageShell>} />
          <Route path="/cong-dong"   element={<PageShell><ForumPage /></PageShell>} />
          <Route path="/cong-dong/:threadId" element={<PageShell><ForumThreadPage /></PageShell>} />
          <Route path="/ho-so"       element={<PageShell><ProfilePage /></PageShell>} />
        </Route>
        <Route path="/tu-van-vien" element={<PageShell><AdvisorDashboardPage /></PageShell>} />
        <Route path="/quan-tri"    element={<PageShell><AdminDashboardPage /></PageShell>} />
      </Routes>
    </Suspense>
  )
}
