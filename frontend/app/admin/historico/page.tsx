'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';

// Tipagem
interface HistoricoItem {
  id: number;
  acao: string;
  data: string;
  usuario: {
    nome: string;
    email: string;
  };
  produto: {
    nome: string;
  };
}

interface TokenPayload {
  role: string;
}

// --- COMPONENTE VISUAL SIMPLIFICADO (SÓ 2 CORES) ---
function BadgeAcao({ tipo }: { tipo: string }) {
  // Se o texto da ação contiver "RESERVA" (seja manual, fila, auto), pinta de Azul
  if (tipo.includes('RESERVA')) {
    return (
      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold border border-blue-200 flex items-center gap-1 w-fit">
         📥 Reserva
      </span>
    );
  }

  // Se o texto da ação contiver "DEVOLUCAO" (seja manual ou auto), pinta de Laranja
  if (tipo.includes('DEVOLUCAO')) {
    return (
      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-bold border border-orange-200 flex items-center gap-1 w-fit">
         📤 Devolução
      </span>
    );
  }

  // Caso apareça algo estranho
  return (
    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold border border-gray-200">
       {tipo}
    </span>
  );
}

export default function HistoricoPage() {
  const router = useRouter();
  
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [busca, setBusca] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  
  const [loading, setLoading] = useState(true);

  // Busca os dados iniciais
  useEffect(() => {
    const token = Cookies.get('token');
    
    if (!token) { router.push('/login'); return; }

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      if (decoded.role !== 'ADMIN') {
        alert("Acesso restrito.");
        router.push('/');
        return;
      }

      fetch('http://localhost:3001/produto/historico/reservas', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Falha ao buscar histórico');
        return res.json();
      })
      .then(data => {
        setHistorico(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        alert("Erro ao carregar histórico.");
      });

    } catch (error) {
      router.push('/login');
    }
  }, [router]);

  // --- LÓGICA DE FILTRAGEM ---
  const historicoFiltrado = historico.filter(item => {
    const termo = busca.toLowerCase();
    const matchTexto = 
        item.usuario?.nome.toLowerCase().includes(termo) ||
        item.produto?.nome.toLowerCase().includes(termo);

    const dataItem = item.data.split('T')[0]; 
    
    const matchInicio = dataInicio ? dataItem >= dataInicio : true;
    const matchFim = dataFim ? dataItem <= dataFim : true;

    return matchTexto && matchInicio && matchFim;
  });

  // Função para limpar filtros
  function limparFiltros() {
    setBusca('');
    setDataInicio('');
    setDataFim('');
  }

  function formatarData(dataIso: string) {
    return new Date(dataIso).toLocaleString('pt-BR');
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando auditoria...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-extrabold text-black">Histórico de Movimentações</h1>
            <Link href="/admin" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold text-sm">
                Voltar ao Painel
            </Link>
        </div>

        {/* --- BARRA DE FILTROS --- */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            
            {/* Filtro de Texto */}
            <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Buscar (Usuário ou Produto)</label>
                <input 
                    type="text" 
                    placeholder="Ex: João, Projetor..." 
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded text-black focus:border-blue-500 outline-none"
                />
            </div>

            {/* Filtro Data Inicio */}
            <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">De:</label>
                <input 
                    type="date" 
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded text-black focus:border-blue-500 outline-none"
                />
            </div>

            {/* Filtro Data Fim e Botão Limpar */}
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Até:</label>
                    <input 
                        type="date" 
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded text-black focus:border-blue-500 outline-none"
                    />
                </div>
                {(busca || dataInicio || dataFim) && (
                    <button 
                        onClick={limparFiltros}
                        className="h-10 px-3 bg-red-100 text-red-600 rounded hover:bg-red-200 font-bold text-xs border border-red-200"
                        title="Limpar Filtros"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b bg-gray-100 text-gray-700">
                    <th className="p-3 font-bold uppercase text-sm">Data / Hora</th>
                    <th className="p-3 font-bold uppercase text-sm">Usuário</th>
                    <th className="p-3 font-bold uppercase text-sm">Ação</th>
                    <th className="p-3 font-bold uppercase text-sm">Produto</th>
                </tr>
            </thead>
            <tbody>
                {historicoFiltrado.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50 text-sm transition-colors">
                        <td className="p-3 text-gray-600 font-mono">
                            {formatarData(item.data)}
                        </td>
                        <td className="p-3">
                            <span className="font-bold text-black block">{item.usuario?.nome || 'Deletado'}</span>
                            <span className="text-xs text-gray-500">{item.usuario?.email}</span>
                        </td>
                        
                        <td className="p-3">
                            <BadgeAcao tipo={item.acao} />
                        </td>

                        <td className="p-3 font-medium text-gray-800">
                            {item.produto?.nome || 'Deletado'}
                        </td>
                    </tr>
                ))}

                {historicoFiltrado.length === 0 && (
                    <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500 bg-gray-50 italic border-t">
                            Nenhum registro encontrado com esses filtros.
                        </td>
                    </tr>
                )}
            </tbody>
          </table>
          
          <div className="mt-4 text-xs text-gray-400 text-right">
             Total de registros: {historicoFiltrado.length}
          </div>
        </div>

      </div>
    </div>
  );
}