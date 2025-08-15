import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TransactionFilters } from "@/components/TransactionFilters";
import { TransactionForm } from "@/components/TransactionForm";
import { ModalConfirmarPagamento } from "@/components/ModalConfirmarPagamento";
import { ModalConfirmarRecebimento } from "@/components/ModalConfirmarRecebimento";
import { ResumoTransacoesFiltradas } from "@/components/ResumoTransacoesFiltradas";
import { pagarDespesa } from "@/hooks/usePagamentoDespesa";
import { updateCartaoLimiteUsado } from "@/hooks/useCartaoUpdater";
import { useCartaoOperations } from "@/hooks/useCartaoOperations";
  import { 
    Plus, 
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Edit2,
    Trash2,
    Calendar,
    AlertCircle,
    CheckCircle,
    Clock,
    Filter,
    Trash
  } from "lucide-react";

interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
  data_transacao: string;
  observacoes?: string;
  categoria_id?: string;
  banco_id?: string;
  cartao_credito_id?: string;
  total_parcelas?: number | null;
  parcela_atual?: number | null;
  created_at: string;
  categoria?: Categoria;
  banco?: Banco;
  cartao_credito?: CartaoCredito;
}

interface FilterState {
  searchText: string;
  tipo: string;
  categoriaId: string;
  bancoId: string;
  cartaoId: string;
  status: string;
  valorMin: string;
  valorMax: string;
  dataInicio: Date | undefined;
  dataFim: Date | undefined;
  parcelamento: string;
}

interface Banco {
  id: string;
  nome: string;
  tipo?: string;
}

interface CartaoCredito {
  id: string;
  nome: string;
}

interface Categoria {
  id: string;
  nome: string;
  cor: string;
  tipo: string;
}

