import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TransacaoPendente {
  id: string;
  descricao: string;
  valor: number;
  data_transacao: string;
  total_parcelas?: number | null;
  parcela_atual?: number | null;
  categoria_id?: string;
  banco_id?: string;
  cartao_credito_id?: string;
}

export const useTransacoesPendentes = (userId: string | undefined, mesSelecionado: Date = new Date()) => {
  const [transacoesPendentes, setTransacoesPendentes] = useState<TransacaoPendente[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchTransacoesPendentes = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Filtrar por mês selecionado
      const mesInicio = new Date(mesSelecionado.getFullYear(), mesSelecionado.getMonth(), 1);
      const mesFim = new Date(mesSelecionado.getFullYear(), mesSelecionado.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from("transacoes")
        .select("id, descricao, valor, data_transacao, total_parcelas, parcela_atual, categoria_id, banco_id, cartao_credito_id")
        .eq("user_id", userId)
        .eq("tipo", "receita")
        .is("banco_id", null) // Apenas receitas sem banco associado (pendentes)
        .gte("data_transacao", mesInicio.toISOString().split('T')[0])
        .lte("data_transacao", mesFim.toISOString().split('T')[0])
        .order("data_transacao", { ascending: true });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar contas pendentes",
          variant: "destructive",
        });
      } else {
        setTransacoesPendentes(data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar transações pendentes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransacoesPendentes();
  }, [userId, mesSelecionado]);

  return {
    transacoesPendentes,
    loading,
    fetchTransacoesPendentes
  };
};