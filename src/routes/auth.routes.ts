// src/routes/auth.routes.ts

import { Router } from 'express';
import { login, register } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register); // ✅ Correto!
router.post('/login', login);

export default router;
