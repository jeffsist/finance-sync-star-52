import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  Filter, 
  ChevronDown, 
  X, 
  Calendar as CalendarIcon,
  Search,
  TrendingUp,
  TrendingDown 
} from "lucide-react";

interface FilterState {
  searchText: string;
  tipo: string;
  categoriaId: string;
  bancoId: string;
  cartaoId: string;
  status: string;
  valorMin: string;
  valorMax: string;
  dataInicio: Date | undefined;
  dataFim: Date | undefined;
  parcelamento: string;
}

interface FilterProps {
  onFiltersChange: (filters: FilterState) => void;
  activeFilters: FilterState;
}

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
}

interface Banco {
  id: string;
  nome: string;
}

interface CartaoCredito {
  id: string;
  nome: string;
}

export const TransactionFilters = ({ onFiltersChange, activeFilters }: FilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [filters, setFilters] = useState<FilterState>(activeFilters);

  useEffect(() => {
    fetchFilterData();
  }, []);

  const fetchFilterData = async () => {
    try {
      const [categoriasRes, bancosRes, cartoesRes] = await Promise.all([
        supabase.from("categorias").select("id, nome, tipo").eq("ativo", true),
        supabase.from("bancos").select("id, nome").eq("ativo", true),
        supabase.from("cartoes_credito").select("id, nome").eq("ativo", true)
      ]);

      if (categoriasRes.data) setCategorias(categoriasRes.data);
      if (bancosRes.data) setBancos(bancosRes.data);
      if (cartoesRes.data) setCartoes(cartoesRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados dos filtros:", error);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    // Convert "all" to empty string for filtering logic
    const actualValue = value === "all" ? "" : value;
    const newFilters = { ...filters, [key]: actualValue };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      searchText: "",
      tipo: "",
      categoriaId: "",
      bancoId: "",
      cartaoId: "",
      status: "",
      valorMin: "",
      valorMax: "",
      dataInicio: undefined,
      dataFim: undefined,
      parcelamento: "",
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const setQuickFilter = (days: number) => {
    const hoje = new Date();
    const dataInicio = new Date();
    dataInicio.setDate(hoje.getDate() - days);
    
    const newFilters = {
      ...filters,
      dataInicio,
      dataFim: hoje,
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchText) count++;
    if (filters.tipo) count++;
    if (filters.categoriaId) count++;
    if (filters.bancoId) count++;
    if (filters.cartaoId) count++;
    if (filters.status) count++;
    if (filters.valorMin) count++;
    if (filters.valorMax) count++;
    if (filters.dataInicio) count++;
    if (filters.dataFim) count++;
    if (filters.parcelamento) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary">{activeFiltersCount}</Badge>
                )}
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4 border-t">
            {/* Filtros Rápidos */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuickFilter(7)}>
                Últimos 7 dias
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickFilter(30)}>
                Últimos 30 dias
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickFilter(90)}>
                Últimos 90 dias
              </Button>
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="h-3 w-3 mr-1" />
                Limpar Filtros
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Busca por texto */}
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Buscar por descrição..."
                    value={filters.searchText}
                    onChange={(e) => handleFilterChange("searchText", e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Tipo */}
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={filters.tipo || "all"} onValueChange={(value) => handleFilterChange("tipo", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="receita">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-income" />
                        Receita
                      </div>
                    </SelectItem>
                    <SelectItem value="despesa">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-expense" />
                        Despesa
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filters.status || "all"} onValueChange={(value) => handleFilterChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={filters.categoriaId || "all"} onValueChange={(value) => handleFilterChange("categoriaId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Banco/Conta */}
              <div className="space-y-2">
                <Label>Conta</Label>
                <Select value={filters.bancoId || "all"} onValueChange={(value) => handleFilterChange("bancoId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as contas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {bancos.map((banco) => (
                      <SelectItem key={banco.id} value={banco.id}>
                        {banco.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cartão */}
              <div className="space-y-2">
                <Label>Cartão</Label>
                <Select value={filters.cartaoId || "all"} onValueChange={(value) => handleFilterChange("cartaoId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os cartões" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {cartoes.map((cartao) => (
                      <SelectItem key={cartao.id} value={cartao.id}>
                        {cartao.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Parcelamento */}
              <div className="space-y-2">
                <Label>Parcelamento</Label>
                <Select value={filters.parcelamento || "all"} onValueChange={(value) => handleFilterChange("parcelamento", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="vista">À vista</SelectItem>
                    <SelectItem value="parcelada">Parceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Valor Mínimo */}
              <div className="space-y-2">
                <Label htmlFor="valor-min">Valor Mínimo</Label>
                <Input
                  id="valor-min"
                  type="number"
                  placeholder="0,00"
                  value={filters.valorMin}
                  onChange={(e) => handleFilterChange("valorMin", e.target.value)}
                />
              </div>

              {/* Valor Máximo */}
              <div className="space-y-2">
                <Label htmlFor="valor-max">Valor Máximo</Label>
                <Input
                  id="valor-max"
                  type="number"
                  placeholder="0,00"
                  value={filters.valorMax}
                  onChange={(e) => handleFilterChange("valorMax", e.target.value)}
                />
              </div>

              {/* Data Início */}
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dataInicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dataInicio ? format(filters.dataInicio, "PPP", { locale: ptBR }) : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dataInicio}
                      onSelect={(date) => handleFilterChange("dataInicio", date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Data Fim */}
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dataFim && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dataFim ? format(filters.dataFim, "PPP", { locale: ptBR }) : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dataFim}
                      onSelect={(date) => handleFilterChange("dataFim", date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};