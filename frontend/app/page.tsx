'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import { Produto } from '@/types';

interface TokenPayload {
  sub?: number | string;
  id?: number; 
  role: string;
}

export default function Home() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState<number | null>(null);

  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) { router.push('/login'); return; }

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      setUserRole(decoded.role);
      setUserId(Number(decoded.id || decoded.sub)); 
      
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
      setProdutos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleReservar(id: number) {
    const token = Cookies.get('token');
    if (!token) return;

    setActionLoading(id);

    try {
      const response = await fetch(`http://localhost:3001/produto/${id}/reserva`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
          await fetchProdutos(token); 
          alert("Reserva realizada com sucesso! Você tem 2 minutos.");
      } else {
          const erro = await response.json();
          alert(erro.message || "Erro ao reservar.");
      }
    } catch (error) {
      alert("Erro de conexão.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleEntrarFila(id: number) {
    const token = Cookies.get('token');
    if (!token) return;

    setActionLoading(id);

    try {
        const response = await fetch(`http://localhost:3001/produto/${id}/fila`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert("Você entrou na fila! Se o produto for devolvido, ele será reservado pra você.");
        } else {
            const erro = await response.json();
            alert(erro.message || "Erro ao entrar na fila.");
        }
    } catch (error) {
        alert("Erro de conexão.");
    } finally {
        setActionLoading(null);
    }
  }

  function handleLogout() {
    Cookies.remove('token');
    router.push('/login');
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Carregando catálogo...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
      
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Catálogo de Produtos</h1>
            <p className="text-gray-500 text-sm mt-1">Reserve produtos ou entre na fila de espera.</p>
          </div>
          
          <nav className="flex items-center gap-3">
            {userRole === 'ADMIN' && (
              <Link href="/admin" className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2">
                ⚙️ Gestão
              </Link>
            )}

            <Link href="/minhas-reservas" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm">
              Minhas Reservas
            </Link>

            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm">
              Sair
            </button>
          </nav>
        </header>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {produtos.map((produto) => {
            const isMeu = produto.donoId === userId;
            const isDisponivel = produto.donoId === null;
            const isLoadingThis = actionLoading === produto.id;

            return (
              <div key={produto.id} className={`bg-white p-6 rounded-xl shadow-sm border transition-all hover:shadow-md ${isMeu ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-100'}`}>
            
                <div className="flex justify-between items-start mb-3">
                    <h2 className="text-lg font-bold text-gray-800 line-clamp-1" title={produto.nome}>{produto.nome}</h2>
                    {isMeu && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Sua Reserva</span>}
                </div>

            
                <p className="text-green-600 font-bold text-xl mb-3">R$ {produto.preco}</p>
                <BotaoDetalhes texto={produto.descricao}/>

              
                <div className="mt-6">
                    {isMeu ? (
                        <div className="w-full bg-blue-50 text-blue-600 py-2 rounded-lg font-semibold text-sm text-center border border-blue-100">
                            Produto com você
                        </div>
                    ) : isDisponivel ? (
                        <button 
                            onClick={() => handleReservar(produto.id)}
                            disabled={isLoadingThis}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2.5 rounded-lg font-bold transition-all shadow-sm hover:shadow active:scale-95 flex justify-center"
                        >
                            {isLoadingThis ? 'Processando...' : 'Reservar Agora'}
                        </button>
                   ) : (
                      <div className="flex flex-col gap-2">
                          
                          {/* --- INÍCIO DA MUDANÇA --- */}
                          <div className="flex justify-between items-center text-xs font-bold px-1">
                              <span className="text-red-500">🔴 Indisponível</span>
                              
                              {/* Mostra o contador se tiver alguém */}
                              {produto._count?.fila && produto._count.fila > 0 ? (
                                  <span className="text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                                      {produto._count.fila} na fila 🧍‍♂️
                                  </span>
                              ) : (
                                  <span className="text-gray-400">Fila vazia</span>
                              )}
                          </div>
                          {/* --- FIM DA MUDANÇA --- */}

                          <button 
                              onClick={() => handleEntrarFila(produto.id)}
                              disabled={isLoadingThis}
                              className="w-full bg-orange-100 hover:bg-orange-200 disabled:bg-gray-100 text-orange-700 py-2.5 rounded-lg font-bold text-sm transition-colors border border-orange-200 flex justify-center items-center gap-2"
                          >
                              {isLoadingThis ? 'Entrando...' : (
                                  <>
                                      <span>⏳ Entrar na Fila</span>
                                  </>
                              )}
                          </button>
                      </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {produtos.length === 0 && (
          <div className="text-center py-20">
             <p className="text-gray-400 text-lg">Nenhum produto cadastrado no sistema.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BotaoDetalhes({ texto }: { texto: string }) {
    const [visivel, setVisivel] = useState(false);
  
    return (
      <div className="text-sm">
        <button 
          onClick={() => setVisivel(!visivel)}
          className="text-gray-500 hover:text-blue-600 font-medium text-xs flex items-center gap-1 transition-colors outline-none"
        >
          {visivel ? 'Ocultar descrição' : 'Ver descrição'}
          <span className={`transform transition-transform ${visivel ? 'rotate-180' : ''}`}>▼</span>
        </button>
        
        {visivel && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-gray-600 text-sm leading-relaxed animate-fadeIn border border-gray-100">
            {texto}
          </div>
        )}
      </div>
    );
  }