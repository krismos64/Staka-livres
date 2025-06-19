import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Bienvenue sur Staka-livres API 🚀");
});

app.listen(PORT, () => {
  console.log(`Serveur en cours sur http://localhost:${PORT}`);
});
