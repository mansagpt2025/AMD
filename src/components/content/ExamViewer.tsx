'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase/sf-client'
import { 
  Target, Clock, CheckCircle, XCircle, 
  ArrowRight, ArrowLeft, Loader2, AlertCircle
} from 'lucide-react'

interface ExamViewerProps {
  examContent: any
  contentId: string
  packageId: string
  userId: string
  theme: any
  onComplete: () => void
}

interface Question {
  id: string
  text: string
  options: { id: string; text: string }[]
  correctAnswer: string
  points: number
}

export default function ExamViewer({
  examContent,
  contentId,
  packageId,
  userId,
  theme,
  onComplete
}: ExamViewerProps) {
  const router = useRouter()
  const params = useParams()
  const supabase = createClientBrowser()
  
  const gradeSlug = params?.grade as string
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(examContent.duration_minutes * 60)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    // جلب الأسئلة (في الواقع الفعلي، ستأتي من قاعدة البيانات)
    // هنا سنستخدم بيانات وهمية للتجربة
    const mockQuestions: Question[] = Array.from({ length: 10 }, (_, i) => ({
      id: `q${i + 1}`,
      text: `سؤال ${i + 1}: ما هو حل المسألة الرياضية التالية؟`,
      options: [
        { id: 'a', text: 'الإجابة أ' },
        { id: 'b', text: 'الإجابة ب' },
        { id: 'c', text: 'الإجابة ج' },
        { id: 'd', text: 'الإجابة د' }
      ],
      correctAnswer: ['a', 'b', 'c', 'd'][Math.floor(Math.random() * 4)],
      points: 10
    }))
    setQuestions(mockQuestions)

    // البدء في العد التنازلي
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleAnswer = (questionId: string, answerId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }))
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // حساب النتيجة
      let totalScore = 0
      questions.forEach(question => {
        if (answers[question.id] === question.correctAnswer) {
          totalScore += question.points
        }
      })

      const finalScore = Math.round((totalScore / (questions.length * 10)) * 100)
      setScore(finalScore)

      // حفظ النتيجة في قاعدة البيانات
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // حفظ في exam_results
        await supabase
          .from('exam_results')
          .insert({
            user_id: user.id,
            content_id: contentId,
            score: finalScore,
            total_questions: questions.length,
            correct_answers: Object.keys(answers).filter(
              qId => answers[qId] === questions.find(q => q.id === qId)?.correctAnswer
            ).length,
            wrong_answers: Object.keys(answers).filter(
              qId => answers[qId] !== questions.find(q => q.id === qId)?.correctAnswer
            ).length
          })

        // تحديث user_progress
        const status = finalScore >= examContent.pass_score ? 'passed' : 'failed'
        await supabase
          .from('user_progress')
          .update({
            status,
            score: finalScore,
            attempts: attempts + 1,
            completed_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('lecture_content_id', contentId)

        setAttempts(prev => prev + 1)
        onComplete()
      }

      setShowResults(true)
    } catch (error) {
      console.error('Error submitting exam:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (showResults) {
    const isPassed = score >= examContent.pass_score

    return (
      <div className="p-8">
        <div className={`p-6 rounded-2xl mb-6 ${
          isPassed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        } border`}>
          <div className="flex items-center gap-3 mb-4">
            {isPassed ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
            <div>
              <h3 className="text-xl font-bold">
                {isPassed ? 'مبروك! لقد نجحت في الامتحان 🎉' : 'للأسف، لم تنجح في الامتحان 😔'}
              </h3>
              <p className="text-gray-600">درجة النجاح المطلوبة: {examContent.pass_score}%</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-white rounded-xl">
              <div className="text-3xl font-bold" style={{ color: theme.text }}>
                {score}%
              </div>
              <div className="text-sm text-gray-600">نتيجتك</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-xl">
              <div className="text-3xl font-bold" style={{ color: theme.text }}>
                {Object.keys(answers).filter(
                  qId => answers[qId] === questions.find(q => q.id === qId)?.correctAnswer
                ).length}
              </div>
              <div className="text-sm text-gray-600">إجابات صحيحة</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-xl">
              <div className="text-3xl font-bold" style={{ color: theme.text }}>
                {Object.keys(answers).filter(
                  qId => answers[qId] !== questions.find(q => q.id === qId)?.correctAnswer
                ).length}
              </div>
              <div className="text-sm text-gray-600">إجابات خاطئة</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-xl">
              <div className="text-3xl font-bold" style={{ color: theme.text }}>
                {questions.length - Object.keys(answers).length}
              </div>
              <div className="text-sm text-gray-600">غير مجاب</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/grades/${gradeSlug}/packages/${packageId}`)}
              className="px-6 py-3 rounded-lg font-medium"
              style={{ background: theme.primary, color: 'white' }}
            >
              العودة للباقة
            </button>
            
            {!isPassed && attempts < examContent.max_attempts && (
              <button
                onClick={() => setShowResults(false)}
                className="px-6 py-3 rounded-lg font-medium border"
                style={{ borderColor: theme.primary, color: theme.primary }}
              >
                المحاولة مرة أخرى
              </button>
            )}
          </div>
        </div>

        {/* Review Answers */}
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: theme.border }}>
          <h4 className="text-lg font-bold mb-4" style={{ color: theme.text }}>مراجعة الإجابات</h4>
          <div className="space-y-4">
            {questions.map((question, index) => {
              const userAnswer = answers[question.id]
              const isCorrect = userAnswer === question.correctAnswer
              
              return (
                <div key={question.id} className="p-4 rounded-lg border" style={{ 
                  borderColor: isCorrect ? theme.success : '#ef4444',
                  background: isCorrect ? `${theme.success}10` : '#fef2f2'
                }}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium mb-2">سؤال {index + 1}: {question.text}</h5>
                      <div className="space-y-2">
                        {question.options.map(option => (
                          <div
                            key={option.id}
                            className={`p-2 rounded ${
                              option.id === question.correctAnswer
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : option.id === userAnswer && !isCorrect
                                ? 'bg-red-100 text-red-700 border border-red-300'
                                : 'bg-gray-50'
                            }`}
                          >
                            {option.text}
                            {option.id === question.correctAnswer && (
                              <span className="mr-2 text-sm text-green-600">✓ الإجابة الصحيحة</span>
                            )}
                            {option.id === userAnswer && !isCorrect && (
                              <span className="mr-2 text-sm text-red-600">✗ إجابتك</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    )
  }

  const currentQ = questions[currentQuestion]

  return (
    <div className="h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: theme.border }}>
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6" style={{ color: theme.primary }} />
          <div>
            <h3 className="font-bold" style={{ color: theme.text }}>امتحان: {examContent.title}</h3>
            <p className="text-sm text-gray-600">سؤال {currentQuestion + 1} من {questions.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${
            timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
          }`}>
            <Clock className="w-4 h-4" />
            <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>

          {/* Progress */}
          <div className="text-sm text-gray-600">
            {Object.keys(answers).length}/{questions.length} مجاب
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h4 className="text-xl font-bold mb-4" style={{ color: theme.text }}>
              {currentQ.text}
            </h4>
            
            <div className="space-y-3">
              {currentQ.options.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(currentQ.id, option.id)}
                  className={`w-full text-right p-4 rounded-xl border-2 transition-all ${
                    answers[currentQ.id] === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{option.text}</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      answers[currentQ.id] === option.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {answers[currentQ.id] === option.id && (
                        <div className="w-3 h-3 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
                currentQuestion === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'text-white'
              }`}
              style={currentQuestion !== 0 ? { background: theme.primary } : {}}
            >
              <ArrowRight className="w-5 h-5" />
              السابق
            </button>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {currentQuestion + 1} / {questions.length}
              </span>
              
              {currentQuestion === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-lg font-medium text-white flex items-center gap-2"
                  style={{ background: theme.success }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري التصحيح...
                    </>
                  ) : (
                    'تسليم الإجابات'
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 rounded-lg font-medium text-white flex items-center gap-2"
                  style={{ background: theme.primary }}
                >
                  التالي
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t" style={{ borderColor: theme.border }}>
        <div className="flex flex-wrap gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                currentQuestion === index
                  ? 'bg-blue-500 text-white'
                  : answers[questions[index].id]
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}