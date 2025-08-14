import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { updateCartaoLimiteUsado } from "@/hooks/useCartaoUpdater";
import { useCartaoOperations } from "@/hooks/useCartaoOperations";

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
}

interface Banco {
  id: string;
  nome: string;
  tipo: string;
  saldo_atual: number;
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

interface FormData {
  descricao: string;
  valor: number;
  tipo: string;
  data_transacao: string;
  observacoes: string;
  categoria_id: string;
  banco_id: string;
  cartao_credito_id: string;
  parcelado: boolean;
  total_parcelas: number;
  parcela_atual: number;
  status_pagamento: string; // "pago" ou "pendente"
  status_recebimento: string; // "recebido" ou "pendente" (para receitas)
  data_vencimento: string;
}

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  editingTransacao?: Transacao | null;
  onSuccess: () => void;
}

export const TransactionForm = ({ 
  isOpen, 
  onClose, 
  user, 
  editingTransacao, 
  onSuccess 
}: TransactionFormProps) => {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    descricao: "",
    valor: 0,
    tipo: "",
    data_transacao: new Date().toISOString().split('T')[0],
    observacoes: "",
    categoria_id: "",
    banco_id: "",
    cartao_credito_id: "",
    parcelado: false,
    total_parcelas: 1,
    parcela_atual: 1,
    status_pagamento: "pago",
    status_recebimento: "recebido",
    data_vencimento: ""
  });
  const { toast } = useToast();
  const { executeCartaoOperation } = useCartaoOperations();

  useEffect(() => {
    if (isOpen) {
      fetchData();
      if (editingTransacao) {
        setFormData({
          descricao: editingTransacao.descricao,
          valor: editingTransacao.valor,
          tipo: editingTransacao.tipo,
          data_transacao: editingTransacao.data_transacao,
          observacoes: editingTransacao.observacoes || "",
          categoria_id: editingTransacao.categoria_id || "",
          banco_id: editingTransacao.banco_id || "",
          cartao_credito_id: editingTransacao.cartao_credito_id || "",
          parcelado: Boolean(editingTransacao.total_parcelas && editingTransacao.total_parcelas > 1),
          total_parcelas: editingTransacao.total_parcelas || 1,
          parcela_atual: editingTransacao.parcela_atual || 1,
          status_pagamento: editingTransacao.banco_id || editingTransacao.cartao_credito_id ? "pago" : "pendente",
          status_recebimento: editingTransacao.banco_id ? "recebido" : "pendente",
          data_vencimento: editingTransacao.data_transacao
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingTransacao]);

  const fetchData = async () => {
    if (user?.id) {
      await Promise.all([
        fetchBancos(),
        fetchCartoes(),
        fetchCategorias()
      ]);
    }
  };

  const fetchBancos = async () => {
    const { data, error } = await supabase
      .from("bancos")
      .select("id, nome, tipo, saldo_atual")
      .eq("user_id", user?.id)
      .eq("ativo", true);

    if (!error && data) {
      setBancos(data);
    }
  };

  const fetchCartoes = async () => {
    const { data, error } = await supabase
      .from("cartoes_credito")
      .select("id, nome")
      .eq("user_id", user?.id)
      .eq("ativo", true);

    if (!error && data) {
      setCartoes(data);
    }
  };

  const fetchCategorias = async () => {
    const { data, error } = await supabase
      .from("categorias")
      .select("id, nome, cor, tipo")
      .eq("user_id", user?.id)
      .eq("ativo", true);

    if (!error && data) {
      setCategorias(data);
    }
  };

  const resetForm = () => {
    setFormData({
      descricao: "",
      valor: 0,
      tipo: "",
      data_transacao: new Date().toISOString().split('T')[0],
      observacoes: "",
      categoria_id: "",
      banco_id: "",
      cartao_credito_id: "",
      parcelado: false,
      total_parcelas: 1,
      parcela_atual: 1,
      status_pagamento: "pago",
      status_recebimento: "recebido",
      data_vencimento: ""
    });
  };

  const updateSaldoBanco = async (bancoId: string, valor: number, tipo: string) => {
    try {
      const { data: banco, error: fetchError } = await supabase
        .from("bancos")
        .select("saldo_atual")
        .eq("id", bancoId)
        .single();

      if (fetchError) {
        console.error("Erro ao buscar saldo do banco:", fetchError);
        return;
      }

      const novoSaldo = tipo === 'receita' 
        ? banco.saldo_atual + valor 
        : banco.saldo_atual - valor;

      const { error: updateError } = await supabase
        .from("bancos")
        .update({ saldo_atual: novoSaldo })
        .eq("id", bancoId);

      if (updateError) {
        console.error("Erro ao atualizar saldo do banco:", updateError);
      }
    } catch (error) {
      console.error("Erro ao atualizar saldo do banco:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingTransacao) {
        // Obter dados da transação anterior para comparar cartões
        const cartaoAnterior = editingTransacao.cartao_credito_id;
        const cartaoNovo = formData.cartao_credito_id;

        // Atualizar transação
        const { error } = await supabase
          .from("transacoes")
          .update({
            descricao: formData.descricao,
            valor: formData.valor,
            tipo: formData.tipo,
            data_transacao: formData.data_transacao,
            observacoes: formData.observacoes,
            categoria_id: formData.categoria_id || null,
            banco_id: formData.banco_id || null,
            cartao_credito_id: formData.cartao_credito_id || null,
          })
          .eq("id", editingTransacao.id);

        if (error) throw error;

        // Usar executeCartaoOperation para garantir atualização adequada
        if (cartaoAnterior && cartaoAnterior !== cartaoNovo) {
          // Se mudou de cartão, atualizar o limite do cartão anterior
          await executeCartaoOperation(
            () => Promise.resolve({ sucesso: true }),
            cartaoAnterior,
            undefined
          );
        }
        if (cartaoNovo) {
          // Atualizar o limite do cartão atual
          await executeCartaoOperation(
            () => Promise.resolve({ sucesso: true }),
            cartaoNovo,
            undefined
          );
        }

        toast({
          title: "Sucesso",
          description: "Transação atualizada com sucesso",
        });
        
        onSuccess();
        onClose();
      } else {
        // Criar nova transação com funcionalidade de despesa pendente
        if (formData.parcelado && formData.total_parcelas > 1) {
          const transacoesParcelas = [];
          const valorParcela = formData.valor / formData.total_parcelas;
          
          for (let i = 1; i <= formData.total_parcelas; i++) {
            let dataParcela = new Date(formData.data_transacao);
            let bancoId = formData.banco_id;
            let cartaoId = formData.cartao_credito_id;

            // Para despesas pendentes, usar data de vencimento e não associar banco/cartão
            if (formData.tipo === "despesa" && formData.status_pagamento === "pendente") {
              if (formData.data_vencimento) {
                dataParcela = new Date(formData.data_vencimento);
              }
              dataParcela.setMonth(dataParcela.getMonth() + (i - 1));
              bancoId = null;
              cartaoId = null;
            // Para receitas pendentes, não associar banco
            } else if (formData.tipo === "receita" && formData.status_recebimento === "pendente") {
              dataParcela.setMonth(dataParcela.getMonth() + (i - 1));
              bancoId = null;
              cartaoId = null;
            } else {
              dataParcela.setMonth(dataParcela.getMonth() + (i - 1));
            }
            
            transacoesParcelas.push({
              descricao: `${formData.descricao} (${i}/${formData.total_parcelas})`,
              valor: valorParcela,
              tipo: formData.tipo,
              data_transacao: dataParcela.toISOString().split('T')[0],
              observacoes: formData.observacoes,
              categoria_id: formData.categoria_id || null,
              banco_id: bancoId || null,
              cartao_credito_id: cartaoId || null,
              total_parcelas: formData.total_parcelas,
              parcela_atual: i,
              user_id: user?.id
            });
          }
          
          const { error } = await supabase
            .from("transacoes")
            .insert(transacoesParcelas);

          if (error) throw error;

          // Atualizar saldo do banco
          if ((formData.status_pagamento === "pago" && formData.tipo === "despesa") || 
              (formData.status_recebimento === "recebido" && formData.tipo === "receita")) {
            if (formData.banco_id) {
              await updateSaldoBanco(formData.banco_id, formData.valor, formData.tipo);
            }
          }
        } else {
          // Transação única
          let dataTransacao = formData.data_transacao;
          let bancoId = formData.banco_id;
          let cartaoId = formData.cartao_credito_id;
          
          // Para despesas pendentes
          if (formData.tipo === "despesa" && formData.status_pagamento === "pendente") {
            if (formData.data_vencimento) {
              dataTransacao = formData.data_vencimento;
            }
            bancoId = null;
            cartaoId = null;
          }
          
          // Para receitas pendentes
          if (formData.tipo === "receita" && formData.status_recebimento === "pendente") {
            bancoId = null;
            cartaoId = null;
          }

          // Verificar saldo suficiente para despesas pagas
          if (formData.tipo === "despesa" && formData.status_pagamento === "pago" && bancoId) {
            const banco = bancos.find(b => b.id === bancoId);
            if (banco && banco.saldo_atual < formData.valor) {
              toast({
                title: "Saldo insuficiente",
                description: `A conta ${banco.nome} não possui saldo suficiente para esta despesa.`,
                variant: "destructive",
              });
              setLoading(false);
              return;
            }
          }
          
          const { error } = await supabase
            .from("transacoes")
            .insert({
              descricao: formData.descricao,
              valor: formData.valor,
              tipo: formData.tipo,
              data_transacao: dataTransacao,
              observacoes: formData.observacoes,
              categoria_id: formData.categoria_id || null,
              banco_id: bancoId || null,
              cartao_credito_id: cartaoId || null,
              total_parcelas: formData.parcelado ? formData.total_parcelas : null,
              parcela_atual: formData.parcelado ? formData.parcela_atual : null,
              user_id: user?.id
            });

          if (error) throw error;

          // Atualizar saldo do banco
          if ((formData.status_pagamento === "pago" && formData.tipo === "despesa") || 
              (formData.status_recebimento === "recebido" && formData.tipo === "receita")) {
            if (bancoId) {
              await updateSaldoBanco(bancoId, formData.valor, formData.tipo);
            }
          }
        }

        // Atualizar limite do cartão se necessário usando executeCartaoOperation
        if (((formData.status_pagamento === "pago" && formData.tipo === "despesa") || 
             (formData.status_recebimento === "recebido" && formData.tipo === "receita")) && 
            formData.cartao_credito_id) {
          await executeCartaoOperation(
            () => Promise.resolve({ sucesso: true }),
            formData.cartao_credito_id,
            undefined
          );
        }

        toast({
          title: "Sucesso",
          description: formData.parcelado && formData.total_parcelas > 1 
            ? `${formData.total_parcelas} parcelas criadas com sucesso` 
            : "Transação criada com sucesso",
        });
        
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar transação",
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

  const categoriasFiltradas = categorias.filter(cat => 
    !formData.tipo || cat.tipo === formData.tipo
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTransacao ? "Editar Transação" : "Nova Transação"}
          </DialogTitle>
          <DialogDescription>
            {editingTransacao ? "Edite as informações da transação" : "Adicione uma nova receita ou despesa"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Ex: Compra no supermercado"
                required
              />
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="valor">Valor</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
                required
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(value) => setFormData({ ...formData, tipo: value, categoria_id: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="data">Data da Transação</Label>
              <Input
                id="data"
                type="date"
                value={formData.data_transacao}
                onChange={(e) => setFormData({ ...formData, data_transacao: e.target.value })}
                required
              />
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select 
                value={formData.categoria_id} 
                onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasFiltradas.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status do Pagamento (apenas para despesas) */}
            {formData.tipo === "despesa" && !editingTransacao && (
              <div className="space-y-3 md:col-span-2">
                <Label>Status do Pagamento</Label>
                <RadioGroup 
                  value={formData.status_pagamento} 
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    status_pagamento: value,
                    banco_id: value === "pendente" ? "" : formData.banco_id,
                    cartao_credito_id: value === "pendente" ? "" : formData.cartao_credito_id
                  })}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pago" id="pago" />
                    <Label htmlFor="pago">Pago</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pendente" id="pendente" />
                    <Label htmlFor="pendente">Pendente</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Status do Recebimento (apenas para receitas) */}
            {formData.tipo === "receita" && !editingTransacao && (
              <div className="space-y-3 md:col-span-2">
                <Label>Status do Recebimento</Label>
                <RadioGroup 
                  value={formData.status_recebimento} 
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    status_recebimento: value,
                    banco_id: value === "pendente" ? "" : formData.banco_id
                  })}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="recebido" id="recebido" />
                    <Label htmlFor="recebido">Recebido</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pendente" id="receita-pendente" />
                    <Label htmlFor="receita-pendente">Pendente</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Data de Vencimento (apenas para despesas pendentes) */}
            {formData.tipo === "despesa" && formData.status_pagamento === "pendente" && (
              <div className="space-y-2">
                <Label htmlFor="data-vencimento">Data de Vencimento</Label>
                <Input
                  id="data-vencimento"
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                />
              </div>
            )}

            {/* Banco (apenas se pago/recebido ou for receita recebida) */}
            {((formData.tipo === "despesa" && formData.status_pagamento === "pago") || 
              (formData.tipo === "receita" && formData.status_recebimento === "recebido")) && (
              <div className="space-y-2">
                <Label>Conta</Label>
                <Select 
                  value={formData.banco_id} 
                  onValueChange={(value) => setFormData({ ...formData, banco_id: value, cartao_credito_id: "" })}
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
            )}

            {/* Cartão (apenas se pago) */}
            {formData.status_pagamento === "pago" && (
              <div className="space-y-2">
                <Label>Cartão de Crédito</Label>
                <Select 
                  value={formData.cartao_credito_id} 
                  onValueChange={(value) => setFormData({ ...formData, cartao_credito_id: value, banco_id: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cartão" />
                  </SelectTrigger>
                  <SelectContent>
                    {cartoes.map((cartao) => (
                      <SelectItem key={cartao.id} value={cartao.id}>
                        {cartao.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Parcelamento */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="parcelado"
                checked={formData.parcelado}
                onCheckedChange={(checked) => setFormData({ ...formData, parcelado: checked as boolean })}
              />
              <Label htmlFor="parcelado">Transação parcelada</Label>
            </div>

            {formData.parcelado && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total-parcelas">Total de Parcelas</Label>
                  <Input
                    id="total-parcelas"
                    type="number"
                    min="2"
                    value={formData.total_parcelas}
                    onChange={(e) => setFormData({ ...formData, total_parcelas: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parcela-atual">Parcela Atual</Label>
                  <Input
                    id="parcela-atual"
                    type="number"
                    min="1"
                    max={formData.total_parcelas}
                    value={formData.parcela_atual}
                    onChange={(e) => setFormData({ ...formData, parcela_atual: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : editingTransacao ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};