import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import BlurReveal from '@/components/BlurReveal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { GraduationCap, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2, Sparkles, Compass, TrendingUp, Shield, Building2, FileText } from 'lucide-react'
import { getUniversities, type University } from '@/lib/universities'
import { registerAdvisor, type RegisterAdvisorRequest } from '@/lib/admin'

type Mode = 'login' | 'register' | 'advisor'

export default function LoginPage({ initialMode = 'login' }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { login, register, loading } = useAuth()
  const navigate = useNavigate()

  const [universities, setUniversities] = useState<University[]>([])
  const [universityId, setUniversityId] = useState('')
  const [universitySearch, setUniversitySearch] = useState('')
  const [universityOpen, setUniversityOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')

  const universityRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getUniversities().then(list => setUniversities(list)).catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (universityRef.current && !universityRef.current.contains(e.target as Node)) {
        setUniversityOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredUniversities = universities.filter(u =>
    u.name.toLowerCase().includes(universitySearch.toLowerCase())
  )
  const selectedUniversity = universities.find(u => u.id === universityId)

  const passwordStrength = (() => {
    if (!password) return 0
    let s = 0
    if (password.length >= 6) s++
    if (password.length >= 10) s++
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++
    if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) s++
    return s
  })()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      if (mode === 'login') {
        await login(email, password)
        navigate('/')
      } else if (mode === 'register') {
        await register(name, email, password)
        navigate('/')
      } else {
        if (!universityId) {
          setError('Vui lòng chọn trường đại học')
          return
        }
        const data: RegisterAdvisorRequest = { name, email, password, universityId, title, bio }
        const res = await registerAdvisor(data)
        setSuccess(`Đăng ký tư vấn viên thành công! Vui lòng đăng nhập.`)
        setName('')
        setEmail('')
        setPassword('')
        setUniversityId('')
        setUniversitySearch('')
        setTitle('')
        setBio('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    }
  }

  const [animState, setAnimState] = useState<'idle' | 'exit' | 'enter'>('idle')
  const [displayMode, setDisplayMode] = useState<Mode>(mode)
  const prevMode = useRef(mode)

  const switchMode = (m: Mode) => {
    if (m === displayMode || animState !== 'idle') return
    const goingRight = m === 'register' || m === 'advisor'
    prevMode.current = displayMode
    setAnimState('exit')
    setTimeout(() => {
      setDisplayMode(m)
      setMode(m)
      setError('')
      setSuccess('')
      setAnimState('enter')
      setTimeout(() => setAnimState('idle'), 220)
    }, 180)
  }

  const slideStyle = (() => {
    const goingRight = mode === 'register' || mode === 'advisor'
    if (animState === 'exit') return { opacity: 0, transform: `translateX(${goingRight ? '32px' : '-32px'})`, transition: 'opacity 180ms ease, transform 180ms ease' }
    if (animState === 'enter') return { opacity: 0, transform: `translateX(${goingRight ? '-32px' : '32px'})`, transition: 'none' }
    return { opacity: 1, transform: 'translateX(0)', transition: 'opacity 220ms ease, transform 220ms ease' }
  })()

  const features = [
    { icon: Compass, title: 'Tư vấn ngành phù hợp', desc: 'AI phân tích điểm thi & sở thích' },
    { icon: TrendingUp, title: 'Dự đoán khả năng đậu', desc: 'Dữ liệu điểm chuẩn 3 năm gần nhất' },
    { icon: Sparkles, title: 'Cá nhân hoá lộ trình', desc: 'Lộ trình ưu tiên theo 5 khối thi' },
  ]

  const isAdvisorMode = mode === 'advisor'
  const toggleModes: Mode[] = ['login', 'register', 'advisor']
  const toggleIndex = toggleModes.indexOf(mode)
  const toggleCount = toggleModes.length
  const toggleWidth = `calc(${(100 / toggleCount).toFixed(3)}% - ${(8 / toggleCount).toFixed(3)}px)`
  const toggleLeft = `calc(${((100 / toggleCount) * toggleIndex).toFixed(3)}% + ${(4 - (8 / toggleCount) * toggleIndex).toFixed(3)}px)`

  return (
    <div className="min-h-screen flex bg-cream-100">
      {/* Left: brand panel */}
      <aside className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-navy-900">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 20% 10%, rgba(46,64,112,0.55) 0%, transparent 60%), radial-gradient(100% 60% at 80% 100%, rgba(212,175,108,0.18) 0%, transparent 50%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-cream-100 w-full">
          <BlurReveal duration={700}>
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <span className="w-10 h-10 rounded-xl bg-gold-500 flex items-center justify-center group-hover:rotate-3 transition-transform duration-300">
                <GraduationCap className="w-5 h-5 text-navy-900" strokeWidth={2.4} />
              </span>
              <span className="font-display text-xl font-semibold tracking-tight">
                Admit<span className="text-gold-400">Consult</span>
              </span>
            </Link>
          </BlurReveal>

          <div className="max-w-md">
            <BlurReveal duration={800} delay={120}>
              <h1 className="font-display text-4xl xl:text-5xl font-semibold leading-[1.1] tracking-tight">
                Lộ trình tuyển sinh
                <br />
                <span className="text-gold-400">minh bạch</span>
                <br />
                cho từng thí sinh.
              </h1>
            </BlurReveal>
            <BlurReveal duration={700} delay={260}>
              <p className="mt-5 text-cream-200/80 text-[15px] leading-relaxed">
                Nhập điểm, chọn khối, nhận danh sách trường & ngành có khả năng
                trúng tuyển — không phải đoán mò.
              </p>
            </BlurReveal>

            <ul className="mt-10 space-y-5">
              {features.map((f, i) => (
                <BlurReveal key={f.title} duration={600} delay={380 + i * 90}>
                  <li className="flex items-start gap-3.5">
                    <span className="mt-0.5 w-9 h-9 shrink-0 rounded-lg bg-navy-700/60 border border-navy-600/60 flex items-center justify-center">
                      <f.icon className="w-4 h-4 text-gold-400" strokeWidth={2} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-cream-50">{f.title}</p>
                      <p className="text-xs text-cream-200/60 mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </li>
                </BlurReveal>
              ))}
            </ul>
          </div>

          <BlurReveal duration={700} delay={700}>
            <div className="flex items-center gap-8 pt-8 border-t border-navy-700/60">
              {[
                { value: '300+', label: 'trường ĐH-CĐ' },
                { value: '5', label: 'khối thi' },
                { value: '3 năm', label: 'điểm chuẩn' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-display text-2xl font-semibold text-gold-400">{s.value}</p>
                  <p className="text-[11px] uppercase tracking-wider text-cream-200/50 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </BlurReveal>
        </div>
      </aside>

      {/* Right: form panel */}
      <main className="flex-1 flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <BlurReveal duration={700}>
            <div className="lg:hidden mb-8 flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-xl bg-navy-800 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-gold-400" strokeWidth={2.4} />
              </span>
              <span className="font-display text-xl font-semibold text-navy-800">
                Admit<span className="text-gold-600">Consult</span>
              </span>
            </div>

            {/* Mode toggle */}
            <div className="inline-flex p-1 bg-cream-200 rounded-xl mb-8 relative">
              <span
                aria-hidden
                className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm transition-all duration-250 ease-in-out"
                style={{ width: toggleWidth, left: toggleLeft }}
              />
              {(['login', 'register', 'advisor'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`relative z-10 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-200 ${
                    mode === m ? 'text-navy-800' : 'text-slate-500 hover:text-navy-800'
                  }`}
                >
                  {m === 'login' ? 'Đăng nhập' : m === 'register' ? 'Đăng ký' : 'Tư vấn viên'}
                </button>
              ))}
            </div>

            <div style={slideStyle}>
              <h2 className="font-display text-3xl font-semibold text-navy-800 tracking-tight">
                {isAdvisorMode ? 'Đăng ký tư vấn viên' : mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {isAdvisorMode
                  ? 'Tham gia mạng lưới tư vấn viên của chúng tôi.'
                  : mode === 'login'
                    ? 'Đăng nhập để tiếp tục lộ trình tư vấn của bạn.'
                    : 'Bắt đầu tư vấn tuyển sinh trong chưa đầy 1 phút.'}
              </p>

              {error && (
                <div className="mt-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mt-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                {isAdvisorMode && (
                  <>
                    <div className="relative">
                      <Input
                        label="Họ và tên"
                        type="text"
                        placeholder="TS. Nguyễn Văn A"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        autoComplete="name"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute right-4 top-[42px] pointer-events-none" />
                    </div>

                    <div className="relative">
                      <Input
                        label="Email"
                        type="email"
                        placeholder="***@university.edu.vn"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-[42px] pointer-events-none" />
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-navy-800 mb-1.5">Trường đại học</label>
                      <div ref={universityRef} className="relative">
                        <div className="rounded-xl border border-cream-200 bg-white focus-within:ring-2 focus-within:ring-gold-400">
                          <input
                            type="text"
                            value={selectedUniversity ? selectedUniversity.name : universitySearch}
                            onChange={(e) => {
                              setUniversityId('')
                              setUniversitySearch(e.target.value)
                              setUniversityOpen(true)
                            }}
                            onFocus={() => setUniversityOpen(true)}
                            placeholder="Nhập tên trường để tìm..."
                            className="w-full px-4 py-2.5 text-navy-800 text-sm bg-transparent placeholder:text-slate-400 focus:outline-none"
                          />
                        </div>
                        <Building2 className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        {universityOpen && (
                          <div className="absolute z-20 mt-2 w-full max-h-60 overflow-y-auto rounded-xl border border-cream-200 bg-white shadow-lg">
                            {filteredUniversities.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-slate-500">Không tìm thấy trường phù hợp</div>
                            ) : (
                              filteredUniversities.map((u) => (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => {
                                    setUniversityId(u.id)
                                    setUniversitySearch('')
                                    setUniversityOpen(false)
                                  }}
                                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-cream-100 transition-colors ${
                                    u.id === universityId ? 'bg-cream-100 font-medium text-navy-800' : 'text-slate-700'
                                  }`}
                                >
                                  {u.name}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <Input
                        label="Chức danh"
                        type="text"
                        placeholder="VD: Giảng viên Kinh tế"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                      <Shield className="w-4 h-4 text-slate-400 absolute right-4 top-[42px] pointer-events-none" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-navy-800 mb-1.5">Giới thiệu</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Kinh nghiệm, chuyên môn..."
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-navy-800 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm resize-none"
                      />
                    </div>

                    <div>
                      <div className="relative">
                        <Input
                          label="Mật khẩu"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Tối thiểu 6 ký tự"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-4 top-[40px] text-slate-400 hover:text-navy-700 transition-colors"
                          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showPassword ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 0 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                          )}
                        </button>
                      </div>
                      {password && (
                        <div className="mt-2 flex items-center gap-1.5">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                                passwordStrength >= i
                                  ? passwordStrength === 1
                                    ? 'bg-red-400'
                                    : passwordStrength === 2
                                      ? 'bg-amber-400'
                                      : passwordStrength === 3
                                        ? 'bg-lime-500'
                                        : 'bg-green-500'
                                  : 'bg-cream-200'
                              }`}
                            />
                          ))}
                          <span className="text-[11px] text-slate-400 w-16 text-right">
                            {['', 'Yếu', 'Trung bình', 'Tốt', 'Mạnh'][passwordStrength]}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {mode === 'register' && !isAdvisorMode && (
                  <div className="relative">
                    <Input
                      label="Họ và tên"
                      type="text"
                      placeholder="Nguyễn Văn Mười"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute right-4 top-[42px] pointer-events-none" />
                  </div>
                )}

                {!isAdvisorMode && (
                  <div className="relative">
                    <Input
                      label="Email"
                      type="email"
                      placeholder="***@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-[42px] pointer-events-none" />
                  </div>
                )}

                {!isAdvisorMode && (
                  <div>
                    <div className="relative">
                      <Input
                        label="Mật khẩu"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={mode === 'login' ? '••••••••' : 'Tối thiểu 6 ký tự'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-4 top-[40px] text-slate-400 hover:text-navy-700 transition-colors"
                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPassword ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 0 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>

                    {mode === 'register' && password && (
                      <div className="mt-2 flex items-center gap-1.5">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                              passwordStrength >= i
                                ? passwordStrength === 1
                                  ? 'bg-red-400'
                                  : passwordStrength === 2
                                    ? 'bg-amber-400'
                                    : passwordStrength === 3
                                      ? 'bg-lime-500'
                                      : 'bg-green-500'
                                : 'bg-cream-200'
                            }`}
                          />
                        ))}
                        <span className="text-[11px] text-slate-400 w-16 text-right">
                          {['', 'Yếu', 'Trung bình', 'Tốt', 'Mạnh'][passwordStrength]}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {mode === 'login' && !isAdvisorMode && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-cream-200 text-gold-500 focus:ring-gold-400"
                      />
                      Ghi nhớ đăng nhập
                    </label>
                    <button type="button" className="text-gold-600 hover:text-gold-500 font-medium transition-colors">
                      Quên mật khẩu?
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                  className="w-full mt-2"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang xử lý…
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      {isAdvisorMode ? 'Đăng ký tư vấn viên' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>

              {mode === 'register' && !isAdvisorMode && (
                <p className="mt-5 text-xs text-slate-500 leading-relaxed">
                  Bằng việc đăng ký, bạn đồng ý với{' '}
                  <span className="text-navy-700 font-medium underline decoration-cream-200 underline-offset-2 hover:decoration-gold-400">
                    Điều khoản dịch vụ
                  </span>{' '}
                  và{' '}
                  <span className="text-navy-700 font-medium underline decoration-cream-200 underline-offset-2 hover:decoration-gold-400">
                    Chính sách bảo mật
                  </span>
                  .
                </p>
              )}

              <p className="mt-6 text-center text-sm text-slate-600">
                {isAdvisorMode ? 'Đã có tài khoản?' : mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
                <button
                  onClick={() => switchMode(isAdvisorMode ? 'login' : mode === 'login' ? 'register' : 'login')}
                  className="text-gold-600 hover:text-gold-500 font-semibold transition-colors"
                >
                  {isAdvisorMode ? 'Đăng nhập' : mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
                </button>
              </p>

              {isAdvisorMode && (
                <p className="mt-4 text-center text-xs text-slate-500">
                  Bạn đã là tư vấn viên?{' '}
                  <button
                    onClick={() => switchMode('login')}
                    className="text-gold-600 hover:text-gold-500 font-semibold transition-colors"
                  >
                    Đăng nhập
                  </button>
                </p>
              )}
            </div>
          </BlurReveal>
        </div>
      </main>
    </div>
  )
}
