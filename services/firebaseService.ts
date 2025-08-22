import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { logger } from "../utils/logger";

export interface FirebaseInvoiceItem {
  id?: string;
  name: string;
  code?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit: string;
  category?: string;
  brand?: string;
}

export interface FirebaseInvoice {
  id?: string;
  userId: string;
  store_name: string;
  store_cnpj?: string;
  store_address?: string;
  invoice_number: string;
  invoice_date: Date; // Data da emissão da nota fiscal
  scanned_at: Date; // Data quando foi escaneada no app
  total_amount: number;
  items: FirebaseInvoiceItem[];
  qr_url?: string;
  protocol?: string;
  access_key?: string;
  series?: string;
  discounts?: number;
  taxes?: number;
  created_at?: Timestamp | any; // Including 'any' to handle serverTimestamp
  updated_at?: Timestamp | any;
}

export interface ShoppingList {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  items: ShoppingListItem[];
  total_estimated_cost: number;
  created_from_invoice?: string | null;
  status: "active" | "completed" | "archived";
  created_at?: Timestamp | any; // Including 'any' to handle serverTimestamp
  updated_at?: Timestamp | any;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  estimated_price: number;
  category: string;
  brand: string | null;
  purchased: boolean;
  actual_price: number | null;
  notes: string | null;
}

export interface PriceHistory {
  id?: string;
  product_name: string;
  product_code?: string;
  store_name: string;
  store_cnpj?: string;
  price: number;
  date: Date;
  invoice_id: string;
  userId: string;
}

export interface InvoiceFilters {
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  minItems?: number;
  maxItems?: number;
  storeName?: string;
  sortBy?: "invoice_date" | "scanned_at" | "total_amount" | "items_count";
  sortOrder?: "asc" | "desc";
}

