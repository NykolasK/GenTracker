import { logger } from "../utils/logger";
import { DateService } from "./dateService";
import { firebaseService } from "./firebaseService";

export interface InvoiceItem {
  codigo: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  valor_total: number;
}

export interface InvoiceEmitente {
  razao_social: string;
  cnpj: string;
  endereco: string;
}

export interface InvoiceConsumidor {
  cpf: string | null;
  nome: string | null;
}

export interface InvoiceInfosGerais {
  numero: string;
  serie: string;
  data_emissao: string;
  protocolo_autorizacao: string;
  chave_acesso: string;
  ambiente: string;
}

export interface InvoiceTotais {
  quantidade_itens: number;
  valor_total: number;
  descontos: number;
  valor_a_pagar: number;
  tributos_totais: number;
}

export interface InvoiceData {
  emitente: InvoiceEmitente;
  consumidor: InvoiceConsumidor;
  infos_gerais: InvoiceInfosGerais;
  itens: InvoiceItem[];
  totais: InvoiceTotais;
  formas_pagamento: any[];
}

export interface APIResponse {
  status: string;
  message: string;
  data: InvoiceData;
  url?: string;
}

export interface InvoiceResponse {
  success: boolean;
  data?: InvoiceData;
  error?: string;
}

export interface ScanResult {
  success: boolean;
  data?: InvoiceData;
  error?: string;
  firebaseId?: string;
  shoppingListId?: string;
}

class InvoiceService {
  private baseURL: string;

  constructor() {
    this.baseURL = "https://nfce-scraper-gentracker.onrender.com";
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
      logger.error("Error extracting URL from QR data:", error);
      return null;
    }
  }

  async processInvoice(url: string, userId?: string): Promise<ScanResult> {
    try {
      logger.info("🔄 Processing invoice URL:", url);
      logger.info("👤 User ID:", userId);

      const response = await fetch(`${this.baseURL}/scrape/nfce`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url,
        }),
      });

      logger.info("📡 API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("❌ API Error Response:", errorText);

        if (response.status === 404) {
          throw new Error("Nota fiscal não encontrada ou URL inválida");
        } else if (response.status === 500) {
          throw new Error("Erro interno do servidor. Tente novamente.");
        } else if (response.status === 422) {
          throw new Error("URL da nota fiscal inválida");
        } else {
          throw new Error(`Erro na API: ${response.status} - ${errorText}`);
        }
      }

      const apiResponse: APIResponse = await response.json();
      logger.info("📦 Full API Response:", {
        status: apiResponse.status,
        message: apiResponse.message,
        hasData: !!apiResponse.data,
        url: apiResponse.url,
      });

      const result = apiResponse.data;
      logger.info("✅ Extracted invoice data:", {
        emitente: result?.emitente?.razao_social,
        itens_count: result?.itens?.length,
        total: result?.totais?.valor_a_pagar,
        data_emissao: result?.infos_gerais?.data_emissao,
        itens_sample: result?.itens?.[0],
      });

      if (
        !result ||
        !result.emitente ||
        !result.itens ||
        !Array.isArray(result.itens)
      ) {
        logger.error("❌ Invalid invoice data structure:", {
          hasResult: !!result,
          hasEmitente: !!result?.emitente,
          hasItens: !!result?.itens,
          itensIsArray: Array.isArray(result?.itens),
          resultKeys: result ? Object.keys(result) : [],
        });
        return {
          success: false,
          error: "Dados da nota fiscal inválidos ou incompletos",
        };
      }

      if (result.itens.length === 0) {
        logger.error("❌ No items found in invoice");
        return {
          success: false,
          error: "Nenhum item encontrado na nota fiscal",
        };
      }

      let firebaseId: string | undefined;
      let shoppingListId: string | undefined;

      if (userId && result) {
        try {
          logger.info("💾 Starting Firebase save process...");

          const firebaseInvoice = await this.convertToFirebaseFormat(
            result,
            userId,
            url
          );
          logger.info("🔄 Converted to Firebase format:", {
            store_name: firebaseInvoice.store_name,
            items_count: firebaseInvoice.items?.length,
            total_amount: firebaseInvoice.total_amount,
            invoice_date: firebaseInvoice.invoice_date,
            scanned_at: firebaseInvoice.scanned_at,
          });

          firebaseId = await firebaseService.saveInvoice(
            firebaseInvoice,
            userId,
            url
          );
          logger.info("✅ Invoice saved with ID:", firebaseId);

          const savedInvoice = await firebaseService.getInvoiceById(firebaseId);
          if (savedInvoice) {
            shoppingListId =
              await firebaseService.createShoppingListFromInvoice(savedInvoice);
            logger.info("✅ Shopping list created with ID:", shoppingListId);
          } else {
            logger.error("❌ Could not retrieve saved invoice");
          }
        } catch (firebaseError) {
          logger.error("❌ Firebase Error Details:", firebaseError);
          logger.error(
            "❌ Firebase Error Stack:",
            (firebaseError as Error).stack
          );
          return {
            success: false,
            error: `Erro ao salvar dados: ${(firebaseError as Error).message}`,
          };
        }
      }

      logger.info("🎉 Process completed successfully!");
      return {
        success: true,
        data: result,
        firebaseId,
        shoppingListId,
      };
    } catch (error) {
      logger.error("❌ Error processing invoice:", error);
      logger.error("❌ Error stack:", (error as Error).stack);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro de conexão com o servidor",
      };
    }
  }

  async testAPIHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch (error) {
      logger.error("API health check failed:", error);
      return false;
    }
  }

  getDocsURL(): string {
    return `${this.baseURL}/docs`;
  }

  /**
   * Categoriza produtos usando regras baseadas em palavras-chave e padrões
   */
  private categorizeProduct(productName: string): string {
    const productLower = productName.toLowerCase().trim();

    // Mapeamento de categorias com palavras-chave expandidas
    const categoryRules = {
      Alimentação: {
        keywords: [
          // Carnes e proteínas
          "carne",
          "frango",
          "peixe",
          "linguiça",
          "salsicha",
          "presunto",
          "mortadela",
          "bacon",
          "hamburguer",
          "costela",
          "picanha",
          "alcatra",
          "patinho",
          "acém",
          "músculo",
          "peito",
          "coxa",
          "sobrecoxa",

          // Laticínios
          "leite",
          "queijo",
          "iogurte",
          "manteiga",
          "margarina",
          "requeijão",
          "cream cheese",
          "ricota",
          "mussarela",
          "prato",
          "coalho",
          "cheddar",
          "parmesão",

          // Grãos e cereais
          "arroz",
          "feijão",
          "lentilha",
          "grão",
          "aveia",
          "quinoa",
          "trigo",
          "farinha",
          "fubá",
          "polenta",
          "macarrão",
          "massa",
          "espaguete",
          "penne",
          "lasanha",
          "nhoque",

          // Pães e biscoitos
          "pão",
          "baguete",
          "bisnaga",
          "torrada",
          "biscoito",
          "bolacha",
          "wafer",
          "rosquinha",

          // Frutas e vegetais
          "banana",
          "maçã",
          "laranja",
          "limão",
          "tomate",
          "cebola",
          "alho",
          "batata",
          "cenoura",
          "alface",
          "fruta",
          "verdura",
          "legume",
          "salada",
          "abobrinha",
          "pepino",
          "pimentão",
          "brócolis",

          // Temperos e condimentos
          "tempero",
          "sal",
          "açúcar",
          "óleo",
          "azeite",
          "vinagre",
          "molho",
          "ketchup",
          "maionese",
          "mostarda",
          "pimenta",
          "orégano",
          "manjericão",
          "alecrim",

          // Outros
          "ovo",
          "ovos",
          "mel",
          "chocolate",
          "doce",
          "bolo",
          "torta",
          "pudim",
        ],
        patterns: [
          /\b(kg|g|gr|gramas?|quilos?)\b/i,
          /\b(pacote|pct)\b/i,
          /\bfresh\b/i,
          /\borganic[oa]?\b/i,
        ],
      },

      Bebidas: {
        keywords: [
          "água",
          "refrigerante",
          "suco",
          "cerveja",
          "vinho",
          "café",
          "chá",
          "guaraná",
          "coca",
          "pepsi",
          "sprite",
          "fanta",
          "energético",
          "isotônico",
          "achocolatado",
          "leite",
          "vitamina",
          "smoothie",
          "whisky",
          "vodka",
          "cachaça",
          "rum",
          "gin",
          "licor",
          "champagne",
          "espumante",
        ],
        patterns: [
          /\b(ml|l|litros?|lt)\b/i,
          /\b(lata|garrafa|pet|long neck)\b/i,
          /\b(gelad[oa]|fria)\b/i,
          /\b(zero|diet|light)\b/i,
        ],
      },

      Limpeza: {
        keywords: [
          "detergente",
          "sabão",
          "amaciante",
          "desinfetante",
          "alvejante",
          "água sanitária",
          "cloro",
          "papel higiênico",
          "papel toalha",
          "guardanapo",
          "saco lixo",
          "esponja",
          "pano",
          "vassoura",
          "rodo",
          "balde",
          "limpa vidro",
          "cera",
          "desengordurante",
          "multiuso",
        ],
        patterns: [
          /\blimpa\b/i,
          /\bsaco.*lixo\b/i,
          /\bpapel.*higienic[oa]\b/i,
          /\bágua.*sanitária\b/i,
        ],
      },

      "Higiene Pessoal": {
        keywords: [
          "shampoo",
          "condicionador",
          "sabonete",
          "pasta dente",
          "escova dente",
          "desodorante",
          "perfume",
          "creme",
          "loção",
          "absorvente",
          "protetor solar",
          "hidratante",
          "gel",
          "espuma",
          "barbeador",
          "lâmina",
          "fio dental",
          "enxaguante",
          "antisséptico",
        ],
        patterns: [
          /\bpasta.*dente\b/i,
          /\bescova.*dente\b/i,
          /\bfio.*dental\b/i,
        ],
      },

      "Casa e Decoração": {
        keywords: [
          "vela",
          "incenso",
          "quadro",
          "moldura",
          "vaso",
          "planta",
          "flor",
          "almofada",
          "cortina",
          "tapete",
          "toalha",
          "lençol",
          "fronha",
          "cobertor",
          "travesseiro",
          "luminária",
          "abajur",
        ],
        patterns: [],
      },

      Eletrônicos: {
        keywords: [
          "pilha",
          "bateria",
          "carregador",
          "cabo",
          "fone",
          "headphone",
          "mouse",
          "teclado",
          "pendrive",
          "cartão memória",
          "cd",
          "dvd",
          "blu-ray",
          "película",
          "capinha",
          "case",
        ],
        patterns: [/\b(usb|hdmi|aux)\b/i, /\b(bluetooth|wireless)\b/i],
      },

      Papelaria: {
        keywords: [
          "caneta",
          "lápis",
          "borracha",
          "régua",
          "caderno",
          "agenda",
          "papel",
          "envelope",
          "cola",
          "fita",
          "grampeador",
          "grampo",
          "clipe",
          "post-it",
          "marcador",
          "canetinha",
        ],
        patterns: [],
      },

      "Pet Shop": {
        keywords: [
          "ração",
          "petisco",
          "brinquedo",
          "coleira",
          "guia",
          "cama",
          "casinha",
          "comedouro",
          "bebedouro",
          "areia",
          "shampoo pet",
          "antipulgas",
          "vermífugo",
        ],
        patterns: [/\b(cão|cachorro|gato|pet)\b/i, /\b(dog|cat)\b/i],
      },

      Medicamentos: {
        keywords: [
          "remédio",
          "medicamento",
          "comprimido",
          "cápsula",
          "xarope",
          "pomada",
          "creme",
          "gel",
          "vitamina",
          "suplemento",
          "analgésico",
          "antibiótico",
          "antialérgico",
          "descongestionante",
        ],
        patterns: [/\b(mg|ml|comprimidos?)\b/i, /\b(genérico|similar)\b/i],
      },

      "Utilidades Domésticas": {
        keywords: [
          "panela",
          "frigideira",
          "talheres",
          "prato",
          "copo",
          "xícara",
          "tigela",
          "bowl",
          "forma",
          "assadeira",
          "peneira",
          "escorredor",
          "abridor",
          "saca-rolhas",
          "tábua",
          "faca",
          "garfo",
          "colher",
          "espátula",
          "concha",
        ],
        patterns: [],
      },
    };

    // Verifica cada categoria
    for (const [category, rules] of Object.entries(categoryRules)) {
      // Verifica palavras-chave
      if (rules.keywords.some((keyword) => productLower.includes(keyword))) {
        logger.info(
          `📋 Produto "${productName}" categorizado como "${category}" (palavra-chave)`
        );
        return category;
      }

      // Verifica padrões regex
      if (rules.patterns.some((pattern) => pattern.test(productName))) {
        logger.info(
          `📋 Produto "${productName}" categorizado como "${category}" (padrão)`
        );
        return category;
      }
    }

    logger.info(
      `❓ Produto "${productName}" não categorizado, usando "Outros"`
    );
    return "Outros";
  }

  private async convertToFirebaseFormat(
    apiData: InvoiceData,
    userId: string,
    qrUrl: string
  ): Promise<any> {
    logger.info("🔄 Converting API data to Firebase format...");

    // Parse da data de emissão correta do campo infos_gerais.data_emissao
    logger.info(
      "📅 Original emission date from API:",
      apiData.infos_gerais.data_emissao
    );

    const invoiceDateResult = DateService.validateAndParseDate(
      apiData.infos_gerais.data_emissao
    );
    const scanTimestamp = DateService.generateScanTimestamp();

    logger.info("📅 Date processing:", {
      original_emission_date: apiData.infos_gerais.data_emissao,
      parsed_invoice_date: invoiceDateResult.parsedDate,
      scan_timestamp: scanTimestamp,
      confidence: invoiceDateResult.confidence,
    });

    // Processa itens com categorização por regras
    logger.info(
      "📋 Iniciando categorização para",
      apiData.itens.length,
      "itens..."
    );

    const itemsWithCategories = apiData.itens.map((item, index) => {
      logger.info(
        `🔄 Processing item ${index + 1}/${apiData.itens.length}:`,
        item.descricao
      );

      const category = this.categorizeProduct(item.descricao);

      return {
        name: item.descricao,
        code: item.codigo,
        quantity: item.quantidade,
        unit_price: item.valor_unitario,
        total_price: item.valor_total,
        unit: item.unidade || "UN",
        category: category,
      };
    });

    logger.info("✅ Categorização concluída para todos os itens");

    const firebaseData = {
      userId,
      store_name: apiData.emitente.razao_social,
      store_cnpj: apiData.emitente.cnpj,
      store_address: this.formatAddress(apiData.emitente.endereco),
      invoice_number: apiData.infos_gerais.numero,
      invoice_date: invoiceDateResult.parsedDate, // Data da emissão da nota (do campo correto)
      scanned_at: scanTimestamp, // Data/hora do escaneamento
      total_amount: apiData.totais.valor_a_pagar,
      items: itemsWithCategories,
      qr_url: qrUrl,
      protocol: apiData.infos_gerais.protocolo_autorizacao,
      access_key: apiData.infos_gerais.chave_acesso,
      series: apiData.infos_gerais.serie,
      discounts: apiData.totais.descontos,
      taxes: apiData.totais.tributos_totais,
      date_parsing_confidence: invoiceDateResult.confidence,
      date_parsing_warnings: invoiceDateResult.warnings,
    };

    logger.info("✅ Firebase data structure created");
    return firebaseData;
  }

  private formatAddress(address: string): string {
    if (!address) return "";

    return address
      .replace(/,\s*,/g, ",")
      .replace(/,\s*0\s*,/g, ",")
      .replace(/,\s*,/g, ",")
      .replace(/,\s*$/g, "")
      .replace(/^\s*,/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  async getUserInvoices(userId: string): Promise<any[]> {
    try {
      const invoices = await firebaseService.getUserInvoices(userId);
      return invoices.map((invoice) => ({
        id: invoice.id,
        store_name: invoice.store_name,
        invoice_number: invoice.invoice_number,
        total_amount: invoice.total_amount,
        date: invoice.invoice_date.toISOString(),
        created_at: invoice.created_at,
        items_count: invoice.items.length,
      }));
    } catch (error) {
      logger.error("Error fetching user invoices:", error);
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
    return DateService.formatForDisplay(date, false);
  }

  formatDateTime(date: Date): string {
    return DateService.formatForDisplay(date, true);
  }
}

export const invoiceService = new InvoiceService();
