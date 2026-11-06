import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage)
  },
  {
    path: 'cadastrar',
    loadComponent: () => import('./pages/cadastrar/cadastrar.page').then((m) => m.CadastrarPage)
  },
  {
    path: 'responder',
    loadComponent: () => import('./pages/responder/responder.page').then((m) => m.ResponderPage)
  },
  {
    path: 'utilizadores',
    loadComponent: () => import('./pages/utilizadores/utilizadores.page').then((m) => m.UtilizadoresPage)
  },
  {
    path: 'gestores',
    loadComponent: () => import('./pages/gestores/gestores.page').then((m) => m.GestoresPage)
  },
  {
    path: 'ordens-servico',
    loadComponent: () => import('./pages/ordens-servico/ordens-servico.page').then((m) => m.OrdensServicoPage)
  },
  {
    path: 'dashboard-checklists',
    loadComponent: () => import('./pages/dashboard-checklists/dashboard-checklists.page').then((m) => m.DashboardChecklistsPage)
  }
];