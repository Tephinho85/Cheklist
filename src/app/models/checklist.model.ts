import { SectorType } from './user.model';

export type TipoResposta = 'Selecao' | 'Radio' | 'Numero' | 'TextoLivre' | '' | null;

export interface ItemChecklist {
  item: string;
  descricao: string;
  tipoResposta: TipoResposta;
  opcoes: string[];
  obrigatorio: boolean;
  observacaoTipo: string | null;
}

export interface Checklist {
  codigo: string;
  revisao: string;
  descricao: string;
  setor?: SectorType;
  metaInspecoesMensais?: number;
  itens: ItemChecklist[];
}

export interface RespostaInspecao {
  item: string;
  pergunta: string;
  resposta: any;
  observacao: string | null;
}

export interface HistoricoInspecao {
  id?: string;
  codigoChecklist: string;
  descricao: string;
  revisao?: string;
  dataExecucao: string;
  responsavel?: string;
  respostas: RespostaInspecao[];
}

export interface GestorArea {
  id: string;
  nome: string;
  area: SectorType;
  email: string;
  whatsapp: string;
  ativo: boolean;
}

export type StatusSolicitacaoOs = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA';
export type CategoriaPrazoOs = 'AGUARDANDO_PRAZO' | 'DENTRO_DO_PRAZO' | 'PROXIMA_DO_VENCIMENTO' | 'VENCIDA' | 'CONCLUIDA';

export interface AcompanhamentoOs {
  id: string;
  data: string;
  autor: string;
  tipo: 'ABERTURA' | 'PRAZO' | 'STATUS' | 'OBSERVACAO' | 'FOTO';
  descricao: string;
}

export interface SolicitacaoOs {
  id: string;
  numero: string;
  inspecaoId: string;
  codigoChecklist: string;
  descricaoChecklist: string;
  revisaoChecklist: string;
  item: string;
  pergunta: string;
  resposta: string;
  irregularidade: string;
  correcaoSolicitada: string;
  area: SectorType;
  gestorId: string;
  gestorNome: string;
  gestorEmail: string;
  gestorWhatsapp: string;
  solicitante: string;
  abertaEm: string;
  criadaEm: string;
  prazoCorrecao?: string | null;
  informadoPor?: string | null;
  dataConclusao?: string | null;
  status: StatusSolicitacaoOs;
  notificacaoStatus: 'PENDENTE' | 'ENVIADA' | 'FALHOU';
  historico?: AcompanhamentoOs[];
  observacoes?: string;
  fotoAntesId?: string | null;
  fotoDepoisId?: string | null;
}