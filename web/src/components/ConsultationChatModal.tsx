import { useState, useEffect, useRef, FormEvent } from 'react'
import { X, Send, Loader2, MessageCircle, Phone, Clock, User, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/lib/authContext'
import {
  getConsultationById,
  getConsultationMessages,
  sendConsultationMessage,
  type ConsultationDto,
  type ConsultationMessageDto,
} from '@/lib/consultations'

interface ConsultationChatModalProps {
  consultationId: string | null
  isOpen: boolean
  onClose: () => void
}

export default function ConsultationChatModal({
  consultationId,
  isOpen,
  onClose,
}: ConsultationChatModalProps) {
  const { user } = useAuth()
  const [consultation, setConsultation] = useState<ConsultationDto | null>(null)
  const [messages, setMessages] = useState<ConsultationMessageDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inputContent, setInputContent] = useState('')
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChat = async () => {
    if (!consultationId) return
    try {
      const [c, msgs] = await Promise.all([
        getConsultationById(consultationId),
        getConsultationMessages(consultationId),
      ])
      setConsultation(c)
      setMessages(msgs)
      setError('')
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Không thể tải tin nhắn tư vấn')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && consultationId) {
      setLoading(true)
      loadChat()
      const interval = setInterval(loadChat, 3000)
      return () => clearInterval(interval)
    }
  }, [isOpen, consultationId])

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!consultationId || !inputContent.trim()) return
    setSending(true)
    try {
      const sent = await sendConsultationMessage(consultationId, inputContent.trim())
      setMessages((prev) => [...prev, sent])
      setInputContent('')
      setTimeout(scrollToBottom, 100)
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Không thể gửi tin nhắn')
    } finally {
      setSending(false)
    }
  }

  if (!isOpen || !consultationId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy-900/60 backdrop-blur-xs">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden border border-cream-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-cream-200 bg-navy-800 text-cream-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gold-500/20 rounded-xl flex items-center justify-center text-gold-400 shrink-0">
              {consultation?.mode === 'SCHEDULED_CALL' ? (
                <Phone className="w-5 h-5" />
              ) : (
                <MessageCircle className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-white truncate text-base">
                  {consultation?.topic || 'Tư vấn trực tiếp'}
                </h3>
                <Badge
                  variant={
                    consultation?.status === 'ACCEPTED'
                      ? 'success'
                      : consultation?.status === 'COMPLETED'
                      ? 'default'
                      : 'warning'
                  }
                  size="sm"
                >
                  {consultation?.status === 'ACCEPTED'
                    ? 'Đã tiếp nhận'
                    : consultation?.status === 'COMPLETED'
                    ? 'Hoàn thành'
                    : 'Chờ xử lý'}
                </Badge>
                {consultation?.mode === 'SCHEDULED_CALL' && (
                  <Badge variant="gold" size="sm">
                    Cuộc gọi hẹn giờ
                  </Badge>
                )}
              </div>
              <p className="text-xs text-cream-200 truncate mt-0.5">
                Học sinh: {consultation?.studentName || 'Học sinh'} • Tư vấn viên:{' '}
                {consultation?.advisorName || 'Tư vấn viên'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-cream-200 hover:text-white hover:bg-navy-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Call Info Banner (if mode is SCHEDULED_CALL) */}
        {consultation?.mode === 'SCHEDULED_CALL' && (
          <div className="bg-gold-50 border-b border-gold-200 p-3 px-5 text-xs text-gold-900 flex items-center justify-between flex-wrap gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold-600 shrink-0" />
              <span>
                <strong>Thời gian hẹn:</strong> {consultation.scheduledTime || 'Thỏa thuận trực tiếp'}
              </span>
            </div>
            {consultation.contactPhone && (
              <div className="flex items-center gap-2 font-medium">
                <Phone className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                <span>SĐT liên hệ: {consultation.contactPhone}</span>
              </div>
            )}
          </div>
        )}

        {/* Message body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-cream-50/50 space-y-4">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-gold-500 mr-2" />
              <span>Đang tải đoạn hội thoại...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
              {error}
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
              <MessageCircle className="w-12 h-12 text-slate-300 mb-2" />
              <p className="font-medium text-navy-800">Chưa có tin nhắn nào</p>
              <p className="text-xs text-slate-500 mt-1">Gửi tin nhắn đầu tiên để bắt đầu trao đổi</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.userId
              const isAdvisor = msg.senderRole === 'ADVISOR'

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar name={msg.senderName || (isAdvisor ? 'Advisor' : 'Student')} size="sm" />
                  <div
                    className={`max-w-[78%] rounded-2xl p-3.5 text-sm shadow-xs ${
                      isMe
                        ? 'bg-navy-800 text-white rounded-tr-none'
                        : isAdvisor
                        ? 'bg-white border border-gold-300 text-navy-900 rounded-tl-none'
                        : 'bg-white border border-cream-200 text-navy-900 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-xs opacity-90">
                        {msg.senderName || (isAdvisor ? 'Tư vấn viên' : 'Học sinh')}
                      </span>
                      {isAdvisor && (
                        <span className="text-[10px] bg-gold-500/20 text-gold-700 px-1.5 py-0.2 rounded font-medium border border-gold-300/40">
                          Tư vấn viên
                        </span>
                      )}
                      <span className="text-[10px] opacity-60 ml-auto">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer Input Box */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-cream-200 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <textarea
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e)
                }
              }}
              placeholder="Nhập nội dung trao đổi..."
              rows={1}
              className="flex-1 px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-gold-400 text-navy-800 text-sm resize-none max-h-24"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={sending || !inputContent.trim()}
              className="px-4 py-2.5 shrink-0"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Gửi</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
