import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ContasPendentes from "@/components/ContasPendentes";
import DespesasPendentes from "@/components/DespesasPendentes";
import FaturasCartoesDashboard from "@/components/FaturasCartoesDashboard";
import ModalConfiguracoes from "@/components/ModalConfiguracoes";
import ResumoContasBanco from "@/components/ResumoContasBanco";
import ResumoMetas from "@/components/ResumoMetas";
import { MobileHeader } from "@/components/MobileHeader";
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Settings,
  LogOut,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Target
} from "lucide-react";

interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
  data_transacao: string;
  categoria_id?: string;
  cartao_credito_id?: string;
  banco_id?: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [transacoesRecentes, setTransacoesRecentes] = useState<Transacao[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState(new Date());
  const [resumoFinanceiro, setResumoFinanceiro] = useState({
    saldoTotal: 0,
    receitasMes: 0,
    despesasMes: 0,
    faturasPendentes: 0
  });
  
  const [projecaoFluxo, setProjecaoFluxo] = useState({
    proximoMes: {
      mes: '',
      saldoFinal: 0,
      totalReceitas: 0,
      totalDespesas: 0,
      variacao: 0
    },
    proximosSeisMeses: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      setLoading(false);
      
      // Carregar dados do dashboard
      await fetchDashboardData(session.user.id);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          navigate("/auth");
        } else {
          setUser(session.user);
          fetchDashboardData(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchDashboardData = async (userId: string) => {
    await Promise.all([
      fetchTransacoesRecentes(userId),
      fetchResumoFinanceiro(userId),
      fetchProjecaoFluxo(userId)
    ]);
  };

  const fetchTransacoesRecentes = async (userId: string) => {
    const { data, error } = await supabase
      .from("transacoes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error && data) {
      setTransacoesRecentes(data);
    }
  };

  const fetchResumoFinanceiro = async (userId: string) => {
    const mesInicio = new Date(mesSelecionado.getFullYear(), mesSelecionado.getMonth(), 1);
    const mesFim = new Date(mesSelecionado.getFullYear(), mesSelecionado.getMonth() + 1, 0);
    
    // Buscar saldo total dos bancos
    const { data: bancosData } = await supabase
      .from("bancos")
      .select("saldo_atual")
      .eq("user_id", userId)
      .eq("ativo", true);
    
    const saldoTotal = bancosData?.reduce((total, banco) => total + banco.saldo_atual, 0) || 0;

    // Buscar transações pendentes do mês (receitas sem banco_id)
    const { data: receitasPendentesData } = await supabase
      .from("transacoes")
      .select("valor")
      .eq("user_id", userId)
      .eq("tipo", "receita")
      .is("banco_id", null)
      .gte("data_transacao", mesInicio.toISOString().split('T')[0])
      .lte("data_transacao", mesFim.toISOString().split('T')[0]);

    const receitasPendentes = receitasPendentesData?.reduce((total, t) => total + t.valor, 0) || 0;

    // Buscar despesas pendentes do mês (despesas sem banco_id e sem cartao_credito_id)
    const { data: despesasPendentesData } = await supabase
      .from("transacoes")
      .select("valor")
      .eq("user_id", userId)
      .eq("tipo", "despesa")
      .is("banco_id", null)
      .is("cartao_credito_id", null)
      .gte("data_transacao", mesInicio.toISOString().split('T')[0])
      .lte("data_transacao", mesFim.toISOString().split('T')[0]);

    const despesasPendentes = despesasPendentesData?.reduce((total, t) => total + t.valor, 0) || 0;

    // Buscar faturas pendentes do mês
    const { data: faturas } = await supabase
      .from("faturas_cartao")
      .select("valor_total")
      .eq("user_id", userId)
      .eq("status", "pendente")
      .eq("mes", mesSelecionado.getMonth() + 1)
      .eq("ano", mesSelecionado.getFullYear());

    const faturasPendentes = faturas?.reduce((total, fatura) => total + fatura.valor_total, 0) || 0;

    // Calcular saldo previsto do mês (saldo atual + receitas pendentes - despesas pendentes - faturas pendentes)
    const saldoPrevisto = saldoTotal + receitasPendentes - despesasPendentes - faturasPendentes;

    setResumoFinanceiro({
      saldoTotal,
      receitasMes: receitasPendentes,
      despesasMes: despesasPendentes + faturasPendentes,
      faturasPendentes: saldoPrevisto
    });
  };

  const fetchProjecaoFluxo = async (userId: string) => {
    // Buscar saldo atual total dos bancos
    const { data: bancosData } = await supabase
      .from("bancos")
      .select("saldo_atual")
      .eq("user_id", userId)
      .eq("ativo", true);

    const saldoAtualTotal = bancosData?.reduce((total, banco) => total + banco.saldo_atual, 0) || 0;

    // Próximo mês
    const proximoMes = new Date();
    proximoMes.setMonth(proximoMes.getMonth() + 1);
    const mesProximoInicio = new Date(proximoMes.getFullYear(), proximoMes.getMonth(), 1);
    const mesProximoFim = new Date(proximoMes.getFullYear(), proximoMes.getMonth() + 1, 0);

    // Buscar transações do próximo mês
    const { data: transacoesProximas } = await supabase
      .from("transacoes")
      .select("*")
      .eq("user_id", userId)
      .gte("data_transacao", mesProximoInicio.toISOString().split('T')[0])
      .lte("data_transacao", mesProximoFim.toISOString().split('T')[0]);

    // Receitas e despesas pendentes do próximo mês
    const receitasProximas = transacoesProximas?.filter(t => t.tipo === 'receita' && !t.banco_id)
      .reduce((total, t) => total + t.valor, 0) || 0;
    const despesasProximas = transacoesProximas?.filter(t => t.tipo === 'despesa' && !t.banco_id && !t.cartao_credito_id)
      .reduce((total, t) => total + t.valor, 0) || 0;

    // Faturas do próximo mês
    const { data: faturasProximas } = await supabase
      .from("faturas_cartao")
      .select("valor_total")
      .eq("user_id", userId)
      .eq("status", "pendente")
      .eq("mes", proximoMes.getMonth() + 1)
      .eq("ano", proximoMes.getFullYear());

    const faturasPendentesProximas = faturasProximas?.reduce((total, fatura) => total + fatura.valor_total, 0) || 0;

    const totalDespesasProximas = despesasProximas + faturasPendentesProximas;
    const saldoFinalProximo = saldoAtualTotal + receitasProximas - totalDespesasProximas;
    const variacaoProximo = receitasProximas - totalDespesasProximas;

    // Próximos 6 meses
    const dataFim = new Date();
    dataFim.setMonth(dataFim.getMonth() + 6);

    const { data: transacoesSeisMeses } = await supabase
      .from("transacoes")
      .select("*")
      .eq("user_id", userId)
      .gte("data_transacao", new Date().toISOString().split('T')[0])
      .lte("data_transacao", dataFim.toISOString().split('T')[0]);

    const { data: faturasSeisMeses } = await supabase
      .from("faturas_cartao")
      .select("valor_total")
      .eq("user_id", userId)
      .eq("status", "pendente")
      .gte("ano", new Date().getFullYear());

    const receitasSeisMeses = transacoesSeisMeses?.filter(t => t.tipo === 'receita' && !t.banco_id)
      .reduce((total, t) => total + t.valor, 0) || 0;
    const despesasSeisMeses = transacoesSeisMeses?.filter(t => t.tipo === 'despesa' && !t.banco_id && !t.cartao_credito_id)
      .reduce((total, t) => total + t.valor, 0) || 0;
    const faturasSeisMesesTotal = faturasSeisMeses?.reduce((total, fatura) => total + fatura.valor_total, 0) || 0;

    const saldoProjetadoSeisMeses = saldoAtualTotal + receitasSeisMeses - despesasSeisMeses - faturasSeisMesesTotal;

    setProjecaoFluxo({
      proximoMes: {
        mes: proximoMes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        saldoFinal: saldoFinalProximo,
        totalReceitas: receitasProximas,
        totalDespesas: totalDespesasProximas,
        variacao: variacaoProximo
      },
      proximosSeisMeses: saldoProjetadoSeisMeses
    });
  };

  const navegarMes = (direcao: 'anterior' | 'proximo') => {
    const novoMes = new Date(mesSelecionado);
    if (direcao === 'anterior') {
      novoMes.setMonth(novoMes.getMonth() - 1);
    } else {
      novoMes.setMonth(novoMes.getMonth() + 1);
    }
    setMesSelecionado(novoMes);
  };

  useEffect(() => {
    if (user?.id) {
      fetchResumoFinanceiro(user.id);
      fetchProjecaoFluxo(user.id);
    }
  }, [mesSelecionado, user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
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
      <MobileHeader title="FinControle">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground hidden sm:block">
            Olá, {user?.user_metadata?.nome || user?.email}
          </span>
          <ModalConfiguracoes user={user}>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Configurações</span>
            </Button>
          </ModalConfiguracoes>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </MobileHeader>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Navegação de Mês */}
        <div className="flex items-center justify-center mb-6">
          <Card className="w-full sm:w-fit">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between sm:justify-center sm:space-x-4">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => navegarMes('anterior')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center min-w-[160px] sm:min-w-[200px]">
                  <h3 className="text-base sm:text-lg font-semibold">
                    {mesSelecionado.toLocaleDateString('pt-BR', { 
                      month: 'long', 
                      year: 'numeric' 
                    }).replace(/^\w/, c => c.toUpperCase())}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Visualização mensal</p>
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => navegarMes('proximo')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projeção de Fluxo de Caixa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(resumoFinanceiro.saldoTotal)}</div>
              <p className="text-xs text-muted-foreground">
                Todas as contas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas Pendentes</CardTitle>
              <TrendingUp className="h-4 w-4 text-income" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-income">
                {formatCurrency(resumoFinanceiro.receitasMes)}
              </div>
              <p className="text-xs text-muted-foreground">
                Mês atual
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas Pendentes</CardTitle>
              <TrendingDown className="h-4 w-4 text-expense" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-expense">
                {formatCurrency(resumoFinanceiro.despesasMes)}
              </div>
              <p className="text-xs text-muted-foreground">
                Mês atual
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Previsto</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${resumoFinanceiro.faturasPendentes >= 0 ? 'text-income' : 'text-expense'}`}>
                {formatCurrency(resumoFinanceiro.faturasPendentes)}
              </div>
              <p className="text-xs text-muted-foreground">
                Mês atual
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Resumo de Contas Bancárias */}
        <ResumoContasBanco 
          userId={user?.id || ''} 
          onNavigateToContas={() => navigate("/contas")} 
        />

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/transacoes")}
          >
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Nova Transação
              </CardTitle>
              <CardDescription>
                Adicione uma receita ou despesa
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/contas")}
          >
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wallet className="h-5 w-5 mr-2" />
                Gerenciar Contas
              </CardTitle>
              <CardDescription>
                Configure suas contas bancárias
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/cartoes")}
          >
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Cartões de Crédito
              </CardTitle>
              <CardDescription>
                Gerencie seus cartões e faturas
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/categorias")}
          >
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Categorias
              </CardTitle>
              <CardDescription>
                Organize suas transações
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/movimentacoes")}
          >
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCw className="h-5 w-5 mr-2" />
                Movimentações
              </CardTitle>
              <CardDescription>
                Histórico completo do sistema
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/metas")}
          >
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Metas e Limites
              </CardTitle>
              <CardDescription>
                Configure metas de receita e limites de gastos
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Nova seção para Projeção de Fluxo de Caixa */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/projecao-fluxo")}
          >
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Projeção de Fluxo de Caixa
              </CardTitle>
              <CardDescription>
                Visualize projeções financeiras dos próximos 24 meses
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Resumo de Metas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <ResumoMetas />
          <div className="grid grid-cols-1 gap-6">
            <ContasPendentes user={user} mesSelecionado={mesSelecionado} />
          </div>
        </div>

        {/* Seção de Gestão Financeira */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-foreground">Gestão Financeira</h2>
            <p className="text-sm text-muted-foreground">
              Gerencie suas faturas de cartões e despesas pendentes
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <FaturasCartoesDashboard user={user} mesSelecionado={mesSelecionado} />
            <DespesasPendentes user={user} mesSelecionado={mesSelecionado} />
          </div>
        </div>


        {/* Transações Recentes */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div>
            <Card>
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>
              Suas últimas movimentações financeiras
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transacoesRecentes.length > 0 ? (
              <div className="space-y-3">
                 {transacoesRecentes.map((transacao) => (
                   <div key={transacao.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                     <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                       <div className={`p-1.5 sm:p-2 rounded-lg ${
                         transacao.tipo === 'receita' ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'
                       }`}>
                         {transacao.tipo === 'receita' ? (
                           <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                         ) : (
                           <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                         )}
                       </div>
                       <div className="min-w-0 flex-1">
                         <p className="font-medium text-sm truncate">{transacao.descricao}</p>
                         <p className="text-xs text-muted-foreground flex items-center">
                           <Calendar className="h-3 w-3 mr-1" />
                           {formatDate(transacao.data_transacao)}
                         </p>
                       </div>
                     </div>
                     <div className={`text-xs sm:text-sm font-bold text-right ${
                       transacao.tipo === 'receita' ? 'text-income' : 'text-expense'
                     }`}>
                       {transacao.tipo === 'receita' ? '+' : '-'} {formatCurrency(transacao.valor)}
                     </div>
                   </div>
                 ))}
                <div className="text-center pt-3">
                  <Button variant="outline" size="sm" onClick={() => navigate("/transacoes")}>
                    Ver todas as transações
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma transação encontrada</p>
                <p className="text-sm">Comece adicionando sua primeira transação</p>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;