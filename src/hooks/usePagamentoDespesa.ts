import { supabase } from "@/integrations/supabase/client";
import { updateCartaoLimiteUsado } from "./useCartaoUpdater";

export const pagarDespesa = async (
  despesaId: string,
  contaId: string,
  metodoPagamento: string,
  observacoes?: string,
  cartaoId?: string
) => {
  try {
    console.log("Iniciando pagamento de despesa:", { despesaId, contaId, metodoPagamento, cartaoId });

    // Buscar dados da despesa
    const { data: despesa, error: despesaError } = await supabase
      .from("transacoes")
      .select("valor, user_id")
      .eq("id", despesaId)
      .single();

    if (despesaError) {
      console.error("Erro ao buscar despesa:", despesaError);
      throw new Error("Despesa não encontrada");
    }

    console.log("Dados da despesa:", despesa);

    // Processar pagamento baseado no método
    if (metodoPagamento === "cartao_credito") {
      if (!cartaoId) {
        throw new Error("Cartão de crédito não informado");
      }

      // Buscar dados do cartão
      const { data: cartao, error: cartaoError } = await supabase
        .from("cartoes_credito")
        .select("nome, limite, limite_usado")
        .eq("id", cartaoId)
        .single();

      if (cartaoError) {
        console.error("Erro ao buscar cartão:", cartaoError);
        throw new Error("Cartão não encontrado");
      }

      // Verificar limite suficiente
      const limiteDisponivel = cartao.limite - cartao.limite_usado;
      if (limiteDisponivel < despesa.valor) {
        throw new Error(`Limite insuficiente no cartão ${cartao.nome}`);
      }

      console.log("Pagamento com cartão de crédito autorizado:", { cartaoId, limiteDisponivel });

    } else if (metodoPagamento !== "dinheiro") {
      // Pagamento com conta bancária
      if (!contaId) {
        throw new Error("Conta bancária não informada");
      }

      // Buscar saldo atual da conta
      const { data: conta, error: contaError } = await supabase
        .from("bancos")
        .select("saldo_atual, nome")
        .eq("id", contaId)
        .single();

      if (contaError) {
        console.error("Erro ao buscar conta:", contaError);
        throw new Error("Conta não encontrada");
      }

      // Verificar saldo suficiente
      if (conta.saldo_atual < despesa.valor) {
        throw new Error(`Saldo insuficiente na conta ${conta.nome}`);
      }

      // Atualizar saldo da conta (diminuir o valor da despesa)
      const novoSaldo = conta.saldo_atual - despesa.valor;
      const { error: updateSaldoError } = await supabase
        .from("bancos")
        .update({ saldo_atual: novoSaldo })
        .eq("id", contaId);

      if (updateSaldoError) {
        console.error("Erro ao atualizar saldo:", updateSaldoError);
        throw new Error("Erro ao atualizar saldo da conta");
      }

      console.log("Saldo da conta atualizado:", { contaId, novoSaldo });
    }

    // Atualizar a transação com os dados do pagamento
    const updateData: any = {
      data_transacao: new Date().toISOString().split('T')[0], // Data atual
    };

    // Definir campos baseado no método de pagamento
    if (metodoPagamento === "cartao_credito") {
      updateData.cartao_credito_id = cartaoId;
      updateData.banco_id = null;
    } else if (metodoPagamento === "dinheiro") {
      updateData.banco_id = null;
      updateData.cartao_credito_id = null;
    } else {
      updateData.banco_id = contaId;
      updateData.cartao_credito_id = null;
    }

    // Adicionar observações se fornecidas
    if (observacoes) {
      updateData.observacoes = observacoes;
    }

    console.log("Atualizando transação com dados:", updateData);

    const { error: updateTransacaoError } = await supabase
      .from("transacoes")
      .update(updateData)
      .eq("id", despesaId);

    if (updateTransacaoError) {
      console.error("Erro ao atualizar transação:", updateTransacaoError);
      throw new Error("Erro ao registrar pagamento da despesa");
    }

    // Atualizar limite do cartão se necessário
    if (metodoPagamento === "cartao_credito" && cartaoId) {
      console.log("Atualizando limite do cartão após pagamento:", cartaoId);
      await updateCartaoLimiteUsado(cartaoId);
    }

    console.log("Pagamento de despesa realizado com sucesso");
    return {
      sucesso: true,
      mensagem: "Despesa paga com sucesso!"
    };

  } catch (error) {
    console.error("Erro no pagamento da despesa:", error);
    return {
      sucesso: false,
      mensagem: error instanceof Error ? error.message : "Erro interno no pagamento"
    };
  }
};