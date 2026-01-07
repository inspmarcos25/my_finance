import { Elysia, t } from "elysia";
import { TransactionController } from "../controllers/supabase-controllers";
import { supabase } from "../config/supabase";

// Helper para validar token via Supabase e extrair user_id
async function validateAuth(headers: any) {
  const authHeader = headers.authorization || headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { token: null, userId: null };
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      console.error("Token inválido ou expirado:", error);
      return { token: null, userId: null };
    }
    return { token, userId: data.user.id };
  } catch (e) {
    console.error("Erro ao validar token:", e);
    return { token: null, userId: null };
  }
}

export default (app: Elysia) =>
  app.group("/api/transactions", (app) =>
    app
      .get("/", async ({ headers }: any) => {
        const { token } = await validateAuth(headers);
        if (!token) return { error: "Não autenticado" };
        
        const controller = new TransactionController(token);
        return await controller.getAll();
      })
      .get("/:id", async ({ params: { id }, headers }: any) => {
        const { token } = await validateAuth(headers);
        if (!token) return { error: "Não autenticado" };
        
        const controller = new TransactionController(token);
        return await controller.getById(Number(id));
      })
      .post(
        "/",
        async ({ body, headers }: any) => {
          const { token, userId } = await validateAuth(headers);
          if (!token || !userId) return { error: "Não autenticado" };
          
          const controller = new TransactionController(token);
          return await controller.create({ ...body, user_id: userId });
        },
        {
          body: t.Object({
            description: t.String(),
            amount: t.Number(),
            type: t.Union([t.Literal("entrada"), t.Literal("saida")]),
            category_id: t.Number(),
            date: t.String(),
            is_recurring: t.Optional(t.Boolean()),
            recurrence_type: t.Optional(
              t.Union([
                t.Literal("nenhuma"),
                t.Literal("diaria"),
                t.Literal("semanal"),
                t.Literal("mensal"),
                t.Literal("anual"),
              ])
            ),
            recurrence_until: t.Optional(t.Nullable(t.String())),
          }),
        }
      )
      .put(
        "/:id",
        async ({ params: { id }, body, headers }: any) => {
          const { token } = await validateAuth(headers);
          if (!token) return { error: "Não autenticado" };
          
          const controller = new TransactionController(token);
          return await controller.update(Number(id), body);
        },
        {
          body: t.Partial(
            t.Object({
              description: t.String(),
              amount: t.Number(),
              type: t.Union([t.Literal("entrada"), t.Literal("saida")]),
              category_id: t.Number(),
              date: t.String(),
              is_recurring: t.Boolean(),
              recurrence_type: t.Union([
                t.Literal("nenhuma"),
                t.Literal("diaria"),
                t.Literal("semanal"),
                t.Literal("mensal"),
                t.Literal("anual"),
              ]),
              recurrence_until: t.Nullable(t.String()),
            })
          ),
        }
      )
      .delete("/:id", async ({ params: { id }, headers }: any) => {
        const { token } = await validateAuth(headers);
        if (!token) return { error: "Não autenticado" };
        
        const controller = new TransactionController(token);
        return await controller.delete(Number(id));
      })
  );
