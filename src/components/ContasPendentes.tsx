import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTransacoesPendentes } from "@/hooks/useTransacoesPendentes";
import ModalConfirmarRecebimento from "@/components/ModalConfirmarRecebimento";
import { Clock, CheckCircle, Calendar } from "lucide-react";

interface ContasPendentesProps {
  user: User | null;
  mesSelecionado?: Date;
}

const ContasPendentes = ({ user, mesSelecionado = new Date() }: ContasPendentesProps) => {
  const { transacoesPendentes, loading, fetchTransacoesPendentes } = useTransacoesPendentes(user?.id, mesSelecionado);
  const [modalAberto, setModalAberto] = useState(false);
  const [transacaoSelecionada, setTransacaoSelecionada] = useState<{
    id: string;
    descricao: string;
    valor: number;
  } | null>(null);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleMarcarEfetivada = (transacao: any) => {
    setTransacaoSelecionada({
      id: transacao.id,
      descricao: transacao.descricao,
      valor: transacao.valor
    });
    setModalAberto(true);
  };

  const handleConfirmado = () => {
    fetchTransacoesPendentes();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Contas Pendentes
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

  if (transacoesPendentes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Contas Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-income opacity-50" />
            <p className="text-muted-foreground text-sm">
              Nenhuma conta pendente
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
          <Clock className="h-5 w-5" />
          Contas Pendentes
          <Badge variant="secondary">{transacoesPendentes.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {transacoesPendentes.map((transacao) => (
          <div 
            key={transacao.id}
            className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30"
          >
            <div className="flex-1">
              <h4 className="font-medium text-sm">{transacao.descricao}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(transacao.data_transacao)}</span>
                {transacao.total_parcelas && transacao.parcela_atual && (
                  <Badge variant="outline" className="text-xs">
                    {transacao.parcela_atual}/{transacao.total_parcelas}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-income">
                {formatCurrency(transacao.valor)}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarcarEfetivada(transacao)}
                className="text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Recebido
              </Button>
            </div>
          </div>
        ))}
        
        <ModalConfirmarRecebimento
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
          transacao={transacaoSelecionada}
          onConfirmed={handleConfirmado}
        />
      </CardContent>
    </Card>
  );
};

export default ContasPendentes;