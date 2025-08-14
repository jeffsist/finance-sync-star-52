import { supabase } from "@/integrations/supabase/client";

export const updateCartaoLimiteUsado = async (cartaoId: string) => {
  console.log("🔄 [CARTÃO UPDATER] Iniciando atualização do limite do cartão:", cartaoId);
  
  // Buscar o total de transações do cartão
  const { data: transacoes, error: transacoesError } = await supabase
    .from("transacoes")
    .select("id, valor, tipo, descricao, data_transacao")
    .eq("cartao_credito_id", cartaoId);

  console.log("📊 [CARTÃO UPDATER] Transações encontradas:", {
    total: transacoes?.length || 0,
    transacoes: transacoes?.map(t => ({
      id: t.id,
      descricao: t.descricao,
      valor: t.valor,
      tipo: t.tipo,
      data: t.data_transacao
    }))
  });

  if (transacoesError) {
    console.error("❌ [CARTÃO UPDATER] Erro ao buscar transações do cartão:", transacoesError);
    return;
  }

  // Calcular o limite usado (apenas despesas)
  const despesas = transacoes?.filter(t => t.tipo === "despesa") || [];
  const limiteUsado = despesas.reduce((total, t) => total + Number(t.valor), 0);

  console.log("💰 [CARTÃO UPDATER] Cálculo do limite usado:", {
    totalTransacoes: transacoes?.length || 0,
    despesasEncontradas: despesas.length,
    valorDespesas: despesas.map(d => ({ descricao: d.descricao, valor: d.valor })),
    limiteUsadoCalculado: limiteUsado
  });

  // Buscar dados atuais do cartão para comparação
  const { data: cartaoAtual, error: cartaoError } = await supabase
    .from("cartoes_credito")
    .select("nome, limite, limite_usado")
    .eq("id", cartaoId)
    .single();

  if (cartaoError) {
    console.error("❌ [CARTÃO UPDATER] Erro ao buscar dados do cartão:", cartaoError);
    return;
  }

  console.log("🏦 [CARTÃO UPDATER] Estado atual do cartão:", {
    nome: cartaoAtual.nome,
    limite: cartaoAtual.limite,
    limiteUsadoAnterior: cartaoAtual.limite_usado,
    limiteUsadoNovo: limiteUsado,
    diferenca: limiteUsado - cartaoAtual.limite_usado
  });

  // Atualizar o limite usado no cartão
  const { error: updateError } = await supabase
    .from("cartoes_credito")
    .update({ limite_usado: limiteUsado })
    .eq("id", cartaoId);

  if (updateError) {
    console.error("❌ [CARTÃO UPDATER] Erro ao atualizar limite do cartão:", updateError);
  } else {
    console.log("✅ [CARTÃO UPDATER] Limite do cartão atualizado com sucesso:", {
      cartaoId,
      nomeCartao: cartaoAtual.nome,
      limiteTotal: cartaoAtual.limite,
      limiteUsadoAnterior: cartaoAtual.limite_usado,
      limiteUsadoNovo: limiteUsado,
      limiteDisponivel: cartaoAtual.limite - limiteUsado
    });
  }
};