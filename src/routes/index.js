// src/routes/index.js
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import receitaRoutes from './receita.routes.js';

const router = Router();

// Healthcheck (público)
router.get('/status', (_req, res) => res.json({ ok: true }));

// Agrupa rotas de domínio
router.use(authRoutes);
router.use(receitaRoutes);

export default router;

