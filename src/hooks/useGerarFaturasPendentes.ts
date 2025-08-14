import { supabase } from "@/integrations/supabase/client";

export const gerarFaturasPendentes = async (userId: string) => {
  try {
    // 1. Buscar todos os cartões ativos do usuário
    const { data: cartoes, error: cartoesError } = await supabase
      .from("cartoes_credito")
      .select("*")
      .eq("user_id", userId)
      .eq("ativo", true);

    if (cartoesError || !cartoes) {
      console.error("Erro ao buscar cartões:", cartoesError);
      return;
    }

    const dataAtual = new Date();
    const anoAtual = dataAtual.getFullYear();
    const mesAtual = dataAtual.getMonth() + 1;

    for (const cartao of cartoes) {
      // Verificar os últimos 24 meses para gerar faturas pendentes
      for (let i = 0; i < 24; i++) {
        const dataReferencia = new Date(anoAtual, mesAtual - 1 + i, 1);
        const anoReferencia = dataReferencia.getFullYear();
        const mesReferencia = dataReferencia.getMonth() + 1;

        // Calcular período de faturamento
        const dataFechamentoAnterior = new Date(anoReferencia, mesReferencia - 2, cartao.dia_fechamento);
        const dataFechamentoAtual = new Date(anoReferencia, mesReferencia - 1, cartao.dia_fechamento);
        
        // Calcular data de vencimento (mês seguinte ao fechamento)
        const dataVencimento = new Date(anoReferencia, mesReferencia, cartao.dia_vencimento);
        const mesVencimento = dataVencimento.getMonth() + 1;
        const anoVencimento = dataVencimento.getFullYear();
        
        // Verificar se já existe fatura para este período (usar mês de vencimento)
        const { data: faturaExistente } = await supabase
          .from("faturas_cartao")
          .select("id, valor_total")
          .eq("cartao_credito_id", cartao.id)
          .eq("ano", anoVencimento)
          .eq("mes", mesVencimento)
          .single();
        
        console.log(`Verificando fatura para cartão ${cartao.id}, referência ${mesReferencia}/${anoReferencia}, vencimento ${mesVencimento}/${anoVencimento}:`, {
          dataFechamentoAnterior: dataFechamentoAnterior.toISOString().split('T')[0],
          dataFechamentoAtual: dataFechamentoAtual.toISOString().split('T')[0],
          dataVencimento: dataVencimento.toISOString().split('T')[0],
          dataAtual: dataAtual.toISOString().split('T')[0]
        });

        // Buscar transações do período de faturamento
        const { data: transacoes } = await supabase
          .from("transacoes")
          .select("valor")
          .eq("cartao_credito_id", cartao.id)
          .eq("tipo", "despesa")
          .gte("data_transacao", dataFechamentoAnterior.toISOString().split('T')[0])
          .lt("data_transacao", dataFechamentoAtual.toISOString().split('T')[0]);

        const valorFatura = transacoes?.reduce((total, t) => total + Number(t.valor), 0) || 0;

         console.log(`Transações encontradas para o período:`, {
           totalTransacoes: transacoes?.length || 0,
           valorFatura,
           periodo: `${dataFechamentoAnterior.toISOString().split('T')[0]} até ${dataFechamentoAtual.toISOString().split('T')[0]}`
         });

         if (faturaExistente) {
           // Atualizar fatura existente se o valor mudou
           if (faturaExistente.valor_total !== valorFatura) {
             console.log(`Atualizando fatura existente ${faturaExistente.id} de ${faturaExistente.valor_total} para ${valorFatura}`);
             
             const { error: updateError } = await supabase
               .from("faturas_cartao")
               .update({
                 valor_total: valorFatura,
                 status: valorFatura > 0 ? "aberta" : "paga"
               })
               .eq("id", faturaExistente.id);

             if (updateError) {
               console.error(`Erro ao atualizar fatura ${faturaExistente.id}:`, updateError);
             } else {
               console.log(`Fatura ${faturaExistente.id} atualizada com sucesso`);
             }
           }
           continue; // Pular criação de nova fatura
         }

         // Criar nova fatura apenas se há valor ou não existe fatura
         if (valorFatura > 0) {
           const { data: faturaInserida, error: insertError } = await supabase
             .from("faturas_cartao")
             .insert({
               cartao_credito_id: cartao.id,
               mes: mesVencimento, // Usar mês de vencimento
               ano: anoVencimento, // Usar ano de vencimento
               data_fechamento: dataFechamentoAtual.toISOString().split('T')[0],
               data_vencimento: dataVencimento.toISOString().split('T')[0],
               valor_total: valorFatura,
               valor_pago: 0,
               status: "aberta",
               user_id: userId
             })
             .select();

           if (insertError) {
             console.error(`Erro ao inserir fatura para cartão ${cartao.id}:`, insertError);
           } else {
             console.log(`Fatura criada para cartão ${cartao.id}, vencimento ${mesVencimento}/${anoVencimento} (ref: ${mesReferencia}/${anoReferencia}):`, faturaInserida);
           }
         }
      }
    }

    console.log("Faturas pendentes geradas com sucesso");
  } catch (error) {
    console.error("Erro ao gerar faturas pendentes:", error);
  }
};