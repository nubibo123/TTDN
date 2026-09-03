import { useState, useEffect } from 'react'
import { Users, MessageCircle, Eye, BarChart3, Pin, Phone, Check, X, Clock, Loader2, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { ForumThread } from '@/types'
import BlurReveal from '@/components/BlurReveal'
import ConsultationChatModal from '@/components/ConsultationChatModal'
import {
  getAdvisorConsultations,
  updateConsultationStatus,
  type ConsultationDto,
} from '@/lib/consultations'

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
  const [requestsList, setRequestsList] = useState<ConsultationDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'all'>('pending')
  const [announcementText, setAnnouncementText] = useState('')

  // Chat modal state
  const [chatConsultationId, setChatConsultationId] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const data = await getAdvisorConsultations()
      setRequestsList(data)
      setError('')
    } catch (err: any) {
      console.warn('Could not load advisor consultations from API:', err)
      setError(err instanceof Error ? err.message : 'Không thể kết nối máy chủ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleStatusChange = async (id: string, newStatus: 'ACCEPTED' | 'REJECTED' | 'COMPLETED') => {
    try {
      const updated = await updateConsultationStatus(id, newStatus)
      setRequestsList((prev) => prev.map((r) => (r.id === id ? updated : r)))
    } catch (err: any) {
      alert(err instanceof Error ? err.message : 'Thao tác không thành công')
    }
  }

  const openChat = (id: string) => {
    setChatConsultationId(id)
    setIsChatOpen(true)
  }

  const filteredRequests = requestsList.filter((r) => {
    if (activeTab === 'pending') return r.status === 'PENDING'
    if (activeTab === 'accepted') return r.status === 'ACCEPTED'
    return true
  })

  return (
    <div className="min-h-screen bg-cream-100 pb-16">
      {/* Header */}
      <header className="bg-navy-800 text-cream-100 py-6 px-8 shadow-sm">
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
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>
                      Yêu cầu tư vấn (
                      {requestsList.filter((r) => r.status === 'PENDING').length} mới)
                    </CardTitle>
                    {/* Status Tabs */}
                    <div className="flex bg-cream-100 p-1 rounded-xl border border-cream-200 text-xs">
                      <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          activeTab === 'pending'
                            ? 'bg-navy-800 text-white shadow-xs'
                            : 'text-slate-600 hover:text-navy-800'
                        }`}
                      >
                        Chờ xử lý ({requestsList.filter((r) => r.status === 'PENDING').length})
                      </button>
                      <button
                        onClick={() => setActiveTab('accepted')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          activeTab === 'accepted'
                            ? 'bg-navy-800 text-white shadow-xs'
                            : 'text-slate-600 hover:text-navy-800'
                        }`}
                      >
                        Đã tiếp nhận ({requestsList.filter((r) => r.status === 'ACCEPTED').length})
                      </button>
                      <button
                        onClick={() => setActiveTab('all')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          activeTab === 'all'
                            ? 'bg-navy-800 text-white shadow-xs'
                            : 'text-slate-600 hover:text-navy-800'
                        }`}
                      >
                        Tất cả ({requestsList.length})
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-12 text-center text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-gold-500" />
                      <p className="text-sm">Đang tải danh sách yêu cầu...</p>
                    </div>
                  ) : filteredRequests.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                      <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-navy-800">Không có yêu cầu tư vấn nào</p>
                      <p className="text-xs text-slate-400 mt-1">Các yêu cầu gửi từ học sinh sẽ hiển thị tại đây</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-cream-200">
                      {filteredRequests.map((req) => (
                        <div key={req.id} className="p-5 hover:bg-cream-50/50 transition-colors">
                          <div className="flex items-start gap-4">
                            <Avatar name={req.studentName || 'Học sinh'} size="md" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-navy-800">
                                    {req.studentName || 'Học sinh'}
                                  </h4>
                                  {req.studentEmail && (
                                    <span className="text-xs text-slate-400 font-normal">
                                      ({req.studentEmail})
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-400">
                                  {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                              </div>

                              {/* Topic & Badges */}
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <p className="text-sm font-semibold text-gold-600">{req.topic}</p>
                                <Badge
                                  variant={req.mode === 'SCHEDULED_CALL' ? 'gold' : 'navy'}
                                  size="sm"
                                >
                                  {req.mode === 'SCHEDULED_CALL' ? (
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" /> Cuộc gọi hẹn giờ
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <MessageCircle className="w-3 h-3" /> Nhắn tin
                                    </span>
                                  )}
                                </Badge>
                              </div>

                              <p className="text-sm text-slate-600 mb-3 whitespace-pre-wrap">
                                {req.message}
                              </p>

                              {/* Scheduled call info if present */}
                              {req.mode === 'SCHEDULED_CALL' && (
                                <div className="mb-3 p-2.5 rounded-xl bg-gold-50 border border-gold-200 text-xs text-navy-800 flex items-center justify-between flex-wrap gap-2">
                                  <span className="flex items-center gap-1.5 font-medium">
                                    <Clock className="w-3.5 h-3.5 text-gold-600" />
                                    Lịch hẹn: {req.scheduledTime || 'Thỏa thuận'}
                                  </span>
                                  {req.contactPhone && (
                                    <span className="font-semibold text-gold-900">
                                      SĐT: {req.contactPhone}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {req.status === 'PENDING' ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={() => handleStatusChange(req.id, 'ACCEPTED')}
                                    >
                                      <Check className="w-3.5 h-3.5 mr-1" /> Nhận tư vấn
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStatusChange(req.id, 'REJECTED')}
                                    >
                                      <X className="w-3.5 h-3.5 mr-1" /> Từ chối
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Badge
                                      variant={
                                        req.status === 'ACCEPTED'
                                          ? 'success'
                                          : req.status === 'COMPLETED'
                                          ? 'default'
                                          : 'danger'
                                      }
                                    >
                                      {req.status === 'ACCEPTED'
                                        ? 'Đã nhận'
                                        : req.status === 'COMPLETED'
                                        ? 'Hoàn thành'
                                        : 'Đã từ chối'}
                                    </Badge>

                                    {req.status === 'ACCEPTED' && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="primary"
                                          onClick={() => openChat(req.id)}
                                          className="bg-gold-500 hover:bg-gold-600 text-white"
                                        >
                                          <MessageCircle className="w-3.5 h-3.5 mr-1" /> Mở trò chuyện
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleStatusChange(req.id, 'COMPLETED')}
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Hoàn thành
                                        </Button>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                        <Badge variant="gold" size="sm" className="mb-2">
                          {post.category}
                        </Badge>
                        <p className="text-sm font-medium text-navy-800 mb-1">{post.title}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {post.replies}
                          </span>
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

      {/* Chat modal */}
      <ConsultationChatModal
        consultationId={chatConsultationId}
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false)
          setChatConsultationId(null)
        }}
      />
    </div>
  )
}