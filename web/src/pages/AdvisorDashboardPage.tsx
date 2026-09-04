import { useState, useEffect, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  MessageCircle,
  Eye,
  BarChart3,
  Pin,
  Phone,
  Check,
  X,
  Clock,
  Loader2,
  CheckCircle2,
  Send,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import BlurReveal from '@/components/BlurReveal'
import ConsultationChatModal from '@/components/ConsultationChatModal'
import { useAuth } from '@/lib/authContext'
import { getMyAdvisorProfile, type AdvisorDto } from '@/lib/advisor'
import {
  getAdvisorConsultations,
  updateConsultationStatus,
  type ConsultationDto,
} from '@/lib/consultations'
import {
  getForumThreads,
  getForumCategories,
  createForumThread,
  type ForumThreadDto,
  type ForumCategory,
  formatForumDate,
} from '@/lib/forum'

export default function AdvisorDashboardPage() {
  const { user } = useAuth()

  // Dynamic state
  const [advisorProfile, setAdvisorProfile] = useState<AdvisorDto | null>(null)
  const [requestsList, setRequestsList] = useState<ConsultationDto[]>([])
  const [forumThreads, setForumThreads] = useState<ForumThreadDto[]>([])
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'all'>('pending')

  // Quick announcement state
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementContent, setAnnouncementContent] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isPinnedAnnouncement, setIsPinnedAnnouncement] = useState(true)
  const [postingAnnouncement, setPostingAnnouncement] = useState(false)
  const [announcementMsg, setAnnouncementMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Chat modal state
  const [chatConsultationId, setChatConsultationId] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [profileData, requestsData, threadsData, categoriesData] = await Promise.allSettled([
        getMyAdvisorProfile(),
        getAdvisorConsultations(),
        getForumThreads(),
        getForumCategories(),
      ])

      if (profileData.status === 'fulfilled' && profileData.value) {
        setAdvisorProfile(profileData.value)
      }
      if (requestsData.status === 'fulfilled') {
        setRequestsList(requestsData.value || [])
      }
      if (threadsData.status === 'fulfilled') {
        setForumThreads(threadsData.value || [])
      }
      if (categoriesData.status === 'fulfilled' && categoriesData.value) {
        setCategories(categoriesData.value)
        if (categoriesData.value.length > 0) {
          setSelectedCategory(categoriesData.value[0].id)
        }
      }
      setError('')
    } catch (err: any) {
      console.warn('Could not load advisor dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Không thể kết nối máy chủ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleStatusChange = async (id: string, newStatus: 'ACCEPTED' | 'REJECTED' | 'COMPLETED') => {
    try {
      const updated = await updateConsultationStatus(id, newStatus)
      setRequestsList((prev) => prev.map((r) => (r.id === id ? updated : r)))
    } catch (err: any) {
      alert(err instanceof Error ? err.message : 'Thao tác không thành công')
    }
  }

  const handlePostAnnouncement = async (e: FormEvent) => {
    e.preventDefault()
    if (!announcementTitle.trim()) {
      setAnnouncementMsg({ type: 'error', text: 'Vui lòng nhập tiêu đề thông báo' })
      return
    }
    if (!announcementContent.trim()) {
      setAnnouncementMsg({ type: 'error', text: 'Vui lòng nhập nội dung thông báo' })
      return
    }
    if (!selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0].id)
    }

    setPostingAnnouncement(true)
    setAnnouncementMsg(null)
    try {
      const catId = selectedCategory || (categories[0]?.id ?? '')
      const newThread = await createForumThread({
        categoryId: catId,
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
        isPinned: isPinnedAnnouncement,
      })

      setForumThreads((prev) => [newThread, ...prev])
      setAnnouncementTitle('')
      setAnnouncementContent('')
      setAnnouncementMsg({ type: 'success', text: 'Đã đăng thông báo lên forum!' })
      setTimeout(() => setAnnouncementMsg(null), 3000)
    } catch (err: any) {
      setAnnouncementMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi khi đăng thông báo',
      })
    } finally {
      setPostingAnnouncement(false)
    }
  }

  const openChat = (id: string) => {
    setChatConsultationId(id)
    setIsChatOpen(true)
  }

  // Dynamic calculations
  const pendingRequests = requestsList.filter((r) => r.status === 'PENDING')
  const acceptedRequests = requestsList.filter((r) => r.status === 'ACCEPTED')
  const completedRequests = requestsList.filter((r) => r.status === 'COMPLETED')
  const uniqueStudentsCount = new Set(requestsList.map((r) => r.studentId).filter(Boolean)).size

  const filteredRequests = requestsList.filter((r) => {
    if (activeTab === 'pending') return r.status === 'PENDING'
    if (activeTab === 'accepted') return r.status === 'ACCEPTED'
    return true
  })

  // Filter pinned or advisor announcement posts
  const pinnedPosts = forumThreads.filter((t) => t.isPinned || t.isAdvicer).slice(0, 5)
  const displayPosts = pinnedPosts.length > 0 ? pinnedPosts : forumThreads.slice(0, 5)

  // Advisor display values
  const displayName = advisorProfile?.name || user?.name || 'Tư vấn viên'
  const displayUniversity = advisorProfile?.universityName || 'Cố vấn tuyển sinh'
  const displayTitle = advisorProfile?.title || 'Tư vấn viên chính thức'
  const isVerified = advisorProfile?.verified ?? false

  const stats = [
    {
      label: 'Yêu cầu tư vấn',
      value: requestsList.length.toString(),
      icon: MessageCircle,
      change: `${pendingRequests.length} mới`,
      isPositive: pendingRequests.length > 0,
    },
    {
      label: 'Đã tiếp nhận & hoàn thành',
      value: (acceptedRequests.length + completedRequests.length).toString(),
      icon: CheckCircle2,
      change: `+${completedRequests.length} xong`,
      isPositive: true,
    },
    {
      label: 'Học sinh kết nối',
      value: uniqueStudentsCount.toString(),
      icon: Users,
      change: `${uniqueStudentsCount} em`,
      isPositive: true,
    },
    {
      label: 'Bài thảo luận Forum',
      value: forumThreads.length.toString(),
      icon: BarChart3,
      change: `${forumThreads.filter((t) => t.isAdvicer).length} bài tư vấn`,
      isPositive: true,
    },
  ]

  return (
    <div className="min-h-screen bg-cream-100 pb-16">
      {/* Header */}
      <header className="bg-navy-800 text-cream-100 py-6 px-8 shadow-sm">
        <BlurReveal as="div" className="max-w-7xl mx-auto flex items-center justify-between" duration={700}>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold">Trang tư vấn viên</h1>
              {isVerified && (
                <Badge variant="gold" size="sm" className="hidden sm:inline-flex">
                  <Sparkles className="w-3 h-3 mr-1" /> Verified Advisor
                </Badge>
              )}
            </div>
            <p className="text-cream-200 text-sm mt-1">{displayUniversity}</p>
          </div>
          <div className="flex items-center gap-3">
            <Avatar name={displayName} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white">{displayName}</p>
                <Badge variant={isVerified ? 'success' : 'warning'} size="sm">
                  {isVerified ? 'Đã xác minh' : 'Chờ xác minh'}
                </Badge>
              </div>
              <p className="text-xs text-cream-200">{displayTitle}</p>
            </div>
          </div>
        </BlurReveal>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dynamic Stats Grid */}
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
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          stat.isPositive
                            ? 'text-green-600 bg-green-50'
                            : 'text-slate-500 bg-slate-100'
                        }`}
                      >
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
          {/* Consultation requests list */}
          <div className="lg:col-span-2 space-y-4">
            <BlurReveal duration={600} delay={520}>
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>
                      Yêu cầu tư vấn ({pendingRequests.length} mới)
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
                        Chờ xử lý ({pendingRequests.length})
                      </button>
                      <button
                        onClick={() => setActiveTab('accepted')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          activeTab === 'accepted'
                            ? 'bg-navy-800 text-white shadow-xs'
                            : 'text-slate-600 hover:text-navy-800'
                        }`}
                      >
                        Đã tiếp nhận ({acceptedRequests.length})
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
            {/* Pinned / Announcement posts */}
            <BlurReveal duration={600} delay={620}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pin className="w-4 h-4 text-gold-600" />
                      <CardTitle>Bài viết & Thông báo</CardTitle>
                    </div>
                    <Link to="/cong-dong" className="text-xs font-semibold text-gold-600 hover:underline">
                      Xem tất cả
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {displayPosts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Chưa có thông báo nào được ghim.
                    </div>
                  ) : (
                    <div className="divide-y divide-cream-200">
                      {displayPosts.map((post) => (
                        <div key={post.id} className="p-4 hover:bg-cream-50/60 transition-colors">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <Badge variant={post.isPinned ? 'gold' : 'navy'} size="sm">
                              {post.categoryName || 'Thông báo'}
                            </Badge>
                            {post.isPinned && (
                              <span className="text-[11px] font-medium text-gold-700 bg-gold-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Pin className="w-3 h-3 text-gold-600" /> Đã ghim
                              </span>
                            )}
                          </div>
                          <Link
                            to={`/cong-dong/${post.id}`}
                            className="text-sm font-semibold text-navy-800 hover:text-gold-600 transition-colors line-clamp-2 block mb-1"
                          >
                            {post.title}
                          </Link>
                          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                            <span className="truncate max-w-[120px]">
                              {post.authorName || 'Tư vấn viên'}
                            </span>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {post.viewsCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                {post.replyCount}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </BlurReveal>

            {/* Quick announcement form */}
            <BlurReveal duration={600} delay={720}>
              <Card>
                <CardHeader>
                  <CardTitle>Đăng thông báo nhanh</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePostAnnouncement} className="space-y-3">
                    {announcementMsg && (
                      <div
                        className={`p-2.5 rounded-xl text-xs font-medium ${
                          announcementMsg.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {announcementMsg.text}
                      </div>
                    )}

                    {categories.length > 0 && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Chuyên mục
                        </label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-cream-200 bg-white text-xs text-navy-800 focus:outline-none focus:ring-2 focus:ring-gold-400"
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Tiêu đề thông báo
                      </label>
                      <input
                        type="text"
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                        placeholder="VD: THÔNG BÁO: Lịch tư vấn trực tiếp tuần này"
                        className="w-full px-3.5 py-2 rounded-xl border border-cream-200 text-xs text-navy-800 focus:outline-none focus:ring-2 focus:ring-gold-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Nội dung thông báo
                      </label>
                      <textarea
                        value={announcementContent}
                        onChange={(e) => setAnnouncementContent(e.target.value)}
                        placeholder="Nhập chi tiết nội dung thông báo cho học sinh..."
                        rows={3}
                        className="w-full px-3.5 py-2 rounded-xl border border-cream-200 text-xs text-navy-800 focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="pinCheck"
                        checked={isPinnedAnnouncement}
                        onChange={(e) => setIsPinnedAnnouncement(e.target.checked)}
                        className="rounded text-gold-600 focus:ring-gold-400 accent-gold-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <label htmlFor="pinCheck" className="text-xs font-medium text-navy-800 cursor-pointer flex items-center gap-1">
                        <Pin className="w-3 h-3 text-gold-600" /> Ghim bài viết này lên đầu
                      </label>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full mt-2"
                      size="sm"
                      disabled={postingAnnouncement}
                    >
                      {postingAnnouncement ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang đăng...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5" /> Đăng lên forum
                        </span>
                      )}
                    </Button>
                  </form>
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