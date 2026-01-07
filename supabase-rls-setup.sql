-- PASSO 1: Adicionar coluna user_id nas tabelas
ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE transactions ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- PASSO 2: Ativar Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- PASSO 3: Criar políticas de segurança para CATEGORIES

-- Política de SELECT: todos veem categorias públicas (user_id IS NULL) e as próprias
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
CREATE POLICY "Users can view public and own categories"
ON categories FOR SELECT
USING (user_id IS NULL OR auth.uid() = user_id);

-- Política de INSERT: usuário cria apenas suas categorias
CREATE POLICY "Users can create their own categories"
ON categories FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política de UPDATE: usuário atualiza apenas suas categorias
CREATE POLICY "Users can update their own categories"
ON categories FOR UPDATE
USING (auth.uid() = user_id);

-- Política de DELETE: usuário deleta apenas suas categorias
CREATE POLICY "Users can delete their own categories"
ON categories FOR DELETE
USING (auth.uid() = user_id);

-- Compartilhar categorias padrão/publicar para todos
-- a) Tornar existentes públicas
UPDATE categories SET user_id = NULL WHERE user_id IS NOT NULL;

-- b) (Re)inserir categorias padrão como públicas
INSERT INTO categories (name, icon, color, user_id) VALUES
	('Alimentação', '🍽️', '#f59e0b', NULL),
	('Transporte', '🚗', '#ef4444', NULL),
	('Saúde', '⚕️', '#10b981', NULL),
	('Lazer', '🎬', '#8b5cf6', NULL),
	('Trabalho', '💼', '#3b82f6', NULL),
	('Educação', '📚', '#06b6d4', NULL),
	('Moradia', '🏠', '#ec4899', NULL),
	('Outros', '📌', '#6b7280', NULL)
ON CONFLICT (name) DO UPDATE SET user_id = NULL;

-- PASSO 4: Criar políticas de segurança para TRANSACTIONS

-- Política de SELECT: usuário vê apenas suas transações
CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

-- Política de INSERT: usuário cria apenas suas transações
CREATE POLICY "Users can create their own transactions"
ON transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política de UPDATE: usuário atualiza apenas suas transações
CREATE POLICY "Users can update their own transactions"
ON transactions FOR UPDATE
USING (auth.uid() = user_id);

-- Política de DELETE: usuário deleta apenas suas transações
CREATE POLICY "Users can delete their own transactions"
ON transactions FOR DELETE
USING (auth.uid() = user_id);

-- NOTA: Após executar este script, cada novo usuário precisará 
-- criar suas próprias categorias. As categorias existentes ficarão 
-- sem user_id (visíveis apenas quando user_id IS NULL).
-- Se quiser atribuir as categorias existentes a um usuário específico:
-- UPDATE categories SET user_id = 'SEU_USER_ID_AQUI' WHERE user_id IS NULL;
