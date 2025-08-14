
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
  Wallet, 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowLeft,
  Building2,
  PiggyBank,
  Briefcase
} from "lucide-react";

interface Banco {
  id: string;
  nome: string;
  tipo: string;
  saldo_inicial: number;
  saldo_atual: number;
  ativo: boolean;
  created_at: string;
}

const Contas = () => {
  const [user, setUser] = useState<User | null>(null);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanco, setEditingBanco] = useState<Banco | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "",
    saldo_inicial: 0
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    fetchBancos();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    setLoading(false);
  };

  const fetchBancos = async () => {
    const { data, error } = await supabase
      .from("bancos")
      .select("*")
      .eq("ativo", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar contas",
        variant: "destructive",
      });
    } else {
      setBancos(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form data antes da validação:", formData);
    
    if (!formData.tipo) {
      toast({
        title: "Erro",
        description: "Selecione o tipo da conta",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome da conta é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar se o tipo está na lista de valores válidos
    const tiposValidos = ['conta_corrente', 'poupanca', 'investimento', 'carteira'];
    if (!tiposValidos.includes(formData.tipo)) {
      console.error("Tipo inválido:", formData.tipo);
      toast({
        title: "Erro",
        description: "Tipo de conta inválido",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Dados validados, enviando para o banco:", {
      nome: formData.nome,
      tipo: formData.tipo,
      saldo_inicial: formData.saldo_inicial,
      user_id: user?.id
    });
    
    if (editingBanco) {
      const { error } = await supabase
        .from("bancos")
        .update({
          nome: formData.nome,
          tipo: formData.tipo,
          saldo_inicial: formData.saldo_inicial,
          saldo_atual: formData.saldo_inicial
        })
        .eq("id", editingBanco.id);

      if (error) {
        console.error("Erro ao atualizar conta:", error);
        toast({
          title: "Erro",
          description: `Erro ao atualizar conta: ${error.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Conta atualizada com sucesso",
        });
        fetchBancos();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("bancos")
        .insert({
          nome: formData.nome,
          tipo: formData.tipo,
          saldo_inicial: formData.saldo_inicial,
          saldo_atual: formData.saldo_inicial,
          user_id: user?.id
        });

      if (error) {
        console.error("Erro detalhado ao criar conta:", error);
        toast({
          title: "Erro",
          description: `Erro ao criar conta: ${error.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Conta criada com sucesso",
        });
        fetchBancos();
        resetForm();
      }
    }
  };

  const handleEdit = (banco: Banco) => {
    setEditingBanco(banco);
    setFormData({
      nome: banco.nome,
      tipo: banco.tipo,
      saldo_inicial: banco.saldo_inicial
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("bancos")
      .update({ ativo: false })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir conta",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Conta excluída com sucesso",
      });
      fetchBancos();
    }
  };

  const resetForm = () => {
    setFormData({ nome: "", tipo: "", saldo_inicial: 0 });
    setEditingBanco(null);
    setIsDialogOpen(false);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "conta_corrente":
        return <Building2 className="h-5 w-5" />;
      case "poupanca":
        return <PiggyBank className="h-5 w-5" />;
      case "investimento":
        return <Briefcase className="h-5 w-5" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "conta_corrente":
        return "CONTA CORRENTE";
      case "poupanca":
        return "POUPANÇA";
      case "investimento":
        return "INVESTIMENTO";
      case "carteira":
        return "CARTEIRA";
      default:
        return tipo.toUpperCase();
    }
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
              <Wallet className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-primary">Gerenciar Contas</h1>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBanco ? "Editar Conta" : "Nova Conta"}
                </DialogTitle>
                <DialogDescription>
                  {editingBanco ? "Edite as informações da conta" : "Crie uma nova conta bancária"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome da Conta</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Bradesco Conta Corrente"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo de Conta</Label>
                  <Select 
                    value={formData.tipo} 
                    onValueChange={(value) => {
                      console.log("Tipo selecionado:", value);
                      setFormData({ ...formData, tipo: value });
                    }} 
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conta_corrente">Conta Corrente</SelectItem>
                      <SelectItem value="poupanca">Poupança</SelectItem>
                      <SelectItem value="investimento">Investimento</SelectItem>
                      <SelectItem value="carteira">Carteira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="saldo">Saldo Inicial</Label>
                  <Input
                    id="saldo"
                    type="number"
                    step="0.01"
                    value={formData.saldo_inicial}
                    onChange={(e) => setFormData({ ...formData, saldo_inicial: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingBanco ? "Salvar" : "Criar"}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bancos.map((banco) => (
            <Card key={banco.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  {getTipoIcon(banco.tipo)}
                  <CardTitle className="text-lg">{banco.nome}</CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(banco)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(banco.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary mb-1">
                  R$ {banco.saldo_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <CardDescription>
                  {getTipoLabel(banco.tipo)}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
          
          {bancos.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="text-center py-8">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Nenhuma conta encontrada</p>
                <p className="text-sm text-muted-foreground">Comece criando sua primeira conta</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Contas;
