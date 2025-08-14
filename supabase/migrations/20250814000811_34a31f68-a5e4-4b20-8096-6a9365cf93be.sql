-- Criar tabelas do sistema de controle financeiro

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de bancos
CREATE TABLE public.bancos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('conta_corrente', 'conta_poupanca', 'conta_investimento')),
  saldo_inicial DECIMAL(15,2) NOT NULL DEFAULT 0,
  saldo_atual DECIMAL(15,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de cartões de crédito
CREATE TABLE public.cartoes_credito (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  limite DECIMAL(15,2) NOT NULL,
  limite_usado DECIMAL(15,2) NOT NULL DEFAULT 0,
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  dia_fechamento INTEGER NOT NULL CHECK (dia_fechamento >= 1 AND dia_fechamento <= 31),
  banco_id UUID REFERENCES public.bancos(id),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de categorias
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  cor TEXT NOT NULL DEFAULT '#3B82F6',
  icone TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de transações
CREATE TABLE public.transacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'transferencia')),
  data_transacao DATE NOT NULL,
  categoria_id UUID REFERENCES public.categorias(id),
  banco_id UUID REFERENCES public.bancos(id),
  cartao_credito_id UUID REFERENCES public.cartoes_credito(id),
  recorrente BOOLEAN NOT NULL DEFAULT false,
  tipo_recorrencia TEXT CHECK (tipo_recorrencia IN ('mensal', 'anual', 'semanal', 'quinzenal')),
  parcela_atual INTEGER,
  total_parcelas INTEGER,
  transacao_pai_id UUID REFERENCES public.transacoes(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de faturas de cartão
CREATE TABLE public.faturas_cartao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cartao_credito_id UUID NOT NULL REFERENCES public.cartoes_credito(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL,
  valor_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  valor_pago DECIMAL(15,2) NOT NULL DEFAULT 0,
  data_vencimento DATE NOT NULL,
  data_fechamento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'paga', 'vencida')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cartao_credito_id, mes, ano)
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bancos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartoes_credito ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas_cartao ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir seu próprio perfil" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para bancos
CREATE POLICY "Usuários podem ver seus próprios bancos" ON public.bancos
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir seus próprios bancos" ON public.bancos
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus próprios bancos" ON public.bancos
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus próprios bancos" ON public.bancos
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para cartões de crédito
CREATE POLICY "Usuários podem ver seus próprios cartões" ON public.cartoes_credito
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir seus próprios cartões" ON public.cartoes_credito
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus próprios cartões" ON public.cartoes_credito
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus próprios cartões" ON public.cartoes_credito
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para categorias
CREATE POLICY "Usuários podem ver suas próprias categorias" ON public.categorias
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir suas próprias categorias" ON public.categorias
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas próprias categorias" ON public.categorias
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar suas próprias categorias" ON public.categorias
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para transações
CREATE POLICY "Usuários podem ver suas próprias transações" ON public.transacoes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir suas próprias transações" ON public.transacoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas próprias transações" ON public.transacoes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar suas próprias transações" ON public.transacoes
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para faturas
CREATE POLICY "Usuários podem ver suas próprias faturas" ON public.faturas_cartao
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir suas próprias faturas" ON public.faturas_cartao
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas próprias faturas" ON public.faturas_cartao
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar suas próprias faturas" ON public.faturas_cartao
  FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bancos_updated_at BEFORE UPDATE ON public.bancos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cartoes_updated_at BEFORE UPDATE ON public.cartoes_credito
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transacoes_updated_at BEFORE UPDATE ON public.transacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_faturas_updated_at BEFORE UPDATE ON public.faturas_cartao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar perfil automaticamente quando usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY definer set search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'nome', new.email));
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inserir categorias padrão (serão criadas para cada usuário via trigger)
CREATE OR REPLACE FUNCTION public.create_default_categories(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY definer
AS $$
BEGIN
  INSERT INTO public.categorias (user_id, nome, tipo, cor, icone) VALUES
  (user_uuid, 'Alimentação', 'despesa', '#EF4444', '🍽️'),
  (user_uuid, 'Transporte', 'despesa', '#F97316', '🚗'),
  (user_uuid, 'Moradia', 'despesa', '#8B5CF6', '🏠'),
  (user_uuid, 'Saúde', 'despesa', '#10B981', '🏥'),
  (user_uuid, 'Educação', 'despesa', '#3B82F6', '📚'),
  (user_uuid, 'Lazer', 'despesa', '#F59E0B', '🎭'),
  (user_uuid, 'Compras', 'despesa', '#EC4899', '🛍️'),
  (user_uuid, 'Salário', 'receita', '#22C55E', '💰'),
  (user_uuid, 'Freelance', 'receita', '#06B6D4', '💼'),
  (user_uuid, 'Investimentos', 'receita', '#8B5CF6', '📈');
END;
$$;

-- Atualizar função para criar categorias padrão automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY definer set search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'nome', new.email));
  
  PERFORM public.create_default_categories(new.id);
  
  RETURN new;
END;
$$;