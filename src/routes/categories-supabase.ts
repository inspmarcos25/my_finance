import { Elysia, t } from "elysia";
import { CategoryController } from "../controllers/supabase-controllers";
import { supabase } from "../config/supabase";

// Helper para validar token via Supabase e extrair user_id de forma confiável
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
  app.group("/api/categories", (app) =>
    app
      .get("/", async ({ headers }: any) => {
        const { token } = await validateAuth(headers);
        if (!token) return { error: "Não autenticado" };
        
        const controller = new CategoryController(token);
        return await controller.getAll();
      })
      .get("/:id", async ({ params: { id }, headers }: any) => {
        const { token } = await validateAuth(headers);
        if (!token) return { error: "Não autenticado" };
        
        const controller = new CategoryController(token);
        return await controller.getById(Number(id));
      })
      .post(
        "/",
        async ({ body, headers }: any) => {
          const { token, userId } = await validateAuth(headers);
          if (!token || !userId) return { error: "Não autenticado" };
          
          const controller = new CategoryController(token);
          return await controller.create({ ...body, user_id: userId });
        },
        {
          body: t.Object({
            name: t.String(),
            icon: t.Optional(t.String()),
            color: t.Optional(t.String()),
          }),
        }
      )
      .put(
        "/:id",
        async ({ params: { id }, body, headers }: any) => {
          const { token } = await validateAuth(headers);
          if (!token) return { error: "Não autenticado" };
          
          const controller = new CategoryController(token);
          return await controller.update(Number(id), body);
        },
        {
          body: t.Partial(
            t.Object({
              name: t.String(),
              icon: t.String(),
              color: t.String(),
            })
          ),
        }
      )
      .delete("/:id", async ({ params: { id }, headers }: any) => {
        const { token } = await validateAuth(headers);
        if (!token) return { error: "Não autenticado" };
        
        const controller = new CategoryController(token);
        return await controller.delete(Number(id));
      })
  );
