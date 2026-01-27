'use client';

import { useState } from 'react';
import { Search, Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './page.module.css';

export default function WalletPage() {
  const [searchType, setSearchType] = useState<'phone' | 'email'>('phone');
  const [identifier, setIdentifier] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userData, setUserData] = useState<any>(null);

  const handleSearch = async () => {
    if (!identifier.trim()) {
      setMessage({ type: 'error', text: 'الرجاء إدخال رقم الهاتف أو البريد الإلكتروني' });
      return;
    }

    setLoading(true);
    try {
      // هنا سيتم استدعاء API للبحث عن المستخدم
      const mockUser = {
        id: '123',
        fullName: 'أحمد محمد',
        email: 'ahmed@example.com',
        phone: '01012345678',
        currentBalance: 1500
      };
      setUserData(mockUser);
      setMessage(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'لم يتم العثور على المستخدم' });
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
      // هنا سيتم استدعاء API لإضافة الأموال
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setMessage({ 
        type: 'success', 
        text: `تم إضافة ${amount} جنيه إلى محفظة ${userData.fullName} بنجاح` 
      });
      
      // تحديث الرصيد الظاهري
      setUserData({
        ...userData,
        currentBalance: userData.currentBalance + parseFloat(amount)
      });
      
      setAmount('');
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء إضافة الأموال' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Wallet className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className={styles.title}>المحفظة</h1>
            <p className={styles.subtitle}>إدارة أرصدة الطلاب وإضافة الأموال</p>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.searchSection}>
          <div className={styles.searchCard}>
            <h2 className={styles.cardTitle}>البحث عن الطالب</h2>
            
            <div className={styles.searchType}>
              <button
                className={`${styles.searchTypeBtn} ${searchType === 'phone' ? styles.active : ''}`}
                onClick={() => setSearchType('phone')}
              >
                البحث برقم الهاتف
              </button>
              <button
                className={`${styles.searchTypeBtn} ${searchType === 'email' ? styles.active : ''}`}
                onClick={() => setSearchType('email')}
              >
                البحث بالبريد الإلكتروني
              </button>
            </div>

            <div className={styles.searchInputGroup}>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={searchType === 'phone' ? 'أدخل رقم الهاتف' : 'أدخل البريد الإلكتروني'}
                className={styles.searchInput}
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className={styles.searchButton}
              >
                <Search className="w-5 h-5" />
                بحث
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
                  {userData.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className={styles.userName}>{userData.fullName}</h3>
                  <div className={styles.userDetails}>
                    <span>📧 {userData.email}</span>
                    <span>📱 {userData.phone}</span>
                  </div>
                </div>
              </div>

              <div className={styles.balanceCard}>
                <span className={styles.balanceLabel}>الرصيد الحالي</span>
                <div className={styles.balanceAmount}>
                  <Wallet className="w-6 h-6 text-green-600" />
                  <span className={styles.amount}>{userData.currentBalance.toLocaleString()} جنيه</span>
                </div>
              </div>
            </div>

            <div className={styles.addFundsCard}>
              <h3 className={styles.cardTitle}>إضافة أموال</h3>
              
              <div className={styles.amountInputGroup}>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="المبلغ بالجنيه"
                  className={styles.amountInput}
                  min="1"
                />
                <span className={styles.currency}>جنيه</span>
              </div>

              <button
                onClick={handleAddFunds}
                disabled={loading || !amount}
                className={styles.addButton}
              >
                {loading ? 'جاري الإضافة...' : 'إضافة إلى المحفظة'}
              </button>

              <div className={styles.quickAmounts}>
                <span>المبالغ السريعة:</span>
                {[100, 200, 500, 1000].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setAmount(quickAmount.toString())}
                    className={styles.quickAmountBtn}
                  >
                    {quickAmount} جنيه
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={styles.transactionsSection}>
          <h2 className={styles.sectionTitle}>آخر العمليات</h2>
          <div className={styles.transactionsList}>
            {transactions.map((transaction, index) => (
              <div key={index} className={styles.transactionItem}>
                <div className={styles.transactionIcon}>
                  {transaction.type === 'add' ? '➕' : '➖'}
                </div>
                <div className={styles.transactionDetails}>
                  <div className={styles.transactionHeader}>
                    <span className={styles.transactionUser}>{transaction.user}</span>
                    <span className={`${styles.transactionAmount} ${transaction.type === 'add' ? styles.positive : styles.negative}`}>
                      {transaction.amount} جنيه
                    </span>
                  </div>
                  <span className={styles.transactionTime}>{transaction.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const transactions = [
  { user: 'أحمد محمد', amount: 500, type: 'add', time: 'قبل 5 دقائق' },
  { user: 'محمد علي', amount: 300, type: 'add', time: 'قبل ساعة' },
  { user: 'سارة أحمد', amount: 200, type: 'add', time: 'قبل 3 ساعات' },
  { user: 'علي حسن', amount: 1000, type: 'add', time: 'أمس' },
];