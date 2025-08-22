"use client";

import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ScreenContainer from "../../components/ui/ScreenContainer";
import { useAuth } from "../../context/AuthContext";
import { invoiceService } from "../../services/invoiceService";
import { logger } from "../../utils/logger";

export default function QRScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastScannedData, setLastScannedData] = useState<string | null>(null);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (showCamera && !permission?.granted) {
      requestPermission();
    }
  }, [showCamera, permission, requestPermission]);

  useEffect(() => {
    checkAPIHealth();
  }, []);

  const checkAPIHealth = async () => {
    const healthy = await invoiceService.testAPIHealth();
    setApiHealthy(healthy);
    if (!healthy) {
      console.warn("API is not responding");
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing) return;

    logger.info("📱 QR Code scanned:", data.substring(0, 100) + "...");
    setScanned(true);
    setLastScannedData(data);

    const invoiceUrl = invoiceService.extractInvoiceUrl(data);
    logger.info("🔍 Extracted URL:", invoiceUrl);

    if (!invoiceUrl) {
      logger.info("❌ Invalid QR code - not a SEFAZ URL");
      Alert.alert(
        "QR Code Inválido",
        "Este QR code não parece ser de uma nota fiscal válida.",
        [
          {
            text: "Tentar Novamente",
            onPress: () => {
              setScanned(false);
              setLastScannedData(null);
            },
          },
        ]
      );
      return;
    }

    if (apiHealthy === false) {
      logger.info("❌ API is not healthy");
      Alert.alert(
        "Serviço Indisponível",
        "O serviço de processamento está temporariamente indisponível. Tente novamente em alguns minutos.",
        [
          {
            text: "Tentar Novamente",
            onPress: () => {
              setScanned(false);
              setLastScannedData(null);
              checkAPIHealth();
            },
          },
        ]
      );
      return;
    }

    setProcessing(true);
    logger.info("🔄 Starting invoice processing...");

    try {
      const result = await invoiceService.processInvoice(invoiceUrl, user?.uid);
      logger.info("📋 Processing result:", {
        success: result.success,
        hasData: !!result.data,
        firebaseId: result.firebaseId,
        shoppingListId: result.shoppingListId,
        error: result.error,
      });

      if (result.success && result.data) {
        const invoice = result.data;
        logger.info("✅ Invoice processed successfully!");

        Alert.alert(
          "✅ Nota Fiscal Processada!",
          `🏪 Loja: ${invoice.emitente.razao_social}\n` +
            `📦 Itens: ${invoice.itens.length}\n` +
            `💰 Total: ${invoiceService.formatCurrency(
              invoice.totais.valor_a_pagar
            )}\n\n` +
            `${
              result.shoppingListId
                ? "📝 Lista de compras criada automaticamente!"
                : ""
            }\n` +
            `${result.firebaseId ? "💾 Dados salvos no histórico!" : ""}`,
          [
            {
              text: "Ver Histórico",
              onPress: () => {
                router.push("/(tabs)/historyScreen");
              },
            },
            {
              text: "Escanear Outro",
              style: "cancel",
              onPress: () => {
                setScanned(false);
                setLastScannedData(null);
              },
            },
          ]
        );
      } else {
        logger.error("❌ Processing failed:", result.error);
        Alert.alert(
          "❌ Erro ao Processar",
          result.error || "Não foi possível processar a nota fiscal.",
          [
            {
              text: "Tentar Novamente",
              onPress: () => {
                setScanned(false);
                setLastScannedData(null);
              },
            },
          ]
        );
      }
    } catch (error) {
      logger.error("❌ Unexpected error:", error);
      Alert.alert(
        "🌐 Erro de Conexão",
        "Verifique sua conexão com a internet e tente novamente.",
        [
          {
            text: "Tentar Novamente",
            onPress: () => {
              setScanned(false);
              setLastScannedData(null);
            },
          },
        ]
      );
    } finally {
      setProcessing(false);
    }
  };

  const startScanning = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          "Permissão Necessária",
          "Precisamos da permissão da câmera para escanear QR codes."
        );
        return;
      }
    }
    setShowCamera(true);
    setScanned(false);
    setProcessing(false);
  };

  const stopScanning = () => {
    setShowCamera(false);
    setScanned(false);
    setProcessing(false);
  };

  if (showCamera) {
    if (!permission?.granted) {
      return (
        <ScreenContainer>
          <View style={styles.content}>
            <View style={styles.permissionContainer}>
              <Ionicons name="camera" size={64} color="#9CA3AF" />
              <Text style={styles.permissionTitle}>Permissão da Câmera</Text>
              <Text style={styles.permissionText}>
                Precisamos da permissão da câmera para escanear QR codes
              </Text>
              <Button
                title="Conceder Permissão"
                onPress={requestPermission}
                variant="primary"
              />
              <Button
                title="Cancelar"
                onPress={stopScanning}
                variant="secondary"
                style={styles.cancelButton}
              />
            </View>
          </View>
        </ScreenContainer>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.closeButton} onPress={stopScanning}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>

          {apiHealthy !== null && (
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: apiHealthy ? "#27AE60" : "#E74C3C" },
              ]}
            >
              <Ionicons
                name={apiHealthy ? "checkmark-circle" : "warning"}
                size={16}
                color="white"
              />
              <Text style={styles.statusText}>
                {apiHealthy ? "Serviço Online" : "Serviço Offline"}
              </Text>
            </View>
          )}

          {processing && (
            <View style={styles.processingContainer}>
              <View style={styles.processingCard}>
                <ActivityIndicator size="large" color="#3498DB" />
                <Text style={styles.processingText}>
                  Processando nota fiscal...
                </Text>
                <Text style={styles.processingSubtext}>
                  Extraindo dados da SEFAZ
                </Text>
              </View>
            </View>
          )}

          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {!processing && <View style={styles.scanLine} />}
          </View>

          {!processing && (
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructions}>
                Posicione o QR code da nota fiscal dentro da moldura
              </Text>
              <Text style={styles.subInstructions}>
                O escaneamento será automático
              </Text>
            </View>
          )}

          {scanned && !processing && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.retryButtonText}>Escanear Novamente</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.scannerArea}>
          <EmptyState
            icon="qr-code"
            title="Escaneie uma Nota Fiscal"
            subtitle="Aponte a câmera para o QR code da sua nota fiscal para extrair os produtos automaticamente"
            size={120}
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Iniciar Escaneamento"
              onPress={startScanning}
              variant="primary"
            />
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
              <Text style={styles.infoText}>
                Extração automática de produtos
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="library" size={20} color="#3498DB" />
              <Text style={styles.infoText}>
                Categorização automática por regras
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="list" size={20} color="#3498DB" />
              <Text style={styles.infoText}>
                Lista de compras gerada automaticamente
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color="#F39C12" />
              <Text style={styles.infoText}>
                Histórico de compras organizado
              </Text>
            </View>
          </View>

          {lastScannedData && (
            <View style={styles.lastScannedContainer}>
              <Text style={styles.lastScannedTitle}>Último QR escaneado:</Text>
              <Text style={styles.lastScannedData} numberOfLines={2}>
                {lastScannedData.length > 50
                  ? lastScannedData.substring(0, 50) + "..."
                  : lastScannedData}
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 120,
  },
  scannerArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 40,
    justifyContent: "space-between",
  },
  buttonContainer: {
    marginTop: 40,
    alignItems: "center",
    gap: 12,
  },
  apiStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  apiStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoContainer: {
    marginTop: 30,
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  lastScannedContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
  },
  lastScannedTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  lastScannedData: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  cancelButton: {
    marginTop: 12,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "black",
    position: "relative",
  },
  camera: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 25,
    padding: 12,
  },
  statusIndicator: {
    position: "absolute",
    top: 60,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  processingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  processingCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginHorizontal: 40,
  },
  processingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 16,
    textAlign: "center",
  },
  processingSubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#3498DB",
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    width: "80%",
    height: 2,
    backgroundColor: "#3498DB",
    opacity: 0.8,
  },
  instructionsContainer: {
    position: "absolute",
    bottom: 120,
    paddingHorizontal: 40,
    alignItems: "center",
  },
  instructions: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  subInstructions: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    position: "absolute",
    bottom: 60,
    backgroundColor: "#3498DB",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
