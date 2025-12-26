'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import { Produto } from '@/types';

interface TokenPayload {
  sub?: number | string;
  id?: number | string;
  role: string;
}

export default function Home() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) { router.push('/login'); return; }

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      setUserRole(decoded.role);
      fetchProdutos(token);
    } catch (error) {
      Cookies.remove('token');
      router.push('/login');
    }
  }, [router]);

  async function fetchProdutos(token: string) {
    try {
      const response = await fetch('http://localhost:3001/produto', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data: Produto[] = await response.json();
      const disponiveis = data.filter(p => p.donoId === null);
      setProdutos(disponiveis);
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleReservar(id: number) {
    const token = Cookies.get('token');
    if (!token) return;

    const response = await fetch(`http://localhost:3001/produto/${id}/reserva`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
        fetchProdutos(token); 
    } else {
        alert("Erro ao reservar.");
    }
  }

  function handleLogout() {
    Cookies.remove('token');
    router.push('/login');
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
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Disponíveis para Reserva</h1>
          
          <div className="flex gap-4">
            {userRole === 'ADMIN' && (
              <Link href="/admin" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-semibold text-sm flex items-center">
                ⚙️ Gestão
              </Link>
            )}

            <Link href="/minhas-reservas" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold text-sm flex items-center">
              Minhas Reservas
            </Link>

            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold text-sm">
              Sair
            </button>
          </div>
        </div>

        {/* LISTA LIMPA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {produtos.map((produto) => (
            <div key={produto.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">{produto.nome}</h2>
              <DescricaoRetratil texto={produto.descricao}/>
              <p className="text-green-600 font-bold mt-2">R$ {produto.preco}</p>
              
              <button 
                onClick={() => handleReservar(produto.id)}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold transition-colors"
              >
                Reservar
              </button>
            </div>
          ))}
        </div>

        {produtos.length === 0 && (
          <p className="text-center text-gray-500 mt-10">Não há produtos disponíveis no momento.</p>
        )}
      </div>
    </div>
  );
}