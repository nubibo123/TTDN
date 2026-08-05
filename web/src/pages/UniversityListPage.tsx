import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Globe, X, ChevronRight, MapPin,
  SlidersHorizontal, ChevronDown, GraduationCap
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getUniversities, getMajors, type University, type Major } from '@/lib/universities'
import { cn } from '@/lib/utils'
import BlurReveal from '@/components/BlurReveal'

const POPULAR_SUBJECT_GROUPS = ['A00', 'A01', 'B00', 'C00', 'D01', 'D07']

const POPULAR_MAJORS = [
  'Công nghệ thông tin',
  'Quản trị kinh doanh',
  'Kế toán',
  'Ngôn ngữ Anh',
  'Luật',
  'Y khoa',
  'Tài chính - Ngân hàng',
  'Thương mại điện tử',
  'Kinh doanh quốc tế',
  'Marketing'
]

function UniversityCardSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="mb-4 space-y-2">
          <div className="skeleton h-5 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-3 w-full mt-2" />
          <div className="skeleton h-3 w-5/6" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-cream-200">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function UniversityListPage() {
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [type, setType] = useState('')
  const [unis, setUnis] = useState<University[]>([])
  const [allMajors, setAllMajors] = useState<Major[]>([])
  const [loading, setLoading] = useState(true)

  // Advanced filters state
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedSubjectGroups, setSelectedSubjectGroups] = useState<string[]>([])
  const [selectedMajors, setSelectedMajors] = useState<string[]>([])
  
  // Custom major input search
  const [majorSearch, setMajorMajorSearch] = useState('')
  const [showMajorSuggestions, setShowMajorSuggestions] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([getUniversities(), getMajors()])
      .then(([uList, mList]) => {
        setUnis(uList)
        setAllMajors(mList)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Dynamic lists from data
  const uniqueMajorNames = useMemo(() => {
    const names = allMajors.map(m => m.name.trim())
    const unique = Array.from(new Set(names))
    return unique.sort((a, b) => a.localeCompare(b, 'vi'))
  }, [allMajors])

  const majorSuggestions = useMemo(() => {
    if (!majorSearch) return []
    const q = majorSearch.toLowerCase()
    return uniqueMajorNames
      .filter(name => name.toLowerCase().includes(q) && !selectedMajors.includes(name))
      .slice(0, 5)
  }, [majorSearch, uniqueMajorNames, selectedMajors])

  // Filter logic
  const PAGE_SIZE = 20
  const [page, setPage] = useState(1)

  const filteredData = useMemo(() => {
    let result = unis

    // 1. Search filter (school name, school code, or its majors)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(u => {
        const nameMatch = u.name.toLowerCase().includes(q)
        const codeMatch = u.code.toLowerCase().includes(q)
        
        const schoolMajors = allMajors.filter(m => m.universityId === u.id)
        const majorMatch = schoolMajors.some(
          m => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
        )
        
        return nameMatch || codeMatch || majorMatch
      })
    }

    // 2. Region filter
    if (region) {
      result = result.filter(u => u.region === region)
    }

    // 3. Type filter
    if (type) {
      result = result.filter(u => u.type === type)
    }

    // 4. Subject Group (Khối thi) filter
    if (selectedSubjectGroups.length > 0) {
      result = result.filter(u => {
        const schoolMajors = allMajors.filter(m => m.universityId === u.id)
        return schoolMajors.some(m => {
          if (!m.subjectGroup) return false
          const groups = m.subjectGroup.split(';').map(g => g.trim())
          return selectedSubjectGroups.some(sg => groups.includes(sg))
        })
      })
    }

    // 5. Selected Majors filter
    if (selectedMajors.length > 0) {
      result = result.filter(u => {
        const schoolMajors = allMajors.filter(m => m.universityId === u.id)
        return schoolMajors.some(m => 
          selectedMajors.some(sm => m.name.toLowerCase().includes(sm.toLowerCase()))
        )
      })
    }

    return result
  }, [unis, allMajors, search, region, type, selectedSubjectGroups, selectedMajors])

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1)
  }, [search, region, type, selectedSubjectGroups, selectedMajors])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedData = useMemo(
    () => filteredData.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredData, safePage]
  )

  // Handlers
  const toggleSubjectGroup = (group: string) => {
    setSelectedSubjectGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    )
  }

  const toggleMajor = (major: string) => {
    setSelectedMajors(prev =>
      prev.includes(major) ? prev.filter(m => m !== major) : [...prev, major]
    )
  }

  const clearFilters = () => {
    setSearch('')
    setRegion('')
    setType('')
    setSelectedSubjectGroups([])
    setSelectedMajors([])
    setMajorMajorSearch('')
  }

  const totalActiveFilters = useMemo(() => {
    let count = 0
    if (region) count++
    if (type) count++
    count += selectedSubjectGroups.length
    count += selectedMajors.length
    return count
  }, [region, type, selectedSubjectGroups, selectedMajors])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <UniversityCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <BlurReveal as="div" className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8" duration={700}>
            <div>
              <h1 className="font-display text-4xl font-bold text-navy-800 mb-2">Danh sách trường đại học</h1>
              <p className="text-slate-600">
                {`${filteredData.length} trường được tìm thấy${
                  totalPages > 1 ? ` · trang ${safePage}/${totalPages}` : ''
                }`}
              </p>
            </div>
          </BlurReveal>

      {/* Main Search Input */}

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm kiếm trường, mã trường, hoặc ngành đào tạo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-cream-200 bg-white text-navy-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-all shadow-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Basic Filters & Advanced Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-navy-800 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 shadow-sm"
          >
            <option value="">Tất cả khu vực</option>
            <option value="NORTH">Miền Bắc</option>
            <option value="CENTRAL">Miền Trung</option>
            <option value="SOUTH">Miền Nam</option>
          </select>

          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-navy-800 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 shadow-sm"
          >
            <option value="">Tất cả loại hình</option>
            <option value="PUBLIC">Công lập</option>
            <option value="PRIVATE">Tư thục</option>
            <option value="NATIONAL">Quốc gia</option>
            <option value="INTERNATIONAL">Quốc tế</option>
          </select>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all shadow-sm',
              showAdvanced || selectedSubjectGroups.length > 0 || selectedMajors.length > 0
                ? 'border-gold-500 bg-gold-400/10 text-gold-600'
                : 'border-cream-200 bg-white text-slate-600 hover:bg-cream-50'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Bộ lọc nâng cao
            {totalActiveFilters > 0 && (
              <span className="flex items-center justify-center bg-gold-500 text-white rounded-full w-5 h-5 text-xs font-bold">
                {totalActiveFilters}
              </span>
            )}
            <ChevronDown className={cn('w-4 h-4 transition-transform', showAdvanced && 'rotate-180')} />
          </button>
        </div>

        {totalActiveFilters > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-slate-500 hover:text-navy-800 font-semibold underline underline-offset-4"
          >
            Xóa tất cả bộ lọc
          </button>
        )}
      </div>

      {/* Advanced Filter Panel */}
      {showAdvanced && (
        <div className="bg-white rounded-2xl border border-cream-200 p-6 mb-8 space-y-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Khối thi */}
          <div>
            <h3 className="text-sm font-bold text-navy-800 mb-3 uppercase tracking-wider">Khối thi tuyển sinh</h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SUBJECT_GROUPS.map(group => {
                const isSelected = selectedSubjectGroups.includes(group)
                return (
                  <button
                    key={group}
                    onClick={() => toggleSubjectGroup(group)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-xs font-semibold font-mono transition-all',
                      isSelected
                        ? 'border-gold-500 bg-gold-500 text-white'
                        : 'border-cream-200 bg-cream-50 text-navy-800 hover:bg-cream-100'
                    )}
                  >
                    {group}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Ngành học */}
          <div>
            <h3 className="text-sm font-bold text-navy-800 mb-3 uppercase tracking-wider">Ngành đào tạo phổ biến</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {POPULAR_MAJORS.map(major => {
                const isSelected = selectedMajors.includes(major)
                return (
                  <button
                    key={major}
                    onClick={() => toggleMajor(major)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all',
                      isSelected
                        ? 'border-gold-500 bg-gold-400/25 text-gold-600 font-bold'
                        : 'border-cream-200 bg-cream-50 text-slate-700 hover:bg-cream-100'
                    )}
                  >
                    {major}
                  </button>
                )
              })}
            </div>

            {/* Custom Major search autocomplete */}
            <div className="relative max-w-md">
              <span className="text-xs text-slate-500 block mb-2 font-medium">Tìm ngành khác không có ở trên:</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nhập tên ngành học (Kỹ thuật điện, Logistics...)"
                  value={majorSearch}
                  onChange={e => {
                    setMajorMajorSearch(e.target.value)
                    setShowMajorSuggestions(true)
                  }}
                  onFocus={() => setShowMajorSuggestions(true)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-cream-200 bg-white text-sm text-navy-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
                {majorSearch && (
                  <button
                    onClick={() => setMajorMajorSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Autocomplete suggestions */}
              {showMajorSuggestions && majorSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-cream-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  {majorSuggestions.map(name => (
                    <button
                      key={name}
                      onClick={() => {
                        toggleMajor(name)
                        setMajorMajorSearch('')
                        setShowMajorSuggestions(false)
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-navy-800 hover:bg-cream-50 transition-colors flex items-center justify-between"
                    >
                      <span>{name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active custom major chips */}
          {selectedMajors.filter(m => !POPULAR_MAJORS.includes(m)).length > 0 && (
            <div className="pt-2 border-t border-cream-100">
              <span className="text-xs text-slate-500 block mb-2 font-medium">Ngành khác đang lọc:</span>
              <div className="flex flex-wrap gap-2">
                {selectedMajors
                  .filter(m => !POPULAR_MAJORS.includes(m))
                  .map(major => (
                    <span
                      key={major}
                      className="inline-flex items-center gap-1.5 bg-gold-400/15 text-gold-600 text-xs font-semibold px-2.5 py-1 rounded-lg"
                    >
                      {major}
                      <button onClick={() => toggleMajor(major)} className="hover:text-gold-700">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main content grid */}
      {filteredData.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-cream-200 p-8 shadow-sm">
          <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg font-display">Không tìm thấy trường nào phù hợp.</p>
          <button onClick={clearFilters} className="mt-4 text-gold-600 hover:underline font-semibold text-sm">
            Xóa bọc lọc và thử lại
          </button>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pagedData.map((uni, idx) => (
            <BlurReveal key={uni.id} duration={500} delay={Math.min(idx, 8) * 70} className="h-full">
              <Link to={`/truong/${uni.id}`} className="block h-full">
                <Card className="hover:shadow-lg hover:border-gold-400/40 transition-all duration-300 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4 gap-3">
                      <div className="flex-1">
                        <h3 className="font-display text-lg font-semibold text-navy-800 leading-tight mb-1" style={{ fontStyle: 'normal' }}>
                          {uni.name}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {uni.region === 'NORTH' ? 'Miền Bắc' : uni.region === 'CENTRAL' ? 'Miền Trung' : 'Miền Nam'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {uni.type === 'PUBLIC' ? 'Công lập' : uni.type === 'PRIVATE' ? 'Tư thục' : uni.type === 'NATIONAL' ? 'Quốc gia' : 'Quốc tế'}
                          </span>
                          <span className="flex items-center gap-1 font-mono">Mã: {uni.code}</span>
                        </div>
                        {uni.address && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2">{uni.address}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-cream-200">
                      {uni.isVerified && <Badge variant="default">Đã xác minh</Badge>}
                      <div className="flex items-center gap-1 text-sm text-gold-600 font-medium">
                        Xem chi tiết <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </BlurReveal>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-1 flex-wrap">
            <button
              onClick={() => setPage(Math.max(1, safePage - 1))}
              disabled={safePage === 1}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                safePage === 1
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-navy-700 hover:bg-cream-200'
              )}
            >
              ‹ Trước
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const showPage =
                p === 1 ||
                p === totalPages ||
                Math.abs(p - safePage) <= 1
              if (!showPage) {
                const prev = p - 1
                const isEllipsisHere = !Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(0, p - 1)
                  .some((pp) => {
                    const shows =
                      pp === 1 ||
                      pp === totalPages ||
                      Math.abs(pp - safePage) <= 1
                    return shows
                  })
                if (!isEllipsisHere) return null
                return (
                  <span key={`ellipsis-${p}`} className="px-2 text-slate-400 text-sm">…</span>
                )
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'min-w-10 px-3 py-2 rounded-lg text-sm font-semibold transition-all',
                    p === safePage
                      ? 'bg-navy-800 text-cream-50 shadow'
                      : 'text-navy-700 hover:bg-cream-200'
                  )}
                >
                  {p}
                </button>
              )
            })}

            <button
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage === totalPages}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                safePage === totalPages
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-navy-700 hover:bg-cream-200'
              )}
            >
              Sau ›
            </button>
          </div>
        )}
        </>
      )}
        </>
        )}
    </div>
  )
}

