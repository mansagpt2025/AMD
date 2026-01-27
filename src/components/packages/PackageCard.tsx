'use client'

import { motion } from 'framer-motion'
import { 
  PlayCircle, Clock, Shield, Rocket, 
  ArrowRight, CheckCircle2, Sparkles,
  Zap, Crown, Star
} from 'lucide-react'
import Image from 'next/image'
import styles from './PackageCard.module.css'

interface PackageCardProps {
  pkg: any
  index: number
  isPurchased: boolean
  onPurchase?: () => void
  onEnter?: () => void
  theme: any
  isHighlighted?: boolean
}

export default function PackageCard({ 
  pkg, 
  index, 
  isPurchased, 
  onPurchase, 
  onEnter, 
  theme,
  isHighlighted = false
}: PackageCardProps) {
  const getTypeIcon = () => {
    switch (pkg.type) {
      case 'weekly': return <Clock className={styles.typeIcon} />
      case 'monthly': return <Calendar className={styles.typeIcon} />
      case 'term': return <BookOpen className={styles.typeIcon} />
      case 'offer': return <Crown className={styles.typeIcon} />
      default: return <Star className={styles.typeIcon} />
    }
  }

  const getTypeLabel = () => {
    switch (pkg.type) {
      case 'weekly': return 'أسبوعي'
      case 'monthly': return 'شهري'
      case 'term': return 'ترم كامل'
      case 'offer': return 'عرض خاص'
      default: return 'خاص'
    }
  }

  const getTypeColor = () => {
    switch (pkg.type) {
      case 'weekly': return '#3b82f6'
      case 'monthly': return '#8b5cf6'
      case 'term': return '#10b981'
      case 'offer': return '#f59e0b'
      default: return '#6366f1'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.3 }
      }}
      className={styles.packageCardContainer}
    >
      {/* Highlight Badge */}
      {isHighlighted && (
        <div 
          className={styles.highlightBadge}
          style={{ 
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.primary})`,
            boxShadow: `0 10px 30px ${theme.accent}40`
          }}
        >
          <Sparkles className={styles.badgeIcon} />
          <span className={styles.badgeText}>عرض حصري</span>
        </div>
      )}

      {/* Purchased Badge */}
      {isPurchased && (
        <div 
          className={styles.purchasedBadge}
          style={{ 
            background: `linear-gradient(135deg, ${theme.success}, #10b981)`,
            boxShadow: `0 10px 30px ${theme.success}40`
          }}
        >
          <CheckCircle2 className={styles.badgeIcon} />
          <span className={styles.badgeText}>مشترك</span>
        </div>
      )}

      <div className={`${styles.card} ${isHighlighted ? styles.highlightedCard : ''}`}>
        {/* Card Header - Image */}
        <div className={styles.imageSection}>
          <div className={styles.imageContainer}>
            {pkg.image_url ? (
              <div className={styles.imageWrapper}>
                <Image
                  src={pkg.image_url}
                  alt={pkg.name}
                  fill
                  className={styles.packageImage}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={index < 3}
                />
                <div className={styles.imageOverlay} />
              </div>
            ) : (
              <div 
                className={styles.imagePlaceholder}
                style={{ background: `linear-gradient(135deg, ${theme.primary}20, ${theme.secondary}20)` }}
              >
                <div className={styles.placeholderIcon}>📚</div>
              </div>
            )}
            
            {/* Package Type */}
            <div 
              className={styles.typeBadge}
              style={{ 
                background: `linear-gradient(135deg, ${getTypeColor()}, ${getTypeColor()}CC)`,
                boxShadow: `0 8px 24px ${getTypeColor()}40`
              }}
            >
              <div className={styles.typeBadgeContent}>
                {getTypeIcon()}
                <span className={styles.typeLabel}>{getTypeLabel()}</span>
              </div>
            </div>

            {/* Hover Effect */}
            <div className={styles.hoverEffect}>
              <div className={styles.hoverGlow} />
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className={styles.contentSection}>
          {/* Title & Description */}
          <div className={styles.titleSection}>
            <h3 className={styles.packageTitle} style={{ color: theme.text }}>
              {pkg.name}
            </h3>
            <p className={styles.packageDescription}>
              {pkg.description || `باقة ${getTypeLabel()} متكاملة للصف ${pkg.grade === 'first' ? 'الأول' : pkg.grade === 'second' ? 'الثاني' : 'الثالث'}`}
            </p>
          </div>

          {/* Stats */}
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statIconContainer}>
                <PlayCircle className={styles.statIcon} style={{ color: theme.primary }} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue} style={{ color: theme.text }}>
                  {pkg.lecture_count || 0}
                </div>
                <div className={styles.statLabel}>محاضرة</div>
              </div>
            </div>
            
            <div className={styles.statItem}>
              <div className={styles.statIconContainer}>
                <Clock className={styles.statIcon} style={{ color: theme.primary }} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue} style={{ color: theme.text }}>
                  {pkg.duration_days || 30}
                </div>
                <div className={styles.statLabel}>يوم</div>
              </div>
            </div>
            
            <div className={styles.statItem}>
              <div className={styles.statIconContainer}>
                <Shield className={styles.statIcon} style={{ color: theme.primary }} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue} style={{ color: theme.text }}>
                  نعم
                </div>
                <div className={styles.statLabel}>ضمان</div>
              </div>
            </div>
          </div>

          {/* Price & Action */}
          <div className={styles.actionSection}>
            <div className={styles.priceContainer}>
              <div className={styles.priceLabel}>السعر</div>
              <div className={styles.priceWrapper}>
                <span className={styles.priceAmount} style={{ color: theme.text }}>
                  {(pkg.price || 0).toLocaleString()}
                </span>
                <span className={styles.priceCurrency}>جنيه</span>
                {isHighlighted && pkg.price && (
                  <span className={styles.originalPrice}>
                    {Math.round(pkg.price * 1.3).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={isPurchased ? onEnter : onPurchase}
              disabled={!pkg.is_active}
              className={`${styles.actionButton} ${
                isPurchased 
                  ? styles.enterButton
                  : isHighlighted
                  ? styles.highlightedButton
                  : styles.purchaseButton
              }`}
              style={isPurchased ? { background: theme.success } : isHighlighted ? { 
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.primary})`
              } : { background: theme.primary }}
            >
              <span className={styles.buttonText}>
                {isPurchased ? 'دخول للباقة' : !pkg.is_active ? 'غير متاحة' : 'اشترك الآن'}
              </span>
              {isPurchased ? (
                <ArrowRight className={styles.buttonIcon} />
              ) : (
                <Rocket className={styles.buttonIcon} />
              )}
            </button>
          </div>

          {/* Features */}
          <div className={styles.featuresSection}>
            <div className={styles.featureItem}>
              <Zap className={styles.featureIcon} style={{ color: theme.primary }} />
              <span>دروس حية أسبوعية</span>
            </div>
            <div className={styles.featureItem}>
              <Shield className={styles.featureIcon} style={{ color: theme.primary }} />
              <span>شهادة إتمام معتمدة</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Icon components
const Calendar = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const BookOpen = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)