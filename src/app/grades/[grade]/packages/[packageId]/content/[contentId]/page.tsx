'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Play, Pause, RotateCcw, ChevronRight, ChevronLeft, 
  Timer, AlertCircle, CheckCircle, Lock, Eye, FileText,
  Shield, Clock, Award, Smartphone, Volume2,
  SkipForward, SkipBack, Loader2, AlertTriangle,
  X, ChevronLeft as ArrowLeft
} from 'lucide-react';

// ==========================================
// Types & Interfaces
// ==========================================
interface Content {
  id: string;
  lecture_id: string;
  type: 'video' | 'pdf' | 'exam' | 'text';
  title: string;
  description?: string;
  content_url?: string;
  duration_minutes: number;
  order_number: number;
  max_attempts: number;
  pass_score: number;
}

interface UserProgress {
  id: string;
  user_id: string;
  lecture_content_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'passed' | 'failed';
  attempts: number;
  last_accessed_at?: string;
  completed_at?: string;
}

interface ExamQuestion {
  id: string;
  content_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  points: number;
}

interface ExamResult {
  content_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  passed: boolean;
  auto_submitted: boolean;
}

// ==========================================
// Supabase Client
// ==========================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// Custom Hook: Content Security & Tracking
// ==========================================
const useContentSecurity = (contentId: string, userId: string, maxAttempts: number) => {
  const [canAccess, setCanAccess] = useState<boolean>(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    checkAccess();
  }, [contentId, userId]);

  const checkAccess = async () => {
    try {
      const { data: existingProgress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lecture_content_id', contentId)
        .single();

      if (existingProgress) {
        setProgress(existingProgress);
        const remaining = maxAttempts - existingProgress.attempts;
        setAttemptsLeft(Math.max(0, remaining));
        setCanAccess(remaining > 0);
      } else {
        const { data: newProgress } = await supabase
          .from('user_progress')
          .insert({
            user_id: userId,
            lecture_content_id: contentId,
            status: 'not_started',
            attempts: 0,
          })
          .select()
          .single();
        
        setProgress(newProgress);
        setAttemptsLeft(maxAttempts);
        setCanAccess(true);
      }
    } catch (error) {
      console.error('Error checking access:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordAccess = async () => {
    if (!progress) return;

    const newAttempts = progress.attempts + 1;
    
    await supabase
      .from('user_progress')
      .update({
        attempts: newAttempts,
        last_accessed_at: new Date().toISOString(),
        status: newAttempts >= 1 ? 'completed' : progress.status,
        completed_at: newAttempts === 1 ? new Date().toISOString() : progress.completed_at,
      })
      .eq('id', progress.id);

    const { data: content } = await supabase
      .from('lecture_contents')
      .select('type')
      .eq('id', contentId)
      .single();

    if (content?.type === 'video') {
      await supabase
        .from('video_views')
        .upsert({
          user_id: userId,
          content_id: contentId,
          watch_count: newAttempts,
          last_watched_at: new Date().toISOString(),
        }, { onConflict: 'user_id,content_id' });
    }

    setAttemptsLeft(maxAttempts - newAttempts);
    if (newAttempts >= maxAttempts) {
      setCanAccess(false);
    }
  };

  return { canAccess, attemptsLeft, loading, recordAccess, progress };
};

// ==========================================
// Component: Secure Video Player
// ==========================================
const SecureVideoPlayer: React.FC<{
  content: Content;
  userId: string;
  onComplete?: () => void;
}> = ({ content, userId, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  
  const { canAccess, attemptsLeft, loading, recordAccess } = useContentSecurity(
    content.id, 
    userId, 
    content.max_attempts
  );

  // Security: Disable right click and keyboard shortcuts
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const preventDefault = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const preventKeys = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
        (e.ctrlKey && ['s', 'S', 'u', 'U'].includes(e.key))
      ) {
        e.preventDefault();
        return false;
      }
    };

    video.addEventListener('contextmenu', preventDefault);
    document.addEventListener('keydown', preventKeys);
    document.addEventListener('contextmenu', preventDefault);

    return () => {
      video.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('keydown', preventKeys);
      document.removeEventListener('contextmenu', preventDefault);
    };
  }, []);

  const handlePlay = async () => {
    if (!hasStarted) {
      await recordAccess();
      setHasStarted(true);
    }
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-100 rounded-2xl">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!canAccess && attemptsLeft === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-slate-100 rounded-2xl p-6 text-center">
        <Lock className="w-16 h-16 text-slate-400 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-2">تم استنفاذ المحاولات</h3>
        <p className="text-slate-600">لقد وصلت إلى الحد الأقصى لعدد مرات المشاهدة ({content.max_attempts})</p>
      </div>
    );
  }

  return (
    <div className="video-container group">
      {/* Security Badge */}
      <div className="security-badge no-select">
        <Shield className="w-3 h-3" />
        <span>محمي ضد التسجيل</span>
      </div>

      {/* Attempts Counter */}
      <div className="attempts-badge no-select">
        محاولات متبقية: {attemptsLeft}
      </div>

      <video
        ref={videoRef}
        src={content.content_url}
        className="video-element"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={onComplete}
        controls={false}
        disablePictureInPicture
        controlsList="nodownload noplaybackrate nofullscreen"
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Custom Controls */}
      <div 
        className={`video-controls ${isPlaying ? 'opacity-0' : 'opacity-100'} group-hover:opacity-100`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Progress Bar */}
        <div className="timeline-container">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="timeline"
            style={{
              background: `linear-gradient(to right, #3B82F6 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.3) ${(currentTime / (duration || 1)) * 100}%)`
            }}
          />
          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="controls-bar">
          <div className="controls-group">
            <button onClick={handlePlay} className="control-btn play">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 mr-0.5" />}
            </button>
            
            <button
              onClick={() => { if(videoRef.current) videoRef.current.currentTime -= 10; }}
              className="control-btn"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={() => { if(videoRef.current) videoRef.current.currentTime += 10; }}
              className="control-btn"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-white/80">
              <Volume2 className="w-5 h-5" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => {
                  const vol = parseFloat(e.target.value);
                  setVolume(vol);
                  if (videoRef.current) videoRef.current.volume = vol;
                }}
                className="volume-slider"
              />
            </div>
          </div>

          <div className="text-white/60 text-sm font-medium no-select">
            {content.title}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Component: Secure Exam
// ==========================================
const SecureExam: React.FC<{
  content: Content;
  questions: ExamQuestion[];
  userId: string;
  onComplete: (result: ExamResult) => void;
}> = ({ content, questions, userId, onComplete }) => {
  const [shuffledQuestions, setShuffledQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(content.duration_minutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  
  const { canAccess, attemptsLeft, loading, recordAccess } = useContentSecurity(
    content.id,
    userId,
    content.max_attempts
  );

  // Shuffle questions and options
  useEffect(() => {
    if (!loading && canAccess) {
      const shuffled = [...questions].sort(() => Math.random() - 0.5).map(q => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5)
      }));
      setShuffledQuestions(shuffled);
    }
  }, [loading, canAccess, questions]);

  // Anti-cheat: Prevent leaving
  useEffect(() => {
    if (!examStarted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setShowExitWarning(true);
        submitExam(true);
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      window.history.pushState(null, '', window.location.pathname);
      setShowExitWarning(true);
    };

    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [examStarted, answers]);

  // Timer
  useEffect(() => {
    if (!examStarted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          submitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examStarted, timeLeft]);

  const startExam = async () => {
    await recordAccess();
    setExamStarted(true);
    await supabase
      .from('exam_results')
      .insert({
        user_id: userId,
        content_id: content.id,
        started_at: new Date().toISOString(),
      });
  };

  const submitExam = async (autoSubmit = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    let correct = 0;
    const total = shuffledQuestions.length;

    shuffledQuestions.forEach(q => {
      if (answers[q.id] === q.correct_answer) correct++;
    });

    const score = Math.round((correct / total) * 100);
    const passed = score >= content.pass_score;

    const result: ExamResult = {
      content_id: content.id,
      score,
      total_questions: total,
      correct_answers: correct,
      wrong_answers: total - correct,
      passed,
      auto_submitted: autoSubmit,
    };

    await supabase
      .from('exam_results')
      .update({
        score,
        total_questions: total,
        correct_answers: correct,
        wrong_answers: total - correct,
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('content_id', content.id)
      .order('created_at', { ascending: false })
      .limit(1);

    await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        lecture_content_id: content.id,
        status: passed ? 'passed' : 'failed',
        score,
        completed_at: new Date().toISOString(),
      });

    onComplete(result);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-2xl shadow-lg">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="exam-container text-center py-12">
        <div className="modal-icon error mx-auto mb-4">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="modal-title">تم استنفاذ المحاولات</h2>
        <p className="modal-text">لقد استنفذت جميع محاولاتك ({content.max_attempts}) لهذا الامتحان</p>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="exam-intro">
        <div className="exam-intro-icon">
          <Award className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{content.title}</h2>
        <p className="text-slate-600 mb-6">{content.description}</p>

        <div className="exam-stats">
          <div className="stat-box">
            <Clock className="w-6 h-6 mx-auto text-blue-500 mb-2" />
            <div className="stat-value">{content.duration_minutes}</div>
            <div className="stat-label">دقيقة</div>
          </div>
          <div className="stat-box">
            <AlertCircle className="w-6 h-6 mx-auto text-amber-500 mb-2" />
            <div className="stat-value">{content.pass_score}%</div>
            <div className="stat-label">للنجاح</div>
          </div>
          <div className="stat-box">
            <RotateCcw className="w-6 h-6 mx-auto text-emerald-500 mb-2" />
            <div className="stat-value">{attemptsLeft}</div>
            <div className="stat-label">محاولات</div>
          </div>
        </div>

        <div className="warning-box">
          <h4 className="warning-title">
            <AlertTriangle className="w-5 h-5" />
            تنبيهات هامة:
          </h4>
          <ul className="warning-list">
            <li>لا يمكنك الخروج من الامتحان بعد البدء إلا بالتسليم</li>
            <li>عند انتهاء الوقت سيتم التسليم تلقائياً</li>
            <li>ترتيب الأسئلة يتغير في كل مرة</li>
          </ul>
        </div>

        <button onClick={startExam} className="btn btn-primary w-full py-4 text-lg">
          بدء الامتحان الآن
        </button>
      </div>
    );
  }

  const currentQuestion = shuffledQuestions[currentIndex];
  const progressPercent = ((currentIndex + 1) / shuffledQuestions.length) * 100;

  return (
    <div className="exam-container">
      {/* Header */}
      <div className="exam-header">
        <div className="exam-header-content">
          <div className="flex items-center gap-3">
            <div className={`exam-timer ${timeLeft < 60 ? 'warning' : ''}`}>
              <Timer className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
            <span className="text-slate-600 text-sm">
              سؤال {currentIndex + 1} من {shuffledQuestions.length}
            </span>
          </div>
          
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Warning Modal */}
      {showExitWarning && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon warning mx-auto mb-4">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <h3 className="modal-title">تحذير!</h3>
            <p className="modal-text">
              {timeLeft === 0 
                ? 'انتهى وقت الامتحان! جارٍ التسليم التلقائي...' 
                : 'تم اكتشاف محاولة مغادرة الصفحة! سيتم تسليم الامتحان تلقائياً'}
            </p>
          </div>
        </div>
      )}

      {/* Question */}
      <div className="exam-body">
        <h3 className="question-text">{currentQuestion?.question}</h3>

        <div className="options-list">
          {currentQuestion?.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: idx }))}
              className={`option-btn ${answers[currentQuestion.id] === idx ? 'selected' : ''}`}
            >
              <div className="option-indicator">
                {answers[currentQuestion.id] === idx && <CheckCircle className="w-4 h-4" />}
              </div>
              <span className="font-medium">{option}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="exam-footer">
        <div className="nav-buttons">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="btn btn-secondary"
          >
            السابق
          </button>

          {currentIndex === shuffledQuestions.length - 1 ? (
            <button
              onClick={() => submitExam(false)}
              disabled={isSubmitting || Object.keys(answers).length < shuffledQuestions.length}
              className="btn btn-success"
            >
              {isSubmitting ? 'جارٍ التسليم...' : 'تسليم الامتحان'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(prev => Math.min(shuffledQuestions.length - 1, prev + 1))}
              className="btn btn-primary"
            >
              التالي
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Questions Grid */}
        <div className="questions-grid">
          {shuffledQuestions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`question-dot ${idx === currentIndex ? 'current' : ''} ${answers[q.id] !== undefined ? 'answered' : ''}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Component: Content Card
// ==========================================
const ContentCard: React.FC<{
  content: Content;
  userId: string;
  onOpen: (content: Content) => void;
}> = ({ content, userId, onOpen }) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, [content.id]);

  const fetchProgress = async () => {
    const { data } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lecture_content_id', content.id)
      .single();
    setProgress(data);
    setLoading(false);
  };

  const getIcon = () => {
    switch (content.type) {
      case 'video': return <Play className="w-6 h-6" />;
      case 'pdf': return <FileText className="w-6 h-6" />;
      case 'exam': return <Award className="w-6 h-6" />;
      default: return <Eye className="w-6 h-6" />;
    }
  };

  const canOpen = !progress || progress.attempts < content.max_attempts;

  return (
    <div 
      className={`content-card ${!canOpen ? 'locked' : ''}`}
      onClick={() => canOpen && onOpen(content)}
    >
      <div className="card-header">
        <div className={`card-icon-wrapper ${content.type}`}>
          {getIcon()}
        </div>
        {progress && progress.attempts > 0 && (
          <span className="status-badge">
            <CheckCircle className="w-3 h-3" />
            مكتمل
          </span>
        )}
      </div>

      <div className="card-body">
        <h3 className="card-title">{content.title}</h3>
        <p className="card-description">{content.description}</p>

        <div className="card-footer">
          <div className="card-meta">
            <Clock className="w-4 h-4" />
            <span>{content.duration_minutes} دقيقة</span>
          </div>
          <div className="card-meta">
            <RotateCcw className="w-4 h-4" />
            <span>
              {progress ? Math.max(0, content.max_attempts - progress.attempts) : content.max_attempts} محاولات
            </span>
          </div>
        </div>

        {!canOpen && (
          <div className="locked-message">
            <Lock className="w-4 h-4" />
            <span>تم استنفاذ المحاولات</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// Component: Content Viewer Modal
// ==========================================
const ContentViewer: React.FC<{
  content: Content;
  userId: string;
  onClose: () => void;
}> = ({ content, userId, onClose }) => {
  const [showExamResult, setShowExamResult] = useState<ExamResult | null>(null);

  // Prevent scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleExamComplete = (result: ExamResult) => {
    setShowExamResult(result);
  };

  const renderContent = () => {
    switch (content.type) {
      case 'video':
        return <SecureVideoPlayer content={content} userId={userId} />;
      
      case 'exam':
        return (
          <SecureExam
            content={content}
            questions={[]} // يجب تمرير الأسئلة من الـ parent
            userId={userId}
            onComplete={handleExamComplete}
          />
        );
      
      case 'pdf':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <FileText className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{content.title}</h2>
            <iframe
              src={content.content_url}
              className="w-full h-[600px] rounded-xl border border-slate-200"
              title={content.title}
            />
          </div>
        );
      
      default:
        return (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{content.title}</h2>
            <div className="prose max-w-none text-slate-600">
              {content.description}
            </div>
          </div>
        );
    }
  };

  // Exam Result Modal
  if (showExamResult) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className={`modal-icon ${showExamResult.passed ? 'success' : 'error'} mx-auto mb-4`}>
            {showExamResult.passed ? (
              <CheckCircle className="w-12 h-12" />
            ) : (
              <AlertCircle className="w-12 h-12" />
            )}
          </div>
          
          <h2 className={`modal-title ${showExamResult.passed ? 'text-emerald-600' : 'text-red-600'}`}>
            {showExamResult.passed ? 'ناجح!' : 'راسب'}
          </h2>
          
          <p className="modal-text">
            {showExamResult.auto_submitted && '(تم التسليم التلقائي)'}
          </p>

          <div className="result-grid">
            <div className="result-box">
              <div className="result-value">{showExamResult.score}%</div>
              <div className="result-label">الدرجة</div>
            </div>
            <div className="result-box">
              <div className="result-value">
                {showExamResult.correct_answers}/{showExamResult.total_questions}
              </div>
              <div className="result-label">الإجابات الصحيحة</div>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-primary w-full">
            العودة للمحتوى
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/95 z-50 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        <button
          onClick={onClose}
          className="fixed top-4 left-4 z-50 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="max-w-5xl mx-auto pt-12">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Main Page Component
// ==========================================
export default function EducationalPlatform() {
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // جلب المستخدم الحالي
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchContents();
      }
    };
    getUser();
  }, []);

  const fetchContents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('lecture_contents')
      .select('*')
      .order('order_number');
    
    if (data) setContents(data);
    setLoading(false);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="header">
        <div className="container header-content">
          <div className="logo">
            <div className="logo-icon">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h1 className="logo-text">منصتي التعليمية</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-600">
            <Smartphone className="w-4 h-4" />
            <span>تطبيق متجاوب</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container">
        <div className="mb-8 pt-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">محتوى المقرر</h2>
          <p className="text-slate-600">اختر المحتوى الذي تريد دراسته</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <div className="content-grid">
            {contents.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                userId={userId}
                onOpen={setSelectedContent}
              />
            ))}
          </div>
        )}
      </main>

      {/* Content Viewer Modal */}
      {selectedContent && userId && (
        <ContentViewer
          content={selectedContent}
          userId={userId}
          onClose={() => setSelectedContent(null)}
        />
      )}
    </div>
  );
}