import { Elysia, t } from "elysia";
import { CategoryController } from "../controllers";

const enableSqliteRoutes = process.env.ENABLE_SQLITE_ROUTES === "true";

export default (app: Elysia) => {
  if (!enableSqliteRoutes) return app;

  return app.group("/api/categories", (app) =>
    app
      .get("/", ({ db }) => {
        const controller = new CategoryController(db);
        return controller.getAll();
      })
      .get("/:id", ({ db, params: { id } }) => {
        const controller = new CategoryController(db);
        return controller.getById(Number(id));
      })
      .post(
        "/",
        ({ db, body }: any) => {
          const controller = new CategoryController(db);
          return controller.create(body);
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
        ({ db, params: { id }, body }: any) => {
          const controller = new CategoryController(db);
          return controller.update(Number(id), body);
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
      .delete("/:id", ({ db, params: { id } }) => {
        const controller = new CategoryController(db);
        return controller.delete(Number(id));
      })
  );
};
