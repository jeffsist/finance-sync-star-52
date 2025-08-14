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
  Tag, 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowLeft,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface Categoria {
  id: string;
  nome: string;
  cor: string;
  icone?: string;
  tipo: string;
  ativo: boolean;
  created_at: string;
}

const cores = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#84CC16", "#6366F1"
];

const Categorias = () => {
  const [user, setUser] = useState<User | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    cor: "#3B82F6",
    tipo: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    fetchCategorias();
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

  const fetchCategorias = async () => {
    const { data, error } = await supabase
      .from("categorias")
      .select("*")
      .eq("ativo", true)
      .order("tipo", { ascending: true })
      .order("nome", { ascending: true });

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar categorias",
        variant: "destructive",
      });
    } else {
      setCategorias(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategoria) {
      const { error } = await supabase
        .from("categorias")
        .update({
          nome: formData.nome,
          cor: formData.cor,
          tipo: formData.tipo
        })
        .eq("id", editingCategoria.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar categoria",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Categoria atualizada com sucesso",
        });
        fetchCategorias();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("categorias")
        .insert({
          nome: formData.nome,
          cor: formData.cor,
          tipo: formData.tipo,
          user_id: user?.id
        });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao criar categoria",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Categoria criada com sucesso",
        });
        fetchCategorias();
        resetForm();
      }
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setFormData({
      nome: categoria.nome,
      cor: categoria.cor,
      tipo: categoria.tipo
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("categorias")
      .update({ ativo: false })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir categoria",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso",
      });
      fetchCategorias();
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      cor: "#3B82F6",
      tipo: ""
    });
    setEditingCategoria(null);
    setIsDialogOpen(false);
  };

  const groupedCategorias = categorias.reduce((acc, categoria) => {
    if (!acc[categoria.tipo]) {
      acc[categoria.tipo] = [];
    }
    acc[categoria.tipo].push(categoria);
    return acc;
  }, {} as Record<string, Categoria[]>);

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
              <Tag className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-primary">Categorias</h1>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategoria ? "Editar Categoria" : "Nova Categoria"}
                </DialogTitle>
                <DialogDescription>
                  {editingCategoria ? "Edite as informações da categoria" : "Crie uma nova categoria para organizar suas transações"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome da Categoria</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Alimentação"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cor</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {cores.map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          formData.cor === cor ? 'border-primary scale-110' : 'border-border hover:scale-105'
                        }`}
                        style={{ backgroundColor: cor }}
                        onClick={() => setFormData({ ...formData, cor })}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingCategoria ? "Salvar" : "Criar"}
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
        {Object.entries(groupedCategorias).map(([tipo, categoriasDoTipo]) => (
          <div key={tipo} className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              {tipo === 'receita' ? (
                <TrendingUp className="h-5 w-5 text-income" />
              ) : (
                <TrendingDown className="h-5 w-5 text-expense" />
              )}
              <h2 className="text-xl font-semibold capitalize">
                {tipo === 'receita' ? 'Receitas' : 'Despesas'}
              </h2>
              <span className="text-sm text-muted-foreground">
                ({categoriasDoTipo.length})
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categoriasDoTipo.map((categoria) => (
                <Card key={categoria.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: categoria.cor }}
                      />
                      <CardTitle className="text-base">{categoria.nome}</CardTitle>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(categoria)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(categoria.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="capitalize">
                      {categoria.tipo}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
        
        {categorias.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhuma categoria encontrada</p>
              <p className="text-sm text-muted-foreground">Comece criando sua primeira categoria</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Categorias;