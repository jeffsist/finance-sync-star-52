import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Receipt, CreditCard, RefreshCw, Calendar } from "lucide-react";

interface Movimentacao {
  id: string;
  tipo: 'receita_recebida' | 'despesa_paga' | 'compra_cartao' | 'pagamento_fatura' | 'transferencia' | 'alteracao_limite';
  descricao: string;
  valor: number;
  data: string;
  status: 'concluida' | 'pendente' | 'cancelada';
}

interface Filtros {
  dataInicio: string;
  dataFim: string;
  tipoMovimentacao: string;
  origem: string;
  valorMin: string;
  valorMax: string;
  status: string;
  busca: string;
}

interface ResumoMovimentacoesProps {
  movimentacoes: Movimentacao[];
  filtros: Filtros;
}

const ResumoMovimentacoes = ({ movimentacoes, filtros }: ResumoMovimentacoesProps) => {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const formatPeriod = () => {
    const inicio = new Date(filtros.dataInicio).toLocaleDateString('pt-BR');
    const fim = new Date(filtros.dataFim).toLocaleDateString('pt-BR');
    return `${inicio} - ${fim}`;
  };

  // Calcular resumos
  const receitas = movimentacoes.filter(m => m.tipo === 'receita_recebida');
  const despesas = movimentacoes.filter(m => m.tipo === 'despesa_paga');
  const comprasCartao = movimentacoes.filter(m => m.tipo === 'compra_cartao');
  const pagamentosFatura = movimentacoes.filter(m => m.tipo === 'pagamento_fatura');

  const totalReceitas = receitas.reduce((total, m) => total + m.valor, 0);
  const totalDespesas = despesas.reduce((total, m) => total + m.valor, 0);
  const totalComprasCartao = comprasCartao.reduce((total, m) => total + m.valor, 0);
  const totalPagamentosFatura = pagamentosFatura.reduce((total, m) => total + m.valor, 0);

  const saldoPeriodo = totalReceitas - totalDespesas - totalComprasCartao - totalPagamentosFatura;
  const totalMovimentacoes = movimentacoes.length;

  return (
    <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
      {/* Título do período */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Resumo do Período</h2>
        <div className="flex items-center justify-center text-muted-foreground text-sm">
          <Calendar className="h-3 sm:h-4 w-3 sm:w-4 mr-2" />
          <span>{formatPeriod()}</span>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-income" />
          </CardHeader>
          <CardContent className="pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-income">{formatCurrency(totalReceitas)}</div>
            <p className="text-xs text-muted-foreground">
              {receitas.length} transação{receitas.length !== 1 ? 'ões' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-expense" />
          </CardHeader>
          <CardContent className="pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-expense">{formatCurrency(totalDespesas)}</div>
            <p className="text-xs text-muted-foreground">
              {despesas.length} transação{despesas.length !== 1 ? 'ões' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cartão de Crédito</CardTitle>
            <CreditCard className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent className="pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-warning">{formatCurrency(totalComprasCartao)}</div>
            <p className="text-xs text-muted-foreground">
              {comprasCartao.length} compra{comprasCartao.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagto. Faturas</CardTitle>
            <Receipt className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent className="pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-info">{formatCurrency(totalPagamentosFatura)}</div>
            <p className="text-xs text-muted-foreground">
              {pagamentosFatura.length} pagamento{pagamentosFatura.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo consolidado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Saldo do Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl sm:text-3xl font-bold ${saldoPeriodo >= 0 ? 'text-income' : 'text-expense'}`}>
              {saldoPeriodo >= 0 ? '+' : ''}{formatCurrency(saldoPeriodo)}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Receitas - Despesas - Compras - Pagamentos
            </p>
            <div className="mt-3 sm:mt-4 space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Receitas:</span>
                <span className="text-income">+{formatCurrency(totalReceitas)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Despesas:</span>
                <span className="text-expense">-{formatCurrency(totalDespesas)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Compras Cartão:</span>
                <span className="text-warning">-{formatCurrency(totalComprasCartao)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pagto. Faturas:</span>
                <span className="text-info">-{formatCurrency(totalPagamentosFatura)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Movimentações</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold">{totalMovimentacoes}</div>
            <p className="text-xs text-muted-foreground">
              Movimentações no período
            </p>
            
            {/* Distribuição por status */}
            <div className="mt-3 sm:mt-4 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Concluídas:</span>
                <span>{movimentacoes.filter(m => m.status === 'concluida').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pendentes:</span>
                <span>{movimentacoes.filter(m => m.status === 'pendente').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Canceladas:</span>
                <span>{movimentacoes.filter(m => m.status === 'cancelada').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResumoMovimentacoes;