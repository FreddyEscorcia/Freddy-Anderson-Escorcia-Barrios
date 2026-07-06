import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up body parsing middleware
app.use(express.json());

// Initialize Firebase SDK for server use
let db: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase initialized successfully on Server.");
  } else {
    console.warn("firebase-applet-config.json not found on Server.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase on server:", error);
}

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", dbConnected: !!db });
});

// WEBHOOK ENDPOINT FOR REAL-TIME OT RECEIPT
app.post("/api/webhook/ot", async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];
    // Check if API key is provided and matches
    if (apiKey !== "genesis-secret-key-123") {
      return res.status(401).json({
        success: false,
        error: "No autorizado. El encabezado 'x-api-key' es incorrecto o no fue proporcionado."
      });
    }

    const {
      ot,
      ordenCs,
      cliente,
      subcliente,
      productoTecnologia,
      bwCapacidad,
      zonal,
      departamento,
      ciudad,
      direccion,
      coordenadas,
      fechaOt,
      fechaTentativaEntrega,
      diasObjetivo,
      cuadrilla,
      jefeZonal,
      gestor,
      implementador,
      estado,
      porcentajeAvance,
      fasesFin,
      comentarios
    } = req.body;

    if (!ot || !cliente || !productoTecnologia) {
      return res.status(400).json({
        success: false,
        error: "Campos requeridos faltantes: 'ot', 'cliente', y 'productoTecnologia' son obligatorios."
      });
    }

    const cleanedOT = ot.toString().trim();
    const cleanedTech = productoTecnologia.toString().trim();

    if (!["F.O.", "GPON", "Starlink"].includes(cleanedTech)) {
      return res.status(400).json({
        success: false,
        error: "El campo 'productoTecnologia' es inválido. Debe ser: 'F.O.', 'GPON' o 'Starlink'."
      });
    }

    if (!db) {
      return res.status(503).json({
        success: false,
        error: "El servicio de base de datos no está disponible temporalmente."
      });
    }

    const nowStr = new Date().toISOString();
    const docRef = doc(db, "instalaciones", cleanedOT);

    const calculatedDias = diasObjetivo ? Number(diasObjetivo) : 5;
    const resolvedFechaTentativa = fechaTentativaEntrega || new Date(Date.now() + calculatedDias * 24 * 60 * 60 * 1000).toISOString();

    const finalData = {
      ot: cleanedOT,
      ordenCs: ordenCs || `CS-${Math.floor(100000 + Math.random() * 900000)}`,
      cliente: cliente.trim(),
      subcliente: subcliente || "",
      productoTecnologia: cleanedTech,
      bwCapacidad: bwCapacidad || "100 Mbps",
      zonal: zonal || "Zonal Centro",
      departamento: departamento || "Cundinamarca",
      ciudad: ciudad || "Bogotá",
      direccion: direccion || "Calle Principal #123",
      coordenadas: coordenadas || "4.6097,-74.0817",
      fechaOt: fechaOt || nowStr,
      fechaTentativaEntrega: resolvedFechaTentativa,
      diasObjetivo: calculatedDias,
      semaforo: "Verde",
      cuadrilla: cuadrilla || "",
      cuadrillaNombre: "",
      jefeZonal: jefeZonal || "Jefe Zonal Bogotá",
      gestor: gestor || "Gestor Automático",
      implementador: implementador || "",
      estado: estado || "En programación",
      porcentajeAvance: porcentajeAvance !== undefined ? Number(porcentajeAvance) : 0,
      fasesFin: fasesFin || {},
      comentarios: comentarios || [
        {
          autor: "Sistema CRM Génesis",
          autorEmail: "genesis@telecom-crm.com",
          fecha: nowStr,
          comentario: "Instalación ingresada automáticamente en tiempo real mediante Webhook API."
        }
      ],
      createdAt: nowStr,
      updatedAt: nowStr,
      createdBy: "API_WEBHOOK"
    };

    await setDoc(docRef, finalData);

    res.status(201).json({
      success: true,
      message: `Orden de Trabajo ${cleanedOT} creada con éxito a través del Webhook.`,
      data: finalData
    });
  } catch (err: any) {
    console.error("Webhook endpoint error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Error interno al procesar el webhook."
    });
  }
});

// Vite Middleware for Development / Static serving for Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Telecom Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
