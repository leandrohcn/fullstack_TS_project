import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { usuario } = context.switchToHttp().getRequest();

    if (!usuario) {
        throw new UnauthorizedException('Usuário não identificado (falha no AuthGuard).');
    }

    const temPermissao = requiredRoles.includes(usuario.role);

    if (!temPermissao) {
        return false; 
    }

    return true;
  }
}