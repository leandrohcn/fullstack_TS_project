import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthCadastroDto, AuthLoginDto } from './dtos/auth';
import { PrismaService } from 'src/db/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private prismaService: PrismaService, private jwtService: JwtService) {}

    async login(data: AuthLoginDto){
        const usuario =  await this.prismaService.usuario.findUnique({
            where: { email: data.email }
        });

        if(!usuario){
            throw new UnauthorizedException('Credenciais inválidas');
        }

        const senhaValida = await bcrypt.compare(data.senha, usuario.senha);
        if(!senhaValida){   
            throw new UnauthorizedException('Credenciais inválidas');
        }

        const accessToken = await this.jwtService.signAsync({ 
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            role: usuario.role
        });

        return {accessToken};
    }

    async cadastro(data: AuthCadastroDto){
        const emailExists = await this.prismaService.usuario.findUnique({
            where: { email: data.email }    
        });

        if(emailExists){
            throw new UnauthorizedException('Email já cadastrado');
        }

        const hashedSenha = await bcrypt.hash(data.senha, 10);  

        const usuario = await this.prismaService.usuario.create({
                data: {
                    ...data,
                    senha: hashedSenha,
                }
        });

        return {
            id: usuario.id, 
            nome: usuario.nome, 
            email: usuario.email
        };
    }
}
