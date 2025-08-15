import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Filter,
  Download,
  Receipt,
  CreditCard,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  Search,
  Wallet
} from "lucide-react";
import MovimentacaoCard from "@/components/MovimentacaoCard";
import MovimentacaoFilters from "@/components/MovimentacaoFilters";
import ResumoMovimentacoes from "@/components/ResumoMovimentacoes";

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

const Movimentacoes = () => {
  const [user, setUser] = useState<User | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<Filtros>({
    dataInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    tipoMovimentacao: 'todos',
    origem: 'todos',
    valorMin: '',
    valorMax: '',
    status: 'todos',
    busca: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchMovimentacoes();
    }
  }, [user, filtros]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    setLoading(false);
  };

  const fetchMovimentacoes = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const movimentacoesProcessadas: Movimentacao[] = [];

      // Buscar transações
      const { data: transacoes } = await supabase
        .from("transacoes")
        .select(`
          *,
          categorias(nome, cor),
          bancos(nome),
          cartoes_credito(nome)
        `)
        .eq("user_id", user.id)
        .gte("data_transacao", filtros.dataInicio)
        .lte("data_transacao", filtros.dataFim)
        .order("data_transacao", { ascending: false });

      if (transacoes) {
        transacoes.forEach(transacao => {
          const isReceita = transacao.tipo === 'receita';
          const isPaga = transacao.banco_id !== null;
          
          let tipo: Movimentacao['tipo'];
          let status: Movimentacao['status'];
          let icone: string;
          let cor: string;

          if (isReceita) {
            tipo = 'receita_recebida';
            status = isPaga ? 'concluida' : 'pendente';
            icone = 'TrendingUp';
            cor = 'text-income';
          } else if (transacao.cartao_credito_id) {
            tipo = 'compra_cartao';
            status = 'concluida';
            icone = 'CreditCard';
            cor = 'text-expense';
          } else {
            tipo = 'despesa_paga';
            status = isPaga ? 'concluida' : 'pendente';
            icone = 'TrendingDown';
            cor = 'text-expense';
          }

          movimentacoesProcessadas.push({
            id: transacao.id,
            tipo,
            descricao: transacao.descricao,
            valor: transacao.valor,
            data: transacao.data_transacao,
            origem: transacao.bancos?.nome || transacao.cartoes_credito?.nome,
            categoria: transacao.categorias?.nome,
            observacoes: transacao.observacoes,
            status,
            icone,
            cor,
            detalhes: transacao
          });
        });
      }

      // Buscar faturas pagas
      const { data: faturas } = await supabase
        .from("faturas_cartao")
        .select(`
          *,
          cartoes_credito(nome)
        `)
        .eq("user_id", user.id)
        .eq("status", "paga")
        .gte("data_vencimento", filtros.dataInicio)
        .lte("data_vencimento", filtros.dataFim)
        .order("data_vencimento", { ascending: false });

      if (faturas) {
        faturas.forEach(fatura => {
          movimentacoesProcessadas.push({
            id: `fatura_${fatura.id}`,
            tipo: 'pagamento_fatura',
            descricao: `Pagamento fatura ${fatura.cartoes_credito?.nome}`,
            valor: fatura.valor_pago,
            data: fatura.data_vencimento,
            origem: fatura.cartoes_credito?.nome,
            status: 'concluida',
            icone: 'Receipt',
            cor: 'text-warning',
            detalhes: fatura
          });
        });
      }

      // Aplicar filtros adicionais
      let movimentacoesFiltradas = movimentacoesProcessadas;

      if (filtros.tipoMovimentacao !== 'todos') {
        movimentacoesFiltradas = movimentacoesFiltradas.filter(m => m.tipo === filtros.tipoMovimentacao);
      }

      if (filtros.status !== 'todos') {
        movimentacoesFiltradas = movimentacoesFiltradas.filter(m => m.status === filtros.status);
      }

      if (filtros.valorMin) {
        movimentacoesFiltradas = movimentacoesFiltradas.filter(m => m.valor >= parseFloat(filtros.valorMin));
      }

      if (filtros.valorMax) {
        movimentacoesFiltradas = movimentacoesFiltradas.filter(m => m.valor <= parseFloat(filtros.valorMax));
      }

      if (filtros.busca) {
        const busca = filtros.busca.toLowerCase();
        movimentacoesFiltradas = movimentacoesFiltradas.filter(m => 
          m.descricao.toLowerCase().includes(busca) ||
          m.origem?.toLowerCase().includes(busca) ||
          m.categoria?.toLowerCase().includes(busca)
        );
      }

      // Ordenar por data
      movimentacoesFiltradas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      setMovimentacoes(movimentacoesFiltradas);
    } catch (error) {
      console.error("Erro ao carregar movimentações:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Implementar exportação CSV/PDF
    console.log("Exportar movimentações");
  };

  const limparFiltros = () => {
    setFiltros({
      dataInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      dataFim: new Date().toISOString().split('T')[0],
      tipoMovimentacao: 'todos',
      origem: 'todos',
      valorMin: '',
      valorMax: '',
      status: 'todos',
      busca: ''
    });
  };

  if (loading && movimentacoes.length === 0) {
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
              <RefreshCw className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-primary">Movimentações</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Resumo do Período */}
        <ResumoMovimentacoes movimentacoes={movimentacoes} filtros={filtros} />

        {/* Filtros */}
        {showFilters && (
          <MovimentacaoFilters 
            filtros={filtros} 
            setFiltros={setFiltros}
            onLimparFiltros={limparFiltros}
          />
        )}

        {/* Busca Rápida */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição, origem ou categoria..."
                value={filtros.busca}
                onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Movimentações */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Carregando movimentações...</p>
            </div>
          ) : movimentacoes.length > 0 ? (
            movimentacoes.map((movimentacao) => (
              <MovimentacaoCard key={movimentacao.id} movimentacao={movimentacao} />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-2">Nenhuma movimentação encontrada</p>
                <p className="text-sm text-muted-foreground">
                  Tente ajustar os filtros ou selecionar um período diferente
                </p>
                <Button variant="outline" onClick={limparFiltros} className="mt-4">
                  Limpar Filtros
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Movimentacoes;