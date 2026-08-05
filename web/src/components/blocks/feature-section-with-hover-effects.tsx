import { cn } from '@/lib/utils'
import {
  Upload,
  BarChart3,
  Compass,
  Users,
  type LucideIcon,
} from 'lucide-react'

interface FeatureItem {
  title: string
  description: string
  icon: LucideIcon
}

const features: FeatureItem[] = [
  {
    title: 'Nhập điểm của bạn',
    description:
      'Upload hình ảnh học bạ hoặc nhập điểm thủ công. Hệ thống tự động tính điểm trung bình.',
    icon: Upload,
  },
  {
    title: 'So sánh với điểm chuẩn',
    description:
      'Xem ngay điểm của bạn so với điểm chuẩn các trường năm trước, biết khả năng đậu.',
    icon: BarChart3,
  },
  {
    title: 'Được tư vấn ngành phù hợp',
    description:
      'Trả lời vài câu hỏi về sở thích, hệ thống gợi ý ngành học và trường phù hợp nhất.',
    icon: Compass,
  },
  {
    title: 'Tham gia cộng đồng',
    description:
      'Trao đổi với các bạn học sinh khác và nhận tư vấn từ đội ngũ cố vấn của các trường.',
    icon: Users,
  },
]

export function FeaturesSectionWithHoverEffects() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-10 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature
          key={feature.title}
          title={feature.title}
          description={feature.description}
          icon={feature.icon}
          index={index}
        />
      ))}
    </div>
  )
}

const Feature = ({
  title,
  description,
  icon: Icon,
  index,
}: {
  title: string
  description: string
  icon: LucideIcon
  index: number
}) => {
  return (
    <div
      className={cn(
        'flex flex-col lg:border-r border-cream-200 py-10 relative group/feature',
        (index === 0 || index === 4) && 'lg:border-l border-cream-200',
        index < 4 && 'lg:border-b border-cream-200'
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-cream-200 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-cream-200 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-gold-600">
        <Icon className="w-7 h-7" strokeWidth={2} />
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-cream-200 group-hover/feature:bg-gold-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-navy-800" style={{ fontStyle: 'normal' }}>
          {title}
        </span>
      </div>
      <p className="text-sm text-slate-600 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  )
}
