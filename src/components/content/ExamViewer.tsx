'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Target, Clock, CheckCircle, XCircle, AlertCircle,
  Trophy, ArrowRight, ArrowLeft, Loader2, RefreshCw
} from 'lucide-react'
import styles from './ExamViewer.module.css'

interface ExamViewerProps {
  examContent: any
  contentId: string
  packageId: string
  userId: string
  theme: any
  onComplete: () => void
}

interface Question {
  id: number
  text: string
  options: { id: string; text: string }[]
  correctAnswer: string
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
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)

  // إنشاء أسئلة تجريبية إذا لم توجد في examContent
  useEffect(() => {
    const generateQuestions = () => {
      const qs: Question[] = []
      const count = examContent?.total_questions || 5
      
      for (let i = 1; i <= count; i++) {
        qs.push({
          id: i,
          text: examContent?.questions?.[i-1] || `السؤال ${i}: ما هو الإجابة الصحيحة لهذا السؤال الرياضي؟`,
          options: [
            { id: 'A', text: 'الإجابة أ - هذا النص هو مثال للإجابة الأولى' },
            { id: 'B', text: 'الإجابة ب - هذا النص هو مثال للإجابة الثانية' },
            { id: 'C', text: 'الإجابة ج - هذا النص هو مثال للإجابة الثالثة' },
            { id: 'D', text: 'الإجابة د - هذا النجابة هو مثال للإجابة الرابعة' }
          ],
          correctAnswer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]
        })
      }
      return qs
    }

    setQuestions(generateQuestions())
    setTimeLeft((examContent?.duration_minutes || 10) * 60)
    setLoading(false)
  }, [examContent])

  // العد التنازلي
  useEffect(() => {
    if (showResults || loading) return
    
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
  }, [showResults, loading])

  const handleAnswer = (questionId: number, answerId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // حساب النتيجة
    let correctCount = 0
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correctCount++
    })
    
    const finalScore = Math.round((correctCount / questions.length) * 100)
    setScore(finalScore)
    setShowResults(true)
    setIsSubmitting(false)
    
    // استدعاء الدالة الخارجية
    if (finalScore >= (examContent?.pass_score || 50)) {
      onComplete()
    }

    // حفظ في قاعدة البيانات
    try {
      const supabase = require('@/lib/supabase/sf2-client').createClientBrowser()
      await supabase.from('exam_results').insert({
        user_id: userId,
        content_id: contentId,
        score: finalScore,
        total_questions: questions.length,
        correct_answers: correctCount,
        wrong_answers: questions.length - correctCount
      })
    } catch (err) {
      console.error('Error saving exam results:', err)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} style={{ color: theme.primary }} />
        <p>جاري تحميل الامتحان...</p>
      </div>
    )
  }

  if (showResults) {
    const passed = score >= (examContent?.pass_score || 50)
    return (
      <div className={styles.resultsContainer}>
        <div className={`${styles.resultCard} ${passed ? styles.passed : styles.failed}`}>
          <div className={styles.resultIcon}>
            {passed ? <Trophy size={64} color="#10b981" /> : <AlertCircle size={64} color="#ef4444" />}
          </div>
          
          <h2>{passed ? 'مبروك! لقد نجحت' : 'للأسف، لم تنجح'}</h2>
          <p className={styles.scoreText}>درجتك: {score}%</p>
          <p className={styles.passScoreText}>درجة النجاح المطلوبة: {examContent?.pass_score || 50}%</p>
          
          <div className={styles.stats}>
            <div className={styles.stat}>
              <CheckCircle color="#10b981" />
              <span>صحيحة: {Object.keys(answers).filter(id => answers[parseInt(id)] === questions.find(q => q.id === parseInt(id))?.correctAnswer).length}</span>
            </div>
            <div className={styles.stat}>
              <XCircle color="#ef4444" />
              <span>خاطئة: {questions.length - Object.keys(answers).filter(id => answers[parseInt(id)] === questions.find(q => q.id === parseInt(id))?.correctAnswer).length}</span>
            </div>
          </div>

          <div className={styles.resultButtons}>
            <button 
              onClick={() => router.back()} 
              className={styles.backButton}
              style={{ background: theme.primary }}
            >
              العودة للباقة
            </button>
            {!passed && (
              <button 
                onClick={() => {
                  setShowResults(false)
                  setAnswers({})
                  setCurrentQuestion(0)
                  setTimeLeft((examContent?.duration_minutes || 10) * 60)
                }} 
                className={styles.retryButton}
              >
                <RefreshCw size={18} /> إعادة المحاولة
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const isLastQuestion = currentQuestion === questions.length - 1

  return (
    <div className={styles.examContainer}>
      {/* Header */}
      <div className={styles.examHeader}>
        <div className={styles.examInfo}>
          <Target style={{ color: theme.primary }} />
          <div>
            <h3>{examContent?.title || 'امتحان تقييمي'}</h3>
            <p>سؤال {currentQuestion + 1} من {questions.length}</p>
          </div>
        </div>
        
        <div className={styles.timer} style={{ 
          background: timeLeft < 60 ? '#fee2e2' : timeLeft < 300 ? '#fef3c7' : '#d1fae5',
          color: timeLeft < 60 ? '#dc2626' : timeLeft < 300 ? '#d97706' : '#059669'
        }}>
          <Clock size={20} />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Question */}
      <div className={styles.questionCard}>
        <div className={styles.questionHeader}>
          <span className={styles.questionNumber}>سؤال {currentQuestion + 1}</span>
        </div>
        
        <h4 className={styles.questionText}>{currentQ?.text}</h4>
        
        <div className={styles.options}>
          {currentQ?.options.map(option => (
            <button
              key={option.id}
              onClick={() => handleAnswer(currentQ.id, option.id)}
              className={`${styles.option} ${answers[currentQ.id] === option.id ? styles.selected : ''}`}
            >
              <span className={styles.optionLabel}>{option.id}</span>
              <span className={styles.optionText}>{option.text}</span>
              <div className={styles.radio}>
                {answers[currentQ.id] === option.id && <div className={styles.radioInner} />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className={styles.navigation}>
        <button 
          onClick={() => setCurrentQuestion(prev => prev - 1)} 
          disabled={currentQuestion === 0}
          className={styles.navButton}
        >
          <ArrowRight size={20} /> السابق
        </button>

        <div className={styles.progressDots}>
          {questions.map((_, idx) => (
            <div 
              key={idx} 
              className={`${styles.dot} ${idx === currentQuestion ? styles.active : ''} ${answers[questions[idx].id] ? styles.answered : ''}`}
            />
          ))}
        </div>

        {isLastQuestion ? (
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={styles.submitButton}
            style={{ background: theme.success }}
          >
            {isSubmitting ? <Loader2 className={styles.spinner} /> : 'تسليم الإجابات'}
          </button>
        ) : (
          <button 
            onClick={() => setCurrentQuestion(prev => prev + 1)}
            className={styles.navButton}
            style={{ background: theme.primary }}
          >
            التالي <ArrowLeft size={20} />
          </button>
        )}
      </div>
    </div>
  )
}