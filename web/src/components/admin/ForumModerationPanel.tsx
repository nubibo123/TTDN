import { getAdminForumPosts, moderateAdminComment, deleteAdminForumPost } from '@/lib/admin'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { useEffect, useRef, useState } from 'react'
import { forumThreadService, type ForumThread, type ModerationResult } from '@/lib/forumThreadService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const labels = { allow: 'Hợp lệ', off_topic: 'Lạc chủ đề', spam: 'Quảng cáo / spam', abusive: 'Xúc phạm', needs_review: 'Cần kiểm tra thủ công' }

export function ForumModerationPanel({ onChanged, comments = false }: { onChanged?: () => void; comments?: boolean }) {
  const itemName = comments ? 'bình luận' : 'bài viết'
  const deleteLabel = comments ? 'Xóa bình luận' : 'Xóa bài'
  const loadItems = async (): Promise<ForumThread[]> => comments
    ? (await getAdminForumPosts()).filter(post => !post.isDeleted).map(post => ({
        id: post.id, authorId: post.authorId, authorName: post.authorName ?? undefined,
        title: post.threadTitle || 'Bình luận diễn đàn', content: post.content,
        categoryId: '', categoryName: 'Bình luận', createdAt: post.createdAt,
      }))
    : forumThreadService.getAllThreads()
  const toast = useToast()
  const [action, setAction] = useState<{ thread: ForumThread; ban: boolean } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const deletingRef = useRef(false)
  const [threads, setThreads] = useState<ForumThread[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const running = useRef(false)
  const cancelled = useRef(false)
  const mounted = useRef(true)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [stopped, setStopped] = useState(false)
  const [results, setResults] = useState<Record<string, ModerationResult>>({})

  const reload = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await loadItems()
      setThreads([...data].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')))
      setResults({})
      setProgress({ done: 0, total: 0 })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được bài viết.')
    } finally { setLoading(false) }
  }
  useEffect(() => {
    mounted.current = true
    void reload()
    return () => { mounted.current = false; cancelled.current = true }
  }, [])

  const checkAll = async () => {
    if (running.current) return
    running.current = true
    cancelled.current = false
    setScanning(true)
    setStopped(false)
    setError('')
    setResults({})
    setProgress({ done: 0, total: 0 })
    try {
      // Refresh the complete list so recently created posts are included in this run.
      const data = await loadItems()
      if (!mounted.current || cancelled.current) return
      const all = [...data].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      setThreads(all)
      const ids = all.flatMap(thread => thread.id ? [thread.id] : [])
      setProgress({ done: 0, total: ids.length })
      for (const id of ids) {
        if (cancelled.current || !mounted.current) break
        setBusy(id)
        let result: ModerationResult
        try {
          result = await (comments ? moderateAdminComment(id) : forumThreadService.moderateThread(id))
        } catch (e) {
          result = { label: 'needs_review', reason: e instanceof Error ? e.message : 'Không kiểm tra được AI.', model: '' }
        }
        if (!mounted.current) break
        setResults(previous => ({ ...previous, [id]: result }))
        setProgress(previous => ({ ...previous, done: previous.done + 1 }))
      }
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'Không tải được danh sách bài viết.')
    } finally {
      running.current = false
      if (mounted.current) {
        setBusy(null)
        setScanning(false)
        setStopped(cancelled.current)
      }
    }
  }

  const stop = () => {
    cancelled.current = true
    setStopped(true)
  }

  const confirmDelete = async () => {
    if (!action?.thread.id || deletingRef.current) return
    deletingRef.current = true
    setDeleting(true)
    const { thread, ban } = action
    const id = thread.id!
    try {
      await (comments ? deleteAdminForumPost(id, ban) : forumThreadService.deleteThread(id, ban))
      setThreads(previous => previous.filter(item => item.id !== id))
      setResults(previous => { const next = { ...previous }; delete next[id]; return next })
      setAction(null)
      toast.success(`Đã xóa ${itemName}${ban ? ' và khóa tài khoản' : ''}`, thread.title)
      onChanged?.()
    } catch (e) {
      toast.error('Thao tác thất bại', e instanceof Error ? e.message : 'Vui lòng thử lại.')
    } finally {
      deletingRef.current = false
      setDeleting(false)
    }
  }

  return <Card>
    <CardHeader>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle>Kiểm duyệt AI {itemName} cộng đồng</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="navy">{threads.length} {itemName}</Badge>
          <Button size="sm" disabled={loading || scanning || action !== null || threads.length === 0} onClick={checkAll}>
            {scanning ? 'Đang kiểm tra…' : 'Kiểm tra toàn bộ'}
          </Button>
          {scanning && <Button size="sm" variant="outline" disabled={stopped} onClick={stop}>{stopped ? 'Đang dừng…' : 'Dừng'}</Button>}
          <Button size="sm" variant="outline" disabled={loading || scanning || action !== null} onClick={reload}>Làm mới</Button>
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-500">Kiểm tra toàn bộ {itemName} để xem phân loại và lý do. Kết quả là gợi ý, không tự ẩn hoặc xóa bài và không lưu sau khi rời trang.</p>
    </CardHeader>
    <CardContent>
      {(scanning || progress.total > 0) && <div role="status" className="mb-4 space-y-2 text-sm text-slate-600">
        <p>{scanning ? (stopped ? 'Đang chờ bài hiện tại hoàn tất' : 'Đang kiểm tra') : stopped ? 'Đã dừng' : 'Đã kiểm tra'}: {progress.done}/{progress.total} {itemName}</p>
        {progress.total > 0 && <progress className="w-full" value={progress.done} max={progress.total} aria-label="Tiến độ kiểm duyệt" />}
        <p>Hợp lệ: {Object.values(results).filter(r => r.label === 'allow').length} · Có dấu hiệu vi phạm: {Object.values(results).filter(r => ['off_topic', 'spam', 'abusive'].includes(r.label)).length} · Cần kiểm tra thủ công: {Object.values(results).filter(r => r.label === 'needs_review').length}</p>
      </div>}
      {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
      {loading ? <p role="status">Đang tải {itemName}…</p> : threads.length === 0 ? <p>Chưa có {itemName}.</p> :
        <div className="divide-y divide-cream-200">
          {threads.map(thread => {
            const result = thread.id ? results[thread.id] : undefined
            return <article key={thread.id} className="space-y-3 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-navy-800">{thread.title}</h4>
                  <p className="text-xs text-slate-500">{thread.authorName || 'Ẩn danh'} · {thread.categoryName}</p>
                </div>
                {busy === thread.id && <Badge variant="navy">Đang kiểm tra…</Badge>}
                {scanning && busy !== thread.id && !result && <Badge variant="default">Đang chờ</Badge>}
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-600">{thread.content}</p>
              {result && <div aria-live="polite" className="rounded-xl bg-cream-50 p-3">
                <Badge variant={result.label === 'allow' ? 'success' : result.label === 'needs_review' ? 'default' : 'danger'}>{labels[result.label]}</Badge>
                <p className="mt-2 text-sm text-slate-600">{result.reason}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="danger" disabled={scanning || deleting} onClick={() => setAction({ thread, ban: false })}>{deleteLabel}</Button>
                  <Button size="sm" variant="outline" disabled={scanning || deleting || !thread.authorId} onClick={() => setAction({ thread, ban: true })}>{deleteLabel} & khóa tài khoản</Button>
                </div>
              </div>}
            </article>
          })}
        </div>}
    </CardContent>
    <ConfirmDialog
      open={action !== null}
      title={`${deleteLabel}${action?.ban ? ' & khóa tài khoản' : ''}`}
      message={`${comments ? `Xóa bình luận của ${action?.thread.authorName || 'tác giả'} trong bài "${action?.thread.title ?? ''}"?` : `Xóa vĩnh viễn bài "${action?.thread.title ?? ''}" và các bình luận, lượt thích của bài?`}${action?.ban ? ` Tài khoản ${action.thread.authorName || action.thread.authorId} cũng sẽ bị khóa, không thể đăng nhập hoặc tiếp tục sử dụng phiên đăng nhập hiện tại.` : ''}`}
      confirmLabel={`${deleteLabel}${action?.ban ? ' & khóa tài khoản' : ''}`}
      busy={deleting}
      onConfirm={confirmDelete}
      onClose={() => { if (!deletingRef.current) setAction(null) }}
    />
  </Card>
}
