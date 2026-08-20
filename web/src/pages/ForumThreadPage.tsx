import { useState, useEffect, type FormEvent } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  MessageCircle,
  Eye,
  Clock,
  Pin,
  Heart,
  Reply,
  Send,
  Loader2,
  Lock,
  ChevronLeft,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import BlurReveal from '@/components/BlurReveal'
import { useAuth } from '@/lib/authContext'
import {
  getForumThread,
  getForumPosts,
  registerForumView,
  toggleThreadLike,
  createForumPost,
  toggleLike,
  formatForumDate,
  type ForumThreadDto,
  type ForumPostDto,
} from '@/lib/forum'

const viewedThreadIds = new Set<string>()

export default function ForumThreadPage() {
  const { threadId = '' } = useParams<{ threadId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [thread, setThread] = useState<ForumThreadDto | null>(null)
  const [posts, setPosts] = useState<ForumPostDto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [replyContent, setReplyContent] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [replyError, setReplyError] = useState('')
  const [likeId, setLikeId] = useState<string | null>(null)
  const [threadLikePending, setThreadLikePending] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    Promise.all([getForumThread(threadId), getForumPosts(threadId)])
      .then(([t, p]) => {
        if (!active) return
        setThread(t)
        setPosts(p)
      })
      .catch((err) => {
        if (active) setLoadError(err instanceof Error ? err.message : 'Không thể tải bài viết')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    if (!viewedThreadIds.has(threadId)) {
      viewedThreadIds.add(threadId)
      registerForumView(threadId)
        .then((t) => {
          if (active) setThread((prev) => (prev && prev.id === t.id ? t : prev))
        })
        .catch(() => {
          viewedThreadIds.delete(threadId)
        })
    }
    return () => {
      active = false
    }
  }, [threadId])

  const handleThreadLike = async () => {
    if (!thread) return
    if (!user) {
      navigate('/dang-nhap')
      return
    }
    if (threadLikePending) return
    setThreadLikePending(true)
    try {
      const res = await toggleThreadLike(thread.id)
      setThread((prev) => (prev ? { ...prev, likedByMe: res.liked, likesCount: res.likesCount } : prev))
    } catch {
      // silent
    } finally {
      setThreadLikePending(false)
    }
  }

  const handleLike = async (post: ForumPostDto) => {
    if (!user) {
      navigate('/dang-nhap')
      return
    }
    setLikeId(post.id)
    try {
      const res = await toggleLike(post.id)
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, likedByMe: res.liked, likesCount: res.likesCount } : p))
      )
    } catch {
      // silent
    } finally {
      setLikeId(null)
    }
  }

  const handleReply = async (e: FormEvent) => {
    e.preventDefault()
    setReplyError('')
    if (!user) {
      navigate('/dang-nhap')
      return
    }
    if (!replyContent.trim()) {
      setReplyError('Nội dung không được để trống')
      return
    }
    setSubmitting(true)
    try {
      const created = await createForumPost({
        threadId,
        content: replyContent.trim(),
        parentId: replyTo ?? undefined,
      })
      setPosts((prev) => [...prev, created])
      setReplyContent('')
      setReplyTo(null)
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setSubmitting(false)
    }
  }

  const replyTarget = replyTo ? posts.find((p) => p.id === replyTo) : null
  const roots = posts.filter((p) => !p.parentId)
  const repliesOf = (id: string) => posts.filter((p) => p.parentId === id)

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    )
  }

  if (loadError || !thread) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 mb-6">{loadError || 'Bài viết không tồn tại'}</p>
        <Link to="/cong-dong">
          <Button variant="primary">Quay lại diễn đàn</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/cong-dong" className="inline-flex items-center gap-1.5 text-sm text-gold-600 hover:text-gold-500 font-medium mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Quay lại diễn đàn
      </Link>

      {/* Thread header */}
      <BlurReveal duration={600}>
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant={thread.isPinned ? 'gold' : 'default'} size="sm">
                {thread.isPinned && <Pin className="w-3 h-3 mr-1" />}
                {thread.categoryName || 'Chung'}
              </Badge>
              {thread.isAdvicer && <Badge variant="navy" size="sm">Tư vấn viên</Badge>}
              {thread.isLocked && (
                <Badge variant="warning" size="sm">
                  <Lock className="w-3 h-3 mr-1" /> Đã khóa
                </Badge>
              )}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-800 leading-tight">{thread.title}</h1>
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-2">
                <Avatar name={thread.authorName || 'A'} size="sm" />
                <span className="font-medium text-slate-600">{thread.authorName || 'Ẩn danh'}</span>
              </span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatForumDate(thread.createdAt)}</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{thread.replyCount} phản hồi</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{thread.viewsCount} lượt xem</span>
              <button
                type="button"
                disabled={threadLikePending}
                onClick={handleThreadLike}
                aria-label="Thả tim"
                className={`inline-flex items-center gap-1 font-semibold rounded-full px-2.5 py-1 border transition-all ${
                  thread.likedByMe
                    ? 'text-red-500 border-red-200 bg-red-50'
                    : 'text-slate-400 border-slate-200 hover:text-red-500 hover:border-red-200 hover:bg-red-50'
                } ${threadLikePending ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Heart className={`w-3.5 h-3.5 ${thread.likedByMe ? 'fill-current' : ''}`} />
                {thread.likesCount} tim
              </button>
            </div>
            <p className="mt-5 text-navy-800 leading-relaxed whitespace-pre-wrap">{thread.content}</p>
          </CardContent>
        </Card>
      </BlurReveal>

      {/* Replies */}
      <div className="space-y-4">
        {roots.length === 0 && (
          <div className="text-center py-10">
            <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Chưa có phản hồi nào. Hãy là người đầu tiên trả lời!</p>
          </div>
        )}
        {roots.map((post, idx) => (
          <BlurReveal key={post.id} duration={500} delay={idx * 60}>
            <PostCard post={post} likedByMe={post.likedByMe} likeId={likeId} onLike={() => handleLike(post)} onReply={() => setReplyTo(post.id)} />
            {repliesOf(post.id).length > 0 && (
              <div className="mt-3 ml-8 sm:ml-12 space-y-3 border-l-2 border-cream-200 pl-4">
                {repliesOf(post.id).map((r) => (
                  <PostCard key={r.id} post={r} likedByMe={r.likedByMe} likeId={likeId} onLike={() => handleLike(r)} onReply={() => setReplyTo(r.id)} compact />
                ))}
              </div>
            )}
          </BlurReveal>
        ))}
      </div>

      {/* Reply box */}
      <BlurReveal duration={600} delay={200}>
        <Card className="mt-8">
          <CardContent className="p-5">
            {thread.isLocked ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Lock className="w-4 h-4" /> Bài viết đã bị khóa bình luận.
              </div>
            ) : !user ? (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 mb-3">Bạn cần đăng nhập để tham gia thảo luận.</p>
                <Link to="/dang-nhap">
                  <Button variant="primary" size="sm">Đăng nhập</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleReply}>
                {replyTarget && (
                  <div className="mb-3 flex items-center justify-between p-2.5 rounded-xl bg-cream-100 text-sm">
                    <span className="text-slate-600">
                      Đang trả lời <span className="font-medium text-navy-800">{replyTarget.authorName || 'Ẩn danh'}</span>
                    </span>
                    <button type="button" onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-600 text-xs font-medium">
                      Hủy
                    </button>
                  </div>
                )}
                {replyError && (
                  <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{replyError}</div>
                )}
                <textarea
                  rows={4}
                  placeholder={replyTarget ? `Phản hồi ${replyTarget.authorName || 'bài viết'}...` : 'Viết phản hồi của bạn...'}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-gold-400 text-navy-800 resize-none"
                />
                <div className="flex justify-end mt-3">
                  <Button type="submit" variant="primary" disabled={submitting}>
                    <Send className="w-4 h-4" /> {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </BlurReveal>
    </div>
  )
}

function PostCard({
  post,
  likedByMe,
  likeId,
  onLike,
  onReply,
  compact = false,
}: {
  post: ForumPostDto
  likedByMe: boolean
  likeId: string | null
  onLike: () => void
  onReply: () => void
  compact?: boolean
}) {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className={`${compact ? 'p-4' : 'p-5'}`}>
        <div className="flex items-start gap-3">
          <Avatar name={post.authorName || 'A'} size={compact ? 'sm' : 'md'} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-medium text-navy-800 ${compact ? 'text-sm' : ''}`}>{post.authorName || 'Ẩn danh'}</span>
              {post.isAdvicer && <Badge variant="navy" size="sm">Tư vấn viên</Badge>}
              {post.isOfficialReply && <Badge variant="success" size="sm">Phản hồi chính thức</Badge>}
              <span className="text-xs text-slate-400 ml-auto">{formatForumDate(post.createdAt)}</span>
            </div>
            <p className="mt-2 text-navy-800 leading-relaxed whitespace-pre-wrap text-sm">{post.content}</p>
            <div className="flex items-center gap-4 mt-3">
              <button
                onClick={onLike}
                disabled={likeId === post.id}
                className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  likedByMe ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${likedByMe ? 'fill-current' : ''}`} />
                {post.likesCount}
              </button>
              <button
                onClick={onReply}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-gold-600 transition-colors"
              >
                <Reply className="w-4 h-4" /> Trả lời
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
