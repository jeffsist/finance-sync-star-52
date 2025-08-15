import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Receipt, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Calendar,
  DollarSign,
  Info
} from "lucide-react";

interface Movimentacao {
  id: string;
  tipo: 'receita_recebida' | 'despesa_paga' | 'compra_cartao' | 'pagamento_fatura' | 'transferencia' | 'alteracao_limite';
  descricao: string;
  valor: number;
  data: string;
  origem?: string;
  destino?: string;
  categoria?: string;
  observacoes?: string;
  status: 'concluida' | 'pendente' | 'cancelada';
  icone: string;
  cor: string;
  detalhes?: any;
}

interface MovimentacaoCardProps {
  movimentacao: Movimentacao;
}

const MovimentacaoCard = ({ movimentacao }: MovimentacaoCardProps) => {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIcon = () => {
    switch (movimentacao.tipo) {
      case 'receita_recebida':
        return <TrendingUp className="h-5 w-5" />;
      case 'despesa_paga':
        return <TrendingDown className="h-5 w-5" />;
      case 'compra_cartao':
        return <CreditCard className="h-5 w-5" />;
      case 'pagamento_fatura':
        return <Receipt className="h-5 w-5" />;
      case 'transferencia':
        return <RefreshCw className="h-5 w-5" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const getTipoLabel = () => {
    switch (movimentacao.tipo) {
      case 'receita_recebida':
        return 'Receita Recebida';
      case 'despesa_paga':
        return 'Despesa Paga';
      case 'compra_cartao':
        return 'Compra no Cartão';
      case 'pagamento_fatura':
        return 'Pagamento de Fatura';
      case 'transferencia':
        return 'Transferência';
      case 'alteracao_limite':
        return 'Alteração de Limite';
      default:
        return 'Movimentação';
    }
  };

  const getStatusVariant = () => {
    switch (movimentacao.status) {
      case 'concluida':
        return 'default';
      case 'pendente':
        return 'secondary';
      case 'cancelada':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getStatusLabel = () => {
    switch (movimentacao.status) {
      case 'concluida':
        return 'Concluída';
      case 'pendente':
        return 'Pendente';
      case 'cancelada':
        return 'Cancelada';
      default:
        return movimentacao.status;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-4 flex-1">
            {/* Ícone */}
            <div className={`${movimentacao.cor} bg-muted p-2 rounded-lg`}>
              {getIcon()}
            </div>

            {/* Informações principais */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground truncate">
                  {movimentacao.descricao}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className={`font-bold text-lg ${movimentacao.cor}`}>
                    {movimentacao.tipo === 'receita_recebida' ? '+' : '-'}{formatCurrency(movimentacao.valor)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(movimentacao.data)}
                </div>
                
                {movimentacao.origem && (
                  <div className="flex items-center">
                    <span className="mr-1">•</span>
                    {movimentacao.origem}
                  </div>
                )}

                {movimentacao.categoria && (
                  <div className="flex items-center">
                    <span className="mr-1">•</span>
                    {movimentacao.categoria}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {getTipoLabel()}
                  </Badge>
                  
                  <Badge variant={getStatusVariant()} className="text-xs">
                    {getStatusLabel()}
                  </Badge>
                </div>

                {/* Botão de detalhes */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Info className="h-4 w-4 mr-1" />
                      Detalhes
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <div className={`${movimentacao.cor}`}>
                          {getIcon()}
                        </div>
                        <span>Detalhes da Movimentação</span>
                      </DialogTitle>
                      <DialogDescription>
                        Informações completas sobre esta transação
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                          <p className="text-sm">{getTipoLabel()}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Status</label>
                          <p className="text-sm">{getStatusLabel()}</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                        <p className="text-sm">{movimentacao.descricao}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Valor</label>
                          <p className={`text-sm font-semibold ${movimentacao.cor}`}>
                            {formatCurrency(movimentacao.valor)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Data</label>
                          <p className="text-sm">{formatDateTime(movimentacao.data)}</p>
                        </div>
                      </div>

                      {movimentacao.origem && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Origem</label>
                          <p className="text-sm">{movimentacao.origem}</p>
                        </div>
                      )}

                      {movimentacao.categoria && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                          <p className="text-sm">{movimentacao.categoria}</p>
                        </div>
                      )}

                      {movimentacao.observacoes && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Observações</label>
                          <p className="text-sm">{movimentacao.observacoes}</p>
                        </div>
                      )}

                      {movimentacao.detalhes && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">ID da Transação</label>
                          <p className="text-xs font-mono text-muted-foreground">{movimentacao.id}</p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MovimentacaoCard;