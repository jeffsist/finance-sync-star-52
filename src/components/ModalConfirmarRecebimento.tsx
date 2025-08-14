import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Banco {
  id: string;
  nome: string;
  tipo: string;
  saldo_atual: number;
}

interface ModalConfirmarRecebimentoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (contaId: string, observacoes?: string) => void;
  titulo: string;
  descricao: string;
  valor: number;
  receitaId: string;
}

export const ModalConfirmarRecebimento = ({
  isOpen,
  onClose,
  onConfirm,
  titulo,
  descricao,
  valor,
  receitaId
}: ModalConfirmarRecebimentoProps) => {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [contaSelecionada, setContaSelecionada] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchBancos();
      setContaSelecionada("");
      setObservacoes("");
    }
  }, [isOpen]);

  const fetchBancos = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("bancos")
        .select("id, nome, tipo, saldo_atual")
        .eq("user_id", session.user.id)
        .eq("ativo", true)
        .order("nome");

      if (error) {
        console.error("Erro ao buscar bancos:", error);
        return;
      }

      setBancos(data || []);
    } catch (error) {
      console.error("Erro ao buscar bancos:", error);
    }
  };

  const handleConfirm = async () => {
    if (!contaSelecionada) {
      toast({
        title: "Erro",
        description: "Selecione uma conta para receber o valor",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await onConfirm(contaSelecionada, observacoes);
      onClose();
    } catch (error) {
      console.error("Erro ao confirmar recebimento:", error);
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
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="text-center">
              <span className="text-2xl font-bold text-income">
                {formatCurrency(valor)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Conta para Recebimento</Label>
            <Select 
              value={contaSelecionada} 
              onValueChange={setContaSelecionada}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta" />
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

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione observações sobre o recebimento..."
              rows={3}
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={loading || !contaSelecionada}
              className="flex-1"
            >
              {loading ? "Confirmando..." : "Confirmar Recebimento"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};