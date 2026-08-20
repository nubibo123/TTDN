import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Star, TrendingUp } from 'lucide-react'
import VantaWavesHero from '@/components/ui/VantaWavesHero'
import { useIntersectionObserver } from '@/lib/useIntersectionObserver'
import { useCountUp } from '@/lib/useCountUp'
import { getUniversities } from '@/lib/universities'
import { FeaturesSectionWithHoverEffects } from '@/components/blocks/feature-section-with-hover-effects'
import BlurReveal from '@/components/BlurReveal'

const popularMajors = [
  { name: 'Khoa học máy tính', school: 'ĐH Bách khoa Hà Nội', score: 38.75, trend: '+0.5' },
  { name: 'Y khoa', school: 'ĐH Y Hà Nội', score: 27.5, trend: '+0.25' },
  { name: 'Kinh doanh quốc tế', school: 'ĐH Ngoại thương', score: 37.5, trend: '+1.0' },
  { name: 'Quản trị kinh doanh', school: 'ĐH Kinh tế Quốc dân', score: 27.25, trend: '-0.5' },
  { name: 'Ngôn ngữ Anh', school: 'ĐH Ngoại thương', score: 35.0, trend: '+0.75' },
]

function StatItem({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.3 })
  const count = useCountUp(value, 1800, isVisible)

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="text-center">
      <p className="font-display text-4xl lg:text-5xl font-bold text-navy-800 mb-1 tabular-nums">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-slate-600 text-sm font-medium">{label}</p>
    </div>
  )
}

function RevealSection({ children, className = '', staggerDelay = 0 }: {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}) {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 })
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`${className} ${isVisible ? 'visible' : ''}`}
      style={{ '--stagger': staggerDelay } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

function HomeStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="text-center space-y-2">
          <div className="skeleton h-10 w-28 mx-auto rounded-lg" />
          <div className="skeleton h-4 w-20 mx-auto" />
        </div>
      ))}
    </div>
  )
}

export default function HomePage() {
  const [stats, setStats] = useState({ universities: 0, majors: 0, scores: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUniversities()
      .then((list) => {
        const uni = list.length
        setStats({ universities: uni, majors: uni * 8, scores: uni * 12 })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero — Vanta Waves provides the motion */}
      <VantaWavesHero />

      {/* Stats */}
      <RevealSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <BlurReveal as="div" duration={700}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {loading ? (
              <HomeStatsSkeleton />
            ) : (
              <>
                <StatItem value={stats.universities} suffix="" label="Trường đại học" />
                <StatItem value={stats.majors} suffix="" label="Ngành học" />
                <StatItem value={stats.scores} suffix="+" label="Điểm chuẩn" />
                <StatItem value={10000} suffix="+" label="Học sinh tin dùng" />
              </>
            )}
          </div>
        </BlurReveal>
      </RevealSection>

      {/* Steps */}
      <RevealSection className="py-16">
        <BlurReveal as="h2" duration={700} className="font-display text-3xl font-bold text-navy-800 text-center mb-12">Cách thức hoạt động</BlurReveal>
        <FeaturesSectionWithHoverEffects />
      </RevealSection>

      {/* Popular majors */}
      <RevealSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <BlurReveal as="div" duration={700} className="flex items-center justify-between mb-8">
          <h2 className="font-display text-3xl font-bold text-navy-800">Ngành hot năm 2025</h2>
          <Link to="/truong" className="text-gold-600 font-medium hover:underline">Xem tất cả →</Link>
        </BlurReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularMajors.map((major, idx) => (
            <BlurReveal key={idx} duration={600} delay={idx * 80} className="p-6 rounded-2xl border border-cream-200 hover:border-gold-400/40 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-navy-800">{major.name}</h3>
                <span className={`text-sm font-medium ${major.trend.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                  {major.trend}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{major.school}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Điểm chuẩn</span>
                <span className="font-display font-bold text-lg text-gold-600">{major.score}</span>
              </div>
            </BlurReveal>
          ))}
        </div>
      </RevealSection>

      {/* CTA */}
      <RevealSection className="bg-navy-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <BlurReveal as="h2" duration={700} className="font-display text-3xl font-bold text-cream-50 mb-4">Sẵn sàng tìm trường phù hợp?</BlurReveal>
          <BlurReveal as="p" duration={700} delay={100} className="text-cream-200 mb-8 max-w-2xl mx-auto">
            Nhập điểm của bạn ngay để được tư vấn ngành học và trường đại học phù hợp nhất.
          </BlurReveal>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/so-sanh">
              <button className="px-8 py-3 bg-gold-400 text-navy-800 font-semibold rounded-xl hover:bg-gold-500 transition-all">
                So sánh điểm ngay
              </button>
            </Link>
            <Link to="/tu-van-nganh">
              <button className="px-8 py-3 bg-transparent border-2 border-cream-50 text-cream-50 font-semibold rounded-xl hover:bg-cream-50/10 transition-all">
                Tư vấn ngành học
              </button>
            </Link>
            <Link to="/dang-ky-tu-van">
              <button className="px-8 py-3 bg-gold-500 text-navy-900 font-semibold rounded-xl hover:bg-gold-400 transition-all">
                Đăng ký tư vấn viên
              </button>
            </Link>
          </div>
        </div>
      </RevealSection>
    </div>
  )
}