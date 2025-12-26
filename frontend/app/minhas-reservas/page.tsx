'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import { Produto } from '@/types';

interface TokenPayload {
  id?: number | string;
  sub?: number | string;
}

export default function MinhasReservas() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const decoded = jwtDecode<TokenPayload>(token);
    const idCorreto = decoded.sub || decoded.id;
    const userId = Number(idCorreto); 

    fetchProdutos(token, userId);
  }, [router]);

  async function fetchProdutos(token: string, userId: number) {
    try {
      const response = await fetch('http://localhost:3001/produto', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data: Produto[] = await response.json();

      const meusProdutos = data.filter(p => p.donoId === userId);
      setProdutos(meusProdutos);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDevolver(id: number) {
    const token = Cookies.get('token');
    if(!token) return;

    await fetch(`http://localhost:3001/produto/${id}/cancela-reserva`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    setProdutos(produtos.filter(p => p.id !== id));
  }

  function DescricaoRetratil({ texto }: { texto: string }) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="mt-2">
      <button 
        onClick={() => setVisivel(!visivel)}
        className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline focus:outline-none"
      >
        {visivel ? 'Ocultar detalhes ▲' : 'Ver descrição ▼'}
      </button>
      
      {visivel && (
        <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-100 text-gray-900 text-sm animate-fadeIn">
          {texto}
        </div>
      )}
    </div>
  );
}

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Minhas Reservas</h1>
          <Link href="/" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
            Voltar para Loja
          </Link>
        </div>

        {produtos.length === 0 ? (
           <div className="text-center py-10 bg-white rounded shadow">
             <p className="text-gray-500 text-lg">Você não tem nenhuma reserva ativa.</p>
             <Link href="/" className="text-blue-600 mt-2 block hover:underline">Ir reservar produtos</Link>
           </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {produtos.map((produto) => (
              <div key={produto.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-600">{produto.nome}</h2>
                  <DescricaoRetratil texto={produto.descricao} />
                </div>
                <button 
                  onClick={() => handleDevolver(produto.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded font-bold"
                >
                  Devolver
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}