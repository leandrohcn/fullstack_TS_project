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
  email: string;
  role: string;
  exp: number;
}

export default function Home() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para controle do usuário
  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string>('');

  // 1. Carrega token, identifica usuário e busca produtos
  useEffect(() => {
    const token = Cookies.get('token');

    if (!token) {
      router.push('/login');
      return;
    }

    try {
      // Decodifica o token
      const decoded = jwtDecode<TokenPayload>(token);
      
      // Converte o ID para número (para bater com o banco de dados)
      const meuId = decoded.sub || decoded.id;
      setUserId(Number(meuId));
      
      // Salva o cargo (ADMIN ou USER)
      setUserRole(decoded.role);
      
      fetchProdutos(token);
    } catch (error) {
      console.error("Token inválido");
      handleLogout();
    }
  }, [router]);

  // 2. Busca produtos no backend
  async function fetchProdutos(token: string) {
    try {
      const response = await fetch('http://localhost:3001/produto', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();
      setProdutos(data);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoading(false);
    }
  }

  // 3. Função de Reservar
  async function handleReservar(id: number) {
    const token = Cookies.get('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3001/produto/${id}/reserva`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const erro = await response.json();
        alert(`Erro: ${erro.message}`);
        return;
      }

      // Atualiza a lista
      fetchProdutos(token);

    } catch (error) {
      console.error("Erro ao reservar:", error);
    }
  }

  // 4. Função de Devolver
  async function handleDevolver(id: number) {
    const token = Cookies.get('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3001/produto/${id}/cancela-reserva`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchProdutos(token);
      }
    } catch (error) {
      console.error("Erro ao devolver:", error);
    }
  }

  function handleLogout() {
    Cookies.remove('token');
    router.push('/login');
  }

  if (loading) return <div className="p-8 text-center">Carregando sistema...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* --- CABEÇALHO --- */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Produtos Disponíveis</h1>
          
          <div className="flex gap-4">
            
            {/* BOTÃO ADMIN (Só aparece se for ADMIN) */}
            {userRole === 'ADMIN' && (
              <Link 
                href="/admin" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-semibold text-sm flex items-center"
              >
                + Novo Produto
              </Link>
            )}

            {/* Link Minhas Reservas */}
            <Link 
              href="/minhas-reservas" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold text-sm flex items-center"
            >
              Minhas Reservas
            </Link>

            {/* Botão Sair */}
            <button 
              onClick={handleLogout} 
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold text-sm"
            >
              Sair
            </button>
            
          </div>
        </div>

        {/* --- GRID DE PRODUTOS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {produtos.map((produto) => {
            
            // Lógica visual
             if (produto.donoId) {
                console.log("--- DEBUG ---");
                console.log("Produto ID:", produto.id);
                console.log("Dono ID (Do Banco):", produto.donoId, typeof produto.donoId);
                console.log("Meu ID (Do Token):", userId, typeof userId);
                console.log("É meu?", produto.donoId == userId);
            }
            const estaLivre = produto.donoId === null;
            const ehMeu = produto.donoId === Number(userId); // userId já é número aqui

            return (
              <div key={produto.id} className={`p-6 rounded-lg shadow border-2 ${ehMeu ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{produto.nome}</h2>
                    <p className="text-gray-600 mt-1">{produto.descricao}</p>
                    <p className="text-green-600 font-bold mt-2">R$ {produto.preco}</p>
                  </div>
                  
                  {/* Etiqueta de Status */}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    estaLivre ? 'bg-green-100 text-green-800' : 
                    ehMeu ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {estaLivre ? 'DISPONÍVEL' : ehMeu ? 'SUA RESERVA' : 'INDISPONÍVEL'}
                  </span>
                </div>

                {/* Área dos Botões */}
                <div className="mt-4 pt-4 border-t border-gray-200/50">
                  {estaLivre && (
                    <button 
                      onClick={() => handleReservar(produto.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold transition-colors"
                    >
                      Reservar Agora
                    </button>
                  )}

                  {ehMeu && (
                    <button 
                      onClick={() => handleDevolver(produto.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold transition-colors"
                    >
                      Devolver Item
                    </button>
                  )}

                  {!estaLivre && !ehMeu && (
                     <button disabled className="w-full bg-gray-300 text-gray-500 py-2 rounded cursor-not-allowed font-semibold">
                       Reservado por outro
                     </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mensagem se não houver produtos */}
        {produtos.length === 0 && (
          <p className="text-center text-gray-500 mt-10">Nenhum produto cadastrado ainda.</p>
        )}

      </div>
    </div>
  );
}