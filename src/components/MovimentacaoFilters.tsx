import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Filtros {
  dataInicio: string;
  dataFim: string;
  tipoMovimentacao: string;
  origem: string;
  valorMin: string;
  valorMax: string;
  status: string;
  busca: string;
}

interface MovimentacaoFiltersProps {
  filtros: Filtros;
  setFiltros: (filtros: Filtros) => void;
  onLimparFiltros: () => void;
}

const MovimentacaoFilters = ({ filtros, setFiltros, onLimparFiltros }: MovimentacaoFiltersProps) => {
  const updateFiltro = (key: keyof Filtros, value: string) => {
    setFiltros({ ...filtros, [key]: value });
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Filtros Avançados</CardTitle>
        <Button variant="outline" size="sm" onClick={onLimparFiltros}>
          <X className="h-4 w-4 mr-2" />
          Limpar Filtros
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Período */}
          <div className="space-y-2">
            <Label htmlFor="dataInicio">Data Início</Label>
            <Input
              id="dataInicio"
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => updateFiltro('dataInicio', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataFim">Data Fim</Label>
            <Input
              id="dataFim"
              type="date"
              value={filtros.dataFim}
              onChange={(e) => updateFiltro('dataFim', e.target.value)}
            />
          </div>

          {/* Tipo de Movimentação */}
          <div className="space-y-2">
            <Label>Tipo de Movimentação</Label>
            <Select value={filtros.tipoMovimentacao} onValueChange={(value) => updateFiltro('tipoMovimentacao', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="receita_recebida">Receitas Recebidas</SelectItem>
                <SelectItem value="despesa_paga">Despesas Pagas</SelectItem>
                <SelectItem value="compra_cartao">Compras no Cartão</SelectItem>
                <SelectItem value="pagamento_fatura">Pagamentos de Fatura</SelectItem>
                <SelectItem value="transferencia">Transferências</SelectItem>
                <SelectItem value="alteracao_limite">Alterações de Limite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filtros.status} onValueChange={(value) => updateFiltro('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="concluida">Concluídas</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="cancelada">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Faixa de Valores */}
          <div className="space-y-2">
            <Label htmlFor="valorMin">Valor Mínimo</Label>
            <Input
              id="valorMin"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={filtros.valorMin}
              onChange={(e) => updateFiltro('valorMin', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorMax">Valor Máximo</Label>
            <Input
              id="valorMax"
              type="number"
              step="0.01"
              placeholder="999999,99"
              value={filtros.valorMax}
              onChange={(e) => updateFiltro('valorMax', e.target.value)}
            />
          </div>
        </div>

        {/* Atalhos de Período */}
        <div className="space-y-2">
          <Label>Períodos Rápidos</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const hoje = new Date();
                setFiltros({ 
                  ...filtros, 
                  dataInicio: hoje.toISOString().split('T')[0],
                  dataFim: hoje.toISOString().split('T')[0]
                });
              }}
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const hoje = new Date();
                const semanaPassada = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
                setFiltros({ 
                  ...filtros, 
                  dataInicio: semanaPassada.toISOString().split('T')[0],
                  dataFim: hoje.toISOString().split('T')[0]
                });
              }}
            >
              Últimos 7 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const hoje = new Date();
                const mesPassado = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
                setFiltros({ 
                  ...filtros, 
                  dataInicio: mesPassado.toISOString().split('T')[0],
                  dataFim: hoje.toISOString().split('T')[0]
                });
              }}
            >
              Últimos 30 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const hoje = new Date();
                const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                setFiltros({ 
                  ...filtros, 
                  dataInicio: inicioMes.toISOString().split('T')[0],
                  dataFim: hoje.toISOString().split('T')[0]
                });
              }}
            >
              Este mês
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const hoje = new Date();
                const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
                const fimMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
                setFiltros({ 
                  ...filtros, 
                  dataInicio: mesPassado.toISOString().split('T')[0],
                  dataFim: fimMesPassado.toISOString().split('T')[0]
                });
              }}
            >
              Mês passado
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MovimentacaoFilters;