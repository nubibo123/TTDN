import { useState } from 'react'
import { Users, MessageCircle, Eye, BarChart3, Pin, Calendar, Phone, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { ConsultationRequest, ForumThread } from '@/types'
import BlurReveal from '@/components/BlurReveal'

const requests: ConsultationRequest[] = [
  { id: '1', studentName: 'Nguyễn Văn Minh', studentAvatar: 'https://i.pravatar.cc/40?img=11', topic: 'Tư vấn ngành Kinh tế', message: 'Em muốn hỏi về khả năng đậu ngành Kinh tế học tại NEU với điểm học bạ 27.5', status: 'pending', date: '2 giờ trước' },
  { id: '2', studentName: 'Trần Thị Lan', studentAvatar: 'https://i.pravatar.cc/40?img=14', topic: 'Chọn trường Y', message: 'Điểm thi của em là 27 điểm khối B, nên chọn Y khoa hay Dược?', status: 'pending', date: '4 giờ trước' },
  { id: '3', studentName: 'Lê Hoàng Nam', studentAvatar: 'https://i.pravatar.cc/40?img=3', topic: 'Học CNTT ở UIT', message: 'Cho em hỏi về cơ hội việc làm sau khi tốt nghiệp ngành KHMT tại UIT', status: 'accepted', date: '1 ngày trước' },
]

const stats = [
  { label: 'Lượt xem trường', value: '12,450', icon: Eye, change: '+18%' },
  { label: 'Yêu cầu tư vấn', value: '24', icon: MessageCircle, change: '+5' },
  { label: 'Học sinh quan tâm', value: '3,200', icon: Users, change: '+12%' },
  { label: 'Bài đăng forum', value: '8', icon: BarChart3, change: '+2' },
]

const pinnedPosts: ForumThread[] = [
  { id: 'p1', title: 'THÔNG BÁO: Lịch tư vấn trực tiếp tháng 7/2025', author: 'Tư vấn viên NEU', avatar: '', category: 'Thông báo', replies: 12, views: 890, lastReply: '1 ngày trước', isPinned: true, isAdvicer: true },
  { id: 'p2', title: 'Cập nhật điểm chuẩn 2025 - Các ngành hot', author: 'Tư vấn viên FTU', avatar: '', category: 'Thông báo', replies: 34, views: 2100, lastReply: '2 ngày trước', isPinned: true, isAdvicer: true },
]

export default function AdvisorDashboardPage() {
  const [requestsList, setRequestsList] = useState(requests)
  const [announcementText, setAnnouncementText] = useState('')

  const acceptRequest = (id: string) => {
    setRequestsList(requestsList.map((r) => r.id === id ? { ...r, status: 'accepted' } : r))
  }

  const rejectRequest = (id: string) => {
    setRequestsList(requestsList.map((r) => r.id === id ? { ...r, status: 'completed' } : r))
  }

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Header */}
      <header className="bg-navy-800 text-cream-100 py-6 px-8">
        <BlurReveal as="div" className="max-w-7xl mx-auto flex items-center justify-between" duration={700}>
          <div>
            <h1 className="font-display text-2xl font-bold">Trang tư vấn viên</h1>
            <p className="text-cream-200 text-sm mt-1">Đại học Kinh tế Quốc dân</p>
          </div>
          <div className="flex items-center gap-3">
            <Avatar name="Tư vấn viên NEU" size="md" />
            <div>
              <p className="text-sm font-medium">TS. Nguyễn Văn A</p>
              <p className="text-xs text-cream-200">Tư vấn viên chính thức</p>
            </div>
          </div>
        </BlurReveal>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <BlurReveal key={stat.label} duration={500} delay={120 + idx * 100}>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-gold-500/15 rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-gold-600" />
                      </div>
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {stat.change}
                      </span>
                    </div>
                    <p className="font-display text-3xl font-bold text-navy-800">{stat.value}</p>
                    <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              </BlurReveal>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Consultation requests */}
          <div className="lg:col-span-2 space-y-4">
            <BlurReveal duration={600} delay={520}>
            <Card>
              <CardHeader>
                <CardTitle>Yêu cầu tư vấn ({requestsList.filter((r) => r.status === 'pending').length} mới)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-cream-200">
                  {requestsList.map((req) => (
                    <div key={req.id} className="p-5">
                      <div className="flex items-start gap-4">
                        <Avatar src={req.studentAvatar} name={req.studentName} size="md" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-navy-800">{req.studentName}</h4>
                            <span className="text-xs text-slate-400">{req.date}</span>
                          </div>
                          <p className="text-sm font-medium text-gold-600 mb-1">{req.topic}</p>
                          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{req.message}</p>
                          <div className="flex items-center gap-3">
                            {req.status === 'pending' ? (
                              <>
                                <Button size="sm" variant="primary" onClick={() => acceptRequest(req.id)}>
                                  <Check className="w-3 h-3" /> Nhận tư vấn
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => rejectRequest(req.id)}>
                                  <X className="w-3 h-3" /> Từ chối
                                </Button>
                              </>
                            ) : (
                              <Badge variant={req.status === 'accepted' ? 'success' : 'default'}>
                                {req.status === 'accepted' ? 'Đã nhận' : 'Hoàn thành'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </BlurReveal>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pinned announcements */}
            <BlurReveal duration={600} delay={620}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Pin className="w-4 h-4 text-gold-600" />
                  <CardTitle>Bài đã ghim</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-cream-200">
                  {pinnedPosts.map((post) => (
                    <div key={post.id} className="p-4">
                      <Badge variant="gold" size="sm" className="mb-2">{post.category}</Badge>
                      <p className="text-sm font-medium text-navy-800 mb-1">{post.title}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.replies}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4">
                  <Button variant="outline" className="w-full" size="sm">
                    <Pin className="w-3 h-3" /> Ghim bài mới
                  </Button>
                </div>
              </CardContent>
            </Card>
            </BlurReveal>

            {/* Quick announcement */}
            <BlurReveal duration={600} delay={720}>
            <Card>
              <CardHeader>
                <CardTitle>Đăng thông báo nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Nhập nội dung thông báo..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none text-sm"
                />
                <Button variant="primary" className="w-full" size="sm">
                  <Pin className="w-3 h-3" /> Đăng lên forum
                </Button>
              </CardContent>
            </Card>
            </BlurReveal>
          </div>
        </div>
      </div>
    </div>
  )
}