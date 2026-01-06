import { Elysia } from "elysia";
import transactionRoutes from "./routes/transactions-supabase";
import categoryRoutes from "./routes/categories-supabase";
import dashboardRoutes from "./routes/dashboard-supabase";

// Criar aplicação
const app = new Elysia()
  // Servir arquivos estáticos (frontend)
  .get("/", () => Bun.file("./public/index.html"))
  .get("/login.html", () => Bun.file("./public/login.html"))
  .get("/style.css", () => Bun.file("./public/style.css"))
  .get("/login.css", () => Bun.file("./public/login.css"))
  .get("/script.js", () => Bun.file("./public/script.js"))
  .get("/login.js", () => Bun.file("./public/login.js"))
  
  // Rotas da API
  .use(transactionRoutes)
  .use(categoryRoutes)
  .use(dashboardRoutes)
  
  // Health check
  .get("/api/health", () => ({ status: "ok", database: "supabase" }))
  
  .listen(3000);

console.log(' Servidor rodando em http://localhost:3000');
console.log(' Usando Supabase como banco de dados com autenticação');
