import { Thematic } from '@models/domain/thematic.model';
import mockThematics from '@assets/mock/thematics.json';

export const MOCK_THEMATICS_BY_UNIT: Record<number, Thematic[]> = mockThematics as unknown as Record<number, Thematic[]>;

// Mantenemos este para compatibilidad inicial, devolviendo SPF por defecto
export const MOCK_THEMATICS: Thematic[] = MOCK_THEMATICS_BY_UNIT[1];

