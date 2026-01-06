-- Execute este SQL no Supabase SQL Editor

-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT '💰',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('entrada', 'saida')),
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_type TEXT NOT NULL DEFAULT 'nenhuma' CHECK(recurrence_type IN ('nenhuma','diaria','semanal','mensal','anual')),
  recurrence_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir categorias padrão
INSERT INTO categories (name, icon, color) VALUES
  ('Alimentação', '🍽️', '#f59e0b'),
  ('Transporte', '🚗', '#ef4444'),
  ('Saúde', '⚕️', '#10b981'),
  ('Lazer', '🎬', '#8b5cf6'),
  ('Trabalho', '💼', '#3b82f6'),
  ('Educação', '📚', '#06b6d4'),
  ('Moradia', '🏠', '#ec4899'),
  ('Outros', '📌', '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
