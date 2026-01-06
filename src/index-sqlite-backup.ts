import { Elysia } from "elysia";
import { Database } from "bun:sqlite";
import { initDatabase } from "./models/database";
import transactionRoutes from "./routes/transactions";
import categoryRoutes from "./routes/categories";
import dashboardRoutes from "./routes/dashboard";

// Inicializar banco de dados
const db = new Database("./expense-tracker.db");
initDatabase(db);

// Criar aplicação
const app = new Elysia()
  .decorate("db", db)
  // Servir arquivos estáticos (frontend)
  .get("/", ({ request }) => Bun.file("./public/index.html"))
  .get("/style.css", () => Bun.file("./public/style.css"))
  .get("/script.js", () => Bun.file("./public/script.js"))
  
  // Rotas da API
  .use(transactionRoutes)
  .use(categoryRoutes)
  .use(dashboardRoutes)
  
  // Health check
  .get("/api/health", () => ({ status: "ok" }))
  
  .listen(3000);

console.log(`🎉 Servidor rodando em http://localhost:3000`);
