require("dotenv").config();

const express = require("express");
const cors = require("cors");
const domainRoutes = require("./routes/domainRoutes");
const { connectRedis } = require("./config/redisClient");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/domain", domainRoutes);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`Server działa na porcie ${PORT}`);
    });
  } catch (error) {
    console.error("Błąd przy starcie aplikacji:", error.message);
  }
}

startServer();