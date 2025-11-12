export function protectWrapper(auth) {
  return async (req, res, next) => {
    try {
      await auth.protect(req, res);
      next();
    } catch (err) {
      console.error("Auth error:", err); // log côté serveur
      res.status(401).json({ error: "Unauthorized" });
    }
  };
}
