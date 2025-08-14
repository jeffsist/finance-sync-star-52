import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Calendar, CreditCard, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { pagarFatura } from "@/hooks/usePagamentoFatura";
import { useToast } from "@/hooks/use-toast";

interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  data_transacao: string;
  observacoes?: string;
  categoria_id?: string;
}

interface CartaoCredito {
  id: string;
  nome: string;
  limite: number;
  limite_usado: number;
  dia_fechamento: number;
  dia_vencimento: number;
}

interface Banco {
  id: string;
  nome: string;
  saldo_atual: number;
}

interface FaturaCartaoProps {
  cartao: CartaoCredito;
  onClose: () => void;
}

const FaturaCartao = ({ cartao, onClose }: FaturaCartaoProps) => {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPagamento, setLoadingPagamento] = useState(false);
  const [isDialogPagamentoOpen, setIsDialogPagamentoOpen] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchTransacoesDoMes();
    fetchBancos();
  }, [mesAtual, cartao.id]);

  const fetchTransacoesDoMes = async () => {
    setLoading(true);
    
    // Calcular período da fatura baseado no dia de fechamento
    const dataFechamento = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), cartao.dia_fechamento);
    const dataFechamentoAnterior = new Date(dataFechamento);
    dataFechamentoAnterior.setMonth(dataFechamentoAnterior.getMonth() - 1);
    
    const { data, error } = await supabase
      .from("transacoes")
      .select("*")
      .eq("cartao_credito_id", cartao.id)
      .eq("tipo", "despesa")
      .gte("data_transacao", dataFechamentoAnterior.toISOString().split('T')[0])
      .lt("data_transacao", dataFechamento.toISOString().split('T')[0])
      .order("data_transacao", { ascending: false });

    if (error) {
      console.error("Erro ao buscar transações da fatura:", error);
    } else {
      setTransacoes(data || []);
    }
    
    setLoading(false);
  };

  const fetchBancos = async () => {
    const { data, error } = await supabase
      .from("bancos")
      .select("id, nome, saldo_atual")
      .eq("ativo", true);

    if (!error && data) {
      setBancos(data);
    }
  };

  const proximoMes = () => {
    setMesAtual(addMonths(mesAtual, 1));
  };

  const mesAnterior = () => {
    setMesAtual(subMonths(mesAtual, 1));
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

  const handlePagarFatura = async () => {
    if (!contaSelecionada || totalFatura <= 0) {
      toast({
        title: "Erro",
        description: "Selecione uma conta e verifique se há valor a pagar",
        variant: "destructive",
      });
      return;
    }

    setLoadingPagamento(true);
    
    const result = await pagarFatura({
      cartaoId: cartao.id,
      valorFatura: totalFatura,
      contaId: contaSelecionada,
      ano: mesAtual.getFullYear(),
      mes: mesAtual.getMonth() + 1
    });

    if (result.success) {
      toast({
        title: "Sucesso",
        description: result.message,
      });
      setIsDialogPagamentoOpen(false);
      setContaSelecionada("");
      fetchTransacoesDoMes(); // Recarregar dados
      // Aqui você pode adicionar lógica para atualizar a página de cartões
    } else {
      toast({
        title: "Erro",
        description: result.message,
        variant: "destructive",
      });
    }
    
    setLoadingPagamento(false);
  };

  const totalFatura = transacoes.reduce((total, t) => total + Number(t.valor), 0);
  
  // Data de vencimento da fatura
  const dataVencimento = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), cartao.dia_vencimento);
  if (dataVencimento < new Date(mesAtual.getFullYear(), mesAtual.getMonth(), cartao.dia_fechamento)) {
    dataVencimento.setMonth(dataVencimento.getMonth() + 1);
  }

  return (
    <div className="space-y-6">
      {/* Header da Fatura */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Fatura - {cartao.nome}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Vencimento: {format(dataVencimento, "dd/MM/yyyy")}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="sm" onClick={mesAnterior}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">
                {format(mesAtual, "MMMM yyyy", { locale: ptBR })}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={proximoMes}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total da Fatura</p>
              <p className="text-2xl font-bold text-expense">{formatCurrency(totalFatura)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Limite Disponível</p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(cartao.limite - cartao.limite_usado)}
              </p>
            </div>
          </div>

          {totalFatura > 0 && (
            <div className="flex justify-center">
              <Dialog open={isDialogPagamentoOpen} onOpenChange={setIsDialogPagamentoOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full md:w-auto">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Pagar Fatura
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Pagar Fatura do Cartão</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Valor a pagar</p>
                      <p className="text-xl font-bold text-expense">{formatCurrency(totalFatura)}</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="conta">Pagar com a conta</Label>
                      <Select value={contaSelecionada} onValueChange={setContaSelecionada}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a conta para débito" />
                        </SelectTrigger>
                        <SelectContent>
                          {bancos.map((banco) => (
                            <SelectItem 
                              key={banco.id} 
                              value={banco.id}
                              disabled={banco.saldo_atual < totalFatura}
                            >
                              {banco.nome} - {formatCurrency(banco.saldo_atual)}
                              {banco.saldo_atual < totalFatura && " (Saldo insuficiente)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handlePagarFatura} 
                        disabled={loadingPagamento || !contaSelecionada}
                        className="flex-1"
                      >
                        {loadingPagamento ? "Processando..." : "Confirmar Pagamento"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsDialogPagamentoOpen(false);
                          setContaSelecionada("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Transações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transações do Período</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : transacoes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma transação encontrada para este período
            </p>
          ) : (
            <div className="space-y-3">
              {transacoes.map((transacao) => (
                <div key={transacao.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">{transacao.descricao}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transacao.data_transacao)}
                    </p>
                    {transacao.observacoes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {transacao.observacoes}
                      </p>
                    )}
                  </div>
                  <Badge variant="destructive">
                    {formatCurrency(transacao.valor)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FaturaCartao;