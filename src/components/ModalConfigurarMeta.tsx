import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Categoria {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
  icone?: string;
}

interface ModalConfigurarMetaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria: Categoria | null;
  onMetaCriada: () => void;
  mesAtual: number;
  anoAtual: number;
}

const ModalConfigurarMeta = ({ 
  open, 
  onOpenChange, 
  categoria, 
  onMetaCriada,
  mesAtual,
  anoAtual 
}: ModalConfigurarMetaProps) => {
  const [valor, setValor] = useState("");
  const [mes, setMes] = useState(mesAtual.toString());
  const [ano, setAno] = useState(anoAtual.toString());
  const [tipoMeta, setTipoMeta] = useState<'limite_gasto' | 'meta_receita'>('meta_receita');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const meses = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  const anos = Array.from({ length: 5 }, (_, i) => {
    const year = anoAtual - 1 + i;
    return { value: year.toString(), label: year.toString() };
  });

  useEffect(() => {
    if (categoria && open) {
      setTipoMeta(categoria.tipo === 'receita' ? 'meta_receita' : 'limite_gasto');
      fetchMetaExistente();
    }
  }, [categoria, open, mes, ano]);

  const fetchMetaExistente = async () => {
    if (!categoria) return;

    try {
      const { data, error } = await supabase
        .from('metas_categoria')
        .select('*')
        .eq('categoria_id', categoria.id)
        .eq('mes', parseInt(mes))
        .eq('ano', parseInt(ano))
        .eq('tipo_meta', tipoMeta)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setValor(data.valor_meta.toString());
      } else {
        setValor("");
      }
    } catch (error) {
      console.error('Erro ao buscar meta existente:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoria || !valor) return;

    setLoading(true);
    try {
      const valorNumerico = parseFloat(valor.replace(',', '.'));
      
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        toast({
          title: "Erro",
          description: "Por favor, insira um valor válido",
          variant: "destructive",
        });
        return;
      }

      // Verificar se já existe uma meta para esta combinação
      const { data: metaExistente } = await supabase
        .from('metas_categoria')
        .select('id')
        .eq('categoria_id', categoria.id)
        .eq('mes', parseInt(mes))
        .eq('ano', parseInt(ano))
        .eq('tipo_meta', tipoMeta)
        .maybeSingle();

      if (metaExistente) {
        // Atualizar meta existente
        const { error } = await supabase
          .from('metas_categoria')
          .update({ valor_meta: valorNumerico })
          .eq('id', metaExistente.id);

        if (error) throw error;
      } else {
        // Criar nova meta
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Usuário não autenticado');

        const { error } = await supabase
          .from('metas_categoria')
          .insert({
            user_id: userData.user.id,
            categoria_id: categoria.id,
            tipo_meta: tipoMeta,
            valor_meta: valorNumerico,
            mes: parseInt(mes),
            ano: parseInt(ano),
          });

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Meta configurada com sucesso",
      });

      onMetaCriada();
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a meta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setValor("");
    setMes(mesAtual.toString());
    setAno(anoAtual.toString());
    onOpenChange(false);
  };

  if (!categoria) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurar Meta - {categoria.nome}</DialogTitle>
          <DialogDescription>
            Configure uma {categoria.tipo === 'receita' ? 'meta de receita' : 'limite de gastos'} para esta categoria.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mes">Mês</Label>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ano">Ano</Label>
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">
              {categoria.tipo === 'receita' ? 'Meta de Receita' : 'Limite de Gastos'} (R$)
            </Label>
            <Input
              id="valor"
              type="text"
              placeholder="0,00"
              value={valor}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d,]/g, '');
                setValor(value);
              }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !valor}>
              {loading ? "Salvando..." : "Salvar Meta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModalConfigurarMeta;