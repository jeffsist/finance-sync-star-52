import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Wallet, CreditCard, Banknote, Smartphone } from "lucide-react";
import { ComprovantesUpload } from "@/components/ComprovantesUpload";
import type { CompressedImageResult } from "@/utils/imageCompression";

interface Banco {
  id: string;
  nome: string;
  saldo_atual: number;
}

interface CartaoCredito {
  id: string;
  nome: string;
  limite: number;
  limite_usado: number;
}

interface ModalConfirmarPagamentoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (contaId: string, metodoPagamento: string, observacoes?: string, cartaoId?: string) => void;
  titulo?: string;
  descricao?: string;
  valor: number;
  despesaId: string;
}

const metodosPagemento = [
  { value: "pix", label: "PIX", icon: Smartphone },
  { value: "transferencia", label: "Transferência", icon: Banknote },
  { value: "cartao_debito", label: "Cartão de Débito", icon: CreditCard },
  { value: "cartao_credito", label: "Cartão de Crédito", icon: CreditCard },
  { value: "dinheiro", label: "Dinheiro", icon: Wallet },
];

export const ModalConfirmarPagamento = ({
  isOpen,
  onClose,
  onConfirm,
  titulo = "Confirmar Pagamento",
  descricao = "Selecione a conta para debitar o valor da despesa",
  valor,
  despesaId,
}: ModalConfirmarPagamentoProps) => {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [contaSelecionada, setContaSelecionada] = useState<string>("");
  const [cartaoSelecionado, setCartaoSelecionado] = useState<string>("");
  const [metodoSelecionado, setMetodoSelecionado] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");
  const [comprovantes, setComprovantes] = useState<CompressedImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchBancos();
      fetchCartoes();
    }
  }, [isOpen]);

  const fetchBancos = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("bancos")
      .select("id, nome, saldo_atual")
      .eq("user_id", session.user.id)
      .eq("ativo", true)
      .order("nome");

    if (!error && data) {
      setBancos(data);
    }
  };

  const fetchCartoes = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("cartoes_credito")
      .select("id, nome, limite, limite_usado")
      .eq("user_id", session.user.id)
      .eq("ativo", true)
      .order("nome");

    if (!error && data) {
      setCartoes(data);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleConfirm = async () => {
    // Validações básicas
    if (!metodoSelecionado) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o método de pagamento.",
        variant: "destructive",
      });
      return;
    }

    if (metodoSelecionado === "cartao_credito" && !cartaoSelecionado) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o cartão de crédito.",
        variant: "destructive",
      });
      return;
    }

    if (metodoSelecionado !== "dinheiro" && metodoSelecionado !== "cartao_credito" && !contaSelecionada) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione a conta para débito.",
        variant: "destructive",
      });
      return;
    }

    // Verificar saldo/limite
    if (metodoSelecionado === "cartao_credito") {
      const cartaoSelecionadoData = cartoes.find(c => c.id === cartaoSelecionado);
      if (cartaoSelecionadoData) {
        const limiteDisponivel = cartaoSelecionadoData.limite - cartaoSelecionadoData.limite_usado;
        if (limiteDisponivel < valor) {
          toast({
            title: "Limite insuficiente",
            description: `O cartão ${cartaoSelecionadoData.nome} não possui limite suficiente para este pagamento.`,
            variant: "destructive",
          });
          return;
        }
      }
    } else if (metodoSelecionado !== "dinheiro") {
      const contaSelecionadaData = bancos.find(b => b.id === contaSelecionada);
      if (contaSelecionadaData && contaSelecionadaData.saldo_atual < valor) {
        toast({
          title: "Saldo insuficiente",
          description: `A conta ${contaSelecionadaData.nome} não possui saldo suficiente para este pagamento.`,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    
    try {
      const metodoLabel = metodosPagemento.find(m => m.value === metodoSelecionado)?.label || metodoSelecionado;
      const obsCompletas = observacoes ? `${metodoLabel} - ${observacoes}` : metodoLabel;
      
      await onConfirm(contaSelecionada, metodoSelecionado, obsCompletas, cartaoSelecionado);
      
      // Reset form
      setContaSelecionada("");
      setCartaoSelecionado("");
      setMetodoSelecionado("");
      setObservacoes("");
    } catch (error) {
      console.error("Erro ao confirmar pagamento:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setContaSelecionada("");
    setCartaoSelecionado("");
    setMetodoSelecionado("");
    setObservacoes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Valor a pagar</p>
              <p className="text-2xl font-bold text-expense">{formatCurrency(valor)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metodo">Método de pagamento</Label>
            <Select value={metodoSelecionado} onValueChange={setMetodoSelecionado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método de pagamento" />
              </SelectTrigger>
              <SelectContent>
                {metodosPagemento.map((metodo) => {
                  const IconComponent = metodo.icon;
                  return (
                    <SelectItem key={metodo.value} value={metodo.value}>
                      <div className="flex items-center space-x-2">
                        <IconComponent className="h-4 w-4" />
                        <span>{metodo.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {metodoSelecionado === "cartao_credito" && (
            <div className="space-y-2">
              <Label htmlFor="cartao">Cartão de crédito</Label>
              <Select value={cartaoSelecionado} onValueChange={setCartaoSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cartão" />
                </SelectTrigger>
                <SelectContent>
                  {cartoes.map((cartao) => {
                    const limiteDisponivel = cartao.limite - cartao.limite_usado;
                    return (
                      <SelectItem key={cartao.id} value={cartao.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{cartao.nome}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {formatCurrency(limiteDisponivel)} disponível
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {metodoSelecionado !== "dinheiro" && metodoSelecionado !== "cartao_credito" && (
            <div className="space-y-2">
              <Label htmlFor="conta">Conta para débito</Label>
              <Select value={contaSelecionada} onValueChange={setContaSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {bancos.map((banco) => (
                    <SelectItem key={banco.id} value={banco.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{banco.nome}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {formatCurrency(banco.saldo_atual)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Adicione observações sobre o pagamento..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          <ComprovantesUpload 
            onImagesChange={setComprovantes}
            maxImages={3}
            className="border-t pt-4"
          />

          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={loading || !metodoSelecionado || 
                       (metodoSelecionado === "cartao_credito" && !cartaoSelecionado) ||
                       (metodoSelecionado !== "dinheiro" && metodoSelecionado !== "cartao_credito" && !contaSelecionada)}
              className="flex-1"
            >
              {loading ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};