'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertTriangle,
  RotateCcw,
  Eye,
  FileText,
  Video,
  HelpCircle,
  ArrowRight,
  Lock,
} from 'lucide-react';
import styles from './ContentPage.module.css';

// ============================================
// Types
// ============================================
interface LectureContent {
  id: string;
  lecture_id: string;
  type: 'video' | 'pdf' | 'exam' | 'text';
  title: string;
  description: string | null;
  content_url: string | null;
  duration_minutes: number;
  order_number: number;
  is_active: boolean;
  max_attempts: number;
  pass_score: number;
  created_at: string;
}

interface ExamQuestion {
  id: string;
  content_id: string;
  question: string;
  question_type: 'multiple_choice' | 'true_false' | 'essay';
  options: string[] | null;
  correct_answer: string | null;
  points: number;
  order_number: number;
  is_active: boolean;
  created_at: string;
}

interface UserProgress {
  id: string;
  user_id: string;
  lecture_content_id: string;
  package_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'passed' | 'failed';
  score: number | null;
  attempts: number;
  last_accessed_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface VideoView {
  id: string;
  user_id: string;
  content_id: string;
  watch_count: number;
  last_watched_at: string | null;
  created_at: string;
}

interface ExamResult {
  id: string;
  user_id: string;
  content_id: string;
  attempt_number: number;
  score: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  started_at: string | null;
  completed_at: string;
  created_at: string;
}

interface ExamResultData {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  passed: boolean;
  answers: { questionId: string; isCorrect: boolean; userAnswer: string; correctAnswer: string }[];
}

interface AccessCheckResult {
  canAccess: boolean;
  currentAttempts: number;
  maxAttempts: number;
  remainingAttempts: number;
  isCompleted: boolean;
  lastScore?: number;
  message?: string;
}

// ============================================
// Utility Functions
// ============================================
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// ============================================
// Video Player Component
// ============================================
function VideoPlayer({
  content,
  userId,
  packageId,
  onComplete,
}: {
  content: LectureContent;
  userId: string;
  packageId: string;
  onComplete?: () => void;
}) {
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessCheck, setAccessCheck] = useState<AccessCheckResult | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [viewRecorded, setViewRecorded] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check access on mount
  useEffect(() => {
    checkAccess();
  }, [content.id, userId]);

