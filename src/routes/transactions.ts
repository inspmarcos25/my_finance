import { Elysia, t } from "elysia";
import { TransactionController } from "../controllers";

export default (app: Elysia) =>
  app.group("/api/transactions", (app) =>
    app
      .get("/", ({ db }) => {
        const controller = new TransactionController(db);
        return controller.getAll();
      })
      .get("/:id", ({ db, params: { id } }) => {
        const controller = new TransactionController(db);
        return controller.getById(Number(id));
      })
      .get("/category/:categoryId", ({ db, params: { categoryId } }) => {
        const controller = new TransactionController(db);
        return controller.getByCategory(Number(categoryId));
      })
      .get("/type/:type", ({ db, params: { type } }) => {
        const controller = new TransactionController(db);
        return controller.getByType(type);
      })
      .post(
        "/",
        ({ db, body }: any) => {
          const controller = new TransactionController(db);
          return controller.create(body);
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
        ({ db, params: { id }, body }: any) => {
          const controller = new TransactionController(db);
          return controller.update(Number(id), body);
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
      .delete("/:id", ({ db, params: { id } }) => {
        const controller = new TransactionController(db);
        return controller.delete(Number(id));
      })
  );
