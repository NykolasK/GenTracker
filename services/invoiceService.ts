import { firebaseService } from "./firebaseService";

export interface InvoiceItem {
  name: string;
  code?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit?: string;
}

export interface InvoiceData {
  store_name: string;
  store_cnpj?: string;
  store_address?: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  items: InvoiceItem[];
}

export interface InvoiceResponse {
  success: boolean;
  data?: InvoiceData;
  cached: boolean;
  error?: string;
}

export interface ScanResult {
  success: boolean;
  data?: InvoiceData;
  error?: string;
  cached?: boolean;
  firebaseId?: string;
  shoppingListId?: string;
}

class InvoiceService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
  }

  validateSEFAZUrl(url: string): boolean {
    const sefazPatterns = [/sefaz/i, /fazenda/i, /nfce/i, /nfe/i, /consulta/i];

    return (
      sefazPatterns.some((pattern) => pattern.test(url)) &&
      (url.includes("http://") || url.includes("https://"))
    );
  }

  extractInvoiceUrl(qrData: string): string | null {
    try {
      if (this.validateSEFAZUrl(qrData)) {
        return qrData;
      }

      const urlMatch = qrData.match(/(https?:\/\/[^\s]+)/i);
      if (urlMatch && this.validateSEFAZUrl(urlMatch[1])) {
        return urlMatch[1];
      }

      return null;
    } catch (error) {
      console.error("Error extracting URL from QR data:", error);
      return null;
    }
  }

  async processInvoice(url: string, userId?: string): Promise<ScanResult> {
    try {
      // First, process with backend
      const response = await fetch(`${this.baseURL}/api/scan-invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: InvoiceResponse = await response.json();

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Failed to process invoice",
        };
      }

      // If we have a user, save to Firebase and create shopping list
      let firebaseId: string | undefined;
      let shoppingListId: string | undefined;

      if (userId && result.data) {
        try {
          // Save invoice to Firebase
          firebaseId = await firebaseService.saveInvoice(
            result.data,
            userId,
            url
          );

          // Get the saved invoice to create shopping list
          const savedInvoice = await firebaseService.getInvoiceById(firebaseId);
          if (savedInvoice) {
            shoppingListId =
              await firebaseService.createShoppingListFromInvoice(savedInvoice);
          }
        } catch (firebaseError) {
          console.error("Error saving to Firebase:", firebaseError);
          // Don't fail the entire operation if Firebase fails
        }
      }

      return {
        success: true,
        data: result.data,
        cached: result.cached,
        firebaseId,
        shoppingListId,
      };
    } catch (error) {
      console.error("Error processing invoice:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async getUserInvoices(userId: string): Promise<any[]> {
    try {
      // Get from Firebase instead of backend
      const invoices = await firebaseService.getUserInvoices(userId);
      return invoices.map((invoice) => ({
        id: invoice.id,
        store_name: invoice.store_name,
        invoice_number: invoice.invoice_number,
        total_amount: invoice.total_amount,
        date: invoice.invoice_date.toISOString(),
        created_at: invoice.created_at,
      }));
    } catch (error) {
      console.error("Error fetching user invoices:", error);
      return [];
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }
}

export const invoiceService = new InvoiceService();
