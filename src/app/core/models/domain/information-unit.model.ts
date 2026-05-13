/**
 * @interface InformationUnit
 * @description
 * Representa una “Unidad de Información” institucional (ej. Rectorado, Facultades).
 * Define el contexto de datos y la identidad visual (logos) para la sesión del usuario.
 */
export interface InformationUnit {
  /** Identificador único de la unidad de información */
  id: number;

  /** Nombre completo institucional (ejemplo: “Facultad de Ingeniería”) */
  name: string;

  /** Nombre corto o abreviatura (ejemplo: “FI”, “Rectorado”) */
  shortName?: string;

  /** Descripción o texto explicativo que detalla la función o alcance de la unidad */
  description?: string;

  /** Ruta al logotipo o ícono institucional (formato SVG, PNG, etc.) */
  logo: string;
}