const Transacoes = () => {
  const [user, setUser] = useState<User | null>(null);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [transacoesFiltradas, setTransacoesFiltradas] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState<Transacao | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [modalPagamento, setModalPagamento] = useState<{
    isOpen: boolean;
    despesa?: Transacao;
  }>({ isOpen: false });
  const [modalRecebimento, setModalRecebimento] = useState<{
    isOpen: boolean;
    receita?: Transacao;
  }>({ isOpen: false });
  const [filters, setFilters] = useState<FilterState>({
    searchText: "",
    tipo: "",
    categoriaId: "",
    bancoId: "",
    cartaoId: "",
    status: "",
    valorMin: "",
    valorMax: "",
    dataInicio: undefined,
    dataFim: undefined,
    parcelamento: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { executeCartaoOperation } = useCartaoOperations();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchData();
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

  const fetchData = async () => {
    if (user?.id) {
      await fetchTransacoes();
    }
  };

  const fetchTransacoes = async () => {
    const { data, error } = await supabase
      .from("transacoes")
      .select(`
        *,
        categoria:categorias(id, nome, cor, tipo),
        banco:bancos(id, nome),
        cartao_credito:cartoes_credito(id, nome)
      `)
      .eq("user_id", user?.id)
      .order("data_transacao", { ascending: false });

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar transações",
        variant: "destructive",
      });
    } else {
      setTransacoes(data || []);
    }
  };

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [transacoes, filters]);

  const applyFilters = () => {
    let filtered = [...transacoes];

    // Filtro de busca por texto
    if (filters.searchText) {
      filtered = filtered.filter(t => 
        t.descricao.toLowerCase().includes(filters.searchText.toLowerCase())
      );
    }

    // Filtro por tipo
    if (filters.tipo) {
      filtered = filtered.filter(t => t.tipo === filters.tipo);
    }

    // Filtro por categoria
    if (filters.categoriaId) {
      filtered = filtered.filter(t => t.categoria_id === filters.categoriaId);
    }

    // Filtro por banco
    if (filters.bancoId) {
      filtered = filtered.filter(t => t.banco_id === filters.bancoId);
    }

    // Filtro por cartão
    if (filters.cartaoId) {
      filtered = filtered.filter(t => t.cartao_credito_id === filters.cartaoId);
    }

    // Filtro por status
    if (filters.status) {
      if (filters.status === "pago") {
        filtered = filtered.filter(t => t.banco_id || t.cartao_credito_id);
      } else if (filters.status === "pendente") {
        filtered = filtered.filter(t => !t.banco_id && !t.cartao_credito_id);
      }
    }

    // Filtro por valor
    if (filters.valorMin) {
      filtered = filtered.filter(t => t.valor >= parseFloat(filters.valorMin));
    }
    if (filters.valorMax) {
      filtered = filtered.filter(t => t.valor <= parseFloat(filters.valorMax));
    }

    // Filtro por data
    if (filters.dataInicio) {
      const dataInicio = filters.dataInicio.toISOString().split('T')[0];
      filtered = filtered.filter(t => t.data_transacao >= dataInicio);
    }
    if (filters.dataFim) {
      const dataFim = filters.dataFim.toISOString().split('T')[0];
      filtered = filtered.filter(t => t.data_transacao <= dataFim);
    }

    // Filtro por parcelamento
    if (filters.parcelamento) {
      if (filters.parcelamento === "vista") {
        filtered = filtered.filter(t => !t.total_parcelas || t.total_parcelas <= 1);
      } else if (filters.parcelamento === "parcelada") {
        filtered = filtered.filter(t => t.total_parcelas && t.total_parcelas > 1);
      }
    }

    setTransacoesFiltradas(filtered);
    setCurrentPage(1);
  };

  const handleMarcarPaga = (despesa: Transacao) => {
    setModalPagamento({ isOpen: true, despesa });
  };

  const handleMarcarRecebida = (receita: Transacao) => {
    setModalRecebimento({ isOpen: true, receita });
  };

  const handleConfirmarPagamento = async (
    contaId: string,
    metodoPagamento: string,
    observacoes?: string,
    cartaoId?: string
  ) => {
    if (!modalPagamento.despesa) return;

    try {
      const resultado = await executeCartaoOperation(
        () => pagarDespesa(
          modalPagamento.despesa!.id,
          contaId,
          metodoPagamento,
          observacoes,
          cartaoId
        ),
        cartaoId,
        fetchTransacoes
      );

      if (resultado.sucesso) {
        toast({
          title: "Sucesso",
          description: resultado.mensagem,
        });
        setModalPagamento({ isOpen: false });
      } else {
        toast({
          title: "Erro",
          description: resultado.mensagem,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro interno no pagamento",
        variant: "destructive",
      });
    }
  };

  const handleConfirmarRecebimento = async (
    contaId: string,
    observacoes?: string
  ) => {
    if (!modalRecebimento.receita) return;

    try {
      // Atualizar a receita para associar ao banco
      const { error: updateError } = await supabase
        .from("transacoes")
        .update({
          banco_id: contaId,
          observacoes: observacoes || modalRecebimento.receita.observacoes
        })
        .eq("id", modalRecebimento.receita.id);

      if (updateError) {
        console.error("Erro ao atualizar receita:", updateError);
        toast({
          title: "Erro",
          description: "Erro ao confirmar recebimento",
          variant: "destructive",
        });
        return;
      }

      // Atualizar o saldo do banco
      const { data: banco, error: bancoError } = await supabase
        .from("bancos")
        .select("saldo_atual")
        .eq("id", contaId)
        .single();

      if (bancoError) {
        console.error("Erro ao buscar banco:", bancoError);
        toast({
          title: "Erro",
          description: "Erro ao atualizar saldo do banco",
          variant: "destructive",
        });
        return;
      }

      const novoSaldo = banco.saldo_atual + modalRecebimento.receita.valor;
      const { error: saldoError } = await supabase
        .from("bancos")
        .update({ saldo_atual: novoSaldo })
        .eq("id", contaId);

      if (saldoError) {
        console.error("Erro ao atualizar saldo:", saldoError);
        toast({
          title: "Erro",
          description: "Erro ao atualizar saldo do banco",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Receita recebida com sucesso",
      });

      setModalRecebimento({ isOpen: false });
      fetchTransacoes();
    } catch (error) {
      console.error("Erro ao confirmar recebimento:", error);
      toast({
        title: "Erro",
        description: "Erro interno no recebimento",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (transacao: Transacao) => {
    setEditingTransacao(transacao);
    setIsFormOpen(true);
  };

  const handleDelete = async (transacao: Transacao) => {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;

    try {
      await executeCartaoOperation(
        async () => {
          const { error } = await supabase
            .from("transacoes")
            .delete()
            .eq("id", transacao.id);

          if (error) throw error;
          return { sucesso: true };
        },
        transacao.cartao_credito_id,
        fetchTransacoes
      );

      toast({
        title: "Sucesso",
        description: "Transação excluída com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir transação",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGroup = async (transacao: Transacao) => {
    if (!transacao.total_parcelas || transacao.total_parcelas <= 1) {
      toast({
        title: "Aviso",
        description: "Esta transação não faz parte de um grupo de parcelas",
        variant: "destructive",
      });
      return;
    }

    // Extrair a descrição base removendo a parte "(X/Y)"
    const descricaoBase = transacao.descricao.replace(/ \(\d+\/\d+\)$/, '');
    const totalParcelas = transacao.total_parcelas;

    if (!confirm(`Tem certeza que deseja excluir TODAS as ${totalParcelas} parcelas de "${descricaoBase}"?`)) return;

    try {
      await executeCartaoOperation(
        async () => {
          // Buscar todas as transações do mesmo grupo
          const { data: transacoesGrupo, error: searchError } = await supabase
            .from("transacoes")
            .select("id")
            .eq("user_id", user?.id)
            .eq("total_parcelas", totalParcelas)
            .like("descricao", `${descricaoBase} (%`);

          if (searchError) throw searchError;

          if (!transacoesGrupo || transacoesGrupo.length === 0) {
            throw new Error("Nenhuma transação do grupo encontrada");
          }

          // Excluir todas as transações do grupo
          const { error: deleteError } = await supabase
            .from("transacoes")
            .delete()
            .in("id", transacoesGrupo.map(t => t.id));

          if (deleteError) throw deleteError;

          return { sucesso: true };
        },
        transacao.cartao_credito_id,
        fetchTransacoes
      );

      toast({
        title: "Sucesso",
        description: `Todas as ${totalParcelas} parcelas foram excluídas com sucesso`,
      });
    } catch (error) {
      console.error("Erro ao excluir grupo:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir grupo de transações",
        variant: "destructive",
      });
    }
  };

  const isPendente = (transacao: Transacao) => {
    return !transacao.banco_id && !transacao.cartao_credito_id;
  };

  const isVencida = (dataTransacao: string) => {
    const hoje = new Date();
    const dataVencimento = new Date(dataTransacao);
    return dataVencimento < hoje;
  };

  const getDespesasPendentes = () => {
    return transacoesFiltradas.filter(t => 
      t.tipo === "despesa" && isPendente(t)
    );
  };

  // Paginação
  const totalPages = Math.ceil(transacoesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const transacoesPaginadas = transacoesFiltradas.slice(startIndex, endIndex);

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
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Transações</h1>
              <p className="text-sm text-muted-foreground">
                {transacoesFiltradas.length} de {transacoes.length} transações
              </p>
            </div>
          </div>
          
          <Button onClick={() => { setEditingTransacao(null); setIsFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Filtros */}
        <TransactionFilters 
          onFiltersChange={setFilters}
          activeFilters={filters}
        />

        {/* Resumo das Transações Filtradas */}
        <ResumoTransacoesFiltradas transacoes={transacoesFiltradas} />

        {/* Resumo de Despesas Pendentes */}
        {getDespesasPendentes().length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="h-5 w-5" />
                Despesas Pendentes
                <Badge variant="secondary">{getDespesasPendentes().length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-amber-700">
                Total pendente: <strong>{formatCurrency(
                  getDespesasPendentes().reduce((sum, d) => sum + d.valor, 0)
                )}</strong>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Lista de Transações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transações</span>
              <div className="flex gap-2">
                {filters.status === "pendente" && (
                  <Badge variant="outline">Apenas Pendentes</Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-48"></div>
                      <div className="h-3 bg-muted rounded w-32"></div>
                    </div>
                    <div className="h-4 bg-muted rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : transacoesPaginadas.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">Nenhuma transação encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {transacoes.length === 0 
                    ? "Adicione sua primeira transação para começar" 
                    : "Tente ajustar os filtros para ver mais resultados"
                  }
                </p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Transação
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {transacoesPaginadas.map((transacao) => (
                  <div 
                    key={transacao.id}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                      isPendente(transacao) && transacao.tipo === "despesa" 
                        ? isVencida(transacao.data_transacao) 
                          ? "border-destructive/50 bg-destructive/5" 
                          : "border-amber-200 bg-amber-50"
                        : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        transacao.tipo === 'receita' 
                          ? 'bg-income/10 text-income' 
                          : isPendente(transacao) && isVencida(transacao.data_transacao)
                            ? 'bg-destructive/10 text-destructive'
                            : isPendente(transacao)
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-expense/10 text-expense'
                      }`}>
                        {transacao.tipo === 'receita' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : isPendente(transacao) && isVencida(transacao.data_transacao) ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : isPendente(transacao) ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{transacao.descricao}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatDate(transacao.data_transacao)}</span>
                          {transacao.categoria && (
                            <>
                              <span>•</span>
                              <span>{transacao.categoria.nome}</span>
                            </>
                          )}
                          {transacao.banco && (
                            <>
                              <span>•</span>
                              <span>{transacao.banco.nome}</span>
                            </>
                          )}
                          {transacao.cartao_credito && (
                            <>
                              <span>•</span>
                              <span>{transacao.cartao_credito.nome}</span>
                            </>
                          )}
                          {transacao.total_parcelas && transacao.parcela_atual && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs">
                                {transacao.parcela_atual}/{transacao.total_parcelas}
                              </Badge>
                            </>
                          )}
                          {isPendente(transacao) && (
                            <>
                              <span>•</span>
                              <Badge 
                                variant={
                                  transacao.tipo === "despesa" && isVencida(transacao.data_transacao)
                                    ? "destructive" 
                                    : "outline"
                                } 
                                className="text-xs"
                              >
                                {transacao.tipo === "despesa" && isVencida(transacao.data_transacao)
                                  ? "Vencida" 
                                  : "Pendente"
                                }
                              </Badge>
                            </>
                          )}
                        </div>
                        {transacao.observacoes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {transacao.observacoes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className={`font-semibold ${
                          transacao.tipo === 'receita' ? 'text-income' : 'text-expense'
                        }`}>
                          {transacao.tipo === 'receita' ? '+' : '-'}{formatCurrency(transacao.valor)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isPendente(transacao) && transacao.tipo === "despesa" && (
                          <Button
                            size="sm"
                            variant={isVencida(transacao.data_transacao) ? "default" : "outline"}
                            onClick={() => handleMarcarPaga(transacao)}
                            className="text-xs h-8"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Pagar
                          </Button>
                        )}
                        {isPendente(transacao) && transacao.tipo === "receita" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarcarRecebida(transacao)}
                            className="text-xs h-8"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Receber
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(transacao)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(transacao)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        {transacao.total_parcelas && transacao.total_parcelas > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGroup(transacao)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title={`Excluir todas as ${transacao.total_parcelas} parcelas`}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages} • {transacoesFiltradas.length} transações
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modal de Formulário */}
      <TransactionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        user={user}
        editingTransacao={editingTransacao}
        onSuccess={fetchTransacoes}
      />

      {/* Modal de Recebimento */}
      {modalRecebimento.receita && (
        <ModalConfirmarRecebimento
          isOpen={modalRecebimento.isOpen}
          onClose={() => setModalRecebimento({ isOpen: false })}
          onConfirm={handleConfirmarRecebimento}
          titulo="Confirmar Recebimento"
          descricao={`Confirme o recebimento da receita: ${modalRecebimento.receita.descricao}`}
          valor={modalRecebimento.receita.valor}
          receitaId={modalRecebimento.receita.id}
        />
      )}

      {/* Modal de Pagamento */}
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
    </div>
  );
};

export default Transacoes;