"use client";

import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ScreenContainer from "../../components/ui/ScreenContainer";

export default function QRScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [lastScannedData, setLastScannedData] = useState<string | null>(null);

  useEffect(() => {
    if (showCamera && !permission?.granted) {
      requestPermission();
    }
  }, [showCamera, permission, requestPermission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);
    setLastScannedData(data);

    // Show what was scanned
    Alert.alert(
      "QR Code Escaneado!",
      `Dados: ${data.length > 100 ? data.substring(0, 100) + "..." : data}`,
      [
        {
          text: "Escanear Novamente",
          onPress: () => {
            setScanned(false);
            setLastScannedData(null);
          },
        },
        {
          text: "Processar",
          onPress: () => {
            // Here you can add your processing logic
            console.log("Processing QR data:", data);
            Alert.alert(
              "Processando...",
              "Funcionalidade será implementada em breve!"
            );
            setScanned(false);
          },
        },
      ]
    );
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
  };

  const stopScanning = () => {
    setShowCamera(false);
    setScanned(false);
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
        >
          <View style={styles.overlay}>
            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={stopScanning}>
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>

            {/* Scanning frame */}
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {/* Scanning line animation could go here */}
              <View style={styles.scanLine} />
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructions}>
                Posicione o QR code dentro da moldura
              </Text>
              <Text style={styles.subInstructions}>
                O escaneamento será automático
              </Text>
            </View>

            {/* Manual retry button if needed */}
            {scanned && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.retryButtonText}>Escanear Novamente</Text>
              </TouchableOpacity>
            )}
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.scannerArea}>
          <EmptyState
            icon="qr-code"
            title="Escaneie um código QR"
            subtitle="Toque no botão abaixo para iniciar o escaneamento"
            size={120}
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Iniciar Escaneamento"
              onPress={startScanning}
              variant="primary"
            />
          </View>

          {lastScannedData && (
            <View style={styles.lastScannedContainer}>
              <Text style={styles.lastScannedTitle}>Último QR escaneado:</Text>
              <Text style={styles.lastScannedData} numberOfLines={3}>
                {lastScannedData}
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
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
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
