import { createAuthenticatedClient } from "../config/supabase";

export class TransactionController {
  private supabase: ReturnType<typeof createAuthenticatedClient>;

  constructor(token: string) {
    this.supabase = createAuthenticatedClient(token);
  }

  // Listar todas as transações
  async getAll() {
    const { data, error } = await this.supabase
      .from("transactions")
      .select(`
        *,
        category:categories(id, name, icon, color)
      `)
      .order("date", { ascending: false });

    if (error) {
      console.error("Erro ao listar transações:", error);
      throw error;
    }

    // Transformar para formato esperado
    return data.map(t => ({
      ...t,
      category_id: t.category?.id,
      category_name: t.category?.name,
      category_icon: t.category?.icon,
    }));
  }

  // Listar transações por categoria
  async getByCategory(categoryId: number) {
    const { data, error } = await this.supabase
      .from("transactions")
      .select(`
        *,
        category:categories(id, name, icon, color)
      `)
      .eq("category_id", categoryId)
      .order("date", { ascending: false });

    if (error) throw error;

    return data.map(t => ({
      ...t,
      category_id: t.category?.id,
      category_name: t.category?.name,
      category_icon: t.category?.icon,
    }));
  }

  // Listar transações por tipo
  async getByType(type: string) {
    const { data, error } = await this.supabase
      .from("transactions")
      .select(`
        *,
        category:categories(id, name, icon, color)
      `)
      .eq("type", type)
      .order("date", { ascending: false });

    if (error) throw error;

    return data.map(t => ({
      ...t,
      category_id: t.category?.id,
      category_name: t.category?.name,
      category_icon: t.category?.icon,
    }));
  }

  // Obter uma transação por ID
  async getById(id: number) {
    const { data, error } = await this.supabase
      .from("transactions")
      .select(`
        *,
        category:categories(id, name, icon, color)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    return {
      ...data,
      category_id: data.category?.id,
      category_name: data.category?.name,
      category_icon: data.category?.icon,
    };
  }

  // Criar nova transação
  async create(transaction: {
    description: string;
    amount: number;
    type: "entrada" | "saida";
    category_id: number;
    date: string;
    is_recurring?: boolean;
    recurrence_type?: "nenhuma" | "diaria" | "semanal" | "mensal" | "anual";
    recurrence_until?: string | null;
    user_id: string;
  }) {
    const { data, error } = await this.supabase
      .from("transactions")
      .insert([transaction])
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar transação:", error);
      throw error;
    }

    return this.getById(data.id);
  }

  // Atualizar transação
  async update(
    id: number,
    updates: Partial<{
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
    const { error } = await this.supabase
      .from("transactions")
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    return this.getById(id);
  }

  // Deletar transação
  async delete(id: number) {
    const { error } = await this.supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return { message: "Transação deletada com sucesso" };
  }
}

export class CategoryController {
  private supabase: ReturnType<typeof createAuthenticatedClient>;

  constructor(token: string) {
    this.supabase = createAuthenticatedClient(token);
  }

  // Listar todas as categorias
  async getAll() {
    const { data, error } = await this.supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Erro ao listar categorias:", error);
      throw error;
    }

    return data;
  }

  // Obter categoria por ID
  async getById(id: number) {
    const { data, error } = await this.supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return data;
  }

  // Criar categoria
  async create(category: { name: string; icon?: string; color?: string; user_id: string }) {
    const { data, error } = await this.supabase
      .from("categories")
      .insert([
        {
          name: category.name,
          icon: category.icon || "📌",
          color: category.color || "#6b7280",
          user_id: category.user_id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar categoria:", error);
      throw error;
    }

    return data;
  }

  // Atualizar categoria
  async update(
    id: number,
    updates: Partial<{ name: string; icon: string; color: string }>
  ) {
    const { error } = await this.supabase
      .from("categories")
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    return this.getById(id);
  }

  // Deletar categoria
  async delete(id: number) {
    const { error } = await this.supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return { message: "Categoria deletada com sucesso" };
  }
}
