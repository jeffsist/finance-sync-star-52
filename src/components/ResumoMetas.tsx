import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Target, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Meta {
  id: string;
  categoria_id: string;
  categoria_nome: string;
  categoria_cor: string;
  tipo_meta: 'limite_gasto' | 'meta_receita';
  valor_meta: number;
  valor_atual: number;
}

interface MetaResponse {
  id: string;
  categoria_id: string;
  tipo_meta: string;
  valor_meta: number;
  categorias: {
    nome: string;
    cor: string;
  };
}

const ResumoMetas = () => {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);

  const mesAtual = new Date().getMonth() + 1;
  const anoAtual = new Date().getFullYear();

  useEffect(() => {
    fetchMetasComProgresso();
  }, []);

  const fetchMetasComProgresso = async () => {
    try {
      // Buscar metas do mês atual
      const { data: metasData, error: metasError } = await supabase
        .from('metas_categoria')
        .select(`
          *,
          categorias!inner(nome, cor)
        `)
        .eq('mes', mesAtual)
        .eq('ano', anoAtual)
        .eq('ativo', true) as { data: MetaResponse[] | null; error: any };

      if (metasError) throw metasError;

      // Buscar transações do mês atual para calcular progresso
      const dataInicio = new Date(anoAtual, mesAtual - 1, 1).toISOString().split('T')[0];
      const dataFim = new Date(anoAtual, mesAtual, 0).toISOString().split('T')[0];

      const { data: transacoesData, error: transacoesError } = await supabase
        .from('transacoes')
        .select('categoria_id, tipo, valor')
        .gte('data_transacao', dataInicio)
        .lte('data_transacao', dataFim);

      if (transacoesError) throw transacoesError;

      // Calcular valores atuais por categoria
      const valoresPorCategoria = transacoesData?.reduce((acc, transacao) => {
        const key = `${transacao.categoria_id}_${transacao.tipo}`;
        acc[key] = (acc[key] || 0) + Number(transacao.valor);
        return acc;
      }, {} as Record<string, number>) || {};

      // Combinar metas com valores atuais
      const metasComProgresso: Meta[] = metasData?.map(meta => {
        const tipoTransacao = meta.tipo_meta === 'meta_receita' ? 'receita' : 'despesa';
        const key = `${meta.categoria_id}_${tipoTransacao}`;
        const valorAtual = valoresPorCategoria[key] || 0;

        return {
          id: meta.id,
          categoria_id: meta.categoria_id,
          categoria_nome: meta.categorias.nome,
          categoria_cor: meta.categorias.cor,
          tipo_meta: meta.tipo_meta as 'limite_gasto' | 'meta_receita',
          valor_meta: Number(meta.valor_meta),
          valor_atual: valorAtual,
        };
      }) || [];

      setMetas(metasComProgresso);
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressoStatus = (meta: Meta) => {
    const percentual = (meta.valor_atual / meta.valor_meta) * 100;
    
    if (meta.tipo_meta === 'limite_gasto') {
      if (percentual >= 100) return { color: 'destructive', status: 'Limite excedido' };
      if (percentual >= 90) return { color: 'destructive', status: 'Próximo do limite' };
      if (percentual >= 80) return { color: 'warning', status: 'Atenção' };
      return { color: 'success', status: 'Dentro do limite' };
    } else {
      if (percentual >= 100) return { color: 'success', status: 'Meta atingida' };
      if (percentual >= 80) return { color: 'warning', status: 'Próximo da meta' };
      return { color: 'secondary', status: 'Em progresso' };
    }
  };

  const metasComAlerta = metas.filter(meta => {
    const percentual = (meta.valor_atual / meta.valor_meta) * 100;
    return (meta.tipo_meta === 'limite_gasto' && percentual >= 80) ||
           (meta.tipo_meta === 'meta_receita' && percentual < 50);
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Resumo de Metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (metas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Resumo de Metas
          </CardTitle>
          <CardDescription>
            Nenhuma meta configurada para este mês
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Resumo de Metas
          {metasComAlerta.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {metasComAlerta.length} alertas
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Progresso das metas do mês atual
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {metas.slice(0, 5).map((meta) => {
          const percentual = Math.min((meta.valor_atual / meta.valor_meta) * 100, 100);
          const status = getProgressoStatus(meta);
          
          return (
            <div key={meta.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: meta.categoria_cor }}
                  />
                  <span className="font-medium text-sm">{meta.categoria_nome}</span>
                  {meta.tipo_meta === 'meta_receita' ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <Badge variant={status.color as any} className="text-xs">
                  {status.status}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <Progress value={percentual} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    R$ {meta.valor_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span>
                    R$ {meta.valor_meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        
        {metas.length > 5 && (
          <p className="text-sm text-muted-foreground text-center pt-2">
            E mais {metas.length - 5} metas configuradas
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumoMetas;