import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/db/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { RolesGuard } from './roles.guard';
import { authGuard } from './auth.guard';

@Module({
  imports: [JwtModule.register({
    global: true,
    secret: jwtConstants.secret || 's3cr3tJwT',
    signOptions: { expiresIn: '1d' },
  }) 
  ],
  providers: [AuthService, PrismaService, RolesGuard, authGuard],
  controllers: [AuthController],
  exports: [AuthService, RolesGuard],
})
export class AuthModule {}
