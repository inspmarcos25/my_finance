import type { Database } from "bun:sqlite";

export function initDatabase(db: Database) {
  // Criar tabela de categorias
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#3b82f6',
      icon TEXT DEFAULT '💰',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Criar tabela de transações
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('entrada', 'saida')),
      category_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      is_recurring INTEGER DEFAULT 0,
      recurrence_type TEXT NOT NULL DEFAULT 'nenhuma' CHECK(recurrence_type IN ('nenhuma','diaria','semanal','mensal','anual')),
      recurrence_until TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // Migration helper: add recurrence columns when updating an existing DB
  try {
    db.exec("ALTER TABLE transactions ADD COLUMN is_recurring INTEGER DEFAULT 0");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE transactions ADD COLUMN recurrence_type TEXT NOT NULL DEFAULT 'nenhuma' CHECK(recurrence_type IN ('nenhuma','diaria','semanal','mensal','anual'))");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE transactions ADD COLUMN recurrence_until TEXT");
  } catch (e) {}

  // Inserir categorias padrão
  const defaultCategories = [
    { name: "Alimentação", icon: "🍽️", color: "#f59e0b" },
    { name: "Transporte", icon: "🚗", color: "#ef4444" },
    { name: "Saúde", icon: "⚕️", color: "#10b981" },
    { name: "Lazer", icon: "🎬", color: "#8b5cf6" },
    { name: "Trabalho", icon: "💼", color: "#3b82f6" },
    { name: "Educação", icon: "📚", color: "#06b6d4" },
    { name: "Moradia", icon: "🏠", color: "#ec4899" },
    { name: "Outros", icon: "📌", color: "#6b7280" },
  ];

  for (const cat of defaultCategories) {
    try {
      db.prepare(
        "INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)"
      ).run(cat.name, cat.icon, cat.color);
    } catch (e) {
      // Categoria já existe, ignorar
    }
  }
}

export function getDb(): Database {
  return new (require("bun:sqlite").Database)("./expense-tracker.db");
}