  const checkAccess = async () => {
    setIsCheckingAccess(true);
    try {
      const { data: videoView, error: viewError } = await supabase
        .from('video_views')
        .select('*')
        .eq('user_id', userId)
        .eq('content_id', content.id)
        .single();

      if (viewError && viewError.code !== 'PGRST116') {
        throw viewError;
      }

      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lecture_content_id', content.id)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        throw progressError;
      }

      const currentAttempts = (videoView as VideoView | null)?.watch_count || 0;
      const contentMaxAttempts = content.max_attempts || 1;
      const remainingAttempts = contentMaxAttempts - currentAttempts;
      const isCompleted = (progress as UserProgress | null)?.status === 'completed';

      if (isCompleted) {
        setAccessCheck({
          canAccess: true,
          currentAttempts,
          maxAttempts: contentMaxAttempts,
          remainingAttempts: Infinity,
          isCompleted: true,
          message: 'لقد أكملت هذا المحتوى مسبقاً',
        });
        setIsCheckingAccess(false);
        return;
      }

      if (remainingAttempts <= 0) {
        setAccessCheck({
          canAccess: false,
          currentAttempts,
          maxAttempts: contentMaxAttempts,
          remainingAttempts: 0,
          isCompleted: false,
          message: 'لقد تجاوزت الحد الأقصى لعدد المشاهدات',
        });
        setIsCheckingAccess(false);
        return;
      }

      setAccessCheck({
        canAccess: true,
        currentAttempts,
        maxAttempts: contentMaxAttempts,
        remainingAttempts,
        isCompleted: false,
      });

      await recordVideoView();
    } catch (err) {
      console.error('Error checking access:', err);
      setError('حدث خطأ أثناء التحقق من الصلاحية');
    } finally {
      setIsCheckingAccess(false);
    }
  };

  const recordVideoView = async () => {
    if (viewRecorded) return;

    try {
      const { data: existing } = await supabase
        .from('video_views')
        .select('*')
        .eq('user_id', userId)
        .eq('content_id', content.id)
        .single();

      const now = new Date().toISOString();

      if (existing) {
        await supabase
          .from('video_views')
          .update({
            watch_count: ((existing as VideoView).watch_count || 0) + 1,
            last_watched_at: now,
          })
          .eq('id', (existing as VideoView).id);
      } else {
        await supabase.from('video_views').insert({
          user_id: userId,
          content_id: content.id,
          watch_count: 1,
          last_watched_at: now,
        });
      }

      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lecture_content_id', content.id)
        .single();

      if (progress) {
        await supabase
          .from('user_progress')
          .update({
            status: 'in_progress',
            last_accessed_at: now,
          })
          .eq('id', (progress as UserProgress).id);
      } else {
        await supabase.from('user_progress').insert({
          user_id: userId,
          lecture_content_id: content.id,
          package_id: packageId,
          status: 'in_progress',
          last_accessed_at: now,
        });
      }

      setViewRecorded(true);
    } catch (err) {
      console.error('Error recording view:', err);
    }
  };

  const markAsCompleted = async () => {
    try {
      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lecture_content_id', content.id)
        .single();

      const now = new Date().toISOString();

      if (progress) {
        await supabase
          .from('user_progress')
          .update({
            status: 'completed',
            completed_at: now,
          })
          .eq('id', (progress as UserProgress).id);
      }

      onComplete?.();
    } catch (err) {
      console.error('Error marking as completed:', err);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    markAsCompleted();
  };

  const handleError = () => {
    setError('حدث خطأ أثناء تحميل الفيديو');
    setIsLoading(false);
  };

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const newTime = pos * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(duration, videoRef.current.currentTime + seconds)
      );
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newVolume = Math.max(0, Math.min(1, pos));
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ([' ', 'ArrowLeft', 'ArrowRight', 'f', 'm'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case ' ':
        case 'k':
          togglePlay();
          break;
        case 'ArrowLeft':
          skip(-10);
          break;
        case 'ArrowRight':
          skip(10);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
        case 'ArrowUp':
          if (videoRef.current) {
            videoRef.current.volume = Math.min(1, videoRef.current.volume + 0.1);
            setVolume(videoRef.current.volume);
          }
          break;
        case 'ArrowDown':
          if (videoRef.current) {
            videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.1);
            setVolume(videoRef.current.volume);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const formatVideoTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isCheckingAccess) {
    return (
      <div className={styles.accessCheckContainer}>
        <div className={styles.accessCheckCard}>
          <div className={`${styles.accessCheckIcon} ${styles.loading}`}>
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
          <h2 className={styles.accessCheckTitle}>جاري التحقق من الصلاحية...</h2>
          <p className={styles.accessCheckMessage}>يرجى الانتظار بينما نتحقق من صلاحية الوصول</p>
        </div>
      </div>
    );
  }

  if (!accessCheck?.canAccess) {
    return (
      <div className={styles.accessCheckContainer}>
        <div className={styles.accessCheckCard}>
          <div className={`${styles.accessCheckIcon} ${styles.locked}`}>
            <Lock className="w-10 h-10" />
          </div>
          <h2 className={styles.accessCheckTitle}>لا يمكن الوصول إلى المحتوى</h2>
          <p className={styles.accessCheckMessage}>
            {accessCheck?.message || 'لقد تجاوزت الحد الأقصى لعدد المشاهدات المسموح به'}
          </p>
          <div className={styles.attemptsInfo}>
            <div className={styles.attemptInfoItem}>
              <div className={styles.attemptInfoValue}>{accessCheck?.currentAttempts || 0}</div>
              <div className={styles.attemptInfoLabel}>المشاهدات</div>
            </div>
            <div className={styles.attemptInfoItem}>
              <div className={styles.attemptInfoValue}>{accessCheck?.maxAttempts || content.max_attempts}</div>
              <div className={styles.attemptInfoLabel}>الحد الأقصى</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.accessCheckContainer}>
        <div className={styles.accessCheckCard}>
          <div className={`${styles.accessCheckIcon} ${styles.error}`}>
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className={styles.accessCheckTitle}>حدث خطأ</h2>
          <p className={styles.accessCheckMessage}>{error}</p>
          <button onClick={() => window.location.reload()} className={`${styles.premiumBtn} ${styles.premiumBtnPrimary} mt-4`}>
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.videoPlayerWrapper}>
      {/* Info Card */}
      <div className={styles.premiumCard}>
        <div className={styles.premiumCardHeader}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.heading3}>{content.title}</h1>
              {content.description && (
                <p className={styles.textBody}>{content.description}</p>
              )}
            </div>
            <div className={styles.badgeGroup}>
              {!accessCheck.isCompleted && (
                <span className={`${styles.premiumBadge} ${styles.premiumBadgePrimary}`}>
                  متبقي {accessCheck.remainingAttempts} مشاهدات
                </span>
              )}
              {accessCheck.isCompleted && (
                <span className={`${styles.premiumBadge} ${styles.premiumBadgeSuccess}`}>
                  <CheckCircle className="w-3 h-3" />
                  مكتمل
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div
        ref={containerRef}
        className={`${styles.videoPlayerContainer} ${showControls ? styles.showControls : ''}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        <div className={styles.videoPlayerWrapperInner}>
          <video
            ref={videoRef}
            className={styles.videoPlayer}
            src={content.content_url || undefined}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onError={handleError}
            onWaiting={() => setIsLoading(true)}
            onPlaying={() => setIsLoading(false)}
            playsInline
          />

          {isLoading && (
            <div className={styles.videoLoading}>
              <div className={styles.videoLoadingSpinner} />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className={styles.videoControls}>
          <div
            ref={progressRef}
            className={styles.videoProgressContainer}
            onClick={handleSeek}
          >
            <div
              className={styles.videoProgressBar}
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>

          <div className={styles.videoControlsRow}>
            <div className={styles.videoControlsLeft}>
              <button className={styles.videoControlBtn} onClick={togglePlay}>
                {isPlaying ? <Pause /> : <Play />}
              </button>

              <button className={styles.videoControlBtn} onClick={() => skip(-10)}>
                <SkipBack />
              </button>

              <button className={styles.videoControlBtn} onClick={() => skip(10)}>
                <SkipForward />
              </button>

              <div className={styles.videoVolumeContainer}>
                <button className={styles.videoControlBtn} onClick={toggleMute}>
                  {isMuted || volume === 0 ? <VolumeX /> : <Volume2 />}
                </button>
                <div className={styles.videoVolumeSlider} onClick={handleVolumeChange}>
                  <div
                    className={styles.videoVolumeLevel}
                    style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                  />
                </div>
              </div>

              <span className={styles.videoTime}>
                {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
              </span>
            </div>

            <div className={styles.videoControlsRight}>
              <button className={styles.videoControlBtn} onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize /> : <Maximize />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className={`${styles.premiumCard} mt-4`}>
        <div className={styles.premiumCardBody}>
          <div className={styles.videoInfoRow}>
            <div className={styles.videoInfoStats}>
              <div className={styles.videoInfoItem}>
                <div className={`${styles.videoInfoValue} ${styles.textPrimary}`}>
                  {accessCheck.currentAttempts + 1}
                </div>
                <div className={styles.videoInfoLabel}>المشاهدة الحالية</div>
              </div>
              <div className={styles.videoInfoDivider} />
              <div className={styles.videoInfoItem}>
                <div className={styles.videoInfoValue}>
                  {accessCheck.maxAttempts}
                </div>
                <div className={styles.videoInfoLabel}>الحد الأقصى</div>
              </div>
              <div className={styles.videoInfoDivider} />
              <div className={styles.videoInfoItem}>
                <div className={`${styles.videoInfoValue} ${styles.textSuccess}`}>
                  {Math.round((currentTime / (duration || 1)) * 100)}%
                </div>
                <div className={styles.videoInfoLabel}>التقدم</div>
              </div>
            </div>

            <div className={styles.keyboardShortcuts}>
              اضغط <kbd className={styles.kbd}>المسافة</kbd> للتشغيل/الإيقاف |
              <kbd className={styles.kbd}>←</kbd>
              <kbd className={styles.kbd}>→</kbd> للتقديم/التأخير 10ث |
              <kbd className={styles.kbd}>F</kbd> ملء الشاشة
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Exam Viewer Component
// ============================================
function ExamViewer({
  content,
  userId,
  packageId,
  onComplete,
}: {
  content: LectureContent;
  userId: string;
  packageId: string;
  onComplete?: () => void;
}) {
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [accessCheck, setAccessCheck] = useState<AccessCheckResult | null>(null);
  const [shuffledQuestions, setShuffledQuestions] = useState<ExamQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [examResult, setExamResult] = useState<ExamResultData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const examRecordedRef = useRef(false);

  useEffect(() => {
    checkAccess();

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (examStarted && !examFinished) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (examStarted && !examFinished) {
        e.preventDefault();
        setShowExitWarning(true);
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [content.id, userId]);

  useEffect(() => {
    if (examStarted && !examFinished && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [examStarted, examFinished, timeRemaining]);

  const checkAccess = async () => {
    setIsCheckingAccess(true);
    try {
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lecture_content_id', content.id)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        throw progressError;
      }

      const { data: examResults, error: resultsError } = await supabase
        .from('exam_results')
        .select('*')
        .eq('user_id', userId)
        .eq('content_id', content.id)
        .order('attempt_number', { ascending: false });

      if (resultsError) throw resultsError;

      const currentAttempts = examResults?.length || 0;
      const contentMaxAttempts = content.max_attempts || 1;
      const remainingAttempts = contentMaxAttempts - currentAttempts;
      const isCompleted = (progress as UserProgress | null)?.status === 'passed' || (progress as UserProgress | null)?.status === 'completed';
      const lastScore = examResults?.[0]?.score;

      if (remainingAttempts <= 0 && !isCompleted) {
        setAccessCheck({
          canAccess: false,
          currentAttempts,
          maxAttempts: contentMaxAttempts,
          remainingAttempts: 0,
          isCompleted: false,
          lastScore,
          message: 'لقد تجاوزت الحد الأقصى لعدد المحاولات',
        });
        setIsCheckingAccess(false);
        return;
      }

      const { data: questionsData, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('content_id', content.id)
        .eq('is_active', true)
        .order('order_number', { ascending: true });

      if (questionsError) throw questionsError;

      const fetchedQuestions = (questionsData as ExamQuestion[]) || [];

      const shuffled = shuffleArray(fetchedQuestions).map((q) => ({
        ...q,
        options: q.options ? shuffleArray(q.options) : q.options,
      }));

      setShuffledQuestions(shuffled);

      setAccessCheck({
        canAccess: true,
        currentAttempts,
        maxAttempts: contentMaxAttempts,
        remainingAttempts,
        isCompleted,
        lastScore,
      });
    } catch (err) {
      console.error('Error checking access:', err);
    } finally {
      setIsCheckingAccess(false);
    }
  };

  const startExam = async () => {
    const now = new Date().toISOString();
    setStartTime(now);
    setExamStarted(true);
    setTimeRemaining((content.duration_minutes || 30) * 60);

    try {
      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lecture_content_id', content.id)
        .single();

      if (progress) {
        await supabase
          .from('user_progress')
          .update({
            status: 'in_progress',
            attempts: ((progress as UserProgress).attempts || 0) + 1,
            last_accessed_at: now,
          })
          .eq('id', (progress as UserProgress).id);
      } else {
        await supabase.from('user_progress').insert({
          user_id: userId,
          lecture_content_id: content.id,
          package_id: packageId,
          status: 'in_progress',
          attempts: 1,
          last_accessed_at: now,
        });
      }
    } catch (err) {
      console.error('Error recording exam start:', err);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < shuffledQuestions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleSubmitExam = async () => {
    if (isSubmitting || examRecordedRef.current) return;

    setIsSubmitting(true);
    examRecordedRef.current = true;

    try {
      let correctCount = 0;
      let wrongCount = 0;
      const answerDetails: ExamResultData['answers'] = [];

      shuffledQuestions.forEach((question) => {
        const userAnswer = answers[question.id];
        const isCorrect = userAnswer === question.correct_answer;

        if (isCorrect) {
          correctCount++;
        } else {
          wrongCount++;
        }

        answerDetails.push({
          questionId: question.id,
          isCorrect: !!isCorrect,
          userAnswer: userAnswer || '',
          correctAnswer: question.correct_answer || '',
        });
      });

      const totalQuestions = shuffledQuestions.length;
      const score = Math.round((correctCount / totalQuestions) * 100);
      const passed = score >= (content.pass_score || 70);

      const result: ExamResultData = {
        score,
        totalQuestions,
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        passed,
        answers: answerDetails,
      };

      setExamResult(result);

      const { data: existingResults } = await supabase
        .from('exam_results')
        .select('attempt_number')
        .eq('user_id', userId)
        .eq('content_id', content.id)
        .order('attempt_number', { ascending: false })
        .limit(1);

      const nextAttemptNumber = ((existingResults?.[0] as ExamResult | undefined)?.attempt_number || 0) + 1;

      await supabase.from('exam_results').insert({
        user_id: userId,
        content_id: content.id,
        attempt_number: nextAttemptNumber,
        score,
        total_questions: totalQuestions,
        correct_answers: correctCount,
        wrong_answers: wrongCount,
        started_at: startTime,
      });

      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lecture_content_id', content.id)
        .single();

      const now = new Date().toISOString();

      if (progress) {
        await supabase
          .from('user_progress')
          .update({
            status: passed ? 'passed' : 'failed',
            score,
            completed_at: now,
          })
          .eq('id', (progress as UserProgress).id);
      }

      setExamFinished(true);
      onComplete?.();
    } catch (err) {
      console.error('Error submitting exam:', err);
      examRecordedRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimerColor = () => {
    const totalTime = (content.duration_minutes || 30) * 60;
    const percentage = timeRemaining / totalTime;

    if (percentage <= 0.1) return styles.danger;
    if (percentage <= 0.25) return styles.warning;
    return '';
  };

  if (isCheckingAccess) {
    return (
      <div className={styles.accessCheckContainer}>
        <div className={styles.accessCheckCard}>
          <div className={`${styles.accessCheckIcon} ${styles.loading}`}>
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
          <h2 className={styles.accessCheckTitle}>جاري التحقق من الصلاحية...</h2>
          <p className={styles.accessCheckMessage}>يرجى الانتظار بينما نتحقق من صلاحية الوصول</p>
        </div>
      </div>
    );
  }

  if (!accessCheck?.canAccess) {
    return (
      <div className={styles.accessCheckContainer}>
        <div className={styles.accessCheckCard}>
          <div className={`${styles.accessCheckIcon} ${styles.locked}`}>
            <Lock className="w-10 h-10" />
          </div>
          <h2 className={styles.accessCheckTitle}>لا يمكن الوصول إلى الامتحان</h2>
          <p className={styles.accessCheckMessage}>
            {accessCheck?.message || 'لقد تجاوزت الحد الأقصى لعدد المحاولات'}
          </p>
          {accessCheck?.lastScore !== undefined && (
            <div className={styles.lastScoreBox}>
              <p className={styles.lastScoreLabel}>نتيجة آخر محاولة:</p>
              <p className={`${styles.lastScoreValue} ${accessCheck.lastScore >= (content.pass_score || 70) ? styles.textSuccess : styles.textError}`}>
                {accessCheck.lastScore}%
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className={styles.accessCheckContainer}>
        <div className={styles.accessCheckCard}>
          <div className={`${styles.accessCheckIcon} ${styles.success}`}>
            <Eye className="w-10 h-10" />
          </div>
          <h2 className={styles.accessCheckTitle}>{content.title}</h2>
          <p className={styles.accessCheckMessage}>{content.description}</p>

          <div className={styles.attemptsInfo}>
            <div className={styles.attemptInfoItem}>
              <div className={styles.attemptInfoValue}>{shuffledQuestions.length}</div>
              <div className={styles.attemptInfoLabel}>سؤال</div>
            </div>
            <div className={styles.attemptInfoItem}>
              <div className={styles.attemptInfoValue}>{content.duration_minutes || 30}</div>
              <div className={styles.attemptInfoLabel}>دقيقة</div>
            </div>
            <div className={styles.attemptInfoItem}>
              <div className={styles.attemptInfoValue}>{content.pass_score || 70}%</div>
              <div className={styles.attemptInfoLabel}>درجة النجاح</div>
            </div>
            <div className={styles.attemptInfoItem}>
              <div className={styles.attemptInfoValue}>{accessCheck.remainingAttempts}</div>
              <div className={styles.attemptInfoLabel}>محاولات متبقية</div>
            </div>
          </div>

          <div className={`${styles.premiumAlert} ${styles.premiumAlertWarning} mt-4`}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div className={styles.alertText}>
              <strong>تنبيه مهم:</strong> بمجرد بدء الامتحان لا يمكنك الخروج حتى تسلم إجاباتك.
              سيتم تسليم الامتحان تلقائياً عند انتهاء الوقت.
            </div>
          </div>

          <button onClick={startExam} className={`${styles.premiumBtn} ${styles.premiumBtnPrimary} ${styles.premiumBtnLg} mt-6`}>
            بدء الامتحان
          </button>
        </div>
      </div>
    );
  }

  if (examFinished && examResult) {
    return (
      <div className={styles.examContainer}>
        <div className={styles.examResults}>
          <div className={`${styles.examScoreCircle} ${examResult.passed ? styles.pass : styles.fail}`}>
            <div className={styles.examScoreValue}>{examResult.score}%</div>
            <div className={styles.examScoreLabel}>{examResult.passed ? 'ناجح' : 'راسب'}</div>
          </div>

          <h2 className={styles.heading2}>
            {examResult.passed ? 'تهانينا! لقد نجحت' : 'لم تنجح هذه المرة'}
          </h2>
          <p className={styles.textBody}>
            {examResult.passed
              ? 'أحسنت! لقد تجاوزت درجة النجاح المطلوبة'
              : 'لا تيأس! يمكنك المحاولة مرة أخرى'}
          </p>

          <div className={styles.examStats}>
            <div className={styles.examStat}>
              <div className={`${styles.examStatValue} ${styles.textSuccess}`}>{examResult.correctAnswers}</div>
              <div className={styles.examStatLabel}>إجابات صحيحة</div>
            </div>
            <div className={styles.examStat}>
              <div className={`${styles.examStatValue} ${styles.textError}`}>{examResult.wrongAnswers}</div>
              <div className={styles.examStatLabel}>إجابات خاطئة</div>
            </div>
            <div className={styles.examStat}>
              <div className={styles.examStatValue}>{examResult.totalQuestions}</div>
              <div className={styles.examStatLabel}>إجمالي الأسئلة</div>
            </div>
          </div>

          <div className={styles.examResultActions}>
            {!examResult.passed && accessCheck.remainingAttempts > 1 && (
              <button
                onClick={() => window.location.reload()}
                className={`${styles.premiumBtn} ${styles.premiumBtnPrimary}`}
              >
                <RotateCcw className="w-4 h-4" />
                إعادة المحاولة
              </button>
            )}
            <button onClick={() => window.location.href = '/dashboard'} className={`${styles.premiumBtn} ${styles.premiumBtnSecondary}`}>
              العودة للرئيسية
            </button>
          </div>
        </div>

        <div className={styles.reviewSection}>
          <h3 className={styles.heading3}>مراجعة الإجابات</h3>
          {shuffledQuestions.map((question, index) => {
            const answerDetail = examResult.answers.find((a) => a.questionId === question.id);
            const isCorrect = answerDetail?.isCorrect;

            return (
              <div key={question.id} className={styles.questionCard}>
                <div className={styles.questionHeader}>
                  <span className={styles.questionNumber}>{index + 1}</span>
                  <div className={styles.questionTextWrapper}>
                    <p className={styles.questionText}>{question.question}</p>
                  </div>
                  {isCorrect ? (
                    <CheckCircle className={`w-6 h-6 ${styles.textSuccess}`} />
                  ) : (
                    <XCircle className={`w-6 h-6 ${styles.textError}`} />
                  )}
                </div>

                <div className={styles.answerOptions}>
                  {question.options?.map((option, optIndex) => {
                    const isSelected = answerDetail?.userAnswer === option;
                    const isCorrectOption = question.correct_answer === option;

                    let optionClass = styles.answerOption;
                    if (isCorrectOption) {
                      optionClass += ` ${styles.correct}`;
                    } else if (isSelected && !isCorrectOption) {
                      optionClass += ` ${styles.wrong}`;
                    }

                    return (
                      <div key={optIndex} className={optionClass}>
                        <span className={styles.answerOptionMarker} />
                        <span className={styles.answerOptionText}>{option}</span>
                        {isCorrectOption && (
                          <CheckCircle className={`w-4 h-4 ${styles.textSuccess} mr-auto`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const timerClass = getTimerColor();

  return (
    <div className={styles.examContainer}>
      {/* Exit Warning Modal */}
      {showExitWarning && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={`${styles.heading3} ${styles.textError}`}>تحذير!</h3>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.textBody}>
                لا يمكنك مغادرة الامتحان قبل تسليم الإجابات. إذا غادرت الآن، سيتم تسجيل محاولتك
                كفاشلة.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setShowExitWarning(false)} className={`${styles.premiumBtn} ${styles.premiumBtnPrimary}`}>
                متابعة الامتحان
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submitting Modal */}
      {isSubmitting && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={`${styles.modalBody} ${styles.textCenter} py-8`}>
              <Loader2 className={`w-12 h-12 animate-spin mx-auto mb-4 ${styles.textPrimary}`} />
              <h3 className={styles.heading3}>جاري تسليم الامتحان...</h3>
            </div>
          </div>
        </div>
      )}

      {/* Exam Header */}
      <div className={styles.examHeader}>
        <div className={styles.examHeaderTop}>
          <h1 className={styles.examTitle}>{content.title}</h1>
          <div className={`${styles.examTimer} ${timerClass}`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeRemaining)}
          </div>
        </div>

        <div className={styles.examProgress}>
          <span className={styles.examProgressText}>
            {answeredCount} / {shuffledQuestions.length}
          </span>
          <div className={styles.examProgressBar}>
            <div
              className={styles.examProgressFill}
              style={{ width: `${(answeredCount / shuffledQuestions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div className={styles.questionCard}>
          <div className={styles.questionCardHeader}>
            <span className={styles.questionNumber}>{currentQuestionIndex + 1}</span>
            <button
              onClick={() => toggleFlag(currentQuestion.id)}
              className={`${styles.flagBtn} ${flaggedQuestions.has(currentQuestion.id) ? styles.flagged : ''}`}
            >
              <Flag className="w-5 h-5" />
            </button>
          </div>

          <p className={styles.questionText}>{currentQuestion.question}</p>

          <div className={styles.answerOptions}>
            {currentQuestion.options?.map((option, index) => (
              <label
                key={index}
                className={`${styles.answerOption} ${answers[currentQuestion.id] === option ? styles.selected : ''}`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={option}
                  checked={answers[currentQuestion.id] === option}
                  onChange={() => handleAnswerSelect(currentQuestion.id, option)}
                  className={styles.visuallyHidden}
                />
                <span className={styles.answerOptionMarker} />
                <span className={styles.answerOptionText}>{option}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className={styles.examNavigation}>
        <button
          onClick={() => goToQuestion(currentQuestionIndex - 1)}
          disabled={currentQuestionIndex === 0}
          className={`${styles.premiumBtn} ${styles.premiumBtnSecondary}`}
        >
          <ChevronRight className="w-4 h-4" />
          السابق
        </button>

        <div className={styles.questionGrid}>
          {shuffledQuestions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => goToQuestion(index)}
              className={`${styles.questionDot} ${
                currentQuestionIndex === index
                  ? styles.current
                  : answers[q.id]
                  ? styles.answered
                  : styles.unanswered
              }`}
            >
              {flaggedQuestions.has(q.id) ? <Flag className="w-3 h-3" /> : index + 1}
            </button>
          ))}
        </div>

        {currentQuestionIndex === shuffledQuestions.length - 1 ? (
          <button
            onClick={handleSubmitExam}
            disabled={isSubmitting}
            className={`${styles.premiumBtn} ${styles.premiumBtnSuccess}`}
          >
            <CheckCircle className="w-4 h-4" />
            تسليم
          </button>
        ) : (
          <button
            onClick={() => goToQuestion(currentQuestionIndex + 1)}
            className={`${styles.premiumBtn} ${styles.premiumBtnPrimary}`}
          >
            التالي
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Submit */}
      {answeredCount === shuffledQuestions.length && (
        <div className={styles.quickSubmit}>
          <button
            onClick={handleSubmitExam}
            disabled={isSubmitting}
            className={`${styles.premiumBtn} ${styles.premiumBtnSuccess} ${styles.premiumBtnLg}`}
          >
            <CheckCircle className="w-5 h-5" />
            تسليم الامتحان
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// PDF Viewer Component
// ============================================
function PDFViewer({
  content,
  userId,
  packageId,
}: {
  content: LectureContent;
  userId: string;
  packageId: string;
}) {
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [accessCheck, setAccessCheck] = useState<AccessCheckResult | null>(null);
  const [viewRecorded, setViewRecorded] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [content.id, userId]);

  const checkAccess = async () => {
    setIsCheckingAccess(true);
    try {
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lecture_content_id', content.id)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        throw progressError;
      }

      const { data: viewCount } = await supabase
        .from('content_views')
        .select('*')
        .eq('user_id', userId)
        .eq('content_id', content.id)
        .single();

      const currentAttempts = (viewCount as { view_count?: number } | null)?.view_count || 0;
      const contentMaxAttempts = content.max_attempts || 1;
      const remainingAttempts = contentMaxAttempts - currentAttempts;
      const isCompleted = (progress as UserProgress | null)?.status === 'completed';

      if (isCompleted) {
        setAccessCheck({
          canAccess: true,
          currentAttempts,
          maxAttempts: contentMaxAttempts,
          remainingAttempts: Infinity,
          isCompleted: true,
          message: 'لقد أكملت هذا المحتوى مسبقاً',
        });
        setIsCheckingAccess(false);
        recordView();
        return;
      }

      if (remainingAttempts <= 0) {
        setAccessCheck({
          canAccess: false,
          currentAttempts,
          maxAttempts: contentMaxAttempts,
          remainingAttempts: 0,
          isCompleted: false,
          message: 'لقد تجاوزت الحد الأقصى لعدد المشاهدات',
        });
        setIsCheckingAccess(false);
        return;
      }

      setAccessCheck({
        canAccess: true,
        currentAttempts,
        maxAttempts: contentMaxAttempts,
        remainingAttempts,
        isCompleted: false,
      });

      await recordView();
    } catch (err) {
      console.error('Error checking access:', err);
      setAccessCheck({
        canAccess: true,
        currentAttempts: 0,
        maxAttempts: content.max_attempts || 1,
        remainingAttempts: content.max_attempts || 1,
        isCompleted: false,
      });
    } finally {
      setIsCheckingAccess(false);
    }
  };

  const recordView = async () => {
    if (viewRecorded) return;

    try {
      const { data: existing } = await supabase
        .from('content_views')
        .select('*')
        .eq('user_id', userId)
        .eq('content_id', content.id)
        .single();

      const now = new Date().toISOString();

      if (existing) {
        await supabase
          .from('content_views')
          .update({
            view_count: ((existing as { view_count?: number }).view_count || 0) + 1,
            last_viewed_at: now,
          })
          .eq('id', (existing as { id: string }).id);
      } else {
        await supabase.from('content_views').insert({
          user_id: userId,
          content_id: content.id,
          view_count: 1,
          last_viewed_at: now,
        });
      }

      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lecture_content_id', content.id)
        .single();

      if (progress) {
        await supabase
          .from('user_progress')
          .update({
            status: 'completed',
            completed_at: now,
          })
          .eq('id', (progress as UserProgress).id);
      } else {
        await supabase.from('user_progress').insert({
          user_id: userId,
          lecture_content_id: content.id,
          package_id: packageId,
          status: 'completed',
          completed_at: now,
        });
      }

      setViewRecorded(true);
    } catch (err) {
      console.error('Error recording view:', err);
    }
  };

  if (isCheckingAccess) {
    return (
      <div className={styles.accessCheckContainer}>
        <div className={styles.accessCheckCard}>
          <div className={`${styles.accessCheckIcon} ${styles.loading}`}>
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
          <h2 className={styles.accessCheckTitle}>جاري التحقق من الصلاحية...</h2>
          <p className={styles.accessCheckMessage}>يرجى الانتظار بينما نتحقق من صلاحية الوصول</p>
        </div>
      </div>
    );
  }

  if (!accessCheck?.canAccess) {
    return (
      <div className={styles.accessCheckContainer}>
        <div className={styles.accessCheckCard}>
          <div className={`${styles.accessCheckIcon} ${styles.locked}`}>
            <Lock className="w-10 h-10" />
          </div>
          <h2 className={styles.accessCheckTitle}>لا يمكن الوصول إلى الملف</h2>
          <p className={styles.accessCheckMessage}>
            {accessCheck?.message || 'لقد تجاوزت الحد الأقصى لعدد المشاهدات'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pdfViewerWrapper}>
      <div className={styles.premiumCard}>
        <div className={styles.premiumCardHeader}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.heading3}>{content.title}</h1>
              {content.description && (
                <p className={styles.textBody}>{content.description}</p>
              )}
            </div>
            <div className={styles.badgeGroup}>
              {!accessCheck.isCompleted && (
                <span className={`${styles.premiumBadge} ${styles.premiumBadgePrimary}`}>
                  متبقي {accessCheck.remainingAttempts} مشاهدات
                </span>
              )}
              {accessCheck.isCompleted && (
                <span className={`${styles.premiumBadge} ${styles.premiumBadgeSuccess}`}>
                  <CheckCircle className="w-3 h-3" />
                  مكتمل
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.pdfContainer}>
        {content.content_url ? (
          <iframe
            src={content.content_url}
            className={styles.pdfIframe}
            title={content.title}
          />
        ) : (
          <div className={styles.pdfError}>
            <AlertCircle className="w-12 h-12 mb-4" />
            <p>لا يوجد ملف PDF متاح</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Text Content Component
// ============================================
function TextViewer({
  content,
  userId,
  packageId,
}: {
  content: LectureContent;
  userId: string;
  packageId: string;
}) {
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [accessCheck, setAccessCheck] = useState<AccessCheckResult | null>(null);
  const [viewRecorded, setViewRecorded] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [content.id, userId]);

  const checkAccess = async () => {
    setIsCheckingAccess(true);
    try {
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lecture_content_id', content.id)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        throw progressError;
      }

      const { data: viewCount } = await supabase
        .from('content_views')
        .select('*')
        .eq('user_id', userId)
        .eq('content_id', content.id)
        .single();

      const currentAttempts = (viewCount as { view_count?: number } | null)?.view_count || 0;
      const contentMaxAttempts = content.max_attempts || 1;
      const remainingAttempts = contentMaxAttempts - currentAttempts;
      const isCompleted = (progress as UserProgress | null)?.status === 'completed';

      if (isCompleted) {
        setAccessCheck({
          canAccess: true,
          currentAttempts,
          maxAttempts: contentMaxAttempts,
          remainingAttempts: Infinity,
          isCompleted: true,
          message: 'لقد أكملت هذا المحتوى مسبقاً',
        });
        setIsCheckingAccess(false);
        recordView();
        return;
      }

      if (remainingAttempts <= 0) {
        setAccessCheck({
          canAccess: false,
          currentAttempts,
          maxAttempts: contentMaxAttempts,
          remainingAttempts: 0,
          isCompleted: false,
          message: 'لقد تجاوزت الحد الأقصى لعدد المشاهدات',
        });
        setIsCheckingAccess(false);
        return;
      }

      setAccessCheck({
        canAccess: true,
        currentAttempts,
        maxAttempts: contentMaxAttempts,
        remainingAttempts,
        isCompleted: false,
      });

      await recordView();
    } catch (err) {
      console.error('Error checking access:', err);
      setAccessCheck({
        canAccess: true,
        currentAttempts: 0,
        maxAttempts: content.max_attempts || 1,
        remainingAttempts: content.max_attempts || 1,
        isCompleted: false,
      });
    } finally {
      setIsCheckingAccess(false);
    }
  };

  const recordView = async () => {
    if (viewRecorded) return;

    try {
      const { data: existing } = await supabase
        .from('content_views')
        .select('*')
        .eq('user_id', userId)
        .eq('content_id', content.id)
        .single();

      const now = new Date().toISOString();

      if (existing) {
        await supabase
          .from('content_views')
          .update({
            view_count: ((existing as { view_count?: number }).view_count || 0) + 1,
            last_viewed_at: now,
          })
          .eq('id', (existing as { id: string }).id);
      } else {
        await supabase.from('content_views').insert({
          user_id: userId,
          content_id: content.id,
          view_count: 1,
          last_viewed_at: now,
        });
      }

      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lecture_content_id', content.id)
        .single();

      if (progress) {
        await supabase
          .from('user_progress')
          .update({
            status: 'completed',
            completed_at: now,
          })
          .eq('id', (progress as UserProgress).id);
      } else {
        await supabase.from('user_progress').insert({
          user_id: userId,
          lecture_content_id: content.id,
          package_id: packageId,
          status: 'completed',
          completed_at: now,
        });
      }

      setViewRecorded(true);
    } catch (err) {
      console.error('Error recording view:', err);
    }
  };

  if (isCheckingAccess) {
    return (
      <div className={styles.accessCheckContainer}>
        <div className={styles.accessCheckCard}>
          <div className={`${styles.accessCheckIcon} ${styles.loading}`}>
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
          <h2 className={styles.accessCheckTitle}>جاري التحقق من الصلاحية...</h2>
          <p className={styles.accessCheckMessage}>يرجى الانتظار بينما نتحقق من صلاحية الوصول</p>
        </div>
      </div>
    );
  }

  if (!accessCheck?.canAccess) {
    return (
      <div className={styles.accessCheckContainer}>
        <div className={styles.accessCheckCard}>
          <div className={`${styles.accessCheckIcon} ${styles.locked}`}>
            <Lock className="w-10 h-10" />
          </div>
          <h2 className={styles.accessCheckTitle}>لا يمكن الوصول إلى المحتوى</h2>
          <p className={styles.accessCheckMessage}>
            {accessCheck?.message || 'لقد تجاوزت الحد الأقصى لعدد المشاهدات'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.textViewerWrapper}>
      <div className={styles.premiumCard}>
        <div className={styles.premiumCardHeader}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.heading3}>{content.title}</h1>
              {content.description && (
                <p className={styles.textBody}>{content.description}</p>
              )}
            </div>
            <div className={styles.badgeGroup}>
              {!accessCheck.isCompleted && (
                <span className={`${styles.premiumBadge} ${styles.premiumBadgePrimary}`}>
                  متبقي {accessCheck.remainingAttempts} مشاهدات
                </span>
              )}
              {accessCheck.isCompleted && (
                <span className={`${styles.premiumBadge} ${styles.premiumBadgeSuccess}`}>
                  <CheckCircle className="w-3 h-3" />
                  مكتمل
                </span>
              )}
            </div>
          </div>
        </div>
        <div className={styles.premiumCardBody}>
          <div 
            className={styles.textContent}
            dangerouslySetInnerHTML={{ __html: content.content_url || 'لا يوجد محتوى نصي متاح' }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================
export default function ContentPage() {
  const params = useParams();
  const router = useRouter();
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

  const { contentId } = params;

  const [content, setContent] = useState<LectureContent | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [packageId, setPackageId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [contentId]);

  const loadData = async () => {
    if (!contentId) {
      setError('معرف المحتوى غير صحيح');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('يجب تسجيل الدخول أولاً');
        setIsLoading(false);
        return;
      }

      setUserId(user.id);

      const { data: contentData, error: contentError } = await supabase
        .from('lecture_contents')
        .select(`
          *,
          lectures:lecture_id (
            package_id
          )
        `)
        .eq('id', contentId)
        .eq('is_active', true)
        .single();

      if (contentError || !contentData) {
        setError('المحتوى غير موجود أو غير متاح');
        setIsLoading(false);
        return;
      }

      const packageIdFromLecture = (contentData as LectureContent & { lectures?: { package_id?: string } }).lectures?.package_id;
      setPackageId(packageIdFromLecture || '');

      const { data: userPackage, error: packageError } = await supabase
        .from('user_packages')
        .select('*')
        .eq('user_id', user.id)
        .eq('package_id', packageIdFromLecture)
        .eq('is_active', true)
        .single();

      if (packageError || !userPackage) {
        setError('ليس لديك صلاحية الوصول إلى هذا المحتوى');
        setIsLoading(false);
        return;
      }

      if ((userPackage as { expires_at?: string }).expires_at && new Date((userPackage as { expires_at?: string }).expires_at!) < new Date()) {
        setError('لقد انتهت صلاحية اشتراكك في هذه الحزمة');
        setIsLoading(false);
        return;
      }

      setContent(contentData as LectureContent);
    } catch (err) {
      console.error('Error loading content page:', err);
      setError('حدث خطأ أثناء تحميل الصفحة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    router.push('/dashboard');
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'exam':
        return <HelpCircle className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getContentLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'فيديو تعليمي';
      case 'pdf':
        return 'ملف PDF';
      case 'exam':
        return 'امتحان';
      case 'text':
        return 'محتوى نصي';
      default:
        return 'محتوى';
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p>جاري تحميل المحتوى...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.accessCheckCard}>
          <div className={`${styles.accessCheckIcon} ${styles.error}`}>
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className={styles.accessCheckTitle}>خطأ</h2>
          <p className={styles.accessCheckMessage}>{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className={`${styles.premiumBtn} ${styles.premiumBtnPrimary} mt-4`}
          >
            <ArrowRight className="w-4 h-4" />
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  if (!content || !userId) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.accessCheckCard}>
          <div className={`${styles.accessCheckIcon} ${styles.error}`}>
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className={styles.accessCheckTitle}>خطأ</h2>
          <p className={styles.accessCheckMessage}>لم يتم العثور على المحتوى</p>
          <button
            onClick={() => router.push('/dashboard')}
            className={`${styles.premiumBtn} ${styles.premiumBtnPrimary} mt-4`}
          >
            <ArrowRight className="w-4 h-4" />
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerContent}>
            <button
              onClick={() => router.push('/dashboard')}
              className={styles.backButton}
            >
              <ArrowRight className="w-5 h-5" />
              <span>العودة</span>
            </button>

            <div className={styles.badgeGroup}>
              {getContentIcon(content.type)}
              <span className={`${styles.premiumBadge} ${
                content.type === 'video' ? styles.premiumBadgePrimary :
                content.type === 'exam' ? styles.premiumBadgeWarning :
                styles.premiumBadgeNeutral
              }`}>
                {getContentLabel(content.type)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {content.type === 'video' && (
          <VideoPlayer
            content={content}
            userId={userId}
            packageId={packageId}
            onComplete={handleComplete}
          />
        )}

        {content.type === 'exam' && (
          <ExamViewer
            content={content}
            userId={userId}
            packageId={packageId}
            onComplete={handleComplete}
          />
        )}

        {content.type === 'pdf' && (
          <PDFViewer
            content={content}
            userId={userId}
            packageId={packageId}
          />
        )}

        {content.type === 'text' && (
          <TextViewer
            content={content}
            userId={userId}
            packageId={packageId}
          />
        )}
      </main>
    </div>
  );
}