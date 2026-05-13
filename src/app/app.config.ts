import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideServiceWorker } from '@angular/service-worker';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
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
import { IDataProvider } from './core/data/data.provider';
import { MockDataProvider } from './core/data/providers/mock-data.provider';
import { QuipuApiProvider } from './core/data/providers/quipu-api.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        ...(environment.production ? [httpLoadingInterceptor] : [])
      ]
      )),
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
    // Data Provider configuration
    {
      provide: IDataProvider,
      useClass: environment.useMockData ? MockDataProvider : QuipuApiProvider,
    }, provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:1000'
    })
  ]
};