class FirebaseService {
  // Invoice Management
  async saveInvoice(
    invoiceData: any,
    userId: string,
    qrUrl?: string
  ): Promise<string> {
    try {
      // Removed log for production

      // Parse invoice date safely
      let invoiceDate = new Date();
      if (invoiceData.invoice_date) {
        if (invoiceData.invoice_date instanceof Date) {
          invoiceDate = invoiceData.invoice_date;
        } else {
          try {
            invoiceDate = new Date(invoiceData.invoice_date);
            // Check if date is valid
            if (isNaN(invoiceDate.getTime())) {
              console.warn("Invalid invoice date, using current date");
              invoiceDate = new Date();
            }
          } catch (error) {
            console.warn(
              "Error parsing invoice date, using current date:",
              error
            );
            invoiceDate = new Date();
          }
        }
      }

      const firebaseInvoice: Omit<FirebaseInvoice, "id"> = {
        userId: invoiceData.userId || userId,
        store_name: invoiceData.store_name,
        store_cnpj: invoiceData.store_cnpj,
        store_address: invoiceData.store_address,
        invoice_number: invoiceData.invoice_number,
        invoice_date: invoiceDate,
        scanned_at: new Date(), // Data atual do escaneamento
        total_amount: invoiceData.total_amount,
        items: invoiceData.items.map((item: any) => ({
          name: item.name,
          code: item.code,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          unit: item.unit || "UN",
          category: item.category || this.categorizeProduct(item.name),
        })),
        qr_url: invoiceData.qr_url || qrUrl,
        protocol: invoiceData.protocol,
        access_key: invoiceData.access_key,
        series: invoiceData.series,
        discounts: invoiceData.discounts || 0,
        taxes: invoiceData.taxes || 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      logger.info("💾 Final Firebase invoice object with scanned_at:", {
        invoice_date: invoiceData.invoice_date,
        scanned_at: invoiceData.scanned_at,
        store_name: invoiceData.store_name,
        total_amount: invoiceData.total_amount,
      });

      const docRef = await addDoc(collection(db, "invoices"), firebaseInvoice);
      logger.info("✅ Document saved successfully with ID:", docRef.id);

      // Save price history for each item
      logger.info("📊 Saving price history...");
      await this.savePriceHistory(
        invoiceData.items,
        invoiceData.store_name,
        invoiceData.store_cnpj,
        docRef.id,
        userId
      );
      logger.info("✅ Price history saved");

      return docRef.id;
    } catch (error) {
      logger.error("❌ Error in saveInvoice:", error);
      throw new Error(
        `Failed to save invoice to Firebase: ${(error as Error).message}`
      );
    }
  }

  async getUserInvoices(
    userId: string,
    limitCount = 50,
    filters?: InvoiceFilters
  ): Promise<FirebaseInvoice[]> {
    try {
      let q = query(collection(db, "invoices"), where("userId", "==", userId));

      // Apply date filters if provided
      if (filters?.dateFrom) {
        q = query(q, where("scanned_at", ">=", filters.dateFrom));
      }
      if (filters?.dateTo) {
        q = query(q, where("scanned_at", "<=", filters.dateTo));
      }

      // Add limit
      q = query(q, limit(limitCount));

      const querySnapshot = await getDocs(q);
      let invoices = querySnapshot.docs.map((doc) => {
        const data = doc.data();

        // Safely convert dates
        let invoiceDate = new Date();
        let scannedAt = new Date();

        try {
          if (data.invoice_date) {
            if (data.invoice_date.toDate) {
              invoiceDate = data.invoice_date.toDate();
            } else {
              invoiceDate = new Date(data.invoice_date);
            }
            if (isNaN(invoiceDate.getTime())) {
              invoiceDate = new Date();
            }
          }
        } catch (error) {
          console.warn("Error parsing invoice_date:", error);
          invoiceDate = new Date();
        }

        try {
          if (data.scanned_at) {
            if (data.scanned_at.toDate) {
              scannedAt = data.scanned_at.toDate();
            } else {
              scannedAt = new Date(data.scanned_at);
            }
            if (isNaN(scannedAt.getTime())) {
              scannedAt = new Date();
            }
          }
        } catch (error) {
          console.warn("Error parsing scanned_at:", error);
          scannedAt = new Date();
        }

        return {
          id: doc.id,
          ...data,
          invoice_date: invoiceDate,
          scanned_at: scannedAt,
        } as FirebaseInvoice;
      });

      // Apply client-side filters
      if (filters) {
        invoices = this.applyClientFilters(invoices, filters);
      }

      // Sort invoices
      const sortBy = filters?.sortBy || "scanned_at";
      const sortOrder = filters?.sortOrder || "desc";

      invoices.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (sortBy) {
          case "invoice_date":
            aValue = a.invoice_date.getTime();
            bValue = b.invoice_date.getTime();
            break;
          case "scanned_at":
            aValue = a.scanned_at.getTime();
            bValue = b.scanned_at.getTime();
            break;
          case "total_amount":
            aValue = a.total_amount;
            bValue = b.total_amount;
            break;
          case "items_count":
            aValue = a.items.length;
            bValue = b.items.length;
            break;
          default:
            aValue = a.scanned_at.getTime();
            bValue = b.scanned_at.getTime();
        }

        return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
      });

      return invoices;
    } catch (error) {
      logger.error("Error fetching user invoices:", error);
      return [];
    }
  }

  private applyClientFilters(
    invoices: FirebaseInvoice[],
    filters: InvoiceFilters
  ): FirebaseInvoice[] {
    return invoices.filter((invoice) => {
      // Amount filters
      if (filters.minAmount && invoice.total_amount < filters.minAmount)
        return false;
      if (filters.maxAmount && invoice.total_amount > filters.maxAmount)
        return false;

      // Items count filters
      if (filters.minItems && invoice.items.length < filters.minItems)
        return false;
      if (filters.maxItems && invoice.items.length > filters.maxItems)
        return false;

      // Store name filter
      if (
        filters.storeName &&
        !invoice.store_name
          .toLowerCase()
          .includes(filters.storeName.toLowerCase())
      )
        return false;

      return true;
    });
  }

  async getInvoiceById(invoiceId: string): Promise<FirebaseInvoice | null> {
    try {
      const docRef = doc(db, "invoices", invoiceId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Safely convert dates
        let invoiceDate = new Date();
        let scannedAt = new Date();

        try {
          if (data.invoice_date) {
            if (data.invoice_date.toDate) {
              invoiceDate = data.invoice_date.toDate();
            } else {
              invoiceDate = new Date(data.invoice_date);
            }
            if (isNaN(invoiceDate.getTime())) {
              invoiceDate = new Date();
            }
          }
        } catch (error) {
          console.warn("Error parsing invoice_date:", error);
          invoiceDate = new Date();
        }

        try {
          if (data.scanned_at) {
            if (data.scanned_at.toDate) {
              scannedAt = data.scanned_at.toDate();
            } else {
              scannedAt = new Date(data.scanned_at);
            }
            if (isNaN(scannedAt.getTime())) {
              scannedAt = new Date();
            }
          }
        } catch (error) {
          console.warn("Error parsing scanned_at:", error);
          scannedAt = new Date();
        }

        return {
          id: docSnap.id,
          ...data,
          invoice_date: invoiceDate,
          scanned_at: scannedAt,
        } as FirebaseInvoice;
      }

      return null;
    } catch (error) {
      logger.error("Error fetching invoice:", error);
      return null;
    }
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    try {
      logger.info("🗑️ Deleting invoice:", invoiceId);

      // Delete related price history
      const priceHistoryQuery = query(
        collection(db, "price_history"),
        where("invoice_id", "==", invoiceId)
      );
      const priceHistorySnapshot = await getDocs(priceHistoryQuery);

      const deletePromises = priceHistorySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      logger.info(
        "🗑️ Deleted",
        priceHistorySnapshot.docs.length,
        "price history records"
      );

      // Delete the invoice
      await deleteDoc(doc(db, "invoices", invoiceId));
      logger.info("✅ Invoice deleted successfully");
    } catch (error) {
      logger.error("❌ Error deleting invoice:", error);
      throw new Error("Failed to delete invoice");
    }
  }

  // Shopping List Management
  async createShoppingListFromInvoice(
    invoice: FirebaseInvoice
  ): Promise<string> {
    try {
      logger.info("📋 Creating shopping list from invoice:", {
        invoiceId: invoice.id,
        itemsCount: invoice.items.length,
        storeName: invoice.store_name,
      });

      const shoppingListItems: ShoppingListItem[] = invoice.items.map(
        (item, index) => ({
          id: `item_${Date.now()}_${index}`,
          name: item.name || "Item sem nome",
          quantity: item.quantity || 1,
          unit: item.unit || "UN",
          estimated_price: item.unit_price || 0,
          category: item.category || "Outros",
          brand: item.brand || null,
          purchased: false,
          actual_price: null,
          notes: null,
        })
      );

      const shoppingList: Omit<ShoppingList, "id"> = {
        userId: invoice.userId,
        name: `Lista baseada em ${invoice.store_name}`,
        description: `Lista gerada automaticamente da nota fiscal ${invoice.invoice_number} de ${invoice.store_name}`,
        items: shoppingListItems,
        total_estimated_cost: invoice.total_amount || 0,
        created_from_invoice: invoice.id || null,
        status: "active",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, "shopping_lists"),
        shoppingList
      );
      logger.info("✅ Shopping list saved with ID:", docRef.id);

      return docRef.id;
    } catch (error) {
      logger.error("❌ Error creating shopping list from invoice:", error);
      throw new Error("Failed to create shopping list");
    }
  }

  async createCustomShoppingList(
    userId: string,
    name: string,
    description?: string
  ): Promise<string> {
    try {
      const shoppingList: Omit<ShoppingList, "id"> = {
        userId,
        name,
        description,
        items: [],
        total_estimated_cost: 0,
        status: "active",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, "shopping_lists"),
        shoppingList
      );
      return docRef.id;
    } catch (error) {
      logger.error("Error creating shopping list:", error);
      throw new Error("Failed to create shopping list");
    }
  }

  async getUserShoppingLists(userId: string): Promise<ShoppingList[]> {
    try {
      // Using a compound query that requires the correct index to be created
      // The error mentioned we need an index for this query
      // Use simple query if the index hasn't been created yet
      let q;
      try {
        q = query(
          collection(db, "shopping_lists"),
          where("userId", "==", userId),
          orderBy("created_at", "desc")
        );
      } catch (error) {
        logger.error(
          "Error with indexed query, falling back to simple query:",
          error
        );
        // Fallback to simpler query without ordering
        q = query(
          collection(db, "shopping_lists"),
          where("userId", "==", userId)
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as ShoppingList)
      );
    } catch (error) {
      logger.error("Error fetching shopping lists:", error);
      return [];
    }
  }

  async updateShoppingList(
    listId: string,
    updates: Partial<ShoppingList>
  ): Promise<void> {
    try {
      const docRef = doc(db, "shopping_lists", listId);
      await updateDoc(docRef, {
        ...updates,
        updated_at: serverTimestamp(),
      });
    } catch (error) {
      logger.error("Error updating shopping list:", error);
      throw new Error("Failed to update shopping list");
    }
  }

  async deleteShoppingList(listId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "shopping_lists", listId));
    } catch (error) {
      logger.error("Error deleting shopping list:", error);
      throw new Error("Failed to delete shopping list");
    }
  }

  async addItemToShoppingList(
    listId: string,
    item: Omit<ShoppingListItem, "id">
  ): Promise<void> {
    try {
      const listRef = doc(db, "shopping_lists", listId);
      const listDoc = await getDoc(listRef);

      if (listDoc.exists()) {
        const currentList = listDoc.data() as ShoppingList;
        const updatedItems = [
          ...currentList.items,
          { ...item, id: Date.now().toString() },
        ];
        const newTotal = updatedItems.reduce(
          (sum, item) => sum + (item.estimated_price || 0) * item.quantity,
          0
        );

        await updateDoc(listRef, {
          items: updatedItems,
          total_estimated_cost: newTotal,
          updated_at: serverTimestamp(),
        });
      }
    } catch (error) {
      logger.error("Error adding item to shopping list:", error);
      throw new Error("Failed to add item to shopping list");
    }
  }

  async updateShoppingListItem(
    listId: string,
    itemId: string,
    updates: Partial<ShoppingListItem>
  ): Promise<void> {
    try {
      const listRef = doc(db, "shopping_lists", listId);
      const listDoc = await getDoc(listRef);

      if (listDoc.exists()) {
        const currentList = listDoc.data() as ShoppingList;
        const updatedItems = currentList.items.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        );
        const newTotal = updatedItems.reduce(
          (sum, item) => sum + (item.estimated_price || 0) * item.quantity,
          0
        );

        await updateDoc(listRef, {
          items: updatedItems,
          total_estimated_cost: newTotal,
          updated_at: serverTimestamp(),
        });
      }
    } catch (error) {
      logger.error("Error updating shopping list item:", error);
      throw new Error("Failed to update shopping list item");
    }
  }

  // Price History and Monitoring
  async savePriceHistory(
    items: any[],
    storeName: string,
    storeCnpj: string | undefined,
    invoiceId: string,
    userId: string
  ): Promise<void> {
    try {
      logger.info("📊 Saving price history for", items.length, "items...");

      const priceHistoryPromises = items.map((item) => {
        const priceHistory: Omit<PriceHistory, "id"> = {
          product_name: item.name,
          product_code: item.code,
          store_name: storeName,
          store_cnpj: storeCnpj,
          price: item.unit_price,
          date: new Date(),
          invoice_id: invoiceId,
          userId,
        };

        return addDoc(collection(db, "price_history"), priceHistory);
      });

      const results = await Promise.all(priceHistoryPromises);
      logger.info("✅ All price history records saved:", results.length);
    } catch (error) {
      logger.error("❌ Error saving price history:", error);
    }
  }

  async getProductPriceHistory(
    productName: string,
    userId: string
  ): Promise<PriceHistory[]> {
    try {
      const q = query(
        collection(db, "price_history"),
        where("userId", "==", userId),
        where("product_name", "==", productName),
        orderBy("date", "desc"),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as PriceHistory)
      );
    } catch (error) {
      logger.error("Error fetching price history:", error);
      return [];
    }
  }

  async getBestPriceForProduct(
    productName: string,
    userId: string
  ): Promise<PriceHistory | null> {
    try {
      const q = query(
        collection(db, "price_history"),
        where("userId", "==", userId),
        where("product_name", "==", productName),
        orderBy("price", "asc"),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
        } as PriceHistory;
      }

      return null;
    } catch (error) {
      logger.error("Error fetching best price:", error);
      return null;
    }
  }

  // Analytics and Statistics
  async getUserSpendingByStore(
    userId: string,
    days = 30
  ): Promise<{ store_name: string; total: number; count: number }[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(db, "invoices"),
        where("userId", "==", userId),
        where("scanned_at", ">=", startDate)
      );

      const querySnapshot = await getDocs(q);
      const storeStats: { [key: string]: { total: number; count: number } } =
        {};

      querySnapshot.docs.forEach((doc) => {
        const invoice = doc.data() as FirebaseInvoice;
        if (!storeStats[invoice.store_name]) {
          storeStats[invoice.store_name] = { total: 0, count: 0 };
        }
        storeStats[invoice.store_name].total += invoice.total_amount;
        storeStats[invoice.store_name].count += 1;
      });

      return Object.entries(storeStats).map(([store_name, stats]) => ({
        store_name,
        ...stats,
      }));
    } catch (error) {
      logger.error("Error fetching spending by store:", error);
      return [];
    }
  }

  async getUserTopProducts(
    userId: string,
    days = 30
  ): Promise<
    { product_name: string; quantity: number; total_spent: number }[]
  > {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(db, "invoices"),
        where("userId", "==", userId),
        where("scanned_at", ">=", startDate)
      );

      const querySnapshot = await getDocs(q);
      const productStats: {
        [key: string]: { quantity: number; total_spent: number };
      } = {};

      querySnapshot.docs.forEach((doc) => {
        const invoice = doc.data() as FirebaseInvoice;
        invoice.items.forEach((item) => {
          if (!productStats[item.name]) {
            productStats[item.name] = { quantity: 0, total_spent: 0 };
          }
          productStats[item.name].quantity += item.quantity;
          productStats[item.name].total_spent += item.total_price;
        });
      });

      return Object.entries(productStats)
        .map(([product_name, stats]) => ({
          product_name,
          ...stats,
        }))
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 20);
    } catch (error) {
      logger.error("Error fetching top products:", error);
      return [];
    }
  }

  // Utility Functions
  private categorizeProduct(productName: string): string {
    const categories = {
      Alimentação: [
        "leite",
        "pão",
        "arroz",
        "feijão",
        "carne",
        "frango",
        "peixe",
        "ovo",
        "queijo",
        "iogurte",
        "fruta",
        "verdura",
        "legume",
      ],
      Limpeza: [
        "detergente",
        "sabão",
        "amaciante",
        "desinfetante",
        "papel higiênico",
        "toalha",
      ],
      Higiene: [
        "shampoo",
        "condicionador",
        "sabonete",
        "pasta de dente",
        "escova",
      ],
      Bebidas: [
        "água",
        "refrigerante",
        "suco",
        "cerveja",
        "vinho",
        "café",
        "chá",
      ],
      Medicamentos: ["remédio", "vitamina", "analgésico", "antibiótico"],
      Eletrônicos: ["celular", "fone", "carregador", "cabo", "bateria"],
    };

    const productLower = productName.toLowerCase();

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => productLower.includes(keyword))) {
        return category;
      }
    }

    return "Outros";
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }

  formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }
}

export const firebaseService = new FirebaseService();
