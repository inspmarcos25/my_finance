import { Elysia } from "elysia";

export default (app: Elysia) =>
  app.group("/api/dashboard", (app) =>
    app.get("/", ({ db }) => {
      // Saldo total (entradas - saídas)
      const balance = db
        .prepare(
          `SELECT 
          COALESCE(SUM(CASE WHEN type = 'entrada' THEN amount ELSE -amount END), 0) as total
          FROM transactions`
        )
        .get() as any;

      // Total de entradas
      const income = db
        .prepare(
          `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'entrada'`
        )
        .get() as any;

      // Total de saídas
      const expenses = db
        .prepare(
          `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'saida'`
        )
        .get() as any;

      // Gastos por categoria
      const byCategory = db
        .prepare(
          `SELECT 
          c.id, 
          c.name, 
          c.icon,
          c.color,
          SUM(CASE WHEN t.type = 'saida' THEN t.amount ELSE 0 END) as expenses,
          SUM(CASE WHEN t.type = 'entrada' THEN t.amount ELSE 0 END) as income
          FROM categories c
          LEFT JOIN transactions t ON c.id = t.category_id
          GROUP BY c.id
          ORDER BY expenses DESC`
        )
        .all();

      // Últimas transações
      const recent = db
        .prepare(
          `SELECT t.*, c.name as category_name, c.icon as category_icon 
           FROM transactions t 
           JOIN categories c ON t.category_id = c.id 
           ORDER BY t.date DESC 
           LIMIT 10`
        )
        .all();

      return {
        balance: balance.total,
        income: income.total,
        expenses: expenses.total,
        byCategory,
        recent,
      };
    })
  );
