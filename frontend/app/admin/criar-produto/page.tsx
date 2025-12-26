'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';

interface TokenPayload {
  role: string;
}

export default function CriarProdutoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
  });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  // 1. Proteção da Rota (Só Admin entra)
  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      if (decoded.role !== 'ADMIN') {
        alert('Acesso negado');
        router.push('/');
      }
    } catch (error) {
      router.push('/login');
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso(false);

    const token = Cookies.get('token');

    try {
      const payload = {
        ...formData,
        preco: Number(formData.preco)
      };

      const response = await fetch('http://localhost:3001/produto', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar produto');
      }

      setSucesso(true);
      setFormData({ nome: '', descricao: '', preco: '' });

    } catch (err: any) {
      setErro(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex justify-center items-start">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg mt-10">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Novo Produto</h1>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">
            ← Voltar
          </Link>
        </div>

        {erro && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{erro}</div>}
        {sucesso && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">Produto criado com sucesso!</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Nome do Produto</label>
            <input
              type="text"
              value={formData.nome}
              onChange={e => setFormData({...formData, nome: e.target.value})}
              className="w-full border rounded px-3 py-2 text-gray-800"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Descrição</label>
            <textarea
              value={formData.descricao}
              onChange={e => setFormData({...formData, descricao: e.target.value})}
              className="w-full border rounded px-3 py-2 text-gray-800"
              rows={3}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Preço (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.preco}
              onChange={e => setFormData({...formData, preco: e.target.value})}
              className="w-full border rounded px-3 py-2 text-gray-800"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Cadastrar Produto
          </button>
        </form>
      </div>
    </div>
  );
}