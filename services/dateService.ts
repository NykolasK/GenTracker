export interface DateValidationResult {
  isValid: boolean
  parsedDate: Date
  originalString: string
  confidence: "high" | "medium" | "low"
  warnings: string[]
}

export class DateService {
  private static readonly DATE_PATTERNS = [
    // DD/MM/YYYY HH:MM:SS
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/,
    // DD/MM/YYYY HH:MM
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/,
    // DD/MM/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // DD-MM-YYYY HH:MM:SS
    /^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/,
    // YYYY-MM-DD HH:MM:SS (ISO format)
    /^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/,
  ]

  private static readonly TIMEZONE_OFFSET = -3 // UTC-3 (Brasília)

  /**
   * Valida e normaliza uma string de data
   */
  static validateAndParseDate(dateString: string): DateValidationResult {
    const warnings: string[] = []

    if (!dateString || typeof dateString !== "string") {
      return {
        isValid: false,
        parsedDate: new Date(),
        originalString: dateString || "",
        confidence: "low",
        warnings: ["Data não fornecida ou inválida"],
      }
    }

    const trimmedDate = dateString.trim()

    // Tenta cada padrão
    for (let i = 0; i < this.DATE_PATTERNS.length; i++) {
      const pattern = this.DATE_PATTERNS[i]
      const match = trimmedDate.match(pattern)

      if (match) {
        try {
          const parsedDate = this.parseMatchedDate(match, i)
          const validation = this.validateParsedDate(parsedDate, trimmedDate)

          if (validation.isValid) {
            return {
              isValid: true,
              parsedDate: validation.date,
              originalString: dateString,
              confidence: validation.confidence,
              warnings: validation.warnings,
            }
          } else {
            warnings.push(...validation.warnings)
          }
        } catch (error) {
          warnings.push(`Erro ao processar padrão ${i + 1}: ${error}`)
        }
      }
    }

    // Fallback: tenta Date.parse()
    const fallbackDate = new Date(dateString)
    if (!isNaN(fallbackDate.getTime())) {
      warnings.push("Usou fallback Date.parse()")
      return {
        isValid: true,
        parsedDate: fallbackDate,
        originalString: dateString,
        confidence: "low",
        warnings,
      }
    }

    // Última tentativa: data atual
    warnings.push("Não foi possível interpretar a data, usando data atual")
    return {
      isValid: false,
      parsedDate: new Date(),
      originalString: dateString,
      confidence: "low",
      warnings,
    }
  }

  private static parseMatchedDate(match: RegExpMatchArray, patternIndex: number): Date {
    switch (patternIndex) {
      case 0: // DD/MM/YYYY HH:MM:SS
      case 1: // DD/MM/YYYY HH:MM
        return new Date(
          Number.parseInt(match[3]), // year
          Number.parseInt(match[2]) - 1, // month (0-indexed)
          Number.parseInt(match[1]), // day
          Number.parseInt(match[4]) || 0, // hour
          Number.parseInt(match[5]) || 0, // minute
          Number.parseInt(match[6]) || 0, // second
        )

      case 2: // DD/MM/YYYY
        return new Date(
          Number.parseInt(match[3]), // year
          Number.parseInt(match[2]) - 1, // month (0-indexed)
          Number.parseInt(match[1]), // day
        )

      case 3: // DD-MM-YYYY HH:MM:SS
        return new Date(
          Number.parseInt(match[3]), // year
          Number.parseInt(match[2]) - 1, // month (0-indexed)
          Number.parseInt(match[1]), // day
          Number.parseInt(match[4]) || 0, // hour
          Number.parseInt(match[5]) || 0, // minute
          Number.parseInt(match[6]) || 0, // second
        )

      case 4: // YYYY-MM-DD HH:MM:SS (ISO)
        return new Date(
          Number.parseInt(match[1]), // year
          Number.parseInt(match[2]) - 1, // month (0-indexed)
          Number.parseInt(match[3]), // day
          Number.parseInt(match[4]) || 0, // hour
          Number.parseInt(match[5]) || 0, // minute
          Number.parseInt(match[6]) || 0, // second
        )

      default:
        throw new Error(`Padrão não implementado: ${patternIndex}`)
    }
  }

  private static validateParsedDate(
    date: Date,
    originalString: string,
  ): {
    isValid: boolean
    date: Date
    confidence: "high" | "medium" | "low"
    warnings: string[]
  } {
    const warnings: string[] = []

    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      return {
        isValid: false,
        date: new Date(),
        confidence: "low",
        warnings: ["Data resultante é inválida"],
      }
    }

    // Verifica se a data está em um range razoável
    const now = new Date()
    const minDate = new Date(2020, 0, 1) // 1 Jan 2020
    const maxDate = new Date(now.getFullYear() + 1, 11, 31) // 31 Dec próximo ano

    if (date < minDate) {
      warnings.push("Data muito antiga, pode estar incorreta")
      return {
        isValid: false,
        date: new Date(),
        confidence: "low",
        warnings,
      }
    }

    if (date > maxDate) {
      warnings.push("Data no futuro, pode estar incorreta")
      return {
        isValid: false,
        date: new Date(),
        confidence: "low",
        warnings,
      }
    }

    // Determina confiança baseada na proximidade com agora
    const diffDays = Math.abs((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    let confidence: "high" | "medium" | "low" = "high"

    if (diffDays > 365) {
      confidence = "medium"
      warnings.push("Data com mais de 1 ano de diferença")
    } else if (diffDays > 30) {
      confidence = "medium"
      warnings.push("Data com mais de 30 dias de diferença")
    }

    return {
      isValid: true,
      date,
      confidence,
      warnings,
    }
  }

  /**
   * Gera timestamp confiável para escaneamento
   */
  static generateScanTimestamp(): Date {
    return new Date()
  }

  /**
   * Formata data para exibição
   */
  static formatForDisplay(date: Date, includeTime = true): string {
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    }

    if (includeTime) {
      options.hour = "2-digit"
      options.minute = "2-digit"
    }

    return new Intl.DateTimeFormat("pt-BR", options).format(date)
  }

  /**
   * Calcula diferença entre datas de forma legível
   */
  static getRelativeTime(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return "Agora mesmo"
    if (diffMinutes < 60) return `${diffMinutes} min atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays < 7) return `${diffDays} dias atrás`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`

    return `${Math.floor(diffDays / 365)} anos atrás`
  }
}
