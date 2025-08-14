import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  CalendarDays,
  RefreshCw
} from "lucide-react";
import { gerarFaturasPendentes } from "@/hooks/useGerarFaturasPendentes";

interface ProjecaoMes {
  mes: string;
  ano: number;
  saldoInicial: number;
  totalReceitas: number;
  totalDespesas: number;
  saldoFinal: number;
  faturasPendentes: number;
}

interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
  data_transacao: string;
  banco_id?: string;
  cartao_credito_id?: string;
}

interface Banco {
  id: string;
  saldo_atual: number;
}

const ProjecaoFluxo = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculatingProjecoes, setCalculatingProjecoes] = useState(false);
  const [projecoes, setProjecoes] = useState<ProjecaoMes[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user?.id) {
      calcularProjecoes();
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    setLoading(false);
  };

  const calcularProjecoes = async () => {
    if (!user?.id) return;
    
    setCalculatingProjecoes(true);

    // Gerar faturas pendentes primeiro
    await gerarFaturasPendentes(user.id);

    // Buscar saldo atual total dos bancos
    const { data: bancosData } = await supabase
      .from("bancos")
      .select("saldo_atual")
      .eq("user_id", user.id)
      .eq("ativo", true);

    const saldoAtualTotal = bancosData?.reduce((total, banco) => total + banco.saldo_atual, 0) || 0;

    // Buscar todas as transações futuras
    const dataAtual = new Date();
    const dataFim = new Date();
    dataFim.setMonth(dataFim.getMonth() + 24);

    const { data: transacoesData } = await supabase
      .from("transacoes")
      .select("*")
      .eq("user_id", user.id)
      .gte("data_transacao", dataAtual.toISOString().split('T')[0])
      .lte("data_transacao", dataFim.toISOString().split('T')[0])
      .order("data_transacao", { ascending: true });

    // Buscar todas as faturas pendentes de uma vez
    const { data: todasFaturas, error: faturaError } = await supabase
      .from("faturas_cartao")
      .select("valor_total, mes, ano, cartao_credito_id")
      .eq("user_id", user.id)
      .in("status", ["aberta", "fechada"])
      .gte("ano", dataAtual.getFullYear())
      .lte("ano", dataFim.getFullYear());

    console.log("Faturas pendentes encontradas:", todasFaturas);
    if (faturaError) {
      console.error("Erro ao buscar faturas:", faturaError);
    }

    // Buscar cartões de crédito para calcular faturas futuras
    const { data: cartoesData } = await supabase
      .from("cartoes_credito")
      .select("id, dia_fechamento, dia_vencimento")
      .eq("user_id", user.id)
      .eq("ativo", true);

    // Calcular projeções mensais
    const projecoesMensais: ProjecaoMes[] = [];
    let saldoAcumulado = saldoAtualTotal;

    for (let i = 0; i < 24; i++) {
      const dataProjecao = new Date(dataAtual);
      dataProjecao.setMonth(dataProjecao.getMonth() + i);
      
      const mes = dataProjecao.toLocaleDateString('pt-BR', { month: 'long' });
      const ano = dataProjecao.getFullYear();
      const mesNumero = dataProjecao.getMonth() + 1;
      
      // Filtrar transações do mês
      const transacoesMes = transacoesData?.filter(t => {
        const dataTransacao = new Date(t.data_transacao);
        return dataTransacao.getMonth() === dataProjecao.getMonth() &&
               dataTransacao.getFullYear() === dataProjecao.getFullYear();
      }) || [];

      // Receitas pendentes que ainda não foram recebidas (sem banco_id)
      const receitasPendentes = transacoesMes
        .filter(t => t.tipo === 'receita' && !t.banco_id)
        .reduce((total, t) => total + t.valor, 0);

      // Despesas pendentes que ainda não foram pagas (sem banco_id e sem cartao_credito_id)
      const despesasPendentes = transacoesMes
        .filter(t => t.tipo === 'despesa' && !t.banco_id && !t.cartao_credito_id)
        .reduce((total, t) => total + t.valor, 0);

      // Despesas programadas no cartão de crédito (que ainda não foram pagas)
      const despesasCartao = transacoesMes
        .filter(t => t.tipo === 'despesa' && t.cartao_credito_id && !t.banco_id)
        .reduce((total, t) => total + t.valor, 0);

      // Calcular faturas para o mês baseado na data de vencimento dos cartões
      let faturasMes = 0;
      
      // Para cada cartão, verificar se há faturas que vencem neste mês
      if (cartoesData) {
        for (const cartao of cartoesData) {
          // Calcular período de faturamento para este mês
          const dataFechamentoAnterior = new Date(ano, mesNumero - 2, cartao.dia_fechamento);
          const dataFechamentoAtual = new Date(ano, mesNumero - 1, cartao.dia_fechamento);
          
          // Verificar se há faturas já criadas para este cartão e mês
          const faturaExistente = todasFaturas?.find(f => 
            f.cartao_credito_id === cartao.id && 
            f.mes === mesNumero && 
            f.ano === ano
          );
          
          if (faturaExistente) {
            faturasMes += faturaExistente.valor_total;
          } else {
            // Calcular valor da fatura baseado nas despesas do período de faturamento
            const despesasCartaoPeriodo = transacoesData?.filter(t => {
              const dataTransacao = new Date(t.data_transacao);
              return t.tipo === 'despesa' && 
                     t.cartao_credito_id === cartao.id &&
                     dataTransacao >= dataFechamentoAnterior &&
                     dataTransacao < dataFechamentoAtual;
            }) || [];
            
            const valorFaturaCalculada = despesasCartaoPeriodo.reduce((total, t) => total + t.valor, 0);
            if (valorFaturaCalculada > 0) {
              faturasMes += valorFaturaCalculada;
            }
          }
        }
      }

      const totalFaturas = faturasMes;
      
      console.log(`Mês ${mesNumero}/${ano}:`, {
        faturasMes,
        despesasPendentes,
        totalDespesas: despesasPendentes + totalFaturas
      });

      const totalReceitas = receitasPendentes;
      const totalDespesas = despesasPendentes + totalFaturas; // Incluir faturas existentes e futuras

      const saldoInicial = saldoAcumulado;
      const saldoFinal = saldoInicial + totalReceitas - totalDespesas;
      saldoAcumulado = saldoFinal;

      projecoesMensais.push({
        mes: mes.charAt(0).toUpperCase() + mes.slice(1),
        ano,
        saldoInicial,
        totalReceitas,
        totalDespesas,
        saldoFinal,
        faturasPendentes: totalFaturas // Faturas que vencem neste mês
      });
    }

    setProjecoes(projecoesMensais);
    setCalculatingProjecoes(false);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-primary">Projeção de Fluxo de Caixa</h1>
          </div>
          <Button 
            onClick={calcularProjecoes} 
            disabled={calculatingProjecoes}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${calculatingProjecoes ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarDays className="h-5 w-5 mr-2" />
                Próximos 24 Meses
              </CardTitle>
              <CardDescription>
                Projeção baseada nas receitas e despesas programadas
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4">
          {projecoes.map((projecao, index) => (
            <Card key={`${projecao.mes}-${projecao.ano}`} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {projecao.mes} {projecao.ano}
                  </h3>
                  <div className={`text-lg font-bold ${
                    projecao.saldoFinal >= 0 ? 'text-income' : 'text-expense'
                  }`}>
                    Saldo Final: {formatCurrency(projecao.saldoFinal)}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Saldo Inicial</p>
                    <p className="text-xl font-bold">{formatCurrency(projecao.saldoInicial)}</p>
                  </div>
                  
                  <div className="bg-income/10 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-income" />
                      <p className="text-sm text-muted-foreground">Receitas</p>
                    </div>
                    <p className="text-xl font-bold text-income">
                      +{formatCurrency(projecao.totalReceitas)}
                    </p>
                  </div>
                  
                   <div className="bg-expense/10 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-4 w-4 text-expense" />
                      <p className="text-sm text-muted-foreground">Despesas + Faturas</p>
                    </div>
                    <p className="text-xl font-bold text-expense">
                      -{formatCurrency(projecao.totalDespesas)}
                    </p>
                    {projecao.faturasPendentes > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Inclui {formatCurrency(projecao.faturasPendentes)} em faturas
                      </p>
                    )}
                  </div>
                  
                  <div className={`p-4 rounded-lg ${
                    projecao.saldoFinal >= 0 ? 'bg-income/10' : 'bg-expense/10'
                  }`}>
                    <p className="text-sm text-muted-foreground">Resultado</p>
                    <p className={`text-xl font-bold ${
                      projecao.saldoFinal >= 0 ? 'text-income' : 'text-expense'
                    }`}>
                      {projecao.saldoFinal >= 0 ? '+' : ''}{formatCurrency(projecao.totalReceitas - projecao.totalDespesas)}
                    </p>
                  </div>
                </div>
                
                {projecao.saldoFinal < 0 && (
                  <div className="mt-4 p-3 bg-expense/10 border border-expense/20 rounded-lg">
                    <p className="text-sm text-expense font-medium">
                      ⚠️ Atenção: Saldo negativo projetado para este mês
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {projecoes.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhuma projeção disponível</p>
              <p className="text-sm text-muted-foreground">
                Adicione transações futuras para visualizar projeções
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ProjecaoFluxo;