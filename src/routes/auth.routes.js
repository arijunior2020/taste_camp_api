import { Router } from 'express';
import { signUp, signIn, signOut } from '../controllers/auth.controller.js';
import { auth } from '../middlewares/auth.js';

const router = Router();

router.post('/sign-up', signUp);
router.post('/sign-in', signIn);
router.post('/sign-out', auth, signOut);

export default router;
