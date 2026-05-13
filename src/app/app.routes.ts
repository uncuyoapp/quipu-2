import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { loginGuard } from '@core/guards/login.guard';
import { UserInfoComponent } from '@pages/user-info/user-info.component';
import { MainComponent } from './layout/main/main.component';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [loginGuard],
  },
  {
    path: 'login/:recovery-token',
    component: LoginComponent,
    canActivate: [loginGuard],
  },
  {
    path: '',
    component: MainComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'about',
        loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent),
        data: { breadcrumb: 'Acerca de QUIPU' },
      },
      {
        path: 'search',
        loadComponent: () => import('./pages/search/search.component').then(m => m.SearchComponent),
        data: { breadcrumb: 'Buscador general' },
      },
      {
        path: 'thematic/:id',
        loadComponent: () => import('./pages/thematic/thematic.component').then(m => m.ThematicComponent),
        data: { breadcrumb: 'Temáticas' },
      },
      {
        path: 'user',
        component: UserInfoComponent,
        data: { breadcrumb: 'Mi perfil' },
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/user-info/components/user-profile-info/user-profile-info.component').then(m => m.UserProfileInfoComponent),
          },
          {
            path: 'change-password',
            loadComponent: () => import('./pages/user-info/components/user-password-edit/user-password-edit.component').then(m => m.UserPasswordEditComponent),
            data: { breadcrumb: 'Cambio de contraseña' },
          },
          {
            path: 'edit-email',
            loadComponent: () => import('./pages/user-info/components/user-email-edit/user-email-edit.component').then(m => m.UserEmailEditComponent),
            data: { breadcrumb: 'Editar correo electrónico' },
          },
          {
            path: 'edit-name',
            loadComponent: () => import('./pages/user-info/components/user-name-edit/user-name-edit.component').then(m => m.UserNameEditComponent),
            data: { breadcrumb: 'Editar nombre y apellido' },
          },
          {
            path: 'edit-work-area',
            loadComponent: () => import('./pages/user-info/components/user-work-area-edit/user-work-area-edit.component').then(m => m.UserWorkAreaEditComponent),
            data: { breadcrumb: 'Editar área de trabajo' },
          }
        ]
      },
      {
        path: 'visualization',
        loadComponent: () => import('./pages/visualization/visualization.component').then(m => m.VisualizationComponent),
      },
      {
        path: 'visualizations',
        loadComponent: () => import('./pages/visualizations-list/visualizations-list.component').then(m => m.VisualizationsListComponent),
        data: { breadcrumb: 'Explorar visualizaciones' },
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
