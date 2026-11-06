// Setores são configuráveis conforme a estrutura de cada empresa.
export type SectorType = string;

// Papel do usuário no fluxo de liberação
export type UserRole = 'TITULAR' | 'AUXILIAR';

export interface UserProfile {
  id: string;
  login: string;          // Matrícula (ex: '8547') ou login de estagiário (ex: 'estagio.joao')
  nome: string;           // Nome completo do colaborador
  setor: SectorType;      // Setor ao qual pertence
  perfil: UserRole;       // TITULAR (pode assinar) ou AUXILIAR (precisa de validação)
  podeAssinar: boolean;   // Flag definitiva que autoriza ou bloqueia o fechamento autônomo
}