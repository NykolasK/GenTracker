"use client";

import { StyleSheet, View } from "react-native";
import EmptyState from "../../components/ui/EmptyState";
import ScreenContainer from "../../components/ui/ScreenContainer";

export default function ListsScreen() {
  return (
    <ScreenContainer>
      <View style={styles.content}>
        <EmptyState
          icon="document-text"
          title="Nenhuma lista ainda"
          subtitle="Crie sua primeira lista de compras"
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
