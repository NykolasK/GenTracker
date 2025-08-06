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
import { type InvoiceData, type InvoiceItem } from "../services/invoiceService";

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
  invoice_date: Date;
  total_amount: number;
  items: FirebaseInvoiceItem[];
  qr_url?: string;
  created_at?: Timestamp | import("firebase/firestore").FieldValue;
  updated_at?: Timestamp | import("firebase/firestore").FieldValue;
}

export interface ShoppingList {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  items: ShoppingListItem[];
  total_estimated_cost: number;
  created_from_invoice?: string; // Invoice ID if generated from invoice
  status: "active" | "completed" | "archived";
  created_at?: Timestamp | import("firebase/firestore").FieldValue;
  updated_at?: Timestamp | import("firebase/firestore").FieldValue;
}

export interface ShoppingListItem {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  estimated_price?: number;
  category?: string;
  brand?: string;
  purchased: boolean;
  actual_price?: number;
  notes?: string;
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

class FirebaseService {
  // Invoice Management
  async saveInvoice(
    invoiceData: InvoiceData,
    userId: string,
    qrUrl?: string
  ): Promise<string> {
    try {
      const firebaseInvoice: Omit<FirebaseInvoice, "id"> = {
        userId,
        store_name: invoiceData.store_name,
        store_cnpj: invoiceData.store_cnpj,
        store_address: invoiceData.store_address,
        invoice_number: invoiceData.invoice_number,
        invoice_date: new Date(invoiceData.invoice_date),
        total_amount: invoiceData.total_amount,
        items: invoiceData.items.map((item) => ({
          name: item.name,
          code: item.code,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          unit: item.unit || "UN",
          category: this.categorizeProduct(item.name),
        })),
        qr_url: qrUrl,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "invoices"), firebaseInvoice);

      // Save price history for each item
      await this.savePriceHistory(
        invoiceData.items,
        invoiceData.store_name,
        invoiceData.store_cnpj,
        docRef.id,
        userId
      );

      return docRef.id;
    } catch (error) {
      console.error("Error saving invoice:", error);
      throw new Error("Failed to save invoice to Firebase");
    }
  }

  async getUserInvoices(
    userId: string,
    limitCount: number = 50
  ): Promise<FirebaseInvoice[]> {
    try {
      const q = query(
        collection(db, "invoices"),
        where("userId", "==", userId),
        orderBy("created_at", "desc"),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as FirebaseInvoice)
      );
    } catch (error) {
      console.error("Error fetching user invoices:", error);
      return [];
    }
  }

  async getInvoiceById(invoiceId: string): Promise<FirebaseInvoice | null> {
    try {
      const docRef = doc(db, "invoices", invoiceId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as FirebaseInvoice;
      }

      return null;
    } catch (error) {
      console.error("Error fetching invoice:", error);
      return null;
    }
  }

  // Shopping List Management
  async createShoppingListFromInvoice(
    invoice: FirebaseInvoice
  ): Promise<string> {
    try {
      const shoppingListItems: ShoppingListItem[] = invoice.items.map(
        (item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          estimated_price: item.unit_price,
          category: item.category,
          brand: item.brand,
          purchased: false,
        })
      );

      const shoppingList: Omit<ShoppingList, "id"> = {
        userId: invoice.userId,
        name: `Lista baseada em ${invoice.store_name}`,
        description: `Lista gerada automaticamente da nota fiscal ${invoice.invoice_number} de ${invoice.store_name}`,
        items: shoppingListItems,
        total_estimated_cost: invoice.total_amount,
        created_from_invoice: invoice.id,
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
      console.error("Error creating shopping list from invoice:", error);
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
      console.error("Error creating shopping list:", error);
      throw new Error("Failed to create shopping list");
    }
  }

  async getUserShoppingLists(userId: string): Promise<ShoppingList[]> {
    try {
      const q = query(
        collection(db, "shopping_lists"),
        where("userId", "==", userId),
        orderBy("created_at", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as ShoppingList)
      );
    } catch (error) {
      console.error("Error fetching shopping lists:", error);
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
      console.error("Error updating shopping list:", error);
      throw new Error("Failed to update shopping list");
    }
  }

  async deleteShoppingList(listId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "shopping_lists", listId));
    } catch (error) {
      console.error("Error deleting shopping list:", error);
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
      console.error("Error adding item to shopping list:", error);
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
      console.error("Error updating shopping list item:", error);
      throw new Error("Failed to update shopping list item");
    }
  }

  // Price History and Monitoring
  async savePriceHistory(
    items: InvoiceItem[],
    storeName: string,
    storeCnpj: string | undefined,
    invoiceId: string,
    userId: string
  ): Promise<void> {
    try {
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

      await Promise.all(priceHistoryPromises);
    } catch (error) {
      console.error("Error saving price history:", error);
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
      console.error("Error fetching price history:", error);
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
      console.error("Error fetching best price:", error);
      return null;
    }
  }

  // Analytics and Statistics
  async getUserSpendingByStore(
    userId: string,
    days: number = 30
  ): Promise<{ store_name: string; total: number; count: number }[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(db, "invoices"),
        where("userId", "==", userId),
        where("invoice_date", ">=", startDate),
        orderBy("invoice_date", "desc")
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
      console.error("Error fetching spending by store:", error);
      return [];
    }
  }

  async getUserTopProducts(
    userId: string,
    days: number = 30
  ): Promise<
    { product_name: string; quantity: number; total_spent: number }[]
  > {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(db, "invoices"),
        where("userId", "==", userId),
        where("invoice_date", ">=", startDate)
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
      console.error("Error fetching top products:", error);
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
}

export const firebaseService = new FirebaseService();
