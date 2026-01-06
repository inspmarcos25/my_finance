# 🔐 Configuração de Autenticação e RLS no Supabase

## 📋 Passos para Implementar

### PASSO 1: Executar SQL para Adicionar Colunas e RLS

Abra o **SQL Editor** no painel do Supabase e execute o script abaixo:

```sql
-- PASSO 1: Adicionar coluna user_id nas tabelas
ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE transactions ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- PASSO 2: Ativar Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- PASSO 3: Criar políticas de segurança para CATEGORIES

-- Política de SELECT: usuário vê apenas suas categorias
CREATE POLICY "Users can view their own categories"
ON categories FOR SELECT
USING (auth.uid() = user_id);

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
```

### PASSO 2: Configurar Email no Supabase Auth

1. Vá em **Authentication** → **Settings** → **Email**
2. **Opção Rápida (Para Teste)**: Desabilite "Email Confirmations" para permitir login imediato após cadastro
3. **Opção Produção**: Configure SMTP personalizado para enviar emails de confirmação

### PASSO 3: Testar o Sistema

1. **Parar o servidor atual** (se estiver rodando)
2. **Iniciar o servidor**: Execute no terminal do VS Code:
   ```powershell
   bun run dev
   ```

3. **Acessar a aplicação**:
   - Abra: http://localhost:3000
   - Você será redirecionado para a tela de login

4. **Criar sua conta**:
   - Clique em "Cadastre-se"
   - Preencha email e senha (mínimo 6 caracteres)
   - Após o cadastro, faça login

5. **Criar categorias**:
   - Vá em "Categorias"
   - Crie algumas categorias (ex: Alimentação, Transporte, etc)

6. **Adicionar transações**:
   - Vá em "Nova"
   - Adicione entradas e saídas

7. **Testar isolamento**:
   - Abra uma aba anônima
   - Cadastre outro usuário
   - Crie categorias/transações diferentes
   - Confirme que cada usuário vê apenas seus próprios dados

## ✅ O Que Foi Implementado

### Frontend:
- ✅ Página de login moderna (login.html)
- ✅ Autenticação automática na página principal
- ✅ Botão de logout no header
- ✅ Todas as requisições incluem token JWT
- ✅ Redirecionamento automático se não autenticado

### Backend:
- ✅ Middleware de autenticação
- ✅ Controllers atualizam com user_id automaticamente
- ✅ Rotas protegidas por autenticação
- ✅ RLS configurado no banco de dados

### Banco de Dados:
- ✅ Coluna user_id em todas as tabelas
- ✅ Row Level Security (RLS) ativo
- ✅ Políticas que isolam dados por usuário
- ✅ Relacionamento com auth.users

## 🔒 Segurança

Agora suas tabelas mostrarão **"RLS ENABLED"** em verde, removendo o aviso "UNRESTRICTED".

Cada usuário:
- ✅ Vê apenas suas próprias transações
- ✅ Vê apenas suas próprias categorias
- ✅ Não pode acessar dados de outros usuários
- ✅ Não pode modificar dados de outros usuários

## 📝 Próximos Passos (Opcional)

1. **Recuperação de senha**: Adicionar "Esqueci minha senha"
2. **Perfil de usuário**: Permitir alterar email/senha
3. **Exportar dados**: Baixar relatórios em PDF/Excel
4. **Notificações**: Alertas de gastos excessivos
5. **Tema escuro**: Alternar entre claro/escuro
