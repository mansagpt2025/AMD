'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase/'
import { 
  Target, Clock, CheckCircle, XCircle, 
  ArrowRight, ArrowLeft, Loader2, AlertCircle,
  Trophy, BarChart, Award, Shield
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
  const [showExplanation, setShowExplanation] = useState<string | null>(null)

  useEffect(() => {
    // جلب الأسئلة
    const mockQuestions: Question[] = Array.from({ length: examContent.total_questions || 10 }, (_, i) => ({
      id: `q${i + 1}`,
      text: `سؤال ${i + 1}: ${examContent.questions?.[i] || 'ما هو حل المسألة الرياضية التالية؟'}`,
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
    
    // إظهار الشرح بعد الإجابة
    setTimeout(() => {
      setShowExplanation(questionId)
    }, 500)
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
      setShowExplanation(null)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
      setShowExplanation(null)
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

  const getTimeColor = () => {
    if (timeLeft < 60) return '#ef4444'
    if (timeLeft < 300) return '#f59e0b'
    return '#10b981'
  }

  if (showResults) {
    const isPassed = score >= examContent.pass_score

    return (
      <div className={styles.resultsContainer}>
        <div className={`${styles.resultCard} ${isPassed ? styles.resultSuccess : styles.resultFailed}`}>
          <div className={styles.resultHeader}>
            <div className={styles.resultIcon}>
              {isPassed ? (
                <Trophy className={styles.trophyIcon} />
              ) : (
                <AlertCircle className={styles.alertIcon} />
              )}
            </div>
            <div>
              <h3 className={styles.resultTitle}>
                {isPassed ? '🎉 مبروك! لقد نجحت في الامتحان' : '😔 للأسف، لم تنجح في الامتحان'}
              </h3>
              <p className={styles.resultSubtitle}>
                درجة النجاح المطلوبة: <span className={styles.passScore}>{examContent.pass_score}%</span>
              </p>
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statIcon} style={{ background: `${theme.primary}20` }}>
                <BarChart className={styles.statSvg} style={{ color: theme.primary }} />
              </div>
              <div className={styles.statValue}>{score}%</div>
              <div className={styles.statLabel}>نتيجتك</div>
            </div>
            
            <div className={styles.statItem}>
              <div className={styles.statIcon} style={{ background: `${theme.success}20` }}>
                <CheckCircle className={styles.statSvg} style={{ color: theme.success }} />
              </div>
              <div className={styles.statValue}>
                {Object.keys(answers).filter(
                  qId => answers[qId] === questions.find(q => q.id === qId)?.correctAnswer
                ).length}
              </div>
              <div className={styles.statLabel}>إجابات صحيحة</div>
            </div>
            
            <div className={styles.statItem}>
              <div className={styles.statIcon} style={{ background: `${theme.error}20` }}>
                <XCircle className={styles.statSvg} style={{ color: theme.error }} />
              </div>
              <div className={styles.statValue}>
                {Object.keys(answers).filter(
                  qId => answers[qId] !== questions.find(q => q.id === qId)?.correctAnswer
                ).length}
              </div>
              <div className={styles.statLabel}>إجابات خاطئة</div>
            </div>
            
            <div className={styles.statItem}>
              <div className={styles.statIcon} style={{ background: `${theme.warning}20` }}>
                <Clock className={styles.statSvg} style={{ color: theme.warning }} />
              </div>
              <div className={styles.statValue}>
                {questions.length - Object.keys(answers).length}
              </div>
              <div className={styles.statLabel}>غير مجاب</div>
            </div>
          </div>

          <div className={styles.resultActions}>
            <button
              onClick={() => router.push(`/grades/${gradeSlug}/packages/${packageId}`)}
              className={styles.backButton}
              style={{ background: theme.primary }}
            >
              <ArrowRight className={styles.buttonIcon} />
              العودة للباقة
            </button>
            
            {!isPassed && attempts < examContent.max_attempts && (
              <button
                onClick={() => setShowResults(false)}
                className={styles.retryButton}
                style={{ borderColor: theme.primary, color: theme.primary }}
              >
                <Refresh className={styles.buttonIcon} />
                المحاولة مرة أخرى
              </button>
            )}
          </div>
        </div>

        {/* Review Answers */}
        <div className={styles.reviewSection}>
          <div className={styles.sectionHeader}>
            <Award className={styles.sectionIcon} style={{ color: theme.primary }} />
            <h4 className={styles.sectionTitle}>مراجعة الإجابات</h4>
          </div>
          <div className={styles.reviewList}>
            {questions.map((question, index) => {
              const userAnswer = answers[question.id]
              const isCorrect = userAnswer === question.correctAnswer
              
              return (
                <div key={question.id} className={`${styles.reviewItem} ${
                  isCorrect ? styles.correctAnswer : styles.wrongAnswer
                }`}>
                  <div className={styles.reviewHeader}>
                    <div className={`${styles.statusIndicator} ${
                      isCorrect ? styles.correctIndicator : styles.wrongIndicator
                    }`}>
                      {isCorrect ? (
                        <CheckCircle className={styles.statusIcon} />
                      ) : (
                        <XCircle className={styles.statusIcon} />
                      )}
                    </div>
                    <div className={styles.questionInfo}>
                      <h5 className={styles.questionTitle}>سؤال {index + 1}: {question.text}</h5>
                      <div className={styles.answersGrid}>
                        {question.options.map(option => (
                          <div
                            key={option.id}
                            className={`${styles.answerOption} ${
                              option.id === question.correctAnswer
                                ? styles.correctOption
                                : option.id === userAnswer && !isCorrect
                                ? styles.wrongOption
                                : ''
                            }`}
                          >
                            <span className={styles.optionText}>{option.text}</span>
                            {option.id === question.correctAnswer && (
                              <span className={styles.correctBadge}>✓ الإجابة الصحيحة</span>
                            )}
                            {option.id === userAnswer && !isCorrect && (
                              <span className={styles.wrongBadge}>✗ إجابتك</span>
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
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>
          <Loader2 className={styles.spinner} style={{ color: theme.primary }} />
        </div>
        <p className={styles.loadingText}>جاري تحميل الأسئلة...</p>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]

  return (
    <div className={styles.examContainer}>
      {/* Header */}
      <div className={styles.examHeader}>
        <div className={styles.headerInfo}>
          <div className={styles.examIcon} style={{ background: theme.primary }}>
            <Target className={styles.targetIcon} />
          </div>
          <div>
            <h3 className={styles.examTitle}>{examContent.title}</h3>
            <p className={styles.questionCounter}>
              سؤال {currentQuestion + 1} من {questions.length}
            </p>
          </div>
        </div>

        <div className={styles.headerControls}>
          {/* Timer */}
          <div className={styles.timerContainer} style={{ background: getTimeColor() + '20' }}>
            <Clock className={styles.timerIcon} style={{ color: getTimeColor() }} />
            <span className={styles.timerText}>{formatTime(timeLeft)}</span>
          </div>

          {/* Progress */}
          <div className={styles.progressContainer}>
            <Shield className={styles.progressIcon} style={{ color: theme.primary }} />
            <span className={styles.progressText}>
              {Object.keys(answers).length}/{questions.length} مجاب
            </span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className={styles.questionSection}>
        <div className={styles.questionCard}>
          <div className={styles.questionHeader}>
            <span className={styles.questionNumber}>سؤال {currentQuestion + 1}</span>
            <span className={styles.questionPoints}>{currentQ.points} نقطة</span>
          </div>
          <h4 className={styles.questionText}>{currentQ.text}</h4>
          
          <div className={styles.optionsGrid}>
            {currentQ.options.map(option => (
              <button
                key={option.id}
                onClick={() => handleAnswer(currentQ.id, option.id)}
                className={`${styles.optionButton} ${
                  answers[currentQ.id] === option.id ? styles.selectedOption : ''
                }`}
              >
                <span className={styles.optionLabel}>{option.id.toUpperCase()}</span>
                <span className={styles.optionText}>{option.text}</span>
                <div className={`${styles.optionCircle} ${
                  answers[currentQ.id] === option.id ? styles.selectedCircle : ''
                }`}>
                  {answers[currentQ.id] === option.id && (
                    <div className={styles.optionDot} />
                  )}
                </div>
              </button>
            ))}
          </div>

          {showExplanation === currentQ.id && (
            <div className={styles.explanationCard}>
              <AlertCircle className={styles.explanationIcon} style={{ color: theme.primary }} />
              <div>
                <h5 className={styles.explanationTitle}>شرح السؤال</h5>
                <p className={styles.explanationText}>
                  هذا هو الشرح التفصيلي للسؤال وسبب صحة الإجابة المختارة.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className={styles.navigationSection}>
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`${styles.navButton} ${styles.prevButton} ${
              currentQuestion === 0 ? styles.disabledButton : ''
            }`}
            style={currentQuestion !== 0 ? { background: theme.primary } : {}}
          >
            <ArrowRight className={styles.navIcon} />
            السابق
          </button>

          <div className={styles.navInfo}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ 
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                  background: theme.primary
                }}
              />
            </div>
            <span className={styles.navCounter}>
              {currentQuestion + 1} / {questions.length}
            </span>
          </div>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`${styles.navButton} ${styles.submitButton}`}
              style={{ background: theme.success }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className={`${styles.navIcon} ${styles.spinning}`} />
                  جاري التصحيح...
                </>
              ) : (
                'تسليم الإجابات'
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className={`${styles.navButton} ${styles.nextButton}`}
              style={{ background: theme.primary }}
            >
              التالي
              <ArrowLeft className={styles.navIcon} />
            </button>
          )}
        </div>
      </div>

      {/* Question Navigation */}
      <div className={styles.questionsNavigation}>
        <div className={styles.questionsGrid}>
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentQuestion(index)
                setShowExplanation(null)
              }}
              className={`${styles.questionDot} ${
                currentQuestion === index
                  ? styles.activeDot
                  : answers[questions[index].id]
                  ? styles.answeredDot
                  : ''
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Exam Tips */}
      <div className={styles.tipsSection}>
        <div className={styles.tipsHeader}>
          <AlertCircle className={styles.tipsIcon} style={{ color: theme.warning }} />
          <h5 className={styles.tipsTitle}>نصائح للامتحان</h5>
        </div>
        <ul className={styles.tipsList}>
          <li className={styles.tipItem}>اقرأ كل سؤال بعناية قبل الإجابة</li>
          <li className={styles.tipItem}>يمكنك العودة وتعديل إجاباتك في أي وقت</li>
          <li className={styles.tipItem}>سيتم الإرسال تلقائياً عند انتهاء الوقت</li>
        </ul>
      </div>
    </div>
  )
}

// Icon component
const Refresh = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)