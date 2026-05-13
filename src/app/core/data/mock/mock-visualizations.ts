import { Visualization } from '@models/domain/visualization.model';

import mockVisualizations from '@assets/mock/visualizations.json';

export const MOCK_VISUALIZATIONS: Visualization[] = (mockVisualizations.visualizations as any[]).map(v => ({ ...v, published: true }));

