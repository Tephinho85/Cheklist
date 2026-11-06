// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';

// Injeção limpa e funcional nativa do Ionic v8+
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // Inicializa a engine do Ionic de forma direta
    provideIonicAngular({}),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
