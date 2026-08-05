import { useState } from 'react'
import { Settings, Users, BarChart3, Shield, Bell, Check, X, AlertTriangle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Tabs } from '@/components/ui/Tabs'
import { SystemStats } from '@/types'
import BlurReveal from '@/components/BlurReveal'

const stats: SystemStats = {
  totalStudents: 12450,
  totalUniversities: 465,
  totalConsultations: 2890,
  totalPosts: 1240,
}

const pendingAdvisors = [
  { id: '1', name: 'TS. Lê Minh Tuấn', university: 'ĐH Bách khoa Hà Nội', email: 'tuan.lmt@hust.edu.vn', submittedAt: '2026-07-10' },
  { id: '2', name: 'ThS. Trần Thu Hà', university: 'ĐH Ngoại thương', email: 'ha.tt@ftu.edu.vn', submittedAt: '2026-07-12' },
  { id: '3', name: 'PGS.TS. Hoàng Lan Chi', university: 'ĐH Y Hà Nội', email: 'chi.hlc@hmu.edu.vn', submittedAt: '2026-07-14' },
]

const flaggedPosts = [
  { id: '1', title: 'Bán đề thi đại học 2025 giá rẻ', author: 'user123', reason: 'Spam / Quảng cáo', date: '2026-07-15' },
  { id: '2', title: 'Tuyển sinh lớp học thêm không phép', author: 'user456', reason: 'Vi phạm quy định tuyển sinh', date: '2026-07-14' },
]

const academicYears = ['2025-2026', '2024-2025', '2023-2024']

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [advisorList, setAdvisorList] = useState(pendingAdvisors)
  const [ocrKey, setOcrKey] = useState('')

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'advisors', label: 'Tư vấn viên', icon: <Shield className="w-4 h-4" /> },
    { id: 'moderation', label: 'Kiểm duyệt', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'settings', label: 'Cài đặt', icon: <Settings className="w-4 h-4" /> },
  ]

  const approveAdvisor = (id: string) => {
    setAdvisorList(advisorList.filter((a) => a.id !== id))
  }

  const rejectAdvisor = (id: string) => {
    setAdvisorList(advisorList.filter((a) => a.id !== id))
  }

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Admin header */}
      <header className="bg-navy-900 text-cream-100 py-6 px-8">
        <BlurReveal as="div" className="max-w-7xl mx-auto flex items-center justify-between" duration={700}>
          <div>
            <h1 className="font-display text-2xl font-bold">Bảng điều khiển quản trị</h1>
            <p className="text-cream-200 text-sm mt-1">Hệ thống quản lý Hướng Nghiệp</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-cream-200 hover:text-cream-50 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <Avatar name="Admin" size="md" />
          </div>
        </BlurReveal>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} className="mb-8" />

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Tổng học sinh', value: stats.totalStudents.toLocaleString(), icon: Users, color: 'bg-navy-800' },
                { label: 'Trường đại học', value: stats.totalUniversities.toString(), icon: TrendingUp, color: 'bg-gold-500' },
                { label: 'Lượt tư vấn', value: stats.totalConsultations.toLocaleString(), icon: BarChart3, color: 'bg-green-500' },
                { label: 'Bài viết forum', value: stats.totalPosts.toString(), icon: Users, color: 'bg-purple-500' },
              ].map((stat, idx) => {
                const Icon = stat.icon
                return (
                  <BlurReveal key={stat.label} duration={500} delay={120 + idx * 100}>
                    <Card>
                      <CardContent className="p-5">
                        <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="font-display text-3xl font-bold text-navy-800">{stat.value}</p>
                        <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                      </CardContent>
                    </Card>
                  </BlurReveal>
                )
              })}
            </div>

            {/* Recent activity */}
            <BlurReveal duration={600} delay={520}>
            <Card>
              <CardHeader>
                <CardTitle>Hoạt động gần đây</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { text: '150 học sinh mới đăng ký hôm nay', time: '5 phút trước', type: 'success' },
                    { text: '3 bài viết forum bị báo cáo spam', time: '1 giờ trước', type: 'warning' },
                    { text: '2 tư vấn viên mới đang chờ xác minh', time: '2 giờ trước', type: 'info' },
                    { text: 'Cập nhật 450 điểm chuẩn mới', time: '6 giờ trước', type: 'success' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-cream-50 rounded-xl">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.type === 'success' ? 'bg-green-500' :
                        item.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <p className="text-sm text-navy-800 flex-1">{item.text}</p>
                      <span className="text-xs text-slate-400">{item.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </BlurReveal>
          </div>
        )}

        {activeTab === 'advisors' && (
          <div className="space-y-6">
            <BlurReveal duration={600} delay={120}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Xác minh tư vấn viên ({advisorList.length} chờ duyệt)</CardTitle>
                  <Badge variant="warning">{advisorList.length} pending</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-cream-200">
                  {advisorList.map((adv) => (
                    <div key={adv.id} className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar name={adv.name} size="md" />
                          <div>
                            <h4 className="font-semibold text-navy-800">{adv.name}</h4>
                            <p className="text-sm text-slate-500">{adv.university}</p>
                            <p className="text-sm text-slate-400">{adv.email}</p>
                            <p className="text-xs text-slate-400 mt-1">Đăng ký: {adv.submittedAt}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="primary" onClick={() => approveAdvisor(adv.id)}>
                            <Check className="w-3 h-3" /> Phê duyệt
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => rejectAdvisor(adv.id)}>
                            <X className="w-3 h-3" /> Từ chối
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </BlurReveal>
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <BlurReveal duration={600} delay={120}>
            <Card>
              <CardHeader>
                <CardTitle>Nội dung bị báo cáo</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-cream-200">
                  {flaggedPosts.map((post) => (
                    <div key={post.id} className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="danger" size="sm" className="mb-2">{post.reason}</Badge>
                          <h4 className="font-semibold text-navy-800">{post.title}</h4>
                          <p className="text-sm text-slate-500 mt-1">Tác giả: {post.author} • {post.date}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="danger">Xóa bài</Button>
                          <Button size="sm" variant="outline">Bỏ qua</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </BlurReveal>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <BlurReveal duration={600} delay={120}>
            <Card>
              <CardHeader>
                <CardTitle>Cấu hình hệ thống</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-navy-800 mb-3">Niên khóa & Phương thức tuyển sinh</h4>
                  <div className="space-y-3">
                    {academicYears.map((year) => (
                      <div key={year} className="flex items-center justify-between p-3 bg-cream-50 rounded-xl">
                        <span className="text-sm font-medium text-navy-800">{year}</span>
                        <Badge variant="success">Đang hoạt động</Badge>
                      </div>
                    ))}
                    <Button variant="outline" size="sm">+ Thêm niên khóa mới</Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-cream-200">
                  <h4 className="font-semibold text-navy-800 mb-3">OCR API Configuration</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-slate-600 block mb-1.5">OCR Provider API Key</label>
                      <input
                        type="password"
                        value={ocrKey}
                        onChange={(e) => setOcrKey(e.target.value)}
                        placeholder="Nhập API key..."
                        className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-navy-800 focus:outline-none focus:ring-2 focus:ring-gold-400"
                      />
                    </div>
                    <Button variant="primary" size="sm">Lưu cấu hình</Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-cream-200">
                  <h4 className="font-semibold text-navy-800 mb-3">Quản lý dữ liệu</h4>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm">Import điểm chuẩn (CSV)</Button>
                    <Button variant="outline" size="sm">Export dữ liệu</Button>
                    <Button variant="outline" size="sm">Cập nhật tự động</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            </BlurReveal>
          </div>
        )}
      </div>
    </div>
  )
}