-- Criar tabela para metas de categorias
CREATE TABLE public.metas_categoria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  categoria_id UUID NOT NULL,
  tipo_meta TEXT NOT NULL CHECK (tipo_meta IN ('limite_gasto', 'meta_receita')),
  valor_meta NUMERIC(15,2) NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, categoria_id, mes, ano, tipo_meta)
);

-- Habilitar RLS
ALTER TABLE public.metas_categoria ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Usuários podem ver suas próprias metas" 
ON public.metas_categoria 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias metas" 
ON public.metas_categoria 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias metas" 
ON public.metas_categoria 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias metas" 
ON public.metas_categoria 
FOR DELETE 
USING (auth.uid() = user_id);

-- Adicionar foreign keys
ALTER TABLE public.metas_categoria 
ADD CONSTRAINT fk_metas_categoria_categoria_id 
FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE CASCADE;

-- Criar trigger para updated_at
CREATE TRIGGER update_metas_categoria_updated_at
BEFORE UPDATE ON public.metas_categoria
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();