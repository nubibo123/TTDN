import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen } from 'lucide-react'
import BlurReveal from '@/components/BlurReveal'

export interface VantaWavesHeroProps {
  height?: string
}

declare global {
  interface Window {
    VANTA: {
      WAVES: (options: Record<string, unknown>) => { destroy: () => void }
    }
    THREE: unknown
  }
}

const defaultOptions = {
  mouseControls: true,
  touchControls: true,
  gyroControls: false,
  minHeight: 200.0,
  minWidth: 200.0,
  scale: 1.0,
  scaleMobile: 1.0,
  color: 0x1a2744,
  shininess: 50.0,
  waveHeight: 20.0,
  waveSpeed: 1.0,
  zoom: 0.9,
}

export default function VantaWavesHero({ height = '100vh' }: VantaWavesHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const vantaInstance = useRef<{ destroy: () => void } | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const initVanta = () => {
      if (typeof window.VANTA !== 'undefined' && container) {
        vantaInstance.current = window.VANTA.WAVES({
          el: container,
          ...defaultOptions,
        })
      }
    }

    const timer = setTimeout(initVanta, 100)
    return () => {
      clearTimeout(timer)
      if (vantaInstance.current) {
        vantaInstance.current.destroy()
        vantaInstance.current = null
      }
    }
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden flex items-center justify-center"
      style={{ height }}
      aria-label="Animated waves hero background."
    >
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <BlurReveal as="div" duration={600} delay={0} className="inline-flex items-center gap-2 bg-gold-500/20 backdrop-blur-sm text-gold-400 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-gold-500/30">
          <BookOpen className="w-4 h-4" />
          Nền tảng tư vấn tuyển sinh hàng đầu
        </BlurReveal>

        <BlurReveal as="h1" duration={700} delay={120} className="font-display text-5xl lg:text-7xl font-bold text-cream-50 leading-tight mb-6">
          Chọn đúng trường,<br />
          <span className="text-gold-400">Yên tâm tương lai</span>
        </BlurReveal>

        <BlurReveal as="p" duration={700} delay={240} className="text-cream-200 text-lg lg:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
          Hướng Nghiệp giúp học sinh tự đánh giá học bạ, so sánh điểm chuẩn,
          nhận tư vấn ngành phù hợp và kết nối cộng đồng tuyển sinh toàn quốc.
        </BlurReveal>

        <BlurReveal as="div" duration={700} delay={360} className="flex flex-wrap justify-center gap-4">
          <Link
            to="/diem-hoc-ky"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gold-500 text-navy-900 font-bold rounded-xl hover:bg-gold-400 transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-gold-500/25"
          >
            Nhập điểm ngay
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/truong"
            className="inline-flex items-center gap-2 px-8 py-4 border-2 border-cream-100/30 text-cream-100 font-semibold rounded-xl hover:bg-cream-100/10 backdrop-blur-sm transition-all duration-200"
          >
            Khám phá trường
          </Link>
        </BlurReveal>
      </div>
    </section>
  )
}