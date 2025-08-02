import { Router } from 'express';
import { 
  registrarVenda, 
  listarVendas, 
  buscarVenda, 
  atualizarStatusVenda 
} from '../controllers/venda.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

// ✅ Proteger com JWT!
router.post('/', verificarToken, registrarVenda);
router.get('/', verificarToken, listarVendas);
router.get('/:id', verificarToken, buscarVenda);
router.patch('/:id/status', verificarToken, atualizarStatusVenda);

export default router; 