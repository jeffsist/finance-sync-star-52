import { useCallback } from "react";
import { updateCartaoLimiteUsado } from "./useCartaoUpdater";

/**
 * Hook para operações que afetam cartões de crédito e garantem atualização do limite
 */
export const useCartaoOperations = () => {
  
  /**
   * Executa uma operação que pode afetar o limite do cartão e força a atualização
   */
  const executeCartaoOperation = useCallback(async (
    operation: () => Promise<any>,
    cartaoId?: string,
    onSuccess?: () => void
  ) => {
    try {
      console.log("🔄 [CARTÃO OPS] Executando operação que afeta cartão:", cartaoId);
      
      // Executar a operação principal
      const result = await operation();
      
      // Se há um cartão envolvido, atualizar seu limite
      if (cartaoId) {
        console.log("🔄 [CARTÃO OPS] Atualizando limite do cartão após operação:", cartaoId);
        await updateCartaoLimiteUsado(cartaoId);
      }
      
      // Executar callback de sucesso (normalmente um refresh)
      if (onSuccess) {
        console.log("🔄 [CARTÃO OPS] Executando callback de sucesso");
        onSuccess();
      }
      
      console.log("✅ [CARTÃO OPS] Operação concluída com sucesso");
      return result;
      
    } catch (error) {
      console.error("❌ [CARTÃO OPS] Erro na operação:", error);
      throw error;
    }
  }, []);

  /**
   * Força a atualização do limite de um cartão específico
   */
  const refreshCartaoLimite = useCallback(async (cartaoId: string) => {
    console.log("🔄 [CARTÃO OPS] Forçando refresh do limite:", cartaoId);
    await updateCartaoLimiteUsado(cartaoId);
  }, []);

  return {
    executeCartaoOperation,
    refreshCartaoLimite
  };
};