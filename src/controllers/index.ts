import type { Database } from "bun:sqlite";

export class TransactionController {
  constructor(private db: Database) {}

  // Listar todas as transações
  getAll() {
    const transactions = this.db
      .prepare(
        `SELECT t.*, c.name as category_name, c.icon as category_icon 
         FROM transactions t 
         JOIN categories c ON t.category_id = c.id 
         ORDER BY t.date DESC`
      )
      .all();
    return transactions;
  }

  // Listar transações por categoria
  getByCategory(categoryId: number) {
    const transactions = this.db
      .prepare(
        `SELECT t.*, c.name as category_name, c.icon as category_icon 
         FROM transactions t 
         JOIN categories c ON t.category_id = c.id 
         WHERE t.category_id = ? 
         ORDER BY t.date DESC`
      )
      .all(categoryId);
    return transactions;
  }

  // Listar transações por tipo (entrada/saida)
  getByType(type: string) {
    const transactions = this.db
      .prepare(
        `SELECT t.*, c.name as category_name, c.icon as category_icon 
         FROM transactions t 
         JOIN categories c ON t.category_id = c.id 
         WHERE t.type = ? 
         ORDER BY t.date DESC`
      )
      .all(type);
    return transactions;
  }

  // Obter uma transação por ID
  getById(id: number) {
    const transaction = this.db
      .prepare(
        `SELECT t.*, c.name as category_name, c.icon as category_icon 
         FROM transactions t 
         JOIN categories c ON t.category_id = c.id 
         WHERE t.id = ?`
      )
      .get(id);
    return transaction;
  }

  // Criar nova transação
  create(data: {
    description: string;
    amount: number;
    type: "entrada" | "saida";
    category_id: number;
    date: string;
    is_recurring?: boolean;
    recurrence_type?: "nenhuma" | "diaria" | "semanal" | "mensal" | "anual";
    recurrence_until?: string | null;
  }) {
    const isRecurring = data.is_recurring ? 1 : 0;
    const recurrenceType = data.recurrence_type || "nenhuma";
    const recurrenceUntil = data.recurrence_until || null;

    const stmt = this.db.prepare(
      `INSERT INTO transactions (
        description,
        amount,
        type,
        category_id,
        date,
        is_recurring,
        recurrence_type,
        recurrence_until
      ) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      data.description,
      data.amount,
      data.type,
      data.category_id,
      data.date,
      isRecurring,
      recurrenceType,
      recurrenceUntil
    );
    return this.getById(Number(result.lastInsertRowid));
  }

  // Atualizar transação
  update(
    id: number,
    data: Partial<{
      description: string;
      amount: number;
      type: "entrada" | "saida";
      category_id: number;
      date: string;
      is_recurring: boolean;
      recurrence_type: "nenhuma" | "diaria" | "semanal" | "mensal" | "anual";
      recurrence_until: string | null;
    }>
  ) {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.description !== undefined) {
      updates.push("description = ?");
      values.push(data.description);
    }
    if (data.is_recurring !== undefined) {
      updates.push("is_recurring = ?");
      values.push(data.is_recurring ? 1 : 0);
    }
    if (data.recurrence_type !== undefined) {
      updates.push("recurrence_type = ?");
      values.push(data.recurrence_type);
    }
    if (data.recurrence_until !== undefined) {
      updates.push("recurrence_until = ?");
      values.push(data.recurrence_until);
    }
    if (data.amount !== undefined) {
      updates.push("amount = ?");
      values.push(data.amount);
    }
    if (data.type !== undefined) {
      updates.push("type = ?");
      values.push(data.type);
    }
    if (data.category_id !== undefined) {
      updates.push("category_id = ?");
      values.push(data.category_id);
    }
    if (data.date !== undefined) {
      updates.push("date = ?");
      values.push(data.date);
    }

    if (updates.length === 0) return this.getById(id);

    values.push(id);
    const stmt = this.db.prepare(
      `UPDATE transactions SET ${updates.join(", ")} WHERE id = ?`
    );
    stmt.run(...values);
    return this.getById(id);
  }

  // Deletar transação
  delete(id: number) {
    this.db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
    return { message: "Transação deletada com sucesso" };
  }
}

export class CategoryController {
  constructor(private db: Database) {}

  // Listar todas as categorias
  getAll() {
    const categories = this.db
      .prepare("SELECT * FROM categories ORDER BY name ASC")
      .all();
    return categories;
  }

  // Obter categoria por ID
  getById(id: number) {
    const category = this.db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(id);
    return category;
  }

  // Criar categoria
  create(data: { name: string; icon?: string; color?: string }) {
    const stmt = this.db.prepare(
      "INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)"
    );
    const result = stmt.run(data.name, data.icon || "📌", data.color || "#6b7280");
    return this.getById(Number(result.lastInsertRowid));
  }

  // Atualizar categoria
  update(
    id: number,
    data: Partial<{ name: string; icon: string; color: string }>
  ) {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      values.push(data.name);
    }
    if (data.icon !== undefined) {
      updates.push("icon = ?");
      values.push(data.icon);
    }
    if (data.color !== undefined) {
      updates.push("color = ?");
      values.push(data.color);
    }

    if (updates.length === 0) return this.getById(id);

    values.push(id);
    const stmt = this.db.prepare(
      `UPDATE categories SET ${updates.join(", ")} WHERE id = ?`
    );
    stmt.run(...values);
    return this.getById(id);
  }

  // Deletar categoria
  delete(id: number) {
    this.db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    return { message: "Categoria deletada com sucesso" };
  }
}
