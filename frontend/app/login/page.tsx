'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    
    // 1. Log para saber se o clique funcionou
    console.log("Tentando logar com:", email, senha); 

    try {
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      
      // 2. Log para ver o que o backend respondeu
      console.log("Status da resposta:", response.status);

      if (!response.ok) {
        throw new Error('Email ou senha inválidos'); // Isso vai pro catch
      }

      const data = await response.json();
      console.log("Token recebido:", data); // 3. Log para ver o token

      Cookies.set('token', data.accessToken, { expires: 1 });
      
      console.log("Redirecionando..."); // 4. Log final
      router.push('/'); 
      
    } catch (err: any) {
      console.error("Erro no login:", err); // 5. Log de erro
      setErro(err.message);
    }
}

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>
        
        {erro && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm text-center">{erro}</div>}

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded text-black focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full px-3 py-2 border rounded text-black focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Entrar
        </button>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <Link href="/cadastro" className="text-blue-600 hover:text-blue-800 font-bold hover:underline">
              Cadastre-se aqui
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}