'use client';

import { useState, useEffect } from 'react';
import { PackageForm } from './components/PackageForm';
import { PackageList } from './components/PackageList';
import { LectureForm } from './components/LectureForm';
import { LectureList } from './components/LectureList';
import { ContentForm } from './components/ContentForm';
import { ContentList } from './components/ContentList';
import { getPackages, getLectures, getContents } from './actions';
import type { Database } from '@/types/supabase';
import styles from './page.module.css';

type Package = Database['public']['Tables']['packages']['Row'];
type Lecture = Database['public']['Tables']['lectures']['Row'] & {
  packages?: {
    name: string;
  } | null;
};

type Content = Database['public']['Tables']['lecture_contents']['Row'] & {
  lectures?: {
    title: string;
  } | null;
};

export default function FirstSecondaryPage() {
  const [activeTab, setActiveTab] = useState<'packages' | 'lectures' | 'contents'>('packages');
  const [packages, setPackages] = useState<Package[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [packagesData, lecturesData, contentsData] = await Promise.all([
        getPackages(),
        getLectures(),
        getContents()
      ]);
      setPackages(packagesData);
      setLectures(lecturesData);
      setContents(contentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg);
    setActiveTab('lectures');
  };

  const handleLectureSelect = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setActiveTab('contents');
  };

  const handlePackageCreated = async () => {
    const packagesData = await getPackages();
    setPackages(packagesData);
  };

  const handleLectureCreated = async () => {
    const lecturesData = await getLectures();
    setLectures(lecturesData);
  };

  const handleContentCreated = async () => {
    const contentsData = await getContents();
    setContents(contentsData);
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>إدارة الصف الأول الثانوي</h1>
        <p className={styles.subtitle}>إدارة الباقات والمحاضرات والمحتوى التعليمي</p>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'packages' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('packages')}
        >
          الباقات ({packages.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'lectures' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('lectures')}
        >
          المحاضرات ({lectures.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'contents' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('contents')}
        >
          المحتوى ({contents.length})
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'packages' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>إنشاء باقة جديدة</h2>
            </div>
            <PackageForm onSuccess={handlePackageCreated} />
            
            <div className={styles.sectionHeader}>
              <h2>الباقات المتاحة</h2>
              <span className={styles.count}>{packages.length} باقة</span>
            </div>
            <PackageList 
              packages={packages} 
              onSelect={handlePackageSelect}
              onUpdate={handlePackageCreated}
            />
          </div>
        )}

        {activeTab === 'lectures' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>إنشاء محاضرة جديدة</h2>
              {selectedPackage && (
                <div className={styles.selectedInfo}>
                  <span>للباقة:</span>
                  <strong>{selectedPackage.name}</strong>
                  <button 
                    className={styles.clearSelection}
                    onClick={() => setSelectedPackage(null)}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            <LectureForm 
              packages={packages}
              selectedPackageId={selectedPackage?.id}
              onSuccess={handleLectureCreated}
            />
            
            <div className={styles.sectionHeader}>
              <h2>المحاضرات المتاحة</h2>
              <span className={styles.count}>{lectures.length} محاضرة</span>
            </div>
            <LectureList 
              lectures={lectures}
              onSelect={handleLectureSelect}
              onUpdate={handleLectureCreated}
            />
          </div>
        )}

        {activeTab === 'contents' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>إنشاء محتوى جديد</h2>
              {selectedLecture && (
                <div className={styles.selectedInfo}>
                  <span>للمحاضرة:</span>
                  <strong>{selectedLecture.title}</strong>
                  <button 
                    className={styles.clearSelection}
                    onClick={() => setSelectedLecture(null)}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            <ContentForm 
              lectures={lectures}
              selectedLectureId={selectedLecture?.id}
              onSuccess={handleContentCreated}
            />
            
            <div className={styles.sectionHeader}>
              <h2>المحتوى المتاح</h2>
              <span className={styles.count}>{contents.length} عنصر</span>
            </div>
            <ContentList 
              contents={contents}
              onUpdate={handleContentCreated}
            />
          </div>
        )}
      </div>
    </div>
  );
}