import React, { useState, useEffect } from 'react';
import { codesService } from '../../services/codesService';
import { supabase } from '../../lib/supabaseClient';
import styles from './CodeForm.module.css';

interface Package {
  id: string;
  name: string;
  grade: string;
}

export const CodeForm: React.FC<{ onCodeCreated: () => void }> = ({ onCodeCreated }) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('id, name, grade')
        .eq('is_active', true);

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setMessage('خطأ في جلب الباقات');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPackageId || !selectedGrade) {
      setMessage('يرجى تحديد الباقة والصف');
      return;
    }

    setLoading(true);
    try {
      const newCode = await codesService.createCode(selectedPackageId, selectedGrade);
      setGeneratedCode(newCode.code);
      setMessage('✓ تم إنشاء الكود بنجاح!');
      setSelectedPackageId('');
      setSelectedGrade('');
      
      setTimeout(() => {
        setGeneratedCode('');
        setMessage('');
      }, 3000);

      onCodeCreated();
    } catch (error) {
      setMessage('خطأ في إنشاء الكود');
      console.error('Error creating code:', error);
    } finally {
      setLoading(false);
    }
  };

  const gradeOptions = [
    { value: 'first', label: 'الصف الأول' },
    { value: 'second', label: 'الصف الثاني' },
    { value: 'third', label: 'الصف الثالث' },
  ];

  return (
    <div className={styles.formContainer}>
      <div className={styles.formCard}>
        <h2 className={styles.title}>إنشاء كود تفعيل</h2>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="package" className={styles.label}>الباقة</label>
            <select
              id="package"
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              className={styles.select}
              required
            >
              <option value="">اختر الباقة</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} - {pkg.grade}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="grade" className={styles.label}>الصف</label>
            <select
              id="grade"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className={styles.select}
              required
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
            disabled={loading}
          >
            {loading ? 'جاري الإنشاء...' : 'توليد الكود'}
          </button>
        </form>

        {message && (
          <div className={`${styles.message} ${generatedCode ? styles.success : styles.error}`}>
            {message}
          </div>
        )}

        {generatedCode && (
          <div className={styles.codeDisplay}>
            <p className={styles.codeLabel}>الكود المُنشأ:</p>
            <div className={styles.codeBox}>
              <span className={styles.code}>{generatedCode}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode);
                  setMessage('✓ تم نسخ الكود');
                }}
                className={styles.copyBtn}
              >
                📋 نسخ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
