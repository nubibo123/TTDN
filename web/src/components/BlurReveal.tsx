import type { CSSProperties, ElementType, ReactNode } from 'react'
import { useIntersectionObserver } from '@/lib/useIntersectionObserver'

type BlurRevealProps = {
  children: ReactNode
  as?: ElementType
  className?: string
  delay?: number
  duration?: number
  threshold?: number
  once?: boolean
}

export default function BlurReveal({
  children,
  as: Tag = 'div',
  className = '',
  delay = 0,
  duration = 600,
  threshold = 0.15,
  once = true,
}: BlurRevealProps) {
  const { ref, isVisible } = useIntersectionObserver({ threshold, triggerOnce: once })
  return (
    <Tag
      ref={ref as React.RefObject<HTMLElement>}
      className={`mb-reveal ${isVisible ? 'is-visible' : ''} ${className}`}
      style={{
        ['--mb-delay' as string]: `${delay}ms`,
        ['--mb-duration' as string]: `${duration}ms`,
      } as CSSProperties}
    >
      {children}
    </Tag>
  )
}
