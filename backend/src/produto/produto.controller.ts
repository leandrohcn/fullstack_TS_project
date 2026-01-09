import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ProdutoService } from './produto.service';
import type { CreateProdutoDto } from './dto/create-produto.dto';
import type { UpdateProdutoDto } from './dto/update-produto.dto';
import { authGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Role } from '../enums/role.enum';
import { Roles } from 'src/auth/roles.decorators';

@Controller('produto')
@UseGuards(authGuard, RolesGuard)
export class ProdutoController {
  constructor(private readonly produtoService: ProdutoService) {}

  @UseGuards(authGuard)
  @Get('historico/reservas')
  @Roles(Role.ADMIN)
  historicoReservas(@Request() req) {
    return this.produtoService.historicoReservas();
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createProdutoDto: CreateProdutoDto, @Request() req) {
    return this.produtoService.create(createProdutoDto);
  }

  @Get()
  findAll() {
    return this.produtoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.produtoService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateProdutoDto: UpdateProdutoDto) {
    return this.produtoService.update(+id, updateProdutoDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.produtoService.remove(+id);
  }

  @UseGuards(authGuard)
  @Patch(':id/reserva')
  reservaProduto(@Param('id') id: string, @Request() req) {
    const idUsuario = req.usuario.id;
    return this.produtoService.reservaProduto(+id, idUsuario);
  }

  @UseGuards(authGuard)
  @Patch(':id/cancela-reserva')
  cancelaReservaProduto(@Param('id') id: string, @Request() req) {
    const idUsuario = req.usuario.id;
    return this.produtoService.cancelaReservaProduto(+id, idUsuario);
  }

}
