import { Elysia } from "elysia";
import { supabase } from "../config/supabase";

// Middleware para extrair usuário autenticado
export const authMiddleware = (app: Elysia) =>
  app.derive(async ({ headers }) => {
    // Extrair token do header Authorization
    const authHeader = headers.authorization || headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, userId: null };
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      // Verificar token com Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return { user: null, userId: null };
      }

      return { user, userId: user.id };
    } catch (error) {
      console.error('Erro no middleware de autenticação:', error);
      return { user: null, userId: null };
    }
  });
