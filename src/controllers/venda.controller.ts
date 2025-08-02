import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Tipagem temporária para resolver o erro do Prisma
const prismaClient = prisma as any;

export const registrarVenda = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const { clienteId, observacao, itens } = req.body;

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      res.status(400).json({ 
        success: false, 
        message: 'Itens da venda são obrigatórios' 
      });
      return;
    }

    // Validar itens
    for (const item of itens) {
      if (!item.estoqueId || !item.quantidade || !item.precoUnitario) {
        res.status(400).json({ 
          success: false, 
          message: 'estoqueId, quantidade e precoUnitario são obrigatórios para cada item' 
        });
        return;
      }

      // Verificar se o item existe no estoque
      const estoque = await prismaClient.estoque.findUnique({
        where: { id: item.estoqueId }
      });

      if (!estoque) {
        res.status(404).json({ 
          success: false, 
          message: `Item de estoque ${item.estoqueId} não encontrado` 
        });
        return;
      }

      // Verificar se há estoque suficiente
      if (estoque.quantidade < item.quantidade) {
        res.status(400).json({ 
          success: false, 
          message: `Estoque insuficiente para ${estoque.produto}. Disponível: ${estoque.quantidade} ${estoque.unidade}` 
        });
        return;
      }
    }

    // Calcular total da venda
    let totalVenda = 0;
    for (const item of itens) {
      totalVenda += Number(item.precoUnitario) * item.quantidade;
    }

    // Criar venda com itens
    const venda = await prismaClient.venda.create({
      data: {
        clienteId: clienteId || null,
        vendedorId: user.id,
        total: totalVenda,
        observacao,
        itens: {
          create: itens.map((item: any) => ({
            estoqueId: item.estoqueId,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            subtotal: Number(item.precoUnitario) * item.quantidade
          }))
        }
      },
      include: {
        itens: {
          include: {
            estoque: {
              select: {
                id: true,
                produto: true,
                unidade: true
              }
            }
          }
        },
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        vendedor: {
          select: {
            id: true,
            nome: true,
            matricula: true
          }
        }
      }
    });

    // Atualizar estoque (diminuir quantidade)
    for (const item of itens) {
      await prismaClient.estoque.update({
        where: { id: item.estoqueId },
        data: {
          quantidade: {
            decrement: item.quantidade
          }
        }
      });
    }

    // Registrar movimentação de saída
    for (const item of itens) {
      await prismaClient.movimentacaoEstoque.create({
        data: {
          estoqueId: item.estoqueId,
          tipo: 'SAIDA',
          quantidade: item.quantidade,
          motivo: 'VENDA',
          observacao: `Venda #${venda.id}`,
          responsavelId: user.id
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Venda registrada com sucesso!',
      venda
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};

export const listarVendas = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const { dataInicio, dataFim, status, vendedorId, clienteId } = req.query;

    let whereClause: any = {};

    if (dataInicio || dataFim) {
      whereClause.dataVenda = {};
      if (dataInicio) {
        whereClause.dataVenda.gte = new Date(dataInicio as string);
      }
      if (dataFim) {
        whereClause.dataVenda.lte = new Date(dataFim as string);
      }
    }

    if (status) {
      whereClause.status = status;
    }

    if (vendedorId) {
      whereClause.vendedorId = parseInt(vendedorId as string);
    }

    if (clienteId) {
      whereClause.clienteId = parseInt(clienteId as string);
    }

    const vendas = await prismaClient.venda.findMany({
      where: whereClause,
      include: {
        itens: {
          include: {
            estoque: {
              select: {
                id: true,
                produto: true,
                unidade: true
              }
            }
          }
        },
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        vendedor: {
          select: {
            id: true,
            nome: true,
            matricula: true
          }
        }
      },
      orderBy: {
        dataVenda: 'desc'
      }
    });

    res.json({
      success: true,
      vendas
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};

export const buscarVenda = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const { id } = req.params;

    const venda = await prismaClient.venda.findUnique({
      where: { id: parseInt(id) },
      include: {
        itens: {
          include: {
            estoque: {
              select: {
                id: true,
                produto: true,
                unidade: true
              }
            }
          }
        },
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        vendedor: {
          select: {
            id: true,
            nome: true,
            matricula: true
          }
        }
      }
    });

    if (!venda) {
      res.status(404).json({ success: false, message: 'Venda não encontrada' });
      return;
    }

    res.json({
      success: true,
      venda
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};

export const atualizarStatusVenda = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pendente', 'aprovada', 'cancelada'].includes(status)) {
      res.status(400).json({ 
        success: false, 
        message: 'Status deve ser: pendente, aprovada ou cancelada' 
      });
      return;
    }

    const venda = await prismaClient.venda.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        itens: {
          include: {
            estoque: true
          }
        },
        cliente: true,
        vendedor: true
      }
    });

    res.json({
      success: true,
      message: 'Status da venda atualizado com sucesso!',
      venda
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
}; 