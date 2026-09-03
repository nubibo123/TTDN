import { useState, FormEvent } from 'react'
import { X, MessageCircle, Phone, Calendar, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createConsultation } from '@/lib/consultations'

interface BookConsultationModalProps {
  advisorId?: string
  advisorName?: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function BookConsultationModal({
  advisorId,
  advisorName,
  isOpen,
  onClose,
  onSuccess,
}: BookConsultationModalProps) {
  const [mode, setMode] = useState<'CHAT' | 'SCHEDULED_CALL'>('CHAT')
  const [topic, setTopic] = useState('')
  const [message, setMessage] = useState('')
  const [scheduledTime, setScheduledTime] = useState('Chiều (14h00 - 17h00)')
  const [contactPhone, setContactPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) {
      setError('Vui lòng nhập chủ đề cần tư vấn')
      return
    }
    if (!message.trim()) {
      setError('Vui lòng nhập câu hỏi hoặc nội dung tư vấn')
      return
    }
    if (mode === 'SCHEDULED_CALL' && !contactPhone.trim()) {
      setError('Vui lòng nhập số điện thoại để tư vấn viên liên hệ')
      return
    }

    setLoading(true)
    setError('')
    try {
      await createConsultation({
        advisorId,
        topic: topic.trim(),
        message: message.trim(),
        mode,
        scheduledTime: mode === 'SCHEDULED_CALL' ? scheduledTime : undefined,
        contactPhone: mode === 'SCHEDULED_CALL' ? contactPhone.trim() : undefined,
      })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setTopic('')
        setMessage('')
        setContactPhone('')
        onSuccess?.()
        onClose()
      }, 1800)
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Không thể gửi yêu cầu tư vấn. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy-900/60 backdrop-blur-xs">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-cream-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-cream-200 bg-navy-800 text-cream-100 flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-white">Đăng ký tư vấn trực tiếp</h3>
            <p className="text-xs text-cream-200 mt-0.5">
              {advisorName ? `Tư vấn viên: ${advisorName}` : 'Được tiếp nhận bởi chuyên gia tư vấn tuyển sinh'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-cream-200 hover:text-white hover:bg-navy-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto animate-in zoom-in-75 duration-300" />
            <h4 className="font-display text-xl font-bold text-navy-800">Gửi yêu cầu thành công!</h4>
            <p className="text-sm text-slate-600">
              Yêu cầu tư vấn của bạn đã được chuyển đến tư vấn viên. Vui lòng theo dõi phản hồi trong hệ thống.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Mode Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Hình thức tư vấn
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('CHAT')}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    mode === 'CHAT'
                      ? 'border-gold-500 bg-gold-50/60 shadow-xs'
                      : 'border-cream-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <MessageCircle className={`w-5 h-5 mt-0.5 ${mode === 'CHAT' ? 'text-gold-600' : 'text-slate-400'}`} />
                  <div>
                    <p className="font-semibold text-navy-800 text-sm">Nhắn tin trực tuyến</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Trao đổi qua tin nhắn hệ thống</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('SCHEDULED_CALL')}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    mode === 'SCHEDULED_CALL'
                      ? 'border-gold-500 bg-gold-50/60 shadow-xs'
                      : 'border-cream-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Phone className={`w-5 h-5 mt-0.5 ${mode === 'SCHEDULED_CALL' ? 'text-gold-600' : 'text-slate-400'}`} />
                  <div>
                    <p className="font-semibold text-navy-800 text-sm">Cuộc gọi hẹn giờ</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Đặt lịch tư vấn qua điện thoại</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Topic Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Chủ đề tư vấn
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ví dụ: Tư vấn khả năng đậu ngành CNTT tại NEU"
                className="w-full px-4 py-2.5 rounded-xl border border-cream-200 text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
            </div>

            {/* If Scheduled Call: Time slot & Phone */}
            {mode === 'SCHEDULED_CALL' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-cream-100/70 border border-cream-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Khung giờ hẹn tư vấn
                  </label>
                  <select
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-cream-200 bg-white text-xs text-navy-800 font-medium focus:outline-none focus:ring-2 focus:ring-gold-400"
                  >
                    <option value="Sáng (8h00 - 11h30)">Sáng (8h00 - 11h30)</option>
                    <option value="Chiều (14h00 - 17h00)">Chiều (14h00 - 17h00)</option>
                    <option value="Tối (19h00 - 21h30)">Tối (19h00 - 21h30)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="098x xxx xxx"
                    className="w-full px-3 py-2 rounded-lg border border-cream-200 bg-white text-xs text-navy-800 font-medium focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                </div>
              </div>
            )}

            {/* Detailed Question Textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Nội dung câu hỏi / ghi chú
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nhập thông tin chi tiết về thắc mắc của bạn (điểm số, nguyện vọng, thông tin cần tư vấn)..."
                className="w-full px-4 py-2.5 rounded-xl border border-cream-200 text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Send className="w-4 h-4 mr-1.5" />
                )}
                {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
