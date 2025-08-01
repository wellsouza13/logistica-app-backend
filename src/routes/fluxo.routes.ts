import { Router } from 'express';
import { iniciarFluxo } from '../controllers/fluxo.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

// ✅ Proteger com JWT!
router.post('/iniciar', verificarToken, iniciarFluxo);

export default router;
