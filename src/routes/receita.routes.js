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
router.get('/me/receitas', auth, listMine);
router.get('/receitas/:id', auth, getOne);
router.post('/receitas', auth, createOne);
router.delete('/receitas/:id', auth, deleteOne);

export default router;
