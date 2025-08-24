"use client";

import { useCallback, useRef, useState } from "react";

interface ActionLockOptions {
  cooldownMs?: number;
  maxConcurrent?: number;
  showFeedback?: boolean;
}

interface ActionLockState {
  isLocked: boolean;
  isLoading: boolean;
  lastAction: Date | null;
  actionCount: number;
}

export function useActionLock(options: ActionLockOptions = {}) {
  const {
    cooldownMs = 2000, // 2 segundos de cooldown
    maxConcurrent = 1,
    showFeedback = true,
  } = options;

  const [state, setState] = useState<ActionLockState>({
    isLocked: false,
    isLoading: false,
    lastAction: null,
    actionCount: 0,
  });

  const activeActions = useRef(0);
  const lockTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const executeAction = useCallback(
    async (
      action: () => Promise<any>,
      actionName?: string
    ): Promise<any | null> => {
      // Verifica se está em cooldown
      if (state.isLocked) {
        if (showFeedback) {
          console.warn(
            `Ação "${actionName || "desconhecida"}" bloqueada - em cooldown`
          );
        }
        return null;
      }

      // Verifica limite de ações concorrentes
      if (activeActions.current >= maxConcurrent) {
        if (showFeedback) {
          console.warn(
            `Ação "${
              actionName || "desconhecida"
            }" bloqueada - muitas ações simultâneas`
          );
        }
        return null;
      }

      try {
        // Inicia o lock
        setState((prev) => ({
          ...prev,
          isLocked: true,
          isLoading: true,
          actionCount: prev.actionCount + 1,
        }));

        activeActions.current++;

        // Executa a ação
        const result = await action();

        // Atualiza estado de sucesso
        setState((prev) => ({
          ...prev,
          lastAction: new Date(),
          isLoading: false,
        }));

        return result;
      } catch (error) {
        console.error(`Erro na ação "${actionName || "desconhecida"}":`, error);

        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));

        throw error;
      } finally {
        activeActions.current--;

        // Programa o unlock após cooldown
        if (lockTimeout.current) {
          clearTimeout(lockTimeout.current);
        }

        lockTimeout.current = setTimeout(() => {
          setState((prev) => ({
            ...prev,
            isLocked: false,
          }));
        }, cooldownMs);
      }
    },
    [state.isLocked, cooldownMs, maxConcurrent, showFeedback]
  );

  const forceUnlock = useCallback(() => {
    if (lockTimeout.current) {
      clearTimeout(lockTimeout.current);
    }

    setState((prev) => ({
      ...prev,
      isLocked: false,
      isLoading: false,
    }));

    activeActions.current = 0;
  }, []);

  const getRemainingCooldown = useCallback(() => {
    if (!state.lastAction || !state.isLocked) return 0;

    const elapsed = Date.now() - state.lastAction.getTime();
    return Math.max(0, cooldownMs - elapsed);
  }, [state.lastAction, state.isLocked, cooldownMs]);

  return {
    executeAction,
    forceUnlock,
    getRemainingCooldown,
    isLocked: state.isLocked,
    isLoading: state.isLoading,
    actionCount: state.actionCount,
    canExecute: !state.isLocked && activeActions.current < maxConcurrent,
  };
}
