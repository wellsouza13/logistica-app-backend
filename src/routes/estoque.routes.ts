import { Router } from 'express';
import { 
  criarItemEstoque, 
  listarEstoque, 
  atualizarItemEstoque, 
  deletarItemEstoque, 
  buscarItemEstoque 
} from '../controllers/estoque.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

// ✅ Proteger com JWT!
router.post('/', verificarToken, criarItemEstoque);
router.get('/', verificarToken, listarEstoque);
router.get('/:id', verificarToken, buscarItemEstoque);
router.put('/:id', verificarToken, atualizarItemEstoque);
router.delete('/:id', verificarToken, deletarItemEstoque);

export default router; 