import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3, CheckCircle, Clock } from "lucide-react";

interface Transacao {
  id: string;
  valor: number;
  tipo: string;
  banco_id?: string;
  cartao_credito_id?: string;
}

interface ResumoTransacoesFitradasProps {
  transacoes: Transacao[];
}

export const ResumoTransacoesFiltradas = ({ transacoes }: ResumoTransacoesFitradasProps) => {
  // Calcular totais
  const receitas = transacoes.filter(t => t.tipo === "receita");
  const despesas = transacoes.filter(t => t.tipo === "despesa");
  
  const totalReceitas = receitas.reduce((sum, t) => sum + t.valor, 0);
  const totalDespesas = despesas.reduce((sum, t) => sum + t.valor, 0);
  const saldoLiquido = totalReceitas - totalDespesas;
  
  // Separar por status
  const receitasPagas = receitas.filter(t => t.banco_id || t.cartao_credito_id);
  const receitasPendentes = receitas.filter(t => !t.banco_id && !t.cartao_credito_id);
  const despesasPagas = despesas.filter(t => t.banco_id || t.cartao_credito_id);
  const despesasPendentes = despesas.filter(t => !t.banco_id && !t.cartao_credito_id);
  
  const totalReceitasPagas = receitasPagas.reduce((sum, t) => sum + t.valor, 0);
  const totalReceitasPendentes = receitasPendentes.reduce((sum, t) => sum + t.valor, 0);
  const totalDespesasPagas = despesasPagas.reduce((sum, t) => sum + t.valor, 0);
  const totalDespesasPendentes = despesasPendentes.reduce((sum, t) => sum + t.valor, 0);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  // Só mostrar se houver transações
  if (transacoes.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <BarChart3 className="h-5 w-5" />
          Resumo das Transações Filtradas
          <Badge variant="secondary">{transacoes.length} transações</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Totais principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-income">
              <TrendingUp className="h-4 w-4" />
              Receitas
            </div>
            <div className="text-2xl font-bold text-income">
              {formatCurrency(totalReceitas)}
            </div>
            <div className="text-xs text-muted-foreground">
              {receitas.length} transações
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-expense">
              <TrendingDown className="h-4 w-4" />
              Despesas
            </div>
            <div className="text-2xl font-bold text-expense">
              {formatCurrency(totalDespesas)}
            </div>
            <div className="text-xs text-muted-foreground">
              {despesas.length} transações
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">
              Saldo Líquido
            </div>
            <div className={`text-2xl font-bold ${
              saldoLiquido >= 0 ? 'text-income' : 'text-expense'
            }`}>
              {formatCurrency(saldoLiquido)}
            </div>
            <div className="text-xs text-muted-foreground">
              Receitas - Despesas
            </div>
          </div>
        </div>

        {/* Separação por status - só mostrar se houver transações pagas e pendentes */}
        {(totalReceitasPagas > 0 || totalDespesasPagas > 0 || totalReceitasPendentes > 0 || totalDespesasPendentes > 0) && (
          <div className="pt-4 border-t border-border/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {totalReceitasPagas > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-income">
                    <CheckCircle className="h-3 w-3" />
                    <span className="text-xs">Receitas Recebidas</span>
                  </div>
                  <div className="font-semibold text-income">
                    {formatCurrency(totalReceitasPagas)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {receitasPagas.length} transações
                  </div>
                </div>
              )}
              
              {totalReceitasPendentes > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-amber-600">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">Receitas Pendentes</span>
                  </div>
                  <div className="font-semibold text-amber-600">
                    {formatCurrency(totalReceitasPendentes)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {receitasPendentes.length} transações
                  </div>
                </div>
              )}
              
              {totalDespesasPagas > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-expense">
                    <CheckCircle className="h-3 w-3" />
                    <span className="text-xs">Despesas Pagas</span>
                  </div>
                  <div className="font-semibold text-expense">
                    {formatCurrency(totalDespesasPagas)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {despesasPagas.length} transações
                  </div>
                </div>
              )}
              
              {totalDespesasPendentes > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-amber-600">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">Despesas Pendentes</span>
                  </div>
                  <div className="font-semibold text-amber-600">
                    {formatCurrency(totalDespesasPendentes)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {despesasPendentes.length} transações
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};