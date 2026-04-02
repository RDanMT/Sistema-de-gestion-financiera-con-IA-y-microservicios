import { create } from 'zustand';
import { loansAPI, transactionsAPI } from '../services/api';

export const useFinanceStore = create((set, get) => ({
  loans: [],
  transactions: [],
  summary: null,
  selectedLoan: null,
  amortizationTable: [],
  isLoading: false,
  error: null,

  // ── Préstamos ──────────────────
  fetchLoans: async () => {
    set({ isLoading: true });
    try {
      const { data } = await loansAPI.getAll();
      set({ loans: data.data, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.error, isLoading: false });
    }
  },

  createLoan: async (loanData) => {
    try {
      const { data } = await loansAPI.create(loanData);
      await get().fetchLoans(); // <--- Sincronizar instantáneamente con el backend
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.error };
    }
  },

  fetchAmortization: async (loanId) => {
    set({ isLoading: true });
    try {
      const { data } = await loansAPI.getAmortization(loanId);
      set({ amortizationTable: data.data.tabla, isLoading: false });
      return data.data;
    } catch (err) {
      set({ isLoading: false });
      return null;
    }
  },

  simulateExtraPayment: async (loanId, porcentajeExtra) => {
    try {
      const { data } = await loansAPI.simulateExtraPayment(loanId, {
        porcentaje_extra: porcentajeExtra,
      });
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.error };
    }
  },

  // ── Transacciones ──────────────────
  fetchTransactions: async (params) => {
    set({ isLoading: true });
    try {
      const { data } = await transactionsAPI.getAll(params);
      set({ transactions: data.data, isLoading: false });
      return data;
    } catch (err) {
      set({ error: err.response?.data?.error, isLoading: false });
    }
  },

  createTransaction: async (txData) => {
    try {
      const { data } = await transactionsAPI.create(txData);
      await get().fetchTransactions();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error };
    }
  },

  fetchSummary: async (mes, anio) => {
    try {
      const { data } = await transactionsAPI.getSummary({ mes, anio });
      set({ summary: data.data });
      return data.data;
    } catch {
      return null;
    }
  },

  deleteTransaction: async (id) => {
    try {
      await transactionsAPI.delete(id);
      set((state) => ({ transactions: state.transactions.filter((t) => t._id !== id) }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error };
    }
  },

  setSelectedLoan: (loan) => set({ selectedLoan: loan }),
  clearError: () => set({ error: null }),
}));
