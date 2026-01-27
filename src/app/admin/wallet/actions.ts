'use server';

import { searchUser, addWalletFunds, getRecentTransactions } from '@/lib/database/admin';

export async function searchUserAction(identifier: string) {
  try {
    const user = await searchUser(identifier);
    return { success: true, data: user };
  } catch (error) {
    console.error('Search error:', error);
    return { success: false, error: 'حدث خطأ أثناء البحث' };
  }
}

export async function addWalletFundsAction(userId: string, amount: number, description: string) {
  try {
    const result = await addWalletFunds(userId, amount, description);
    return { success: true, data: result };
  } catch (error) {
    console.error('Add funds error:', error);
    return { success: false, error: 'حدث خطأ أثناء إضافة الأموال' };
  }
}

export async function getRecentTransactionsAction(limit: number) {
  try {
    const transactions = await getRecentTransactions(limit);
    return { success: true, data: transactions };
  } catch (error) {
    console.error('Load transactions error:', error);
    return { success: false, error: 'حدث خطأ أثناء تحميل العمليات' };
  }
}
