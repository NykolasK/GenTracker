import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { logger } from "../utils/logger";
import { firebaseService, type FirebaseInvoice } from "./firebaseService";

export interface UserStats {
  totalScans: number;
  totalInvoices: number;
  totalProducts: number;
  totalLists: number;
  totalSavings: number;
  totalSpent: number;
  averageInvoiceValue: number;
  mostShoppedStore: string;
  currentMonthSpent: number;
  lastUpdated: Date;
}

class StatsService {
  /**
   * Calcula todas as estatísticas do usuário baseado nas notas fiscais e listas
   */
  async calculateUserStats(userId: string): Promise<UserStats> {
    try {
      logger.info("🔢 Calculating user stats for:", userId);

      // Buscar todas as notas fiscais do usuário
      const invoices = await firebaseService.getUserInvoices(userId, 1000);
      const lists = await firebaseService.getUserShoppingLists(userId);

      // Calcular estatísticas das notas fiscais
      const totalInvoices = invoices.length;
      const totalProducts = invoices.reduce(
        (sum, invoice) => sum + invoice.items.length,
        0
      );
      const totalSpent = invoices.reduce(
        (sum, invoice) => sum + invoice.total_amount,
        0
      );
      const totalSavings = invoices.reduce(
        (sum, invoice) => sum + (invoice.discounts || 0),
        0
      );

      // Calcular valor médio das notas
      const averageInvoiceValue =
        totalInvoices > 0 ? totalSpent / totalInvoices : 0;

      // Encontrar loja mais frequente
      const storeFrequency: { [key: string]: number } = {};
      invoices.forEach((invoice) => {
        storeFrequency[invoice.store_name] =
          (storeFrequency[invoice.store_name] || 0) + 1;
      });

      const mostShoppedStore = Object.keys(storeFrequency).reduce(
        (a, b) => (storeFrequency[a] > storeFrequency[b] ? a : b),
        "Nenhuma"
      );

      // Calcular gastos do mês atual
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const currentMonthSpent = invoices
        .filter((invoice) => {
          const invoiceDate = new Date(invoice.invoice_date);
          return (
            invoiceDate.getMonth() === currentMonth &&
            invoiceDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, invoice) => sum + invoice.total_amount, 0);

      // Estatísticas das listas
      const totalLists = lists.length;

      const stats: UserStats = {
        totalScans: totalInvoices, // Cada nota escaneada é um scan
        totalInvoices,
        totalProducts,
        totalLists,
        totalSavings,
        totalSpent,
        averageInvoiceValue,
        mostShoppedStore,
        currentMonthSpent,
        lastUpdated: new Date(),
      };

      logger.info("✅ Stats calculated:", stats);
      return stats;
    } catch (error) {
      logger.error("❌ Error calculating user stats:", error);
      throw error;
    }
  }

  /**
   * Atualiza as estatísticas do usuário no Firestore
   */
  async updateUserStats(userId: string): Promise<UserStats> {
    try {
      const stats = await this.calculateUserStats(userId);

      // Atualizar documento do usuário com as novas estatísticas
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        stats: {
          totalScans: stats.totalScans,
          totalInvoices: stats.totalInvoices,
          totalProducts: stats.totalProducts,
          totalLists: stats.totalLists,
          totalSavings: this.formatCurrency(stats.totalSavings),
          totalSpent: this.formatCurrency(stats.totalSpent),
          averageInvoiceValue: this.formatCurrency(stats.averageInvoiceValue),
          mostShoppedStore: stats.mostShoppedStore,
          currentMonthSpent: this.formatCurrency(stats.currentMonthSpent),
          lastUpdated: stats.lastUpdated,
        },
      });

      logger.info("✅ User stats updated in Firestore");
      return stats;
    } catch (error) {
      logger.error("❌ Error updating user stats:", error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas detalhadas por período
   */
  async getDetailedStats(
    userId: string,
    period: "week" | "month" | "year" = "month"
  ): Promise<{
    periodSpent: number;
    periodSavings: number;
    periodInvoices: number;
    periodProducts: number;
    topCategories: { category: string; total: number; count: number }[];
    spendingTrend: { date: string; amount: number }[];
  }> {
    try {
      const invoices = await firebaseService.getUserInvoices(userId, 1000);
      const currentDate = new Date();

      // Definir período
      let startDate = new Date();
      switch (period) {
        case "week":
          startDate.setDate(currentDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(currentDate.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(currentDate.getFullYear() - 1);
          break;
      }

      // Filtrar notas do período
      const periodInvoices = invoices.filter(
        (invoice) => new Date(invoice.invoice_date) >= startDate
      );

      const periodSpent = periodInvoices.reduce(
        (sum, invoice) => sum + invoice.total_amount,
        0
      );
      const periodSavings = periodInvoices.reduce(
        (sum, invoice) => sum + (invoice.discounts || 0),
        0
      );
      const periodProducts = periodInvoices.reduce(
        (sum, invoice) => sum + invoice.items.length,
        0
      );

      // Calcular categorias mais compradas
      const categoryStats: { [key: string]: { total: number; count: number } } =
        {};

      periodInvoices.forEach((invoice) => {
        invoice.items.forEach((item) => {
          const category = item.category || "Outros";
          if (!categoryStats[category]) {
            categoryStats[category] = { total: 0, count: 0 };
          }
          categoryStats[category].total += item.total_price;
          categoryStats[category].count += item.quantity;
        });
      });

      const topCategories = Object.entries(categoryStats)
        .map(([category, stats]) => ({ category, ...stats }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // Calcular tendência de gastos (por dia/semana/mês dependendo do período)
      const spendingTrend = this.calculateSpendingTrend(periodInvoices, period);

      return {
        periodSpent,
        periodSavings,
        periodInvoices: periodInvoices.length,
        periodProducts,
        topCategories,
        spendingTrend,
      };
    } catch (error) {
      logger.error("❌ Error getting detailed stats:", error);
      throw error;
    }
  }

  /**
   * Calcula tendência de gastos por período
   */
  private calculateSpendingTrend(
    invoices: FirebaseInvoice[],
    period: "week" | "month" | "year"
  ): { date: string; amount: number }[] {
    const spendingByDate: { [key: string]: number } = {};

    invoices.forEach((invoice) => {
      let dateKey = "";
      const date = new Date(invoice.invoice_date);

      switch (period) {
        case "week":
          dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
          break;
        case "month":
          dateKey = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`; // YYYY-MM
          break;
        case "year":
          dateKey = date.getFullYear().toString(); // YYYY
          break;
      }

      spendingByDate[dateKey] =
        (spendingByDate[dateKey] || 0) + invoice.total_amount;
    });

    return Object.entries(spendingByDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Formata valor como moeda brasileira
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  }

  /**
   * Formata valor sem símbolo da moeda
   */
  formatCurrencyValue(amount: number): string {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

export const statsService = new StatsService();
