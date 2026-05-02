import { 
  collection, doc, setDoc, getDoc, getDocs, query, where, 
  deleteDoc, onSnapshot, serverTimestamp, updateDoc,
  DocumentData, QuerySnapshot, FirestoreError, writeBatch
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Expense, Debt, Category } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || false,
    },
    operationType,
    path
  }
  console.error('[Khata Security] Firestore Error:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

export const dbService = {
  // User Profile
  async getUserProfile(userId: string) {
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, path));
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
    }
  },

  async updateUserProfile(userId: string, data: any) {
    const path = `users/${userId}`;
    try {
      const user = auth.currentUser;
      const profileData = { 
        ...data, 
        uid: userId,
        email: user?.email || '',
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, path), profileData, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  // Expenses
  async addExpense(userId: string, expense: Omit<Expense, 'id'>) {
    const path = `users/${userId}/expenses`;
    try {
      const newDoc = doc(collection(db, path));
      await setDoc(newDoc, { ...expense, id: newDoc.id, userId });
      return newDoc.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  listenToExpenses(userId: string, callback: (expenses: Expense[]) => void) {
    const path = `users/${userId}/expenses`;
    const q = collection(db, path);
    return onSnapshot(q, 
      (snap) => {
        const expenses = snap.docs.map(d => ({ ...d.data(), id: d.id } as Expense));
        callback(expenses);
      },
      (e) => handleFirestoreError(e, OperationType.LIST, path)
    );
  },

  // Debts
  async addDebt(userId: string, debt: Omit<Debt, 'id'>) {
    const path = `users/${userId}/debts`;
    try {
      const newDoc = doc(collection(db, path));
      await setDoc(newDoc, { ...debt, id: newDoc.id, userId, settled: false });
      return newDoc.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async settleDebt(userId: string, debtId: string) {
    const path = `users/${userId}/debts/${debtId}`;
    try {
      await updateDoc(doc(db, path), { settled: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async deleteExpense(userId: string, expenseId: string) {
    const path = `users/${userId}/expenses/${expenseId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  async updateExpense(userId: string, expenseId: string, data: Partial<Expense>) {
    const path = `users/${userId}/expenses/${expenseId}`;
    try {
      await updateDoc(doc(db, path), data as DocumentData);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async resetExpenses(userId: string) {
    const path = `users/${userId}/expenses`;
    try {
      const batch = writeBatch(db);
      const snap = await getDocs(collection(db, path));
      
      if (snap.empty) return;
      
      snap.docs.forEach(d => {
        batch.delete(d.ref);
      });
      
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  async deleteDebt(userId: string, debtId: string) {
    const path = `users/${userId}/debts/${debtId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  async resetDebts(userId: string) {
    const path = `users/${userId}/debts`;
    try {
      const batch = writeBatch(db);
      const snap = await getDocs(collection(db, path));
      if (snap.empty) return;
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  listenToDebts(userId: string, callback: (debts: Debt[]) => void) {
    const path = `users/${userId}/debts`;
    const q = collection(db, path);
    return onSnapshot(q, 
      (snap) => {
        const debts = snap.docs.map(d => ({ ...d.data(), id: d.id } as Debt));
        callback(debts);
      },
      (e) => handleFirestoreError(e, OperationType.LIST, path)
    );
  }
};
