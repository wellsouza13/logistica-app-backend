import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Tipagem temporária para resolver o erro do Prisma
const prismaClient = prisma as any;

export const registrarEntrada = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const { estoqueId, quantidade, motivo, observacao } = req.body;

    if (!estoqueId || !quantidade || !motivo) {
      res.status(400).json({ 
        success: false, 
        message: 'estoqueId, quantidade e motivo são obrigatórios' 
      });
      return;
    }

    // Verificar se o item existe
    const itemEstoque = await prismaClient.estoque.findUnique({
      where: { id: parseInt(estoqueId) },
    });

    if (!itemEstoque) {
      res.status(404).json({ success: false, message: 'Item de estoque não encontrado' });
      return;
    }

    // Registrar a movimentação
    const movimentacao = await prismaClient.movimentacaoEstoque.create({
      data: {
        estoqueId: parseInt(estoqueId),
        tipo: 'ENTRADA',
        quantidade,
        motivo,
        observacao,
        responsavelId: user.id,
      },
    });

    // Atualizar a quantidade no estoque
    await prismaClient.estoque.update({
      where: { id: parseInt(estoqueId) },
      data: {
        quantidade: itemEstoque.quantidade + quantidade,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Entrada registrada com sucesso!',
      movimentacao,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};

export const registrarSaida = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const { estoqueId, quantidade, motivo, observacao } = req.body;

    if (!estoqueId || !quantidade || !motivo) {
      res.status(400).json({ 
        success: false, 
        message: 'estoqueId, quantidade e motivo são obrigatórios' 
      });
      return;
    }

    // Verificar se o item existe
    const itemEstoque = await prismaClient.estoque.findUnique({
      where: { id: parseInt(estoqueId) },
    });

    if (!itemEstoque) {
      res.status(404).json({ success: false, message: 'Item de estoque não encontrado' });
      return;
    }

    // Verificar se há estoque suficiente
    if (itemEstoque.quantidade < quantidade) {
      res.status(400).json({ 
        success: false, 
        message: `Estoque insuficiente. Disponível: ${itemEstoque.quantidade} ${itemEstoque.unidade}` 
      });
      return;
    }

    // Registrar a movimentação
    const movimentacao = await prismaClient.movimentacaoEstoque.create({
      data: {
        estoqueId: parseInt(estoqueId),
        tipo: 'SAIDA',
        quantidade,
        motivo,
        observacao,
        responsavelId: user.id,
      },
    });

    // Atualizar a quantidade no estoque
    await prismaClient.estoque.update({
      where: { id: parseInt(estoqueId) },
      data: {
        quantidade: itemEstoque.quantidade - quantidade,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Saída registrada com sucesso!',
      movimentacao,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};

export const listarMovimentacoes = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const { estoqueId, tipo, dataInicio, dataFim } = req.query;

    let whereClause: any = {};

    if (estoqueId) {
      whereClause.estoqueId = parseInt(estoqueId as string);
    }

    if (tipo) {
      whereClause.tipo = tipo;
    }

    if (dataInicio || dataFim) {
      whereClause.dataMovimentacao = {};
      if (dataInicio) {
        whereClause.dataMovimentacao.gte = new Date(dataInicio as string);
      }
      if (dataFim) {
        whereClause.dataMovimentacao.lte = new Date(dataFim as string);
      }
    }

    const movimentacoes = await prismaClient.movimentacaoEstoque.findMany({
      where: whereClause,
      include: {
        estoque: true,
        responsavel: {
          select: {
            id: true,
            matricula: true,
          },
        },
      },
      orderBy: {
        dataMovimentacao: 'desc',
      },
    });

    res.json({
      success: true,
      movimentacoes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};

export const buscarMovimentacao = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const { id } = req.params;

    const movimentacao = await prismaClient.movimentacaoEstoque.findUnique({
      where: { id: parseInt(id) },
      include: {
        estoque: true,
        responsavel: {
          select: {
            id: true,
            matricula: true,
          },
        },
      },
    });

    if (!movimentacao) {
      res.status(404).json({ success: false, message: 'Movimentação não encontrada' });
      return;
    }

    res.json({
      success: true,
      movimentacao,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};

export const relatorioEstoque = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    // Buscar todos os itens com suas movimentações
    const estoque = await prismaClient.estoque.findMany({
      include: {
        movimentacoes: {
          orderBy: {
            dataMovimentacao: 'desc',
          },
          take: 5, // Últimas 5 movimentações
        },
      },
      orderBy: {
        produto: 'asc',
      },
    });

    // Calcular estatísticas
    const totalItens = estoque.length;
    const itensComEstoque = estoque.filter((item: any) => item.quantidade > 0).length;
    const itensSemEstoque = totalItens - itensComEstoque;

    res.json({
      success: true,
      relatorio: {
        totalItens,
        itensComEstoque,
        itensSemEstoque,
        estoque,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
}; 