import { Elysia, t } from "elysia";
import { TransactionController } from "../controllers/supabase-controllers";

// Helper para extrair token e user_id
function extractTokenAndUserId(headers: any) {
  const authHeader = headers.authorization || headers.Authorization;
  let token = null;
  let userId = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '');
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      userId = decoded.sub;
    } catch (e) {
      console.error('Erro ao decodificar token:', e);
    }
  }
  
  return { token, userId };
}

export default (app: Elysia) =>
  app.group("/api/transactions", (app) =>
    app
      .get("/", async ({ headers }: any) => {
        const { token } = extractTokenAndUserId(headers);
        if (!token) return { error: "Não autenticado" };
        
        const controller = new TransactionController(token);
        return await controller.getAll();
      })
      .get("/:id", async ({ params: { id }, headers }: any) => {
        const { token } = extractTokenAndUserId(headers);
        if (!token) return { error: "Não autenticado" };
        
        const controller = new TransactionController(token);
        return await controller.getById(Number(id));
      })
      .post(
        "/",
        async ({ body, headers }: any) => {
          const { token, userId } = extractTokenAndUserId(headers);
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
          }),
        }
      )
      .put(
        "/:id",
        async ({ params: { id }, body, headers }: any) => {
          const { token } = extractTokenAndUserId(headers);
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
            })
          ),
        }
      )
      .delete("/:id", async ({ params: { id }, headers }: any) => {
        const { token } = extractTokenAndUserId(headers);
        if (!token) return { error: "Não autenticado" };
        
        const controller = new TransactionController(token);
        return await controller.delete(Number(id));
      })
  );
