import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Building2, TrendingUp, TrendingDown } from "lucide-react";

interface Banco {
  id: string;
  nome: string;
  tipo: string;
  saldo_atual: number;
  saldo_inicial: number;
}

interface ResumoContasBancoProps {
  userId: string;
  onNavigateToContas: () => void;
}

const ResumoContasBanco = ({ userId, onNavigateToContas }: ResumoContasBancoProps) => {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumo, setResumo] = useState({
    saldoTotal: 0,
    contasAtivas: 0,
    variacaoTotal: 0
  });

  useEffect(() => {
    if (userId) {
      fetchBancos();
    }
  }, [userId]);

  const fetchBancos = async () => {
    try {
      const { data, error } = await supabase
        .from("bancos")
        .select("*")
        .eq("user_id", userId)
        .eq("ativo", true)
        .order("saldo_atual", { ascending: false });

      if (!error && data) {
        setBancos(data);
        
        const saldoTotal = data.reduce((total, banco) => total + banco.saldo_atual, 0);
        const variacaoTotal = data.reduce((total, banco) => total + (banco.saldo_atual - banco.saldo_inicial), 0);
        
        setResumo({
          saldoTotal,
          contasAtivas: data.length,
          variacaoTotal
        });
      }
    } catch (error) {
      console.error("Erro ao carregar bancos:", error);
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

  const getTipoIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'corrente':
        return <Building2 className="h-4 w-4" />;
      case 'poupanca':
        return <Wallet className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Resumo Geral */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(resumo.saldoTotal)}</div>
            <p className="text-xs text-muted-foreground">
              {resumo.contasAtivas} conta{resumo.contasAtivas !== 1 ? 's' : ''} ativa{resumo.contasAtivas !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variação Total</CardTitle>
            {resumo.variacaoTotal >= 0 ? (
              <TrendingUp className="h-4 w-4 text-income" />
            ) : (
              <TrendingDown className="h-4 w-4 text-expense" />
            )}
          </CardHeader>
          <CardContent className="pb-3 sm:pb-6">
            <div className={`text-xl sm:text-2xl font-bold ${resumo.variacaoTotal >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrency(resumo.variacaoTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              Desde a criação das contas
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1" onClick={onNavigateToContas}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gerenciar</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3 sm:pb-6">
            <Button variant="outline" className="w-full" size="sm">
              Ver Todas as Contas
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Bancos */}
      {bancos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 sm:mb-4">Suas Contas Bancárias</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {bancos.slice(0, 6).map((banco) => {
              const variacao = banco.saldo_atual - banco.saldo_inicial;
              
              return (
                <Card key={banco.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onNavigateToContas}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        {getTipoIcon(banco.tipo)}
                        <span className="font-medium truncate text-sm sm:text-base">{banco.nome}</span>
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded whitespace-nowrap ml-2 flex-shrink-0">
                        {banco.tipo}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Saldo Atual:</span>
                        <span className="font-semibold text-sm sm:text-base">{formatCurrency(banco.saldo_atual)}</span>
                      </div>
                      
                      {variacao !== 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Variação:</span>
                          <span className={`text-sm font-medium ${variacao >= 0 ? 'text-income' : 'text-expense'}`}>
                            {variacao >= 0 ? '+' : ''}{formatCurrency(variacao)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {bancos.length > 6 && (
            <div className="text-center mt-3 sm:mt-4">
              <Button variant="outline" onClick={onNavigateToContas} size="sm">
                Ver mais {bancos.length - 6} conta{bancos.length - 6 !== 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </div>
      )}

      {bancos.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2">Nenhuma conta bancária encontrada</p>
            <p className="text-sm text-muted-foreground mb-4">Comece adicionando sua primeira conta</p>
            <Button onClick={onNavigateToContas}>
              Adicionar Conta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResumoContasBanco;