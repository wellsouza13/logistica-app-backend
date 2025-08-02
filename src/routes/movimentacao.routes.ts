import { Router } from 'express';
import { 
  registrarEntrada, 
  registrarSaida, 
  listarMovimentacoes, 
  buscarMovimentacao,
  relatorioEstoque
} from '../controllers/movimentacao.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

// ✅ Proteger com JWT!
router.post('/entrada', verificarToken, registrarEntrada);
router.post('/saida', verificarToken, registrarSaida);
router.get('/', verificarToken, listarMovimentacoes);
router.get('/:id', verificarToken, buscarMovimentacao);
router.get('/relatorio/estoque', verificarToken, relatorioEstoque);

export default router; 