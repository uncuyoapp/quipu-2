/**
 * Registro centralizado de iconos de la aplicación.
 * Permite mapear acciones y elementos de la UI a iconos específicos,
 * facilitando cambios globales y mejorando la semántica en los templates.
 */
export const APP_ICONS = {
  actions: {
    add: 'ionAdd',
    edit: 'ionPencilOutline',
    create: 'ionCreateOutline',
    delete: 'ionTrashOutline',
    save: 'ionSave',
    close: 'ionCloseOutline',
    refresh: 'ionRefresh',
    sync: 'ionSyncOutline',
    download: 'ionDownloadOutline',
    filter: 'ionFilterOutline',
    funnel: 'ionFunnel',
    move: 'ionMoveOutline',
    search: 'ionSearch',
    hide: 'ionEyeOffOutline',
    draft: 'ionCloudOfflineOutline',
    publish: 'ionCloudDoneOutline',
  },
  nav: {
    back: 'ionArrowBackOutline',
    forward: 'ionArrowForwardOutline',
    chevronBack: 'ionChevronBackOutline',
    chevronForward: 'ionChevronForwardOutline',
    chevronDown: 'ionChevronDownOutline',
    chevronUp: 'ionChevronUp',
    menu: 'ionMenu',
    reorder: 'ionReorderThreeOutline',
  },
  ui: {
    search: 'ionSearch',
    expand: 'ionExpandOutline',
    contract: 'ionContractOutline',
    time: 'ionTimeOutline',
    calendar: 'ionCalendarOutline',
    eye: 'ionEyeOutline',
    eyeOff: 'ionEyeOffOutline',
    heart: 'ionHeart',
    toggle: 'ionToggleOutline',
  },
  status: {
    info: 'ionInformationCircleOutline',
    warning: 'ionWarningOutline',
    alert: 'ionAlertCircleOutline',
    success: 'ionCheckmarkCircleOutline',
    error: 'ionCloseCircleOutline',
    check: 'ionCheckmarkOutline',
  },
  viz: {
    chart: 'ionStatsChartOutline',
    grid: 'ionGridOutline',
    apps: 'ionApps',
    document: 'ionDocumentTextOutline',
    image: 'ionImageOutline',
    business: 'ionBusinessOutline',
  }
} as const;
