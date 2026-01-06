import { Elysia } from "elysia";
import { createAuthenticatedClient } from "../config/supabase";

// Helper para extrair token
function extractToken(headers: any) {
  const authHeader = headers.authorization || headers.Authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }
  
  return null;
}

export default (app: Elysia) =>
  app.group("/api/dashboard", (app) =>
    app
      .get("/", async ({ headers }: any) => {
      const token = extractToken(headers);
      if (!token) return { error: "Não autenticado" };
      
      const supabase = createAuthenticatedClient(token);
      
      // Buscar todas as transações
      const { data: transactions, error: transError } = await supabase
        .from("transactions")
        .select("*");

      if (transError) throw transError;

      // Calcular saldo total
      const balance = transactions.reduce((sum, t) => {
        return sum + (t.type === "entrada" ? t.amount : -t.amount);
      }, 0);

      // Total de entradas
      const income = transactions
        .filter(t => t.type === "entrada")
        .reduce((sum, t) => sum + t.amount, 0);

      // Total de saídas
      const expenses = transactions
        .filter(t => t.type === "saida")
        .reduce((sum, t) => sum + t.amount, 0);

      // Buscar categorias com gastos
      const { data: categories, error: catError } = await supabase
        .from("categories")
        .select("*");

      if (catError) throw catError;

      // Calcular gastos por categoria
      const byCategory = categories.map(cat => {
        const catTransactions = transactions.filter(t => t.category_id === cat.id);
        const catExpenses = catTransactions
          .filter(t => t.type === "saida")
          .reduce((sum, t) => sum + t.amount, 0);
        const catIncome = catTransactions
          .filter(t => t.type === "entrada")
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          expenses: catExpenses,
          income: catIncome,
        };
      }).sort((a, b) => b.expenses - a.expenses);

      // Últimas transações
      const { data: recent, error: recentError } = await supabase
        .from("transactions")
        .select(`
          *,
          category:categories(id, name, icon, color)
        `)
        .order("date", { ascending: false })
        .limit(10);

      if (recentError) throw recentError;

      const recentFormatted = recent.map(t => ({
        ...t,
        category_id: t.category.id,
        category_name: t.category.name,
        category_icon: t.category.icon,
      }));

      return {
        balance,
        income,
        expenses,
        byCategory,
        recent: recentFormatted,
      };
    })
  );
