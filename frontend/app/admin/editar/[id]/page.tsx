'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode'; // <--- Importante
import Link from 'next/link';

interface TokenPayload {
  role: string;
}

export default function EditarProdutoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [formData, setFormData] = useState({ nome: '', descricao: '', preco: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      
      if (decoded.role !== 'ADMIN') {
        alert('Acesso Negado: Você não tem permissão para editar produtos.');
        router.push('/'); 
        return;
      }

      fetch(`http://localhost:3001/produto/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
          if (!res.ok) throw new Error('Erro ao buscar produto');
          return res.json();
      })
      .then(data => {
          setFormData({
              nome: data.nome,
              descricao: data.descricao,
              preco: data.preco
          });
          setLoading(false);
      })
      .catch(err => {
          console.error(err);
          alert("Erro ao carregar produto (talvez não exista).");
          router.push('/admin/painel');
      });

    } catch (error) {
      router.push('/login');
    }
  }, [id, router]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    const token = Cookies.get('token');

    try {
      const response = await fetch(`http://localhost:3001/produto/${id}`, {
          method: 'PATCH',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({
              ...formData,
              preco: Number(formData.preco)
          }),
      });

      if (response.ok) {
          alert('Produto atualizado com sucesso!');
          router.push('/admin/painel');
      } else {
          const erro = await response.json();
          alert(`Erro: ${erro.message}`);
      }
    } catch (error) {
      alert('Erro de conexão ao salvar.');
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Verificando permissões...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex justify-center items-center">
      <form onSubmit={handleUpdate} className="bg-white p-8 rounded shadow-md w-full max-w-lg">
        
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black">Editar Produto #{id}</h2>
            {/* O type="button" é crucial para não submeter o form ao clicar em voltar */}
            <button type="button" onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">
                ← Voltar
            </button>
        </div>

        <div className="mb-4">
            <label className="block mb-2 font-bold text-gray-700">Nome</label>
            <input 
                type="text" 
                value={formData.nome} 
                onChange={e => setFormData({...formData, nome: e.target.value})}
                className="w-full border border-gray-300 p-2 rounded text-black focus:border-blue-500 outline-none"
                required
            />
        </div>

        <div className="mb-4">
            <label className="block mb-2 font-bold text-gray-700">Descrição</label>
            <textarea 
                value={formData.descricao} 
                onChange={e => setFormData({...formData, descricao: e.target.value})}
                className="w-full border border-gray-300 p-2 rounded text-black focus:border-blue-500 outline-none"
                rows={4}
                required
            />
        </div>

        <div className="mb-6">
            <label className="block mb-2 font-bold text-gray-700">Preço (R$)</label>
            <input 
                type="number" 
                step="0.01"
                value={formData.preco} 
                onChange={e => setFormData({...formData, preco: e.target.value})}
                className="w-full border border-gray-300 p-2 rounded text-black focus:border-blue-500 outline-none"
                required
            />
        </div>

        <div className="flex gap-4">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition-colors">
                Salvar Alterações
            </button>
            <Link href="/admin" className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 rounded text-center transition-colors">
                Cancelar
            </Link>
        </div>
      </form>
    </div>
  );
}