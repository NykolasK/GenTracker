"use client";

import { StyleSheet, View } from "react-native";
import EmptyState from "../../components/ui/EmptyState";
import ScreenContainer from "../../components/ui/ScreenContainer";

export default function HistoryScreen() {
  return (
    <ScreenContainer>
      <View style={styles.content}>
        <EmptyState
          icon="time"
          title="Nenhum histórico ainda"
          subtitle="Suas atividades aparecerão aqui"
        />
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
});
