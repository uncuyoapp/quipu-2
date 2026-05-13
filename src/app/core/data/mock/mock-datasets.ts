import mockDatasets from '@assets/mock/datasets.json';

/** Estructura de un ítem de dimensión en los mocks */
interface MockDimensionItem {
  id: number | string;
  name: string;
  selected?: boolean;
}

/** Estructura de una dimensión en los mocks */
interface MockDimensionRaw {
  id: number | string;
  name: string;
  nameView: string;
  selected?: boolean;
  items: MockDimensionItem[];
}

/** Estructura de un dataset en los archivos JSON de mock */
export interface MockDatasetRaw {
  id: number | string;
  name?: string;
  description?: string;
  dimensions: MockDimensionRaw[];
  isPercentage?: boolean;
  allowsAddingData?: boolean;
  unit?: string;
  periodicity?: string;
  temporal?: string;
  lastModified?: string;
  enableRollUp?: boolean;
  rowData?: Record<string, unknown>[];
}

export const MOCK_DATASETS: MockDatasetRaw[] = mockDatasets.datasets as MockDatasetRaw[];

