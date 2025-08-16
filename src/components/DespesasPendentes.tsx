import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle, Calendar, CreditCard, AlertCircle, TrendingDown } from "lucide-react";
import { ModalConfirmarPagamento } from "@/components/ModalConfirmarPagamento";
import { pagarDespesa } from "@/hooks/usePagamentoDespesa";

interface DespesaPendente {
  id: string;
  descricao: string;
  valor: number;
  data_transacao: string;
  total_parcelas?: number | null;
  parcela_atual?: number | null;
}

interface DespesasPendentesProps {
  user: User | null;
  mesSelecionado?: Date;
}

const DespesasPendentes = ({ user, mesSelecionado = new Date() }: DespesasPendentesProps) => {
  const [despesasPendentes, setDespesasPendentes] = useState<DespesaPendente[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalPagamento, setModalPagamento] = useState<{
    isOpen: boolean;
    despesa?: DespesaPendente;
  }>({ isOpen: false });
  const { toast } = useToast();

  const fetchDespesasPendentes = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Filtrar por mês selecionado
      const mesInicio = new Date(mesSelecionado.getFullYear(), mesSelecionado.getMonth(), 1);
      const mesFim = new Date(mesSelecionado.getFullYear(), mesSelecionado.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from("transacoes")
        .select("id, descricao, valor, data_transacao, total_parcelas, parcela_atual")
        .eq("user_id", user.id)
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
  }, [user?.id, mesSelecionado]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleMarcarPaga = (despesa: DespesaPendente) => {
    setModalPagamento({ isOpen: true, despesa });
  };

  const handleConfirmarPagamento = async (
    contaId: string,
    metodoPagamento: string,
    observacoes?: string,
    cartaoId?: string
  ) => {
    if (!modalPagamento.despesa) return;

    const resultado = await pagarDespesa(
      modalPagamento.despesa.id,
      contaId,
      metodoPagamento,
      observacoes,
      cartaoId
    );

    if (resultado.sucesso) {
      toast({
        title: "Sucesso",
        description: resultado.mensagem,
      });
      setModalPagamento({ isOpen: false });
      fetchDespesasPendentes(); // Recarregar lista
    } else {
      toast({
        title: "Erro",
        description: resultado.mensagem,
        variant: "destructive",
      });
    }
  };

  const isVencida = (dataTransacao: string) => {
    const hoje = new Date();
    const dataVencimento = new Date(dataTransacao);
    return dataVencimento < hoje;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Despesas Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (despesasPendentes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Despesas Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-income opacity-50" />
            <p className="text-muted-foreground text-sm">
              Nenhuma despesa pendente
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Despesas Pendentes
          <Badge variant="secondary">{despesasPendentes.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {despesasPendentes
          .sort((a, b) => new Date(a.data_transacao).getTime() - new Date(b.data_transacao).getTime())
          .map((despesa) => (
          <div 
            key={despesa.id}
            className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30"
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                isVencida(despesa.data_transacao) 
                  ? 'bg-destructive/10 text-destructive' 
                  : 'bg-expense/10 text-expense'
              }`}>
                {isVencida(despesa.data_transacao) ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm truncate">{despesa.descricao}</h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span className={`whitespace-nowrap ${isVencida(despesa.data_transacao) ? 'text-destructive font-medium' : ''}`}>
                      {formatDate(despesa.data_transacao)}
                      {isVencida(despesa.data_transacao) && ' (Vencida)'}
                    </span>
                  </div>
                  {despesa.total_parcelas && despesa.parcela_atual && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {despesa.parcela_atual}/{despesa.total_parcelas}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="font-semibold text-expense">
                  {formatCurrency(despesa.valor)}
                </span>
                {isVencida(despesa.data_transacao) && (
                  <Badge variant="destructive" className="text-xs ml-2">
                    Vencida
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant={isVencida(despesa.data_transacao) ? "default" : "outline"}
                onClick={() => handleMarcarPaga(despesa)}
                className="text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Pagar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
      
      {modalPagamento.despesa && (
        <ModalConfirmarPagamento
          isOpen={modalPagamento.isOpen}
          onClose={() => setModalPagamento({ isOpen: false })}
          onConfirm={handleConfirmarPagamento}
          titulo="Pagar Despesa"
          descricao={`Confirme o pagamento da despesa: ${modalPagamento.despesa.descricao}`}
          valor={modalPagamento.despesa.valor}
          despesaId={modalPagamento.despesa.id}
        />
      )}
    </Card>
  );
};

export default DespesasPendentes;