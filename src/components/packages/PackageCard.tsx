'use client'

import { motion } from 'framer-motion'
import { 
  PlayCircle, Clock, Shield, Rocket, 
  ArrowRight, CheckCircle2, Sparkles
} from 'lucide-react'
import Image from 'next/image'

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
      case 'weekly': return <Clock className="w-4 h-4" />
      case 'monthly': return '🗓️'
      case 'term': return '📚'
      case 'offer': return <Sparkles className="w-4 h-4" />
      default: return '⭐'
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="relative group"
    >
      {/* Highlight Badge */}
      {isHighlighted && (
        <div 
          className="absolute -top-3 -right-3 z-10 px-4 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1"
          style={{ background: theme.accent }}
        >
          <Sparkles className="w-3 h-3" />
          عرض حصري
        </div>
      )}

      {/* Purchased Badge */}
      {isPurchased && (
        <div 
          className="absolute -top-3 -right-3 z-10 px-4 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1"
          style={{ background: theme.success }}
        >
          <CheckCircle2 className="w-3 h-3" />
          مشترك
        </div>
      )}

      <div className={`rounded-2xl overflow-hidden border-2 transition-all duration-300 group-hover:shadow-xl ${
        isHighlighted ? 'border-orange-200' : isPurchased ? 'border-green-200' : 'border-gray-200'
      }`}>
        {/* Card Header - Image */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {pkg.image_url ? (
            <div className="relative w-full h-full">
              <Image
                src={pkg.image_url}
                alt={pkg.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: theme.primary + '20' }}>
              <div className="text-4xl">📚</div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          
          {/* Package Type */}
          <div className="absolute top-4 left-4">
            <div 
              className="px-3 py-1 rounded-full text-sm font-medium text-white flex items-center gap-1"
              style={{ background: theme.primary + 'CC' }}
            >
              {getTypeIcon()}
              <span>{getTypeLabel()}</span>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 bg-white">
          {/* Title & Description */}
          <h3 className="text-xl font-bold mb-2" style={{ color: theme.text }}>
            {pkg.name}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {pkg.description}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <PlayCircle className="w-4 h-4" style={{ color: theme.primary }} />
                <span className="text-sm text-gray-600">محاضرات</span>
              </div>
              <span className="font-bold text-lg" style={{ color: theme.text }}>
                {pkg.lecture_count}
              </span>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4" style={{ color: theme.primary }} />
                <span className="text-sm text-gray-600">مدة</span>
              </div>
              <span className="font-bold text-lg" style={{ color: theme.text }}>
                {pkg.duration_days} يوم
              </span>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Shield className="w-4 h-4" style={{ color: theme.primary }} />
                <span className="text-sm text-gray-600">ضمان</span>
              </div>
              <span className="font-bold text-lg" style={{ color: theme.text }}>
                نعم
              </span>
            </div>
          </div>

          {/* Price & Action */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500 mb-1">السعر</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold" style={{ color: theme.text }}>
                  {pkg.price.toLocaleString()}
                </span>
                <span className="text-gray-600">جنيه</span>
                {isHighlighted && (
                  <span className="text-sm line-through text-gray-400 mr-2">
                    {Math.round(pkg.price * 1.3).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={isPurchased ? onEnter : onPurchase}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                isPurchased 
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : isHighlighted
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'text-white'
              }`}
              style={!isPurchased && !isHighlighted ? { background: theme.primary } : {}}
            >
              {isPurchased ? (
                <>
                  دخول للباقة
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  اشترك الآن
                  <Rocket className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}