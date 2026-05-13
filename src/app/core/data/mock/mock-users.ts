import { InformationUnit } from '@models/domain/information-unit.model';
import { User } from '@models/domain/user.model';
import mockUsers from '@assets/mock/users.json';
import mockInformationUnits from '@assets/mock/information-units.json';

export const MOCK_INFORMATION_UNITS: InformationUnit[] = mockInformationUnits as InformationUnit[];

export const MOCK_USERS: User[] = mockUsers.users as User[];

// Usuario actual simulado (para propósitos de testing)
export const CURRENT_MOCK_USER: User = MOCK_USERS[0]; // Admin por defecto

// Credenciales válidas para login mock
export const VALID_MOCK_CREDENTIALS = mockUsers.credentials;

export const VALID_RECOVERY_TOKENS = mockUsers.recoveryTokens;

