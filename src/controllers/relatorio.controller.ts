import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Tipagem temporária para resolver o erro do Prisma
const prismaClient = prisma as any;

export const relatorioGeral = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    // Buscar dados para o dashboard
    const [
      totalVendas,
      totalEntregas,
      itensEstoque,
      usuariosAtivos,
      vendasMes,
      entregasStatus,
      produtosMaisVendidos
    ] = await Promise.all([
      // Total de vendas
      prismaClient.venda.count(),
      
      // Total de entregas
      prismaClient.entrega.count(),
      
      // Itens em estoque
      prismaClient.estoque.count(),
      
      // Usuários ativos
      prismaClient.user.count({ where: { ativo: true } }),
      
      // Receita mensal
      prismaClient.venda.aggregate({
        where: {
          dataVenda: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          },
          status: 'aprovada'
        },
        _sum: { total: true }
      }),
      
      // Entregas por status
      prismaClient.entrega.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      
      // Produtos mais vendidos
      prismaClient.vendaItem.groupBy({
        by: ['estoqueId'],
        _sum: { quantidade: true },
        orderBy: { _sum: { quantidade: 'desc' } },
        take: 5
      })
    ]);

    // Calcular receita mensal
    const receitaMensal = vendasMes._sum.total || 0;

    // Processar entregas por status
    const entregasPorStatus = entregasStatus.reduce((acc: any, item: any) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});

    // Buscar detalhes dos produtos mais vendidos
    const produtosDetalhes = await Promise.all(
      produtosMaisVendidos.map(async (item: any) => {
        const estoque = await prismaClient.estoque.findUnique({
          where: { id: item.estoqueId }
        });
        return {
          produto: estoque?.produto || 'Produto não encontrado',
          quantidade: item._sum.quantidade,
          receita: 0 // Seria calculado com preços
        };
      })
    );

    res.json({
      success: true,
      relatorio: {
        totalVendas,
        totalEntregas,
        itensEstoque,
        usuariosAtivos,
        receitaMensal: Number(receitaMensal),
        produtosMaisVendidos: produtosDetalhes,
        entregasPorStatus
      }
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};

export const relatorioVendas = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const { periodo, vendedor } = req.query;

    let whereClause: any = {};

    if (periodo) {
      const [ano, mes] = (periodo as string).split('-');
      whereClause.dataVenda = {
        gte: new Date(parseInt(ano), parseInt(mes) - 1, 1),
        lt: new Date(parseInt(ano), parseInt(mes), 1)
      };
    }

    if (vendedor) {
      whereClause.vendedorId = parseInt(vendedor as string);
    }

    // Vendas por período
    const vendasPorPeriodo = await prismaClient.venda.groupBy({
      by: ['dataVenda'],
      where: whereClause,
      _sum: { total: true },
      _count: { id: true },
      orderBy: { dataVenda: 'asc' }
    });

    // Produtos mais vendidos
    const produtosMaisVendidos = await prismaClient.vendaItem.groupBy({
      by: ['estoqueId'],
      where: {
        venda: whereClause
      },
      _sum: { quantidade: true },
      orderBy: { _sum: { quantidade: 'desc' } },
      take: 5
    });

    // Vendedores top
    const vendedoresTop = await prismaClient.venda.groupBy({
      by: ['vendedorId'],
      where: whereClause,
      _count: { id: true },
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5
    });

    // Receita por mês (últimos 6 meses)
    const receitaPorMes = await prismaClient.venda.groupBy({
      by: ['dataVenda'],
      where: {
        dataVenda: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1)
        }
      },
      _sum: { total: true },
      orderBy: { dataVenda: 'asc' }
    });

    // Buscar detalhes dos vendedores
    const vendedoresDetalhes = await Promise.all(
      vendedoresTop.map(async (vendedor: any) => {
        const user = await prismaClient.user.findUnique({
          where: { id: vendedor.vendedorId }
        });
        return {
          vendedor: user?.nome || `Vendedor ${vendedor.vendedorId}`,
          vendas: vendedor._count.id,
          receita: Number(vendedor._sum.total || 0)
        };
      })
    );

    // Buscar detalhes dos produtos
    const produtosDetalhes = await Promise.all(
      produtosMaisVendidos.map(async (item: any) => {
        const estoque = await prismaClient.estoque.findUnique({
          where: { id: item.estoqueId }
        });
        return {
          produto: estoque?.produto || 'Produto não encontrado',
          quantidade: item._sum.quantidade,
          receita: 0 // Seria calculado com preços
        };
      })
    );

    res.json({
      success: true,
      relatorio: {
        vendasPorPeriodo: vendasPorPeriodo.map((venda: any) => ({
          data: venda.dataVenda.toISOString().split('T')[0],
          quantidade: venda._count.id,
          receita: Number(venda._sum.total || 0)
        })),
        produtosMaisVendidos: produtosDetalhes,
        vendedoresTop: vendedoresDetalhes,
        receitaPorMes: receitaPorMes.map((mes: any) => ({
          mes: mes.dataVenda.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          receita: Number(mes._sum.total || 0)
        }))
      }
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};

export const relatorioEntregas = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const { status, motorista } = req.query;

    let whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (motorista) {
      whereClause.motoristaId = parseInt(motorista as string);
    }

    // Entregas por status
    const entregasPorStatus = await prismaClient.entrega.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    // Entregas por região
    const entregasPorRegiao = await prismaClient.entrega.groupBy({
      by: ['regiao'],
      where: { regiao: { not: null } },
      _count: { id: true }
    });

    // Motoristas top
    const motoristasTop = await prismaClient.entrega.groupBy({
      by: ['motoristaId'],
      _count: { id: true },
      _avg: { avaliacao: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    // Calcular tempo médio de entrega
    const entregasCompletadas = await prismaClient.entrega.findMany({
      where: {
        status: 'entregue',
        dataEntrega: { not: null }
      },
      select: {
        criadoEm: true,
        dataEntrega: true
      }
    });

    const tempoMedio = entregasCompletadas.length > 0 
      ? entregasCompletadas.reduce((acc: number, entrega: any) => {
          const diff = entrega.dataEntrega!.getTime() - entrega.criadoEm.getTime();
          return acc + (diff / (1000 * 60 * 60 * 24)); // Converter para dias
        }, 0) / entregasCompletadas.length
      : 0;

    // Buscar detalhes dos motoristas
    const motoristasDetalhes = await Promise.all(
      motoristasTop.map(async (motorista: any) => {
        const user = await prismaClient.user.findUnique({
          where: { id: motorista.motoristaId }
        });
        return {
          motorista: user?.nome || `Motorista ${motorista.motoristaId}`,
          entregas: motorista._count.id,
          avaliacao: motorista._avg.avaliacao || 0
        };
      })
    );

    // Processar entregas por status
    const statusProcessado = entregasPorStatus.reduce((acc: any, item: any) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});

    // Processar entregas por região
    const regioesProcessadas = entregasPorRegiao.map((regiao: any) => ({
      regiao: regiao.regiao,
      quantidade: regiao._count.id,
      tempoMedio: "1.8 dias" // Seria calculado com dados reais
    }));

    res.json({
      success: true,
      relatorio: {
        entregasPorStatus: statusProcessado,
        tempoMedioEntrega: `${tempoMedio.toFixed(1)} dias`,
        entregasPorRegiao: regioesProcessadas,
        motoristasTop: motoristasDetalhes
      }
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};

export const relatorioUsuarios = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    // Estatísticas gerais
    const [totalUsuarios, usuariosAtivos, usuariosPorCargo, usuariosRecentes] = await Promise.all([
      // Total de usuários
      prismaClient.user.count(),
      
      // Usuários ativos
      prismaClient.user.count({ where: { ativo: true } }),
      
      // Usuários por cargo
      prismaClient.user.groupBy({
        by: ['cargo'],
        _count: { id: true }
      }),
      
      // Usuários recentes
      prismaClient.user.findMany({
        where: {
          criadoEm: {
            gte: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 dias
          }
        },
        orderBy: { criadoEm: 'desc' },
        take: 5,
        select: {
          nome: true,
          cargo: true,
          criadoEm: true
        }
      })
    ]);

    // Processar usuários por cargo
    const cargoProcessado = usuariosPorCargo.reduce((acc: any, item: any) => {
      acc[item.cargo] = item._count.id;
      return acc;
    }, {});

    // Processar usuários recentes
    const recentesProcessados = usuariosRecentes.map((usuario: any) => ({
      nome: usuario.nome || `Usuário ${usuario.id}`,
      cargo: usuario.cargo,
      dataCadastro: usuario.criadoEm.toISOString().split('T')[0]
    }));

    res.json({
      success: true,
      relatorio: {
        totalUsuarios,
        usuariosAtivos,
        usuariosPorCargo: cargoProcessado,
        usuariosRecentes: recentesProcessados
      }
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
}; 