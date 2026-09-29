import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { httpErrorInterceptor } from '@core/interceptors/http-error.interceptor';
import { httpLoadingInterceptor } from '@core/interceptors/http-loading.interceptor';
import { environment } from '@environments/environment';
import { provideIcons, provideNgIconsConfig } from '@ng-icons/core';
import {
  ionAdd,
  ionAlertCircleOutline,
  ionApps,
  ionArrowBackOutline,
  ionArrowForwardOutline,
  ionBusinessOutline,
  ionCalendarOutline,
  ionCheckmarkCircleOutline,
  ionCheckmarkOutline,
  ionChevronBackOutline,
  ionChevronDownOutline,
  ionChevronForwardOutline,
  ionChevronUp,
  ionCloseCircleOutline,
  ionCloseOutline,
  ionCloudDoneOutline,
  ionCloudOfflineOutline,
  ionContractOutline,
  ionCreateOutline,
  ionDocumentTextOutline,
  ionDownloadOutline,
  ionExpandOutline,
  ionEyeOffOutline,
  ionEyeOutline,
  ionFilterOutline,
  ionFunnel,
  ionGridOutline,
  ionHeart,
  ionImageOutline,
  ionInformationCircleOutline,
  ionMenu,
  ionMoveOutline,
  ionPencilOutline,
  ionRefresh,
  ionReorderThreeOutline,
  ionSave,
  ionSearch,
  ionStatsChartOutline,
  ionSyncOutline,
  ionTimeOutline,
  ionToggleOutline,
  ionTrashOutline,
  ionWarningOutline
} from '@ng-icons/ionicons';
import { provideDataVisualizerCharts, provideDataVisualizerTables } from '@uncuyoapp/ngx-data-visualizer';
import { routes } from './app.routes';
import { IAuthProvider } from './core/data/auth.provider';
import { IDataProvider } from './core/data/data.provider';
import { MockAuthProvider } from './core/data/providers/mock-auth.provider';
import { MockDataProvider } from './core/data/providers/mock-data.provider';
import { QuipuApiAuthProvider } from './core/data/providers/quipu-api-auth.provider';
import { QuipuApiProvider } from './core/data/providers/quipu-api.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([
        ...(environment.production ? [httpLoadingInterceptor] : []),
        httpErrorInterceptor,
        authInterceptor
      ])
    ),
    provideIcons({
      ionAdd,
      ionAlertCircleOutline,
      ionApps,
      ionArrowBackOutline,
      ionArrowForwardOutline,
      ionBusinessOutline,
      ionCalendarOutline,
      ionCheckmarkCircleOutline,
      ionCheckmarkOutline,
      ionChevronBackOutline,
      ionChevronDownOutline,
      ionChevronForwardOutline,
      ionChevronUp,
      ionCloseCircleOutline,
      ionCloseOutline,
      ionCloudDoneOutline,
      ionCloudOfflineOutline,
      ionContractOutline,
      ionCreateOutline,
      ionDocumentTextOutline,
      ionDownloadOutline,
      ionExpandOutline,
      ionEyeOffOutline,
      ionEyeOutline,
      ionFilterOutline,
      ionFunnel,
      ionGridOutline,
      ionHeart,
      ionImageOutline,
      ionInformationCircleOutline,
      ionMenu,
      ionMoveOutline,
      ionPencilOutline,
      ionRefresh,
      ionReorderThreeOutline,
      ionSave,
      ionSearch,
      ionStatsChartOutline,
      ionSyncOutline,
      ionTimeOutline,
      ionToggleOutline,
      ionTrashOutline,
      ionWarningOutline
    }),
    provideNgIconsConfig({ size: '1.2em' }),
    provideDataVisualizerCharts(),
    provideDataVisualizerTables(),
    {
      provide: IDataProvider,
      useClass: environment.useMockData ? MockDataProvider : QuipuApiProvider,
    },
    {
      provide: IAuthProvider,
      useClass: environment.useMockData ? MockAuthProvider : QuipuApiAuthProvider,
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:1000'
    })
  ]
};
