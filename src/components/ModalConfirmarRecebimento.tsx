import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, X } from "lucide-react";

interface Banco {
  id: string;
  nome: string;
  tipo: string;
}

interface ModalConfirmarRecebimentoProps {
  isOpen: boolean;
  onClose: () => void;
  transacao: {
    id: string;
    descricao: string;
    valor: number;
  } | null;
  onConfirmed: () => void;
}

const ModalConfirmarRecebimento = ({ 
  isOpen, 
  onClose, 
  transacao, 
  onConfirmed 
}: ModalConfirmarRecebimentoProps) => {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [formData, setFormData] = useState({
    metodo_recebimento: "",
    banco_id: "",
    data_recebimento: new Date().toISOString().split('T')[0],
    observacoes: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchBancos();
      resetForm();
    }
  }, [isOpen]);

  const fetchBancos = async () => {
    const { data, error } = await supabase
      .from("bancos")
      .select("id, nome, tipo")
      .eq("ativo", true);

    if (!error && data) {
      setBancos(data);
    }
  };

  const resetForm = () => {
    setFormData({
      metodo_recebimento: "",
      banco_id: "",
      data_recebimento: new Date().toISOString().split('T')[0],
      observacoes: ""
    });
  };

  const handleConfirm = async () => {
    if (!transacao || !formData.metodo_recebimento || !formData.banco_id) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Buscar saldo atual do banco
      const { data: banco, error: fetchError } = await supabase
        .from("bancos")
        .select("saldo_atual")
        .eq("id", formData.banco_id)
        .single();

      if (fetchError) {
        toast({
          title: "Erro",
          description: "Erro ao buscar dados do banco",
          variant: "destructive",
        });
        return;
      }

      // Atualizar a transação marcando como efetivada e associando ao banco
      const { error } = await supabase
        .from("transacoes")
        .update({
          data_transacao: formData.data_recebimento,
          banco_id: formData.banco_id,
          observacoes: formData.observacoes 
            ? `${formData.observacoes} | Método: ${formData.metodo_recebimento}`
            : `Método: ${formData.metodo_recebimento}`
        })
        .eq("id", transacao.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao confirmar recebimento",
          variant: "destructive",
        });
        return;
      }

      // Atualizar saldo do banco
      const novoSaldo = banco.saldo_atual + transacao.valor;
      const { error: updateError } = await supabase
        .from("bancos")
        .update({ saldo_atual: novoSaldo })
        .eq("id", formData.banco_id);

      if (updateError) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar saldo do banco",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Recebimento confirmado com sucesso!",
        });
        onConfirmed();
        onClose();
      }
    } catch (error) {
      console.error("Erro ao confirmar recebimento:", error);
      toast({
        title: "Erro",
        description: "Erro interno do sistema",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-income" />
            Confirmar Recebimento
          </DialogTitle>
          <DialogDescription>
            Confirme o recebimento de {transacao?.descricao} no valor de {transacao ? formatCurrency(transacao.valor) : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="metodo_recebimento">Método de Recebimento</Label>
            <Select 
              value={formData.metodo_recebimento} 
              onValueChange={(value) => setFormData({ ...formData, metodo_recebimento: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Como você recebeu?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                <SelectItem value="deposito">Depósito</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="banco_destino">Conta de Destino</Label>
            <Select 
              value={formData.banco_id} 
              onValueChange={(value) => setFormData({ ...formData, banco_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Para qual conta foi o valor?" />
              </SelectTrigger>
              <SelectContent>
                {bancos.map((banco) => (
                  <SelectItem key={banco.id} value={banco.id}>
                    🏦 {banco.nome} ({banco.tipo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="data_recebimento">Data do Recebimento</Label>
            <Input
              id="data_recebimento"
              type="date"
              value={formData.data_recebimento}
              onChange={(e) => setFormData({ ...formData, data_recebimento: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Input
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Informações adicionais..."
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleConfirm} 
            className="flex-1"
            disabled={loading || !formData.metodo_recebimento || !formData.banco_id}
          >
            {loading ? "Confirmando..." : "Confirmar Recebimento"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalConfirmarRecebimento;