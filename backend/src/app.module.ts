import { Module } from '@nestjs/common';

import { DbModule } from './db/db.module';
import { ProdutoModule } from './produto/produto.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [DbModule, ProdutoModule, UsuariosModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
