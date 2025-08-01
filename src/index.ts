import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import fluxoRoutes from './routes/fluxo.routes';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Swagger Docs em /docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/fluxo', fluxoRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📚 Swagger Docs: http://localhost:${PORT}/docs`);
});
