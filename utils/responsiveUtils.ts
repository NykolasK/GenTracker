import { Dimensions, PixelRatio, Platform } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Baseado no iPhone 14 (390px de largura)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

/**
 * Utilidades para responsividade em diferentes dispositivos
 */
export class ResponsiveUtils {
  static get screenWidth() {
    return SCREEN_WIDTH;
  }

  static get screenHeight() {
    return SCREEN_HEIGHT;
  }

  static get isSmallDevice() {
    return SCREEN_WIDTH < 375;
  }

  static get isMediumDevice() {
    return SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
  }

  static get isLargeDevice() {
    return SCREEN_WIDTH >= 414;
  }

  static get isTablet() {
    return SCREEN_WIDTH >= 768;
  }

  static get aspectRatio() {
    return SCREEN_HEIGHT / SCREEN_WIDTH;
  }

  /**
   * Escala um valor baseado na largura da tela
   */
  static scaleWidth(size: number): number {
    return (SCREEN_WIDTH / BASE_WIDTH) * size;
  }

  /**
   * Escala um valor baseado na altura da tela
   */
  static scaleHeight(size: number): number {
    return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
  }

  /**
   * Escala um valor de fonte baseado no dispositivo
   */
  static scaleFontSize(size: number): number {
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    const newSize = size * scale;

    if (Platform.OS === "ios") {
      return Math.round(PixelRatio.roundToNearestPixel(newSize));
    } else {
      return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
    }
  }

  /**
   * Retorna padding horizontal baseado no dispositivo
   */
  static getHorizontalPadding(): number {
    if (this.isSmallDevice) {
      return 16;
    } else if (this.isMediumDevice) {
      return 20;
    } else if (this.isTablet) {
      return 32;
    } else {
      return 24;
    }
  }

  /**
   * Retorna espaçamento vertical baseado no dispositivo
   */
  static getVerticalSpacing(): number {
    if (this.isSmallDevice) {
      return 12;
    } else if (this.isMediumDevice) {
      return 16;
    } else {
      return 20;
    }
  }

  /**
   * Retorna tamanho de card baseado no dispositivo
   */
  static getCardPadding(): number {
    if (this.isSmallDevice) {
      return 12;
    } else if (this.isMediumDevice) {
      return 16;
    } else {
      return 20;
    }
  }

  /**
   * Retorna tamanhos de fonte responsivos
   */
  static getFontSizes() {
    const baseSizes = {
      small: 12,
      medium: 14,
      large: 16,
      title: 18,
      header: 24,
    };

    return {
      small: this.scaleFontSize(baseSizes.small),
      medium: this.scaleFontSize(baseSizes.medium),
      large: this.scaleFontSize(baseSizes.large),
      title: this.scaleFontSize(baseSizes.title),
      header: this.scaleFontSize(baseSizes.header),
    };
  }

  /**
   * Retorna espaçamentos responsivos
   */
  static getSpacing() {
    const baseSpacing = {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      xxl: 24,
    };

    return {
      xs: this.scaleWidth(baseSpacing.xs),
      sm: this.scaleWidth(baseSpacing.sm),
      md: this.scaleWidth(baseSpacing.md),
      lg: this.scaleWidth(baseSpacing.lg),
      xl: this.scaleWidth(baseSpacing.xl),
      xxl: this.scaleWidth(baseSpacing.xxl),
    };
  }

  /**
   * Ajusta automaticamente larguras de componentes
   */
  static getFlexibleWidth(percentage: number): number {
    return (SCREEN_WIDTH * percentage) / 100;
  }

  /**
   * Verifica se o texto pode quebrar baseado no tamanho
   */
  static shouldWrapText(
    text: string,
    fontSize: number,
    maxWidth: number
  ): boolean {
    // Aproximação simples para verificar se o texto excede a largura
    const approximateCharWidth = fontSize * 0.6;
    const textWidth = text.length * approximateCharWidth;
    return textWidth > maxWidth;
  }

  /**
   * Retorna configurações de modal baseadas no dispositivo
   */
  static getModalConfig() {
    return {
      padding: this.getHorizontalPadding(),
      borderRadius: this.isSmallDevice ? 12 : 16,
      maxHeight: SCREEN_HEIGHT * 0.9,
    };
  }
}
