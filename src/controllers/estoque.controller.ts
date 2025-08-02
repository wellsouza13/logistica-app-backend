import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Tipagem temporária para resolver o erro do Prisma
const prismaClient = prisma as any;

export const criarItemEstoque = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const { produto, quantidade, unidade, localizacao } = req.body;

    if (!produto || !quantidade || !unidade) {
      res.status(400).json({ 
        success: false, 
        message: 'produto, quantidade e unidade são obrigatórios' 
      });
      return;
    }

    const itemEstoque = await prismaClient.estoque.create({
      data: {
        produto,
        quantidade,
        unidade,
        localizacao,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Item de estoque criado com sucesso!',
      item: itemEstoque,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};

export const listarEstoque = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const estoque = await prismaClient.estoque.findMany({
      orderBy: {
        criadoEm: 'desc',
      },
    });

    res.json({
      success: true,
      estoque,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};

export const atualizarItemEstoque = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const { id } = req.params;
    const { produto, quantidade, unidade, localizacao } = req.body;

    if (!produto || !quantidade || !unidade) {
      res.status(400).json({ 
        success: false, 
        message: 'produto, quantidade e unidade são obrigatórios' 
      });
      return;
    }

    const itemEstoque = await prismaClient.estoque.update({
      where: { id: parseInt(id) },
      data: {
        produto,
        quantidade,
        unidade,
        localizacao,
      },
    });

    res.json({
      success: true,
      message: 'Item de estoque atualizado com sucesso!',
      item: itemEstoque,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};

export const deletarItemEstoque = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const { id } = req.params;

    await prismaClient.estoque.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: 'Item de estoque deletado com sucesso!',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};

export const buscarItemEstoque = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const { id } = req.params;

    const itemEstoque = await prismaClient.estoque.findUnique({
      where: { id: parseInt(id) },
    });

    if (!itemEstoque) {
      res.status(404).json({ success: false, message: 'Item não encontrado' });
      return;
    }

    res.json({
      success: true,
      item: itemEstoque,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
}; 