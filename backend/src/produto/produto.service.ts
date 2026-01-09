import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { PrismaService } from 'src/db/prisma.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ProdutoService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createProdutoDto: CreateProdutoDto) {
    return this.prismaService.produto.create({
      data: createProdutoDto,
      });
  }

  findAll() {
    return this.prismaService.produto.findMany({
      include: {
        _count: {
          select: {fila: true}
        }
      }
    });
  }

  findOne(id: number) {
    return this.prismaService.produto.findUnique({
      where: { id },
    });
  }

  update(id: number, updateProdutoDto: UpdateProdutoDto) {
    return this.prismaService.produto.update({
      where: { id },
      data: updateProdutoDto,
    });
  }

  remove(id: number) {
    return this.prismaService.produto.delete({
      where: { id },
    });
  }

  async reservaProduto(id: number, idUsuario: number) {
    const produto = await this.prismaService.produto.findUnique({
      where: { id },
    });

    if (!produto) { 
      throw new NotFoundException('Produto não encontrado');
    }

    if(produto.donoId) {
      throw new BadRequestException('Produto já está reservado');
    }

    const produtosDoUsuario = await this.prismaService.produto.count({
      where: { donoId: idUsuario },
    });

    if (produtosDoUsuario >= 3) {
      throw new BadRequestException('Limite de produtos reservados atingido');
    }

    const prazo = new Date();
    prazo.setMinutes(prazo.getMinutes() + 2);

    return this.prismaService.$transaction(async (tx) => {
      const produtoAtualizado = await tx.produto.update({
        where: { id },
        data: {
          donoId: idUsuario,
          reservadoEm: new Date(),
          prazoLimite: prazo,
        },
      });
      await tx.historico.create({
        data: {
          acao: 'RESERVA',
          produtoId: id,
          usuarioId: idUsuario,
        },
      });
      return produtoAtualizado;
    });
      
  }

  async cancelaReservaProduto(id: number, idUsuario: number) {
    const produto = await this.prismaService.produto.findUnique({
      where: { id },
    }); 
    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }
    if (produto.donoId !== idUsuario) {
      throw new BadRequestException('Você não pode cancelar a reserva deste produto');
    }
    
    return this.prismaService.$transaction(async (tx) => {
      const produtoAtualizado = await tx.produto.update({
        where: { id },
        data: {
          donoId: null,
        },
      });
      await tx.historico.create({
        data: {
          acao: 'DEVOLUCAO_MANUAL',
          produtoId: id,
          usuarioId: idUsuario,
        },
      });
      return produtoAtualizado;
    });

  }
  
  async historicoReservas() {
    return this.prismaService.historico.findMany({
      orderBy: { data: 'desc' },
      include: { produto: {select: { nome: true, id: true } }, 
                 usuario: {select: { nome: true, id: true } } },
    });

  }

  async entrarNaFilaEspera(idProduto: number, idUsuario: number) {
    
    const usuarioNaFila = await this.prismaService.filaEspera.findFirst({
      where: {
        produtoId: idProduto,
        usuarioId: idUsuario,
      },
    });

    if (usuarioNaFila) {
      throw new UnprocessableEntityException('Usuário já está na fila de espera para este produto');
    }
    
    return this.prismaService.filaEspera.create({
      data: {
        produtoId: idProduto,
        usuarioId: idUsuario,
      },
    });
  }
  @Cron('*/30 * * * * *')
  async verificaPrazosVencidos() {
    console.log('Verificando produtos com prazo vencido...');
    const vencidos = await this.prismaService.produto.findMany({
      where: {
        prazoLimite: {
          lt: new Date(),
        },
        donoId: { not: null },
      },
    });
      for (const produto of vencidos) {
        await this.processarRotatividade(produto.id, produto.donoId!);
  }  }

  private async processarRotatividade(idProduto: number, idUsuarioAtual: number) {
    await this.prismaService.$transaction(async (tx) => {
      await tx.produto.update({
        where: { id: idProduto },
        data: {
          donoId: null,
          prazoLimite: null,
        },
      });
      await tx.historico.create({
        data: {
          acao: 'DEVOLUCAO_AUTOMATICA',
          produtoId: idProduto,
          usuarioId: idUsuarioAtual,
        },
      });
      const proximoNaFila = await tx.filaEspera.findFirst({
        where: { produtoId: idProduto },
        orderBy: { dataEntrada: 'asc' },
      });
      if (proximoNaFila) {
        const novoPrazo = new Date();
        novoPrazo.setMinutes(novoPrazo.getMinutes() + 2);
        await tx.produto.update({
          where: { id: idProduto },
          data: {
            donoId: proximoNaFila.usuarioId,
            reservadoEm: new Date(),
            prazoLimite: novoPrazo,
          },
        });
        await tx.historico.create({ 
          data: {
            acao: 'RESERVA_FILA',
            produtoId: idProduto,
            usuarioId: proximoNaFila.usuarioId,
          },
        });
        await tx.filaEspera.delete({
          where: { id: proximoNaFila.id },
        });
      }
    });
  }
}
