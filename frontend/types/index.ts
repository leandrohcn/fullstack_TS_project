export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  donoId: number | null;
  reservadoEm?: string | null;
  _count?: {
    fila: number;
  };
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: 'ADMIN' | 'Usuario';
}

export interface LoginResponse {
  accessToken: string;
}