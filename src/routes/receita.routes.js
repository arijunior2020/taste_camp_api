import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import {
  listPublic,
  listMine,
  getOne,
  createOne,
  deleteOne,
} from '../controllers/receita.controller.js';

const router = Router();

// Público (opcional)
router.get('/receitas', listPublic);

// Protegidas
router.use(auth); // Apply auth middleware to all protected routes
router.get('/me/receitas', listMine);
router.get('/receitas/:id', getOne);
router.post('/receitas', createOne);
router.delete('/receitas/:id', deleteOne);

export default router;
