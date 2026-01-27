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
    console.log('Starting addWalletFundsAction:', { userId, amount, description });
    
    const result = await addWalletFunds(userId, amount, description);
    
    console.log('addWalletFunds result:', result);
    
    if (!result.success) {
      return { success: false, error: result.message };
    }

    return { 
      success: true, 
      data: result,
      newBalance: result.newBalance 
    };
  } catch (error) {
    console.error('Add funds error:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة الأموال';
    return { success: false, error: errorMessage };
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
