import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class ProdutoService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createProdutoDto: CreateProdutoDto) {
    return this.prismaService.produto.create({
      data: createProdutoDto,
      });
  }

  findAll() {
    return this.prismaService.produto.findMany();
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

    return this.prismaService.$transaction(async (tx) => {
      const produtoAtualizado = await tx.produto.update({
        where: { id },
        data: {
          donoId: idUsuario,
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
          acao: 'DEVOLUCAO',
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

}
