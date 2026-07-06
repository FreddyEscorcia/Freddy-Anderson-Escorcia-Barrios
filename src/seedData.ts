import { Instalacion, Cuadrilla } from "./types";

export const MOCK_CUADRILLAS: Cuadrilla[] = [
  {
    id: "CUAD-01",
    nombre: "Cuadrilla Alfa - FO / GPON",
    integrantes: "Juan Pérez (Líder), Carlos Gómez (Técnico 1)",
    ciudad: "Bogotá",
    zonal: "Zonal Centro",
    activo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "CUAD-02",
    nombre: "Cuadrilla Beta - Fibra Metropolitana",
    integrantes: "Andrés Rojas (Líder), Mateo Silva (Técnico 1)",
    ciudad: "Medellín",
    zonal: "Zonal Noroccidente",
    activo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "CUAD-03",
    nombre: "Cuadrilla Gamma - Starlink Especializada",
    integrantes: "Luis Torres (Líder), Fernando Ruiz (Ayudante)",
    ciudad: "Cali",
    zonal: "Zonal Suroccidente",
    activo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "CUAD-04",
    nombre: "Cuadrilla Delta - Enrutamientos Rápidos",
    integrantes: "Felipe Soto (Líder), Oscar Peña (Fusionador)",
    ciudad: "Barranquilla",
    zonal: "Zonal Norte",
    activo: true,
    createdAt: new Date().toISOString()
  }
];

export function generateMockInstalaciones(): Instalacion[] {
  const now = new Date();
  
  // Create helper to generate date string relative to today
  const relativeDate = (daysOffset: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString();
  };

  return [
    {
      id: "OT-99482",
      ot: "OT-99482",
      ordenCs: "CS-483920",
      cliente: "Banco Nacional de Crédito",
      subcliente: "Sucursal Av. Chile",
      productoTecnologia: "F.O.",
      bwCapacidad: "1 Gbps Dedicado",
      zonal: "Zonal Centro",
      departamento: "Bogotá D.C.",
      ciudad: "Bogotá",
      direccion: "Carrera 7 #72-10",
      coordenadas: "4.6562,-74.0560",
      fechaOt: relativeDate(-6),
      fechaTentativaEntrega: relativeDate(-1), // Past delivery - Overdue SLA (Rojo)
      diasObjetivo: 5,
      semaforo: "Rojo",
      cuadrilla: "CUAD-01",
      cuadrillaNombre: "Cuadrilla Alfa - FO / GPON",
      jefeZonal: "Ing. Alejandro Mendoza",
      gestor: "Marta Gómez",
      implementador: "Juan Pérez",
      estado: "En proceso",
      porcentajeAvance: 50, // Done with 2 phases: Enrutamiento (Completed) and Tendido Externo (Completed)
      fasesFin: {
        enrutamientos: relativeDate(-5),
        tendidoExterno: relativeDate(-3),
        tendidoInterno: null,
        instalacionEquipos: null
      },
      comentarios: [
        {
          autor: "Ing. Alejandro Mendoza",
          autorEmail: "a.mendoza@telecom.com",
          fecha: relativeDate(-5),
          comentario: "Enrutamientos de fibra principal completados desde el Nodo 12."
        },
        {
          autor: "Marta Gómez",
          autorEmail: "m.gomez@telecom.com",
          fecha: relativeDate(-3),
          comentario: "Tendido externo finalizado hasta la fachada del banco. Pendiente autorización interna por administración del edificio."
        }
      ],
      createdAt: relativeDate(-6),
      updatedAt: relativeDate(-3),
      createdBy: "SISTEMA_EXCEL"
    },
    {
      id: "OT-99501",
      ot: "OT-99501",
      ordenCs: "CS-484112",
      cliente: "Supermercados El Éxito",
      subcliente: "Express El Poblado",
      productoTecnologia: "GPON",
      bwCapacidad: "300 Mbps Simétrico",
      zonal: "Zonal Noroccidente",
      departamento: "Antioquia",
      ciudad: "Medellín",
      direccion: "Calle 10 #43E-12",
      coordenadas: "6.2089,-75.5679",
      fechaOt: relativeDate(-3),
      fechaTentativaEntrega: relativeDate(2), // Delivery in 2 days (Amarillo)
      diasObjetivo: 5,
      semaforo: "Amarillo",
      cuadrilla: "CUAD-02",
      cuadrillaNombre: "Cuadrilla Beta - Fibra Metropolitana",
      jefeZonal: "Ing. Laura Restrepo",
      gestor: "Andrés Silva",
      implementador: "Andrés Rojas",
      estado: "En proceso",
      porcentajeAvance: 25, // Done with 1 phase: Enrutamientos (automatic because cajaTieneSplitter: true)
      fasesFin: {
        enrutamientos: relativeDate(-3),
        tendidoExterno: null,
        tendidoInterno: null,
        instalacionEquipos: null,
        cajaTieneSplitter: true // This is the GPON condition! It auto-completes Phase 1
      },
      comentarios: [
        {
          autor: "Andrés Silva",
          autorEmail: "a.silva@telecom.com",
          fecha: relativeDate(-3),
          comentario: "GPON: Caja de última milla ya contiene el Splitter de distribución. Fase de enrutamiento se marca automática como completada (Valor 0/Auto)."
        }
      ],
      createdAt: relativeDate(-3),
      updatedAt: relativeDate(-3),
      createdBy: "SISTEMA_EXCEL"
    },
    {
      id: "OT-99520",
      ot: "OT-99520",
      ordenCs: "CS-484501",
      cliente: "Minera Andina S.A.",
      subcliente: "Campamento Exploración",
      productoTecnologia: "Starlink",
      bwCapacidad: "220 Mbps Satelital",
      zonal: "Zonal Suroccidente",
      departamento: "Cauca",
      ciudad: "Popayán",
      direccion: "Km 45 Vía al Tambo",
      coordenadas: "2.4419,-76.6063",
      fechaOt: relativeDate(-1),
      fechaTentativaEntrega: relativeDate(4), // Delivery in 4 days (Verde)
      diasObjetivo: 5,
      semaforo: "Verde",
      cuadrilla: "CUAD-03",
      cuadrillaNombre: "Cuadrilla Gamma - Starlink Especializada",
      jefeZonal: "Ing. Carlos Vivas",
      gestor: "Patricia Hoyos",
      implementador: "Luis Torres",
      estado: "En programación",
      porcentajeAvance: 0,
      fasesFin: {
        instalacionAntena: null
      },
      comentarios: [
        {
          autor: "Patricia Hoyos",
          autorEmail: "p.hoyos@telecom.com",
          fecha: relativeDate(-1),
          comentario: "Se programa cuadrilla especializada en altura para el montaje del mástil y antena Starlink."
        }
      ],
      createdAt: relativeDate(-1),
      updatedAt: relativeDate(-1),
      createdBy: "SISTEMA_EXCEL"
    },
    {
      id: "OT-99411",
      ot: "OT-99411",
      ordenCs: "CS-481102",
      cliente: "Clínica del Norte",
      subcliente: "Urgencias Infantiles",
      productoTecnologia: "F.O.",
      bwCapacidad: "500 Mbps Simétrico",
      zonal: "Zonal Noroccidente",
      departamento: "Antioquia",
      ciudad: "Bello",
      direccion: "Diagonal 55 #45-10",
      coordenadas: "6.3312,-75.5562",
      fechaOt: relativeDate(-10),
      fechaTentativaEntrega: relativeDate(-5),
      diasObjetivo: 5,
      semaforo: "Verde", // Completed on time
      cuadrilla: "CUAD-02",
      cuadrillaNombre: "Cuadrilla Beta - Fibra Metropolitana",
      jefeZonal: "Ing. Laura Restrepo",
      gestor: "Andrés Silva",
      implementador: "Andrés Rojas",
      estado: "Ejecutada",
      porcentajeAvance: 100, // Fully done
      fasesFin: {
        enrutamientos: relativeDate(-9),
        tendidoExterno: relativeDate(-8),
        tendidoInterno: relativeDate(-7),
        instalacionEquipos: relativeDate(-6)
      },
      comentarios: [
        {
          autor: "Andrés Rojas",
          autorEmail: "a.rojas@cuadrilla.com",
          fecha: relativeDate(-6),
          comentario: "Instalación ejecutada con éxito. Entrega de servicio y pruebas de BW realizadas (OK)."
        }
      ],
      createdAt: relativeDate(-10),
      updatedAt: relativeDate(-6),
      createdBy: "SISTEMA_EXCEL"
    }
  ];
}
