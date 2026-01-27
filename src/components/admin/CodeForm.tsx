import React, { useState, useEffect, useCallback } from 'react';
import { codesService } from '../../services/codesService';
import { supabase } from '../../lib/supabaseClient';
import styles from './CodeForm.module.css';

interface Package {
  id: string;
  name: string;
  grade: string;
  type: string;
  duration_days?: number;
}

interface CodeFormProps {
  onCodeCreated: () => void;
  onError?: (errorMessage: string) => void;
}

export const CodeForm: React.FC<CodeFormProps> = ({ onCodeCreated, onError }) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPackages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('id, name, grade, type, duration_days')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      const errorMessage = 'خطأ في جلب الباقات: ' + (error instanceof Error ? error.message : 'خطأ غير معروف');
      setMessage(errorMessage);
      onError?.(errorMessage);
      console.error('Error fetching packages:', error);
    }
  }, [onError]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPackageId || !selectedGrade) {
      const errorMsg = 'يرجى تحديد الباقة والصف';
      setMessage(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    setLoading(true);
    setMessage('');
    
    try {
      const newCode = await codesService.createCode(selectedPackageId, selectedGrade);
      setGeneratedCode(newCode.code);
      setMessage('✓ تم إنشاء الكود بنجاح!');
      setSelectedPackageId('');
      setSelectedGrade('');
      
      setTimeout(() => {
        setGeneratedCode('');
        setMessage('');
      }, 5000);

      onCodeCreated();
    } catch (error) {
      const errorMsg = 'خطأ في إنشاء الكود: ' + (error instanceof Error ? error.message : 'خطأ غير معروف');
      setMessage(errorMsg);
      onError?.(errorMsg);
      console.error('Error creating code:', error);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const gradeOptions = [
    { value: 'first', label: 'الصف الأول' },
    { value: 'second', label: 'الصف الثاني' },
    { value: 'third', label: 'الصف الثالث' },
  ];

  const handlePackageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPackageId(e.target.value);
    setMessage('');
  };

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGrade(e.target.value);
    setMessage('');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setMessage('✓ تم نسخ الكود إلى الحافظة');
      setTimeout(() => {
        if (!generatedCode) setMessage('');
      }, 2000);
    } catch (err) {
      setMessage('✗ فشل نسخ الكود');
    }
  };

  const getPackageName = (pkgId: string) => {
    const pkg = packages.find(p => p.id === pkgId);
    return pkg ? `${pkg.name} - ${pkg.grade}` : '';
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h2 className={styles.title}>إنشاء كود تفعيل</h2>
          <div className={styles.infoIcon} title="إنشاء أكواد تفعيل للطلاب">
            ℹ️
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="package" className={styles.label}>
              <span className={styles.required}>*</span> الباقة
            </label>
            <select
              id="package"
              value={selectedPackageId}
              onChange={handlePackageChange}
              className={styles.select}
              required
              disabled={loading}
            >
              <option value="">اختر الباقة</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} - {pkg.grade} ({pkg.type})
                </option>
              ))}
            </select>
            {selectedPackageId && (
              <div className={styles.packageInfo}>
                {getPackageName(selectedPackageId)}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="grade" className={styles.label}>
              <span className={styles.required}>*</span> الصف
            </label>
            <select
              id="grade"
              value={selectedGrade}
              onChange={handleGradeChange}
              className={styles.select}
              required
              disabled={loading}
            >
              <option value="">اختر الصف</option>
              {gradeOptions.map((grade) => (
                <option key={grade.value} value={grade.value}>
                  {grade.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || isSubmitting || !selectedPackageId || !selectedGrade}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                جاري الإنشاء...
              </>
            ) : (
              'توليد الكود'
            )}
          </button>
        </form>

        {message && (
          <div className={`${styles.message} ${message.includes('✓') ? styles.success : styles.error}`}>
            <span className={styles.messageIcon}>
              {message.includes('✓') ? '✓' : '✗'}
            </span>
            <span className={styles.messageText}>{message}</span>
          </div>
        )}

        {generatedCode && (
          <div className={styles.codeDisplay}>
            <p className={styles.codeLabel}>الكود المُنشأ:</p>
            <div className={styles.codeBox}>
              <span className={styles.code}>{generatedCode}</span>
              <div className={styles.codeActions}>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className={styles.copyBtn}
                  title="نسخ الكود"
                >
                  📋 نسخ
                </button>
                <button
                  type="button"
                  onClick={() => setGeneratedCode('')}
                  className={styles.closeBtn}
                  title="إغلاق"
                >
                  ✕
                </button>
              </div>
            </div>
            <p className={styles.codeHint}>
              ⏱️ هذا الكود صالح للاستخدام مرة واحدة فقط
            </p>
          </div>
        )}
      </div>
    </div>
  );
};