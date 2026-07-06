export type Tecnologia = "F.O." | "GPON" | "Starlink";

export type EstadoOT = "En programación" | "En proceso" | "Cliente" | "Soporte" | "Ejecutada" | "Anulada";

export type SemaforoColor = "Verde" | "Amarillo" | "Rojo";

export interface Comentario {
  autor: string;
  autorEmail: string;
  fecha: string;
  comentario: string;
  causaReprogramacion?: string;
}

export interface Gasto {
  id: string;
  fecha: string;
  concepto: string; // e.g., "Combustible", "Viáticos", "Materiales adicionales", "Peajes", "Otros"
  monto: number;
  registradoPor: string;
}

export interface FasesFin {
  enrutamientos?: string | null;
  tendidoExterno?: string | null;
  tendidoInterno?: string | null;
  instalacionEquipos?: string | null;
  instalacionAntena?: string | null;
  cajaTieneSplitter?: boolean; // GPON specific conditional flag
}

export interface Instalacion {
  id: string; // matches "ot"
  ot: string;
  ordenCs: string;
  cliente: string;
  subcliente?: string;
  productoTecnologia: Tecnologia;
  bwCapacidad: string;
  zonal: string;
  departamento: string;
  ciudad: string;
  direccion: string;
  coordenadas?: string;
  fechaOt: string;
  fechaTentativaEntrega: string;
  diasObjetivo: number;
  semaforo: SemaforoColor;
  cuadrilla: string;
  cuadrillaNombre?: string;
  jefeZonal: string;
  gestor: string;
  implementador: string;
  estado: EstadoOT;
  porcentajeAvance: number;
  fasesFin: FasesFin;
  comentarios: Comentario[];
  
  // Escalamiento ODC fields
  escaladaOdc?: boolean;
  fechaEscalamientoOdc?: string | null;
  motivoEscalamientoOdc?: string | null;
  comentariosOdc?: string | null;
  estadoEscalamientoOdc?: "Pendiente" | "En revisión" | "Programado" | "Solucionado" | "Cancelado";
  
  // Gastos associated with the installation
  gastos?: Gasto[];

  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Cuadrilla {
  id: string;
  nombre: string;
  integrantes: string;
  ciudad: string;
  zonal: string;
  activo: boolean;
  createdAt: string;
}
