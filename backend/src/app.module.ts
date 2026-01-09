import { Module } from '@nestjs/common';

import { DbModule } from './db/db.module';
import { ProdutoModule } from './produto/produto.module';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [DbModule, ProdutoModule, AuthModule, ScheduleModule.forRoot()],
  controllers: [],
  providers: [],
})
export class AppModule {}
