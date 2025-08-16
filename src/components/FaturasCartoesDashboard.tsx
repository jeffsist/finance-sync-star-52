import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ModalPagamentoFatura from "./ModalPagamentoFatura";

interface CartaoComFatura {
  id: string;
  nome: string;
  limite: number;
  limite_usado: number;
  dia_fechamento: number;
  dia_vencimento: number;
  valorFatura: number;
  faturaId?: string;
  statusPagamento: 'paga' | 'pendente';
}

interface FaturasCartoesDashboardProps {
  user: User | null;
  mesSelecionado: Date;
}

const FaturasCartoesDashboard = ({ user, mesSelecionado }: FaturasCartoesDashboardProps) => {
  const [cartoes, setCartoes] = useState<CartaoComFatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalPagamento, setModalPagamento] = useState(false);
  const [cartaoSelecionado, setCartaoSelecionado] = useState<CartaoComFatura | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      fetchCartoesComFaturas();
    }
  }, [user?.id, mesSelecionado]);

  const fetchCartoesComFaturas = async () => {
    if (!user?.id) return;

    setLoading(true);
    
    try {
      // Buscar cartões ativos
      const { data: cartoesData, error: cartoesError } = await supabase
        .from("cartoes_credito")
        .select("*")
        .eq("user_id", user.id)
        .eq("ativo", true);

      if (cartoesError) throw cartoesError;

      const cartoesComFaturas: CartaoComFatura[] = [];

      for (const cartao of cartoesData || []) {
        // Calcular período da fatura (do fechamento anterior até fechamento atual)
        const anoAtual = mesSelecionado.getFullYear();
        const mesAtual = mesSelecionado.getMonth();
        
        const dataFechamentoAnterior = new Date(anoAtual, mesAtual - 1, cartao.dia_fechamento);
        const dataFechamentoAtual = new Date(anoAtual, mesAtual, cartao.dia_fechamento);

        // Buscar transações do período
        const { data: transacoes } = await supabase
          .from("transacoes")
          .select("valor")
          .eq("cartao_credito_id", cartao.id)
          .eq("tipo", "despesa")
          .gte("data_transacao", dataFechamentoAnterior.toISOString().split('T')[0])
          .lt("data_transacao", dataFechamentoAtual.toISOString().split('T')[0]);

        const valorFatura = transacoes?.reduce((total, t) => total + Number(t.valor), 0) || 0;

        // Por enquanto, todas as faturas são consideradas pendentes
        const statusPagamento: 'paga' | 'pendente' = 'pendente';

        cartoesComFaturas.push({
          id: cartao.id,
          nome: cartao.nome,
          limite: cartao.limite,
          limite_usado: cartao.limite_usado,
          dia_fechamento: cartao.dia_fechamento,
          dia_vencimento: cartao.dia_vencimento,
          valorFatura,
          statusPagamento
        });
      }

      setCartoes(cartoesComFaturas);
    } catch (error) {
      console.error("Erro ao buscar cartões e faturas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as faturas dos cartões.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getDataVencimento = (cartao: CartaoComFatura) => {
    const dataVencimento = new Date(
      mesSelecionado.getFullYear(),
      mesSelecionado.getMonth(),
      cartao.dia_vencimento
    );
    return dataVencimento.toLocaleDateString('pt-BR');
  };

  const handlePagarFatura = (cartao: CartaoComFatura) => {
    setCartaoSelecionado(cartao);
    setModalPagamento(true);
  };

  const handlePagamentoRealizado = () => {
    fetchCartoesComFaturas();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Faturas dos Cartões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Faturas dos Cartões
        </CardTitle>
      </CardHeader>
      <CardContent>
        {cartoes.length > 0 ? (
          <div className="space-y-3">
            {cartoes.map((cartao) => (
              <div
                key={cartao.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors gap-3 sm:gap-4"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="bg-primary/10 text-primary p-2 rounded-lg flex-shrink-0">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                     <p className="font-medium text-sm truncate">{cartao.nome}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs text-muted-foreground gap-1 sm:gap-0">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Venc: {getDataVencimento(cartao)}</span>
                      </div>
                      <span className="hidden sm:inline">•</span>
                      <span className="truncate">
                        Limite: {formatCurrency(cartao.limite - cartao.limite_usado)} disponível
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="font-bold text-sm whitespace-nowrap">
                      {formatCurrency(cartao.valorFatura)}
                    </div>
                    {cartao.statusPagamento === 'paga' ? (
                      <Badge variant="default" className="bg-income text-income-foreground">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Paga
                      </Badge>
                    ) : cartao.valorFatura > 0 ? (
                      <Button
                        size="sm"
                        onClick={() => handlePagarFatura(cartao)}
                      >
                        Pagar Fatura
                      </Button>
                    ) : (
                      <Badge variant="outline">Sem movimentação</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum cartão de crédito encontrado</p>
            <p className="text-sm">Cadastre um cartão para ver as faturas aqui</p>
          </div>
        )}
      </CardContent>
      
      {cartaoSelecionado && (
        <ModalPagamentoFatura
          open={modalPagamento}
          onOpenChange={setModalPagamento}
          cartao={cartaoSelecionado}
          mesSelecionado={mesSelecionado}
          onPagamentoRealizado={handlePagamentoRealizado}
        />
      )}
    </Card>
  );
};

export default FaturasCartoesDashboard;