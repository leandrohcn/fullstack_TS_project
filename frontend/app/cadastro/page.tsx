'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CadastroPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
  });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErro('');

    try {
      const response = await fetch('http://localhost:3001/auth/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar conta. Tente outro email.');
      }

      setSucesso(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
    } catch (err: any) {
      setErro(err.message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleCadastro} className="w-full max-w-sm bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Crie sua Conta</h2>
        
        {erro && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm text-center">{erro}</div>}
        {sucesso && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded text-sm text-center">Conta criada! Redirecionando...</div>}

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Nome</label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({...formData, nome: e.target.value})}
            className="w-full px-3 py-2 border rounded text-black"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-3 py-2 border rounded text-black"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Senha</label>
          <input
            type="password"
            value={formData.senha}
            onChange={(e) => setFormData({...formData, senha: e.target.value})}
            className="w-full px-3 py-2 border rounded text-black"
            required
          />
        </div>

        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Cadastrar
        </button>

        <p className="mt-4 text-center text-sm text-green-600">
          Já tem conta? <Link href="/login" className="text-blue-600 hover:underline">Faça Login</Link>
        </p>
      </form>
    </div>
  );
}