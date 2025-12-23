import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorators'; // <--- Verifique se o nome do arquivo está certo

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Busca quais roles são exigidas (Lê o @Roles do controller)
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Se a rota não tem @Roles, libera geral
    if (!requiredRoles) {
      return true;
    }

    // 2. Pega o usuário que o authGuard injetou
    const { usuario } = context.switchToHttp().getRequest();

    // --- ÁREA DE DEBUG (OLHE O TERMINAL APÓS A REQUISIÇÃO) ---
    console.log('====================================');
    console.log('🔍 DEBUG ROLES GUARD');
    console.log('👮 Roles Exigidas na Rota:', requiredRoles);
    console.log('👤 Role do Usuário (no Token):', usuario?.role);
    console.log('❓ O usuário existe?', !!usuario);
    console.log('====================================');
    // ---------------------------------------------------------

    if (!usuario) {
        throw new UnauthorizedException('Usuário não identificado (falha no AuthGuard).');
    }

    // 3. Verifica a permissão
    // O .includes verifica se o role do usuário está na lista de permitidos
    const temPermissao = requiredRoles.includes(usuario.role);

    if (!temPermissao) {
        console.log('❌ ACESSO NEGADO: As roles não batem.');
        return false; // Isso dispara o erro 403 Forbidden
    }

    console.log('✅ ACESSO PERMITIDO');
    return true;
  }
}