import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { statsService, type UserStats } from "../services/statsService";
import { logger } from "../utils/logger";

export interface UseUserStatsReturn {
  userStats: UserStats | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  updateStats: () => Promise<void>;
}

/**
 * Hook customizado para gerenciar estatísticas do usuário
 */
export const useUserStats = (): UseUserStatsReturn => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(
    async (shouldUpdateFirestore = false) => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        let stats: UserStats;

        if (shouldUpdateFirestore) {
          // Atualiza as estatísticas no Firestore
          stats = await statsService.updateUserStats(user.uid);
        } else {
          // Apenas calcula as estatísticas localmente
          stats = await statsService.calculateUserStats(user.uid);
        }

        setUserStats(stats);
        logger.info("✅ User stats loaded successfully");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao carregar estatísticas";
        setError(errorMessage);
        logger.error("❌ Error loading user stats:", err);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const refreshStats = useCallback(async () => {
    await loadStats(false);
  }, [loadStats]);

  const updateStats = useCallback(async () => {
    await loadStats(true);
  }, [loadStats]);

  useEffect(() => {
    if (user) {
      loadStats(false);
    }
  }, [user, loadStats]);

  return {
    userStats,
    loading,
    error,
    refreshStats,
    updateStats,
  };
};
