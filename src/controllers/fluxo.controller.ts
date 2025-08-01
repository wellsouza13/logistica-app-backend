import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const iniciarFluxo = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Não autorizado' });
    }

    const { veiculoId } = req.body;

    if (!veiculoId) {
      return res.status(400).json({ success: false, message: 'veiculoId é obrigatório' });
    }

    const fluxo = await prisma.fluxo.create({
      data: {
        motoristaId: user.id,
        veiculoId,
      },
    });

    return res.json({
      success: true,
      message: 'Fluxo iniciado com sucesso!',
      fluxoId: fluxo.id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};

export const listarFluxos = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Não autorizado' });
    }

    const fluxos = await prisma.fluxo.findMany({
      where: { motoristaId: user.id },
      include: {
        veiculo: true, // opcional: incluir os dados do veículo
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({
      success: true,
      fluxos,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};
