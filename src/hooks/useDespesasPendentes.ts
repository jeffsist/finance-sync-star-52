import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DespesaPendente {
  id: string;
  descricao: string;
  valor: number;
  data_transacao: string;
  total_parcelas?: number | null;
  parcela_atual?: number | null;
  categoria_id?: string;
}

export const useDespesasPendentes = (userId: string | undefined, mesSelecionado: Date = new Date()) => {
  const [despesasPendentes, setDespesasPendentes] = useState<DespesaPendente[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDespesasPendentes = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Filtrar por mês selecionado
      const mesInicio = new Date(mesSelecionado.getFullYear(), mesSelecionado.getMonth(), 1);
      const mesFim = new Date(mesSelecionado.getFullYear(), mesSelecionado.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from("transacoes")
        .select("id, descricao, valor, data_transacao, total_parcelas, parcela_atual, categoria_id")
        .eq("user_id", userId)
        .eq("tipo", "despesa")
        .is("banco_id", null) // Apenas despesas sem banco associado (pendentes)
        .is("cartao_credito_id", null) // E sem cartão de crédito associado
        .gte("data_transacao", mesInicio.toISOString().split('T')[0])
        .lte("data_transacao", mesFim.toISOString().split('T')[0])
        .order("data_transacao", { ascending: true });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar despesas pendentes",
          variant: "destructive",
        });
      } else {
        setDespesasPendentes(data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar despesas pendentes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDespesasPendentes();
  }, [userId, mesSelecionado]);

  return {
    despesasPendentes,
    loading,
    fetchDespesasPendentes
  };
};