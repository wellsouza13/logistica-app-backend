import { Router } from 'express';
import { 
  relatorioGeral, 
  relatorioVendas, 
  relatorioEntregas, 
  relatorioUsuarios 
} from '../controllers/relatorio.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

// ✅ Proteger com JWT!
router.get('/geral', verificarToken, relatorioGeral);
router.get('/vendas', verificarToken, relatorioVendas);
router.get('/entregas', verificarToken, relatorioEntregas);
router.get('/usuarios', verificarToken, relatorioUsuarios);

export default router; 