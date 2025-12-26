'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // <--- Importante para redirecionar
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode'; // <--- Importante para ler o cargo
import Link from 'next/link';
import { Produto } from '@/types';

interface TokenPayload {
  role: string;
}

export default function AdminPainel() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
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
        alert("Acesso Negado: Área restrita para administradores.");
        router.push('/'); 
        return;
      }

     
      fetch('http://localhost:3001/produto', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setProdutos(data);
        setLoading(false);
      });

    } catch (error) {
      router.push('/login');
    }
  }, [router]);


  async function deletar(id: number) {
    if(!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    const token = Cookies.get('token');
    
    try {
      const response = await fetch(`http://localhost:3001/produto/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setProdutos(produtos.filter(p => p.id !== id));
        alert("Produto excluído com sucesso.");
      } else {
        const erro = await response.json();
        alert(`Erro ao excluir: ${erro.message || 'Sem permissão'}`);
      }
    } catch (error) {
      alert("Erro de conexão com o servidor.");
    }
  }
  
  function BotaoDetalhes({ texto }: { texto: string }) {
    const [aberto, setAberto] = useState(false);
    return (
      <div className="relative">
        <button 
          onClick={() => setAberto(!aberto)}
          className="w-6 h-6 rounded-full bg-blue-100 border border-blue-300 text-blue-600 font-serif italic font-bold flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
          title="Ver descrição completa"
        >
          i
        </button>
        {aberto && (
          <>
            <div className="fixed inset-0 z-10 cursor-default" onClick={() => setAberto(false)}></div>
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 p-4 bg-white border border-gray-200 shadow-xl rounded-lg z-20 animate-fadeIn text-left">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 border-b pb-1">Descrição do Produto</h4>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{texto}</p>
            </div>
          </>
        )}
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center">Verificando permissões...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow"> 
        
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-extrabold text-black">Gestão de Produtos</h1>
            <div className="gap-2 flex">
                <Link href="/admin/criar-produto" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold transition-colors">
                    + Novo Produto
                </Link>
                <Link href="/" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold transition-colors">
                    Voltar para Loja
                </Link>
            </div>
        </div>

        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b bg-gray-50 text-gray-700">
                    <th className="p-3 text-sm font-bold uppercase">ID</th>
                    <th className="p-3 text-sm font-bold uppercase">Nome</th>
                    <th className="p-3 text-sm font-bold uppercase text-center">Detalhes</th>
                    <th className="p-3 text-sm font-bold uppercase">Preço</th>
                    <th className="p-3 text-sm font-bold uppercase">Status</th>
                    <th className="p-3 text-sm font-bold uppercase">Ações</th>
                </tr>
            </thead>
            <tbody>
                {produtos.map(p => (
                    <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-medium text-gray-500">{p.id}</td>
                        <td className="p-3 font-bold text-black">{p.nome}</td>
                        <td className="p-3 text-center">
                            <div className="flex justify-center">
                                <BotaoDetalhes texto={p.descricao} />
                            </div>
                        </td>
                        <td className="p-3 text-gray-900 font-medium">R$ {p.preco}</td>
                        <td className="p-3">
                            {p.donoId ? (
                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200">Reservado</span>
                            ) : (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">Disponível</span>
                            )}
                        </td>
                        <td className="p-3 flex gap-3">
                            <Link href={`/admin/editar/${p.id}`} className="text-blue-600 hover:text-blue-800 font-semibold text-sm hover:underline">Editar</Link>
                            <button onClick={() => deletar(p.id)} className="text-red-600 hover:text-red-800 font-semibold text-sm hover:underline">Excluir</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}