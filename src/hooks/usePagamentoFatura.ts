import { supabase } from "@/integrations/supabase/client";
import { updateCartaoLimiteUsado } from "./useCartaoUpdater";

interface PagamentoFaturaProps {
  cartaoId: string;
  valorFatura: number;
  contaId: string;
  ano: number;
  mes: number;
}

export const pagarFatura = async ({ cartaoId, valorFatura, contaId, ano, mes }: PagamentoFaturaProps) => {
  try {
    // 1. Buscar dados da conta para verificar saldo
    const { data: conta, error: contaError } = await supabase
      .from("bancos")
      .select("saldo_atual, nome")
      .eq("id", contaId)
      .single();

    if (contaError) {
      throw new Error("Erro ao buscar dados da conta");
    }

    if (conta.saldo_atual < valorFatura) {
      throw new Error("Saldo insuficiente na conta selecionada");
    }

    // 2. Buscar dados do cartão
    const { data: cartao, error: cartaoError } = await supabase
      .from("cartoes_credito")
      .select("nome, dia_fechamento, dia_vencimento")
      .eq("id", cartaoId)
      .single();

    if (cartaoError) {
      throw new Error("Erro ao buscar dados do cartão");
    }

    // 3. Criar transação de pagamento da fatura
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error("Usuário não autenticado");
    }

    const dataVencimento = new Date(ano, mes - 1, cartao.dia_vencimento);
    const dataTransacao = new Date().toISOString().split('T')[0];

    const { error: transacaoError } = await supabase
      .from("transacoes")
      .insert({
        descricao: `Pagamento fatura ${cartao.nome} - ${mes.toString().padStart(2, '0')}/${ano}`,
        valor: valorFatura,
        tipo: "despesa",
        data_transacao: dataTransacao,
        observacoes: `Pagamento da fatura do cartão ${cartao.nome} referente ao período ${mes}/${ano}`,
        banco_id: contaId,
        user_id: userData.user.id
      });

    if (transacaoError) {
      throw new Error("Erro ao registrar transação de pagamento");
    }

    // 4. Atualizar saldo da conta
    const novoSaldo = conta.saldo_atual - valorFatura;
    const { error: updateContaError } = await supabase
      .from("bancos")
      .update({ saldo_atual: novoSaldo })
      .eq("id", contaId);

    if (updateContaError) {
      throw new Error("Erro ao atualizar saldo da conta");
    }

    // 5. Criar ou atualizar fatura no banco
    const dataFechamento = new Date(ano, mes - 1, cartao.dia_fechamento);
    
    const { error: faturaError } = await supabase
      .from("faturas_cartao")
      .upsert({
        cartao_credito_id: cartaoId,
        mes: mes,
        ano: ano,
        data_fechamento: dataFechamento.toISOString().split('T')[0],
        data_vencimento: dataVencimento.toISOString().split('T')[0],
        valor_total: valorFatura,
        valor_pago: valorFatura,
        status: "paga",
        user_id: userData.user.id
      });

    if (faturaError) {
      throw new Error("Erro ao registrar fatura");
    }

    // 6. Resetar limite usado do cartão (fatura paga)
    const { error: resetLimiteError } = await supabase
      .from("cartoes_credito")
      .update({ limite_usado: 0 })
      .eq("id", cartaoId);

    if (resetLimiteError) {
      throw new Error("Erro ao resetar limite do cartão");
    }

    return { success: true, message: "Fatura paga com sucesso!" };
  } catch (error) {
    console.error("Erro ao pagar fatura:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Erro desconhecido ao pagar fatura" 
    };
  }
};