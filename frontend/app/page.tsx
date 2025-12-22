'use client'
import { useEffect, useState } from "react";

export default function Home() {
  const [produtos, setProdutos] = useState<any>([]);
  // inicializa com valor vazio para evitar erros de uncontrolled components
  const [produto, setProduto] = useState<any>({ nome: '', preco: '', descricao: '' });

  useEffect(() => {
    obterProdutos();
  }, []);

  async function obterProdutos() {
    const resposta = await fetch('http://localhost:3001/produto');
    const dados = await resposta.json();
    setProdutos(dados);
  }

  // Função para carregar os dados no formulário ao clicar em "Editar"
  function selecionarProduto(p: any) {
    setProduto(p);
  }

  async function excluirProduto(id: number) {
    await fetch(`http://localhost:3001/produto/${id}`, {
      method: 'DELETE'
    });
    obterProdutos();
  }

  // função unificada que decide se Cria ou Altera
  async function salvarProduto(e: any) {
    e.preventDefault();

    if (produto.id) {
      await fetch(`http://localhost:3001/produto/${produto.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(produto)
      });
    } else {
      await fetch('http://localhost:3001/produto', {
        method: 'POST',
        headers: {  
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(produto)
      });
    }

    setProduto({ nome: '', preco: '', descricao: '' });
    obterProdutos();
  }

  function formProduto() {
    return (
      <form onSubmit={salvarProduto} className="flex flex-col gap-2">
        <input 
          type="text" 
          placeholder="Nome" 
          value={produto.nome} 
          onChange={e => setProduto({ ...produto, nome: e.target.value })} 
          className="p-2 rounded-md bg-zinc-800 text-white" 
        />
        <input 
          type="text" 
          placeholder="Preço" 
          value={produto.preco} 
          onChange={e => setProduto({ ...produto, preco: +e.target.value })} 
          className="p-2 rounded-md bg-zinc-800 text-white" 
        />
        <input 
          type="text" 
          placeholder="Descrição" 
          value={produto.descricao} 
          onChange={e => setProduto({ ...produto, descricao: e.target.value })} 
          className="p-2 rounded-md bg-zinc-800 text-white" 
        />
        
        <div className="flex gap-2">
            <button type="submit" className="bg-blue-500 p-2 rounded-md text-white flex-1">
            {produto.id ? 'Salvar Alteração' : 'Cadastrar Produto'}
            </button>
            {produto.id && (
                <button 
                    type="button" 
                    onClick={() => setProduto({ nome: '', preco: '', descricao: '' })}
                    className="bg-gray-500 p-2 rounded-md text-white"
                >
                    Cancelar
                </button>
            )}
        </div>
      </form>
    );
  }

  function listarProdutos() {
    return (
      <div className="flex flex-col gap-2">
        {produtos.map((p: any) => (
          <div key={p.id} className="flex gap-2 bg-zinc-800 p-2 rounded-md m-2 items-center justify-between">
            <div className="text-white">
                <h2 className="font-bold">{p.nome}</h2>
                <p>R$ {p.preco}</p>
                <p className="text-sm text-gray-400">{p.descricao}</p>
            </div>
            <div className="flex gap-2">
                <button onClick={() => selecionarProduto(p)} className="bg-green-500 p-2 rounded-md text-white">
                    Editar
                </button>
                <button onClick={() => excluirProduto(p.id)} className="bg-red-500 p-2 rounded-md text-white">
                    Excluir
                </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-black text-white p-4">
      <h1 className="text-2xl mb-4">Lista de Produtos</h1>
      {listarProdutos()}
      
      <h2 className="text-xl mt-8 mb-4">
        {produto.id ? `Editando: ${produto.nome}` : 'Adicionar Produto'}
      </h2>
      {formProduto()}
    </div>
  );
}