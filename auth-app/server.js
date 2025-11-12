import express from "express";
import dotenv from "dotenv";
import { betterAuth } from "better-auth";
import { protectWrapper } from "./wrapper.js";

import publicRoutes from "./routes/public.js";
import profileRoutes from "./routes/profile.js";

dotenv.config();

const app = express();
app.use(express.json());

// Création de l'instance Better Auth
const auth = betterAuth({
  secret: process.env.AUTH_SECRET || "supersecret",
});

// Routes publiques
app.use("/", publicRoutes);

// Routes protégées
app.use("/", profileRoutes(auth, protectWrapper));

app.listen(3000, () =>
  console.log("✅ Serveur lancé sur http://localhost:3000")
);
