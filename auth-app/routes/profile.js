import express from "express";
const router = express.Router();

export default (auth, protectWrapper) => {
  router.get("/profile", protectWrapper(auth), (req, res) => {
    res.json({ user: req.user });
  });
  return router;
};
