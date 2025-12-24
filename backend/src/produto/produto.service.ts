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

    return this.prismaService.produto.update({
      where: { id },
      data: { donoId: idUsuario,
              reservadoEm: new Date()
       },
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
    
    return this.prismaService.produto.update({
      where: { id },
      data: { donoId: null,
              reservadoEm: null
       },
    });
  }
  
}
