import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Compass, Check, ChevronRight, Lightbulb, ArrowRight, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { personalityQuestions, majorSuggestions } from '@/data/personality'
import { universities } from '@/data/universities'
import BlurReveal from '@/components/BlurReveal'

export default function MajorAdvicePage() {
  const [step, setStep] = useState<'quiz' | 'results'>('quiz')
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [currentQ, setCurrentQ] = useState(0)

  const question = personalityQuestions[currentQ]

  const handleAnswer = (optionIdx: number) => {
    setAnswers({ ...answers, [question.id]: optionIdx })
    if (currentQ < personalityQuestions.length - 1) {
      setTimeout(() => setCurrentQ(currentQ + 1), 300)
    } else {
      setTimeout(() => setStep('results'), 500)
    }
  }

  const getTopCategories = () => {
    const scores: Record<string, number> = {}
    Object.entries(answers).forEach(([qId, oIdx]) => {
      const q = personalityQuestions.find((q) => q.id === qId)
      if (!q) return
      q.options[oIdx].scores.forEach((s) => {
        scores[s.category] = (scores[s.category] || 0) + s.score
      })
    })
    return Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat)
  }

  const topCategories = getTopCategories()

  const suggestedMajors = topCategories.flatMap((cat) => {
    const suggestion = majorSuggestions.find((m) => m.category === cat)
    if (!suggestion) return []
    const matchingSchools = universities
      .map((u) => ({
        ...u,
        matchedMajors: u.majors.filter((m) =>
          suggestion.examples.some((e) => m.name.includes(e.name))
        ).slice(0, 2),
      }))
      .filter((u) => u.matchedMajors.length > 0)
      .slice(0, 2)
    return [{ ...suggestion, schools: matchingSchools }]
  })

  const restart = () => {
    setStep('quiz')
    setAnswers({})
    setCurrentQ(0)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <BlurReveal as="div" className="mb-10 text-center" duration={700}>
        <div className="inline-flex items-center gap-2 bg-gold-500/15 text-gold-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" /> Tư vấn bằng AI
        </div>
        <h1 className="font-display text-4xl font-bold text-navy-800 mb-3">Tư vấn ngành học</h1>
        <p className="text-slate-600 text-lg max-w-xl mx-auto">
          Trả lời 6 câu hỏi ngắn để nhận gợi ý ngành học và trường phù hợp nhất với tính cách và khả năng của bạn.
        </p>
      </BlurReveal>

      {step === 'quiz' && (
        <>
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-slate-500 mb-2">
              <span>Câu {currentQ + 1} / {personalityQuestions.length}</span>
              <span>{Math.round(((currentQ + 1) / personalityQuestions.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold-500 rounded-full transition-all duration-500"
                style={{ width: `${((currentQ + 1) / personalityQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question card */}
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-10 text-center">
              <div className="w-16 h-16 bg-navy-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Compass className="w-8 h-8 text-gold-400" />
              </div>
              <h2 className="font-display text-2xl font-semibold text-navy-800 mb-8">
                {question.text}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {question.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 hover:border-gold-400 hover:bg-gold-50 ${
                      answers[question.id] === i
                        ? 'border-gold-500 bg-gold-50'
                        : 'border-cream-200 bg-white'
                    }`}
                  >
                    <span className="text-sm font-medium text-navy-800">{opt.text}</span>
                    {answers[question.id] === i && (
                      <Check className="w-4 h-4 text-gold-600 mt-2 float-right" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skip */}
          <div className="text-center mt-6">
            <button onClick={() => setStep('results')} className="text-sm text-slate-400 hover:text-slate-600">
              Bỏ qua và xem kết quả
            </button>
          </div>
        </>
      )}

      {step === 'results' && (
        <>
          {/* Personality summary */}
          <Card className="mb-8 bg-navy-800 border-navy-800 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gold-500/20 rounded-xl flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-gold-400" />
                </div>
                <div>
                  <p className="text-cream-200 text-sm">Phong cách nổi bật của bạn</p>
                  <h3 className="font-display text-2xl font-bold text-cream-50">
                    {topCategories.map((cat) => {
                      const s = majorSuggestions.find((m) => m.category === cat)
                      return s?.label
                    }).join(' • ')}
                  </h3>
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
                {topCategories.map((cat) => (
                  <Badge key={cat} variant="gold">{majorSuggestions.find((m) => m.category === cat)?.label}</Badge>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-navy-700 flex gap-4">
                <Button variant="primary" onClick={restart}>
                  Làm lại bài trắc nghiệm
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Major suggestions */}
          <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-navy-800 text-center mb-6">
              Gợi ý ngành học phù hợp
            </h2>

            {suggestedMajors.map((suggestion) => (
              <Card key={suggestion.category}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="gold" className="mb-2">{suggestion.label}</Badge>
                      <CardTitle>{suggestion.label}</CardTitle>
                    </div>
                    <div className="w-10 h-10 bg-cream-100 rounded-xl flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-navy-700" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm mb-6">{suggestion.description}</p>

                  <div className="mb-4">
                    <p className="text-sm font-semibold text-navy-800 mb-3">Ngành cụ thể:</p>
                    <div className="space-y-2">
                      {suggestion.examples.map((ex) => (
                        <div key={ex.name} className="flex items-center justify-between p-3 bg-cream-50 rounded-xl">
                          <span className="text-sm font-medium text-navy-800">{ex.name}</span>
                          <span className="text-sm text-slate-500">từ {ex.minScore} điểm</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {suggestion.schools.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-navy-800 mb-3 mt-4">Trường phù hợp:</p>
                      <div className="space-y-2">
                        {suggestion.schools.map((school) => (
                          <Link
                            key={school.id}
                            to={`/truong/${school.id}`}
                            className="flex items-center justify-between p-3 border border-cream-200 rounded-xl hover:border-gold-400/40 transition-colors"
                          >
                            <span className="text-sm font-medium text-navy-800">{school.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">
                                {school.matchedMajors.map((m) => m.score).join(', ')} điểm
                              </span>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12 max-w-2xl mx-auto">
            <p className="text-slate-600 mb-4">
              Muốn so sánh chính xác hơn với điểm thi thật của bạn?
            </p>
            <Link to="/so-sanh">
              <Button variant="secondary" className="gap-2">
                So sánh điểm thi ngay <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}