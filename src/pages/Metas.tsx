import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ModalConfigurarMeta from "@/components/ModalConfigurarMeta";

interface Categoria {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
  icone?: string;
}

interface Meta {
  id: string;
  categoria_id: string;
  tipo_meta: 'limite_gasto' | 'meta_receita';
  valor_meta: number;
  mes: number;
  ano: number;
}

interface CategoriaResponse {
  id: string;
  nome: string;
  tipo: string;
  cor: string;
  icone?: string;
}

interface MetaResponse {
  id: string;
  categoria_id: string;
  tipo_meta: string;
  valor_meta: number;
  mes: number;
  ano: number;
}

const Metas = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<Categoria | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const mesAtual = new Date().getMonth() + 1;
  const anoAtual = new Date().getFullYear();

  useEffect(() => {
    fetchCategorias();
    fetchMetas();
  }, []);

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('ativo', true)
        .order('nome') as { data: CategoriaResponse[] | null; error: any };

      if (error) throw error;
      
      const categoriasFormatadas: Categoria[] = data?.map(cat => ({
        id: cat.id,
        nome: cat.nome,
        tipo: cat.tipo as 'receita' | 'despesa',
        cor: cat.cor,
        icone: cat.icone,
      })) || [];
      
      setCategorias(categoriasFormatadas);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias",
        variant: "destructive",
      });
    }
  };

  const fetchMetas = async () => {
    try {
      const { data, error } = await supabase
        .from('metas_categoria')
        .select('*')
        .eq('mes', mesAtual)
        .eq('ano', anoAtual)
        .eq('ativo', true) as { data: MetaResponse[] | null; error: any };

      if (error) throw error;
      
      const metasFormatadas: Meta[] = data?.map(meta => ({
        id: meta.id,
        categoria_id: meta.categoria_id,
        tipo_meta: meta.tipo_meta as 'limite_gasto' | 'meta_receita',
        valor_meta: Number(meta.valor_meta),
        mes: meta.mes,
        ano: meta.ano,
      })) || [];
      
      setMetas(metasFormatadas);
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as metas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMetaParaCategoria = (categoriaId: string, tipoMeta: 'limite_gasto' | 'meta_receita') => {
    return metas.find(m => m.categoria_id === categoriaId && m.tipo_meta === tipoMeta);
  };

  const handleConfigurarMeta = (categoria: Categoria) => {
    setCategoriaSelecionada(categoria);
    setModalOpen(true);
  };

  const handleMetaCriada = () => {
    fetchMetas();
    setModalOpen(false);
    setCategoriaSelecionada(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
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
              <Target className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-primary">Metas e Limites</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-6">
        <p className="text-muted-foreground">
          Configure metas de receita e limites de gastos por categoria
        </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categorias.map((categoria) => {
          const metaReceita = getMetaParaCategoria(categoria.id, 'meta_receita');
          const limiteGasto = getMetaParaCategoria(categoria.id, 'limite_gasto');
          
          return (
            <Card key={categoria.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: categoria.cor }}
                    />
                    <CardTitle className="text-lg">{categoria.nome}</CardTitle>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleConfigurarMeta(categoria)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  {categoria.tipo === 'receita' ? 'Categoria de Receita' : 'Categoria de Despesa'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {categoria.tipo === 'receita' && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Meta de Receita</p>
                    <p className="text-lg font-semibold text-success">
                      {metaReceita 
                        ? `R$ ${metaReceita.valor_meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                        : 'Não configurada'
                      }
                    </p>
                  </div>
                )}
                
                {categoria.tipo === 'despesa' && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Limite de Gastos</p>
                    <p className="text-lg font-semibold text-destructive">
                      {limiteGasto 
                        ? `R$ ${limiteGasto.valor_meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                        : 'Não configurado'
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

        <ModalConfigurarMeta
          open={modalOpen}
          onOpenChange={setModalOpen}
          categoria={categoriaSelecionada}
          onMetaCriada={handleMetaCriada}
          mesAtual={mesAtual}
          anoAtual={anoAtual}
        />
      </main>
    </div>
  );
};

export default Metas;