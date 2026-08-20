import { useState, useEffect, type FormEvent, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Pin, MessageCircle, Eye, Clock, ChevronRight, Plus, Loader2, Heart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import BlurReveal from '@/components/BlurReveal'
import { useAuth } from '@/lib/authContext'
import {
  getForumCategories,
  getForumThreads,
  createForumThread,
  toggleThreadLike,
  formatForumDate,
  type ForumCategory,
  type ForumThreadDto,
} from '@/lib/forum'

export default function ForumPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [threads, setThreads] = useState<ForumThreadDto[]>([])
  const [loading, setLoading] = useState(true)

  const [showNewThread, setShowNewThread] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [likePendingId, setLikePendingId] = useState<string | null>(null)

  useEffect(() => {
    getForumCategories()
      .then((list) => setCategories(list))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    getForumThreads()
      .then((list) => {
        if (active) setThreads(list)
      })
      .catch(() => {
        if (active) setThreads([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const openNewThread = () => {
    if (!user) {
      navigate('/dang-nhap')
      return
    }
    setFormError('')
    setShowNewThread(true)
  }

  const handleCreateThread = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!formTitle.trim() || !formCategory || !formContent.trim()) {
      setFormError('Vui lòng điền đầy đủ tiêu đề, chủ đề và nội dung')
      return
    }
    setSubmitting(true)
    try {
      const created = await createForumThread({
        categoryId: formCategory,
        title: formTitle.trim(),
        content: formContent.trim(),
      })
      setShowNewThread(false)
      navigate(`/cong-dong/${created.id}`)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (thread: ForumThreadDto, e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate('/dang-nhap')
      return
    }
    if (likePendingId === thread.id) return
    setLikePendingId(thread.id)
    try {
      const res = await toggleThreadLike(thread.id)
      setThreads((prev) =>
        prev.map((t) =>
          t.id === thread.id ? { ...t, likedByMe: res.liked, likesCount: res.likesCount } : t
        )
      )
    } catch {
      // silent
    } finally {
      setLikePendingId(null)
    }
  }

  const activeCategory = categories.find((c) => c.id === activeCategoryId) ?? null

  const filteredThreads = threads.filter((t) => {
    const matchCat = !activeCategoryId || t.categoryId === activeCategoryId
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const pinnedThreads = filteredThreads.filter((t) => t.isPinned)
  const regularThreads = filteredThreads.filter((t) => !t.isPinned)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <BlurReveal as="div" className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8" duration={700}>
        <div>
          <h1 className="font-display text-4xl font-bold text-navy-800 mb-2">Cộng đồng tuyển sinh</h1>
          <p className="text-slate-600">Thảo luận với học sinh khác và nhận tư vấn từ đội ngũ chuyên gia</p>
        </div>
        <Button variant="primary" onClick={openNewThread}>
          <Plus className="w-4 h-4" /> Đăng bài mới
        </Button>
      </BlurReveal>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <Card className="sticky top-24">
            <CardContent className="p-4">
              <h3 className="font-semibold text-navy-800 mb-3 text-sm">Chủ đề</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveCategoryId(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeCategoryId === null
                      ? 'bg-navy-800 text-cream-100 font-medium'
                      : 'text-slate-600 hover:bg-cream-100'
                  }`}
                >
                  Tất cả
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeCategoryId === cat.id
                        ? 'bg-navy-800 text-cream-100 font-medium'
                        : 'text-slate-600 hover:bg-cream-100'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main */}
        <div className="flex-1">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-cream-200 bg-white text-navy-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-gold-500" />
              <p className="text-sm">Đang tải bài viết...</p>
            </div>
          ) : (
            <>
              {pinnedThreads.length > 0 && (
                <div className="mb-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    <Pin className="w-3 h-3" /> Ghim
                  </div>
                  {pinnedThreads.map((thread, idx) => (
                    <BlurReveal key={thread.id} duration={500} delay={idx * 60}>
                      <ThreadCard
                        thread={thread}
                        likedByMe={thread.likedByMe}
                        likePending={likePendingId === thread.id}
                        onLike={(e) => handleLike(thread, e)}
                      />
                    </BlurReveal>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {regularThreads.map((thread, idx) => (
                  <BlurReveal key={thread.id} duration={500} delay={Math.min(idx, 6) * 50}>
                    <ThreadCard
                      thread={thread}
                      likedByMe={thread.likedByMe}
                      likePending={likePendingId === thread.id}
                      onLike={(e) => handleLike(thread, e)}
                    />
                  </BlurReveal>
                ))}
              </div>

              {filteredThreads.length === 0 && (
                <div className="text-center py-16">
                  <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">
                    {activeCategory
                      ? `Chưa có bài viết nào trong chủ đề "${activeCategory.name}".`
                      : 'Chưa có bài viết nào. Hãy là người đầu tiên đăng bài!'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* New thread modal */}
      {showNewThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-900/60" onClick={() => setShowNewThread(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-cream-200 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-navy-800">Đăng bài mới</h3>
              <button onClick={() => setShowNewThread(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateThread} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{formError}</div>
              )}
              <div>
                <label className="text-sm font-medium text-navy-800 block mb-1.5">Tiêu đề</label>
                <input
                  type="text"
                  placeholder="Nhập tiêu đề bài viết..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-gold-400 text-navy-800"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-navy-800 block mb-1.5">Chủ đề</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-gold-400 text-navy-800"
                >
                  <option value="">Chọn chủ đề...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-navy-800 block mb-1.5">Nội dung</label>
                <textarea
                  rows={5}
                  placeholder="Viết nội dung bài viết..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-gold-400 text-navy-800 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowNewThread(false)}>Hủy</Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Đang đăng...' : 'Đăng bài'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function ThreadCard({
  thread,
  likedByMe,
  likePending,
  onLike,
}: {
  thread: ForumThreadDto
  likedByMe: boolean
  likePending: boolean
  onLike: (e: MouseEvent) => void
}) {
  return (
    <Link to={`/cong-dong/${thread.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <Avatar name={thread.authorName || 'A'} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge variant={thread.isPinned ? 'gold' : 'default'} size="sm">
                  {thread.isPinned && <Pin className="w-3 h-3 mr-1" />}
                  {thread.categoryName || 'Chung'}
                </Badge>
                {thread.isAdvicer && (
                  <Badge variant="navy" size="sm">Tư vấn viên</Badge>
                )}
              </div>
              <h3 className="font-semibold text-navy-800 mb-1 group-hover:text-gold-600 transition-colors line-clamp-2">
                {thread.title}
              </h3>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="font-medium text-slate-600">{thread.authorName || 'Ẩn danh'}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatForumDate(thread.createdAt)}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{thread.replyCount}</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{thread.viewsCount}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <button
                type="button"
                disabled={likePending}
                onClick={onLike}
                aria-label="Thả tim"
                className={`inline-flex items-center gap-1.5 text-sm font-semibold rounded-full px-3 py-1.5 border transition-all ${
                  likedByMe
                    ? 'text-red-500 border-red-200 bg-red-50'
                    : 'text-slate-400 border-slate-200 hover:text-red-500 hover:border-red-200 hover:bg-red-50'
                } ${likePending ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Heart className={`w-4 h-4 ${likedByMe ? 'fill-current' : ''}`} />
                {thread.likesCount}
              </button>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
