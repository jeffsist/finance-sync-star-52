import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CreditCard, DollarSign, Percent, AlertTriangle } from "lucide-react";

interface CartaoCredito {
  id: string;
  nome: string;
  limite: number;
  limite_usado: number;
  ativo: boolean;
}

interface ResumoGeralCartoesProps {
  userId: string;
}

const ResumoGeralCartoes = ({ userId }: ResumoGeralCartoesProps) => {
  const [resumo, setResumo] = useState({
    limiteTotal: 0,
    limiteUsado: 0,
    limiteDisponivel: 0,
    percentualUso: 0,
    cartoesAtivos: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchResumoCartoes();
    }
  }, [userId]);

  const fetchResumoCartoes = async () => {
    try {
      const { data, error } = await supabase
        .from("cartoes_credito")
        .select("*")
        .eq("user_id", userId)
        .eq("ativo", true);

      if (!error && data) {
        const limiteTotal = data.reduce((total, cartao) => total + cartao.limite, 0);
        const limiteUsado = data.reduce((total, cartao) => total + cartao.limite_usado, 0);
        const limiteDisponivel = limiteTotal - limiteUsado;
        const percentualUso = limiteTotal > 0 ? (limiteUsado / limiteTotal) * 100 : 0;

        setResumo({
          limiteTotal,
          limiteUsado,
          limiteDisponivel,
          percentualUso,
          cartoesAtivos: data.length
        });
      }
    } catch (error) {
      console.error("Erro ao carregar resumo dos cartões:", error);
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

  const getUsageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-expense';
    if (percentage >= 60) return 'text-warning';
    return 'text-success';
  };

  const getUsageLevel = (percentage: number) => {
    if (percentage >= 80) return { text: 'Alto', color: 'text-expense' };
    if (percentage >= 60) return { text: 'Moderado', color: 'text-warning' };
    return { text: 'Baixo', color: 'text-success' };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const usageLevel = getUsageLevel(resumo.percentualUso);

  return (
    <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">Resumo Geral dos Cartões</h2>
        {resumo.percentualUso >= 80 && (
          <div className="flex items-center text-expense">
            <AlertTriangle className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
            <span className="text-xs sm:text-sm font-medium">Uso Alto - Atenção!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Limite Total</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(resumo.limiteTotal)}</div>
            <p className="text-xs text-muted-foreground">
              {resumo.cartoesAtivos} cartão{resumo.cartoesAtivos !== 1 ? 'ões' : ''} ativo{resumo.cartoesAtivos !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Limite Usado</CardTitle>
            <DollarSign className="h-4 w-4 text-expense" />
          </CardHeader>
          <CardContent className="pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-expense">{formatCurrency(resumo.limiteUsado)}</div>
            <p className="text-xs text-muted-foreground">
              Valor total utilizado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Limite Disponível</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent className="pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-success">{formatCurrency(resumo.limiteDisponivel)}</div>
            <p className="text-xs text-muted-foreground">
              Disponível para uso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso Geral</CardTitle>
            <Percent className={`h-4 w-4 ${getUsageColor(resumo.percentualUso)}`} />
          </CardHeader>
          <CardContent className="pb-3 sm:pb-6">
            <div className={`text-xl sm:text-2xl font-bold ${getUsageColor(resumo.percentualUso)}`}>
              {resumo.percentualUso.toFixed(1)}%
            </div>
            <p className={`text-xs font-medium ${usageLevel.color}`}>
              Uso {usageLevel.text}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Progresso Geral */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Utilização Geral dos Cartões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 pt-0">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm">
              <span>Usado: {formatCurrency(resumo.limiteUsado)}</span>
              <span>Disponível: {formatCurrency(resumo.limiteDisponivel)}</span>
            </div>
            <Progress 
              value={resumo.percentualUso} 
              className="h-2 sm:h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className={`font-medium ${getUsageColor(resumo.percentualUso)}`}>
                {resumo.percentualUso.toFixed(1)}% usado
              </span>
              <span>100%</span>
            </div>
          </div>

          {resumo.cartoesAtivos === 0 && (
            <div className="text-center py-4">
              <CreditCard className="h-6 sm:h-8 w-6 sm:w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm text-muted-foreground">Nenhum cartão ativo encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumoGeralCartoes;