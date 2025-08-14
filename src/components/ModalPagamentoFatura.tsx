import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { pagarFatura } from "@/hooks/usePagamentoFatura";
import { Wallet, CreditCard, AlertCircle, CheckCircle } from "lucide-react";

interface ModalPagamentoFaturaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartao: {
    id: string;
    nome: string;
    valorFatura: number;
    dia_vencimento: number;
  };
  mesSelecionado: Date;
  onPagamentoRealizado: () => void;
}

interface Banco {
  id: string;
  nome: string;
  tipo: string;
  saldo_atual: number;
}

const ModalPagamentoFatura = ({
  open,
  onOpenChange,
  cartao,
  mesSelecionado,
  onPagamentoRealizado
}: ModalPagamentoFaturaProps) => {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [bancoSelecionado, setBancoSelecionado] = useState("");
  const [valorPagamento, setValorPagamento] = useState(cartao.valorFatura);
  const [loading, setLoading] = useState(false);
  const [loadingBancos, setLoadingBancos] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchBancos();
      setValorPagamento(cartao.valorFatura);
      setBancoSelecionado("");
    }
  }, [open, cartao.valorFatura]);

  const fetchBancos = async () => {
    setLoadingBancos(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from("bancos")
        .select("id, nome, tipo, saldo_atual")
        .eq("user_id", userData.user.id)
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setBancos(data || []);
    } catch (error) {
      console.error("Erro ao carregar bancos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas bancárias.",
        variant: "destructive",
      });
    } finally {
      setLoadingBancos(false);
    }
  };

  const handlePagamento = async () => {
    if (!bancoSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione uma conta para pagamento.",
        variant: "destructive",
      });
      return;
    }

    if (valorPagamento <= 0) {
      toast({
        title: "Erro",
        description: "O valor do pagamento deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const resultado = await pagarFatura({
        cartaoId: cartao.id,
        valorFatura: valorPagamento,
        contaId: bancoSelecionado,
        ano: mesSelecionado.getFullYear(),
        mes: mesSelecionado.getMonth() + 1
      });

      if (resultado.success) {
        toast({
          title: "Sucesso",
          description: resultado.message,
        });
        onPagamentoRealizado();
        onOpenChange(false);
      } else {
        toast({
          title: "Erro",
          description: resultado.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao pagar fatura:", error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao processar pagamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const bancoSelecionadoData = bancos.find(b => b.id === bancoSelecionado);
  const saldoSuficiente = bancoSelecionadoData ? bancoSelecionadoData.saldo_atual >= valorPagamento : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Pagar Fatura
          </DialogTitle>
          <DialogDescription>
            Pagamento da fatura do cartão {cartao.nome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações da Fatura */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cartão:</span>
              <span className="font-medium">{cartao.nome}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Vencimento:</span>
              <span className="font-medium">
                {new Date(mesSelecionado.getFullYear(), mesSelecionado.getMonth(), cartao.dia_vencimento)
                  .toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valor Total:</span>
              <span className="font-bold text-lg">{formatCurrency(cartao.valorFatura)}</span>
            </div>
          </div>

          {/* Valor do Pagamento */}
          <div>
            <Label htmlFor="valor">Valor do Pagamento</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              value={valorPagamento}
              onChange={(e) => setValorPagamento(parseFloat(e.target.value) || 0)}
              placeholder="0,00"
            />
          </div>

          {/* Seleção de Conta */}
          <div>
            <Label htmlFor="banco">Conta para Pagamento</Label>
            {loadingBancos ? (
              <div className="h-10 bg-muted animate-pulse rounded-md"></div>
            ) : (
              <Select value={bancoSelecionado} onValueChange={setBancoSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {bancos.map((banco) => (
                    <SelectItem key={banco.id} value={banco.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <Wallet className="h-4 w-4 mr-2" />
                          <span>{banco.nome}</span>
                        </div>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {formatCurrency(banco.saldo_atual)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Alerta de Saldo */}
          {bancoSelecionadoData && (
            <div className={`p-3 rounded-lg flex items-center space-x-2 ${
              saldoSuficiente 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {saldoSuficiente ? (
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              )}
              <div className="text-sm">
                {saldoSuficiente ? (
                  <span>Saldo suficiente para o pagamento</span>
                ) : (
                  <span>Saldo insuficiente. Disponível: {formatCurrency(bancoSelecionadoData.saldo_atual)}</span>
                )}
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handlePagamento} 
              className="flex-1"
              disabled={loading || !bancoSelecionado || !saldoSuficiente || valorPagamento <= 0}
            >
              {loading ? "Processando..." : "Pagar Fatura"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalPagamentoFatura;