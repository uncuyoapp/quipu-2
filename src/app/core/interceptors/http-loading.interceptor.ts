import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoadingService } from '@services';
import { finalize } from 'rxjs';
import { SILENT_HTTP } from '../http/tokens';

/**
 * Interceptor encargado de gestionar el estado de carga global de la aplicación.
 * Activa el LoadingService al inicio de una petición y lo desactiva al finalizar.
 * Permite omitir este comportamiento mediante el token SILENT_HTTP.
 */
export const httpLoadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  const isSilent = req.context.get(SILENT_HTTP);

  if (!isSilent) {
    loading.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (!isSilent) {
        loading.hide();
      }
    })
  );
};