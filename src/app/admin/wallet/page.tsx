'use client';

import { useState, useEffect } from 'react';
import { Search, Wallet, AlertCircle, CheckCircle, User, CreditCard, History } from 'lucide-react';
import styles from './page.module.css';
import { searchUserAction, addWalletFundsAction, getRecentTransactionsAction } from './actions';
import { createClient } from '@/lib/supabase';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  grade: string;
  role: string;
  created_at: string;
  wallets: { balance: number }[];
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function WalletPage() {
  const [searchType, setSearchType] = useState<'phone' | 'email'>('phone');
  const [identifier, setIdentifier] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [description, setDescription] = useState('');

  // جلب آخر العمليات عند تحميل الصفحة
  useEffect(() => {
    loadRecentTransactions();
  }, []);

  const loadRecentTransactions = async () => {
    try {
      const result = await getRecentTransactionsAction(5);
      if (result.success) {
        setRecentTransactions(result.data as any);
      } else {
        console.error('Error loading transactions:', result.error);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleSearch = async () => {
    if (!identifier.trim()) {
      setMessage({ type: 'error', text: 'الرجاء إدخال رقم الهاتف أو البريد الإلكتروني' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await searchUserAction(identifier);
      if (result.success && result.data) {
        setUserData(result.data);
        setMessage({ type: 'success', text: 'تم العثور على المستخدم بنجاح' });
      } else {
        setMessage({ type: 'error', text: 'لم يتم العثور على المستخدم' });
        setUserData(null);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء البحث' });
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    if (!userData || !amount || parseFloat(amount) <= 0) {
      setMessage({ type: 'error', text: 'الرجاء إدخال مبلغ صحيح' });
      return;
    }

    setLoading(true);
    try {
      console.log('Adding funds:', { userId: userData.id, amount: parseFloat(amount), description });
      
      const result = await addWalletFundsAction(userData.id, parseFloat(amount), description);
      
      console.log('Add funds result:', result);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.data?.message || 'تم إضافة الأموال بنجاح' });
        
        // تحديث بيانات المستخدم
        const searchResult = await searchUserAction(userData.email);
        if (searchResult.success && searchResult.data) {
          setUserData(searchResult.data);
        }
        
        // تحديث قائمة العمليات
        loadRecentTransactions();
        
        // إعادة تعيين الحقول
        setAmount('');
        setDescription('');
      } else {
        setMessage({ type: 'error', text: result.error || 'حدث خطأ أثناء إضافة الأموال' });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      setMessage({ type: 'error', text: errorMsg });
      console.error('Add funds error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `قبل ${diffMins} دقيقة`;
    if (diffHours < 24) return `قبل ${diffHours} ساعة`;
    if (diffDays < 7) return `قبل ${diffDays} يوم`;
    return date.toLocaleDateString('ar-EG');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white bg-opacity-20 rounded-xl shadow-lg backdrop-blur-sm">
            <Wallet className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
          <div>
            <h1 className={styles.title}>المحفظة المالية 💰</h1>
            <p className={styles.subtitle}>إدارة أرصدة الطلاب وإضافة الأموال بسهولة وأمان</p>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.searchSection}>
          <div className={styles.searchCard}>
            <h2 className={styles.cardTitle}>
              <Search className="inline-block w-5 h-5 ml-2" />
              البحث عن الطالب
            </h2>
            
            <div className={styles.searchType}>
              <button
                type="button"
                className={`${styles.searchTypeBtn} ${searchType === 'phone' ? styles.active : ''}`}
                onClick={() => setSearchType('phone')}
              >
                📱 البحث برقم الهاتف
              </button>
              <button
                type="button"
                className={`${styles.searchTypeBtn} ${searchType === 'email' ? styles.active : ''}`}
                onClick={() => setSearchType('email')}
              >
                📧 البحث بالبريد الإلكتروني
              </button>
            </div>

            <div className={styles.searchInputGroup}>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={searchType === 'phone' ? 'أدخل رقم الهاتف (مثال: 01012345678)' : 'أدخل البريد الإلكتروني'}
                className={styles.searchInput}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={loading || !identifier}
                className={`${styles.searchButton} ${loading ? styles.loading : ''}`}
              >
                {loading ? (
                  <>
                    <div className={styles.spinner}></div>
                    جاري البحث...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    بحث
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className={`${styles.message} ${message.type === 'success' ? styles.success : styles.error}`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {userData && (
          <div className={styles.userSection}>
            <div className={styles.userCard}>
              <div className={styles.userInfo}>
                <div className={styles.userAvatar}>
                  {getInitials(userData.full_name)}
                </div>
                <div className="flex-1">
                  <h3 className={styles.userName}>{userData.full_name}</h3>
                  <div className={styles.userDetails}>
                    <span className={styles.userDetailItem}>
                      <User className="inline-block w-4 h-4 ml-1" />
                      {userData.grade}
                    </span>
                    <span className={styles.userDetailItem}>
                      📧 {userData.email}
                    </span>
                    <span className={styles.userDetailItem}>
                      📱 {userData.phone}
                    </span>
                    <span className={styles.userDetailItem}>
                      📅 عضو منذ {formatDate(userData.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.balanceCard}>
                <div className="flex items-center justify-between mb-2">
                  <span className={styles.balanceLabel}>الرصيد الحالي</span>
                  <Wallet className="w-6 h-6 text-green-100" />
                </div>
                <div className={styles.balanceAmount}>
                  <span className={styles.amount}>
                    {(userData.wallets?.[0]?.balance || 0).toLocaleString()}
                  </span>
                  <span className={styles.currency}>جنيه مصري</span>
                </div>
              </div>
            </div>

            <div className={styles.addFundsCard}>
              <h3 className={styles.cardTitle}>
                <CreditCard className="inline-block w-5 h-5 ml-2" />
                إضافة أموال للمحفظة
              </h3>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>المبلغ</label>
                <div className={styles.amountInputGroup}>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className={styles.amountInput}
                    min="1"
                    step="1"
                  />
                  <span className={styles.currencyInput}>ج.م</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>وصف العملية (اختياري)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مثال: إضافة رصيد لشراء باقة الرياضيات"
                  className={styles.descriptionInput}
                />
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3 font-semibold">المبالغ السريعة:</p>
                <div className="flex flex-wrap gap-2">
                  {[100, 200, 500, 1000, 2000].map((quickAmount) => (
                    <button
                      key={quickAmount}
                      type="button"
                      onClick={() => setAmount(quickAmount.toString())}
                      className={`px-4 py-2 text-sm font-bold rounded-lg border-2 transition-all ${
                        amount === quickAmount.toString()
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-purple-600 shadow-lg shadow-purple-500/50'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      {quickAmount} ج.م
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddFunds}
                disabled={loading || !amount || parseFloat(amount) <= 0}
                className={`${styles.addButton} ${loading ? styles.loading : ''}`}
              >
                {loading ? (
                  <>
                    <div className={styles.spinner}></div>
                    جاري الإضافة...
                  </>
                ) : (
                  'إضافة إلى المحفظة'
                )}
              </button>

              <p className="text-xs text-gray-500 mt-3 text-center font-medium">
                ✅ سيتم تحديث الرصيد فوراً وسيكون متاحاً للطالب للشراء مباشرة
              </p>
            </div>
          </div>
        )}

        <div className={styles.transactionsSection}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={styles.sectionTitle}>
              <History className="inline-block w-5 h-5 ml-2" />
              آخر العمليات
            </h2>
            <button
              onClick={loadRecentTransactions}
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 text-blue-700 font-bold rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              🔄 تحديث
            </button>
          </div>

          <div className={styles.transactionsList}>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className={styles.transactionItem}>
                  <div className={`${styles.transactionIcon} ${
                    transaction.type === 'add' ? styles.transactionAdd : 
                    transaction.type === 'deduct' ? styles.transactionDeduct : 
                    styles.transactionPurchase
                  }`}>
                    {transaction.type === 'add' ? '➕' : 
                     transaction.type === 'deduct' ? '➖' : '🛒'}
                  </div>
                  <div className={styles.transactionDetails}>
                    <div className={styles.transactionHeader}>
                      <div>
                        <span className={styles.transactionUser}>
                          {transaction.profiles.full_name}
                        </span>
                        <span className={styles.transactionDescription}>
                          {transaction.description}
                        </span>
                      </div>
                      <span className={`${styles.transactionAmount} ${
                        transaction.type === 'add' ? styles.positive : styles.negative
                      }`}>
                        {transaction.type === 'add' ? '+' : '-'}
                        {transaction.amount.toLocaleString()} ج.م
                      </span>
                    </div>
                    <div className={styles.transactionFooter}>
                      <span className={styles.transactionEmail}>
                        {transaction.profiles.email}
                      </span>
                      <span className={styles.transactionTime}>
                        {formatDate(transaction.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>لا توجد عمليات سابقة</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}