import { Body, Controller, Get, Post, Request, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthCadastroDto, AuthLoginDto } from './dtos/auth';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
    async login(@Body() body: AuthLoginDto) {
        return this.authService.login(body);
    }
    
    @Post('cadastro')
    async cadastro(@Body() body: AuthCadastroDto) {
        return this.authService.cadastro(body);
    }   

    @UseGuards(authGuard)
    @Get('perfil')
    async perfil(@Request() req) {  
        return req.usuario;
    }
}
