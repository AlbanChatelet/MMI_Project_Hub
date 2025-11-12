import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Bienvenue sur ton API Better Auth 🚀");
});

export default router;
