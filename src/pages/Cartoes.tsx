import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowLeft,
  Calendar,
  DollarSign,
  Receipt
} from "lucide-react";
import FaturaCartao from "@/components/FaturaCartao";

interface CartaoCredito {
  id: string;
  nome: string;
  limite: number;
  limite_usado: number;
  dia_fechamento: number;
  dia_vencimento: number;
  banco_id?: string;
  ativo: boolean;
  created_at: string;
}

interface Banco {
  id: string;
  nome: string;
}

const Cartoes = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCartao, setEditingCartao] = useState<CartaoCredito | null>(null);
  const [cartaoFatura, setCartaoFatura] = useState<CartaoCredito | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    limite: 0,
    dia_fechamento: 1,
    dia_vencimento: 10,
    banco_id: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

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
      await Promise.all([
        fetchCartoes(),
        fetchBancos()
      ]);
    }
  };

  const fetchCartoes = async () => {
    console.log("Fetching cartões...");
    const { data, error } = await supabase
      .from("cartoes_credito")
      .select("*")
      .eq("ativo", true)
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    console.log("Cartões result:", { data, error, userId: user?.id });

    if (error) {
      console.error("Erro ao carregar cartões:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar cartões",
        variant: "destructive",
      });
    } else {
      console.log("Cartões carregados:", data?.length || 0);
      setCartoes(data || []);
    }
  };

  const fetchBancos = async () => {
    const { data, error } = await supabase
      .from("bancos")
      .select("id, nome")
      .eq("ativo", true);

    if (!error && data) {
      setBancos(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCartao) {
      const { error } = await supabase
        .from("cartoes_credito")
        .update({
          nome: formData.nome,
          limite: formData.limite,
          dia_fechamento: formData.dia_fechamento,
          dia_vencimento: formData.dia_vencimento,
          banco_id: formData.banco_id || null
        })
        .eq("id", editingCartao.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar cartão",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Cartão atualizado com sucesso",
        });
        fetchCartoes();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("cartoes_credito")
        .insert({
          nome: formData.nome,
          limite: formData.limite,
          dia_fechamento: formData.dia_fechamento,
          dia_vencimento: formData.dia_vencimento,
          banco_id: formData.banco_id || null,
          user_id: user?.id
        });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao criar cartão",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Cartão criado com sucesso",
        });
        fetchCartoes();
        resetForm();
      }
    }
  };

  const handleEdit = (cartao: CartaoCredito) => {
    setEditingCartao(cartao);
    setFormData({
      nome: cartao.nome,
      limite: cartao.limite,
      dia_fechamento: cartao.dia_fechamento,
      dia_vencimento: cartao.dia_vencimento,
      banco_id: cartao.banco_id || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("cartoes_credito")
      .update({ ativo: false })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir cartão",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Cartão excluído com sucesso",
      });
      fetchCartoes();
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      limite: 0,
      dia_fechamento: 1,
      dia_vencimento: 10,
      banco_id: ""
    });
    setEditingCartao(null);
    setIsDialogOpen(false);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const getUsagePercentage = (usado: number, limite: number) => {
    if (limite === 0) return 0;
    return (usado / limite) * 100;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-expense';
    if (percentage >= 60) return 'text-warning';
    return 'text-success';
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
              <CreditCard className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-primary">Cartões de Crédito</h1>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cartão
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCartao ? "Editar Cartão" : "Novo Cartão"}
                </DialogTitle>
                <DialogDescription>
                  {editingCartao ? "Edite as informações do cartão" : "Adicione um novo cartão de crédito"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome do Cartão</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Nubank Roxinho"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="limite">Limite</Label>
                  <Input
                    id="limite"
                    type="number"
                    step="0.01"
                    value={formData.limite}
                    onChange={(e) => setFormData({ ...formData, limite: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="dia_fechamento">Dia Fechamento</Label>
                    <Select 
                      value={formData.dia_fechamento.toString()} 
                      onValueChange={(value) => setFormData({ ...formData, dia_fechamento: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dia_vencimento">Dia Vencimento</Label>
                    <Select 
                      value={formData.dia_vencimento.toString()} 
                      onValueChange={(value) => setFormData({ ...formData, dia_vencimento: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="banco">Banco (Opcional)</Label>
                  <Select value={formData.banco_id} onValueChange={(value) => setFormData({ ...formData, banco_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o banco (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum banco associado</SelectItem>
                      {bancos.map((banco) => (
                        <SelectItem key={banco.id} value={banco.id}>
                          {banco.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingCartao ? "Salvar" : "Criar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {cartaoFatura ? (
          <FaturaCartao 
            cartao={cartaoFatura} 
            onClose={() => setCartaoFatura(null)} 
          />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cartoes.map((cartao) => {
            const usagePercentage = getUsagePercentage(cartao.limite_usado, cartao.limite);
            const limiteDisponivel = cartao.limite - cartao.limite_usado;
            
            return (
              <Card key={cartao.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <CardTitle className="text-lg">{cartao.nome}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => setCartaoFatura(cartao)} title="Ver Fatura">
                      <Receipt className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(cartao)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cartao.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Limite Usado</span>
                      <span className={`text-sm font-medium ${getUsageColor(usagePercentage)}`}>
                        {usagePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          usagePercentage >= 80 ? 'bg-expense' : 
                          usagePercentage >= 60 ? 'bg-warning' : 'bg-success'
                        }`}
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Disponível:</span>
                      <span className="font-medium text-success">
                        {formatCurrency(limiteDisponivel)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Limite Total:</span>
                      <span className="font-medium">
                        {formatCurrency(cartao.limite)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Fechamento: {cartao.dia_fechamento}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Vencimento: {cartao.dia_vencimento}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {cartoes.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Nenhum cartão encontrado</p>
                <p className="text-sm text-muted-foreground">Comece adicionando seu primeiro cartão</p>
              </CardContent>
            </Card>
            )}
        </div>
        )}
      </main>
    </div>
  );
};

export default Cartoes;