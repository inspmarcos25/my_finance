#  Rastreador de Despesas Pessoais - Bun

Um app moderno e responsivo para gerenciar despesas pessoais com entradas, saídas e categorias personalizáveis. Construído com **Bun**, **Elysia** e **SQLite**.

##  Características

-  **Dashboard com Resumo** - Visualize saldo total, entradas e saídas
-  **Gerenciamento de Transações** - Adicione, edite e delete transações
-  **Categorias Personalizáveis** - Crie categorias com ícones e cores
-  **Filtros Inteligentes** - Filtre por tipo (entrada/saída) e categoria
-  **Gráficos de Gastos** - Visualize gastos por categoria
-  **Interface Mobile-First** - Totalmente responsiva
-  **Histórico de Transações** - Veja todas as suas transações
-  **Sem Complicações** - Sem login, sem banco de dados externo

##  Estrutura do Projeto

`
Teste Bun/
 src/
    index.ts              # Servidor principal
    controllers/          # Lógica de negócio
       index.ts
    models/              # Banco de dados
       database.ts
    routes/              # Rotas da API
       transactions.ts
       categories.ts
       dashboard.ts
    middleware/          # Middlewares
 public/                  # Arquivos estáticos
    index.html          # Frontend HTML
    style.css           # Estilos CSS
    script.js           # Lógica do frontend
 package.json            # Dependências
 README.md              # Este arquivo
`

##  Tecnologias

- **Bun** - Runtime JavaScript/TypeScript rápido
- **Elysia** - Framework web minimalista
- **SQLite** (bun:sqlite) - Banco de dados local
- **Vanilla JS** - Frontend sem frameworks pesados

##  Como Rodar

### Pré-requisitos
- [Bun](https://bun.sh) instalado

### Passos

1. **Instalar dependências**
   \\\ash
   bun install
   \\\

2. **Rodar em desenvolvimento**
   \\\ash
   bun run dev
   \\\

3. **Abrir no navegador**
   \\\
   http://localhost:3000
   \\\

##  API Endpoints

### Transações
- GET /api/transactions - Listar todas
- GET /api/transactions/:id - Obter por ID
- GET /api/transactions/type/:type - Por tipo (entrada/saida)
- POST /api/transactions - Criar
- DELETE /api/transactions/:id - Deletar

### Categorias
- GET /api/categories - Listar todas
- GET /api/categories/:id - Obter por ID
- POST /api/categories - Criar
- DELETE /api/categories/:id - Deletar

### Dashboard
- GET /api/dashboard - Resumo completo

##  Como Usar

1. **Dashboard** - Visualize seu saldo e gastos por categoria
2. **Nova Transação** - Adicione entradas e saídas
3. **Filtrar** - Use os filtros por tipo e categoria
4. **Categorias** - Crie e personalize categorias

##  Responsividade

100% responsivo para:
-  Celulares
-  Tablets
-  Desktops

##  Categorias Padrão

| Categoria | Ícone |
|-----------|-------|
| Alimentação |  |
| Transporte |  |
| Saúde |  |
| Lazer |  |
| Trabalho |  |
| Educação |  |
| Moradia |  |
| Outros |  |

##  Dicas

- **Backup**: Copie \expense-tracker.db\ para backup
- **Customização**: Edite \public/style.css\ para mudar cores
- **Ícones**: Use qualquer emoji para categorias

---

**Desenvolvido com  usando Bun**
