import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Pin, MessageCircle, Eye, Clock, ChevronRight, Plus, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { forumThreads, forumCategories } from '@/data/forum'
import BlurReveal from '@/components/BlurReveal'

export default function ForumPage() {
  const [activeCategory, setActiveCategory] = useState('Tất cả')
  const [search, setSearch] = useState('')
  const [showNewThread, setShowNewThread] = useState(false)

  const filteredThreads = forumThreads.filter((t) => {
    const matchCat = activeCategory === 'Tất cả' || t.category === activeCategory
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
        <Button variant="primary" onClick={() => setShowNewThread(true)}>
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
                {forumCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeCategory === cat
                        ? 'bg-navy-800 text-cream-100 font-medium'
                        : 'text-slate-600 hover:bg-cream-100'
                    }`}
                  >
                    {cat}
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

          {/* Pinned threads */}
          {pinnedThreads.length > 0 && (
            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                <Pin className="w-3 h-3" /> Ghim
              </div>
              {pinnedThreads.map((thread, idx) => (
                <BlurReveal key={thread.id} duration={500} delay={idx * 60}>
                  <ThreadCard thread={thread} />
                </BlurReveal>
              ))}
            </div>
          )}

          {/* Regular threads */}
          <div className="space-y-3">
            {regularThreads.map((thread, idx) => (
              <BlurReveal key={thread.id} duration={500} delay={Math.min(idx, 6) * 50}>
                <ThreadCard thread={thread} />
              </BlurReveal>
            ))}
          </div>

          {filteredThreads.length === 0 && (
            <div className="text-center py-16">
              <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Không có bài viết nào trong chủ đề này.</p>
            </div>
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
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-navy-800 block mb-1.5">Tiêu đề</label>
                <input
                  type="text"
                  placeholder="Nhập tiêu đề bài viết..."
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-navy-800 block mb-1.5">Chủ đề</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-gold-400">
                  {forumCategories.filter((c) => c !== 'Tất cả').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-navy-800 block mb-1.5">Nội dung</label>
                <textarea
                  rows={5}
                  placeholder="Viết nội dung bài viết..."
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowNewThread(false)}>Hủy</Button>
                <Button variant="primary" onClick={() => setShowNewThread(false)}>Đăng bài</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ThreadCard({ thread }: { thread: typeof forumThreads[0] }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar src={thread.avatar} name={thread.author} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant={thread.isPinned ? 'gold' : 'default'} size="sm">
                {thread.isPinned && <Pin className="w-3 h-3 mr-1" />}
                {thread.category}
              </Badge>
              {thread.isAdvicer && (
                <Badge variant="navy" size="sm">Tư vấn viên</Badge>
              )}
            </div>
            <h3 className="font-semibold text-navy-800 mb-1 hover:text-gold-600 cursor-pointer transition-colors line-clamp-2">
              {thread.title}
            </h3>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="font-medium text-slate-600">{thread.author}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{thread.lastReply}</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{thread.replies}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{thread.views}</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  )
}