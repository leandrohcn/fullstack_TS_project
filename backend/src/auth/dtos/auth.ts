import { IsNotEmpty, IsEmail, MinLength, IsString } from 'class-validator';

export class AuthLoginDto {
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @MinLength(6)
    senha: string;  
}

export class AuthCadastroDto {
    @IsNotEmpty()
    @MinLength(3)
    @IsString()
    nome: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    @MinLength(6)
    senha: string;  
}   
