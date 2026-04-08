require("dotenv").config();

const express = require("express");
const cors = require("cors");
const domainRoutes = require("./routes/domainRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/domain", domainRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server działa na porcie ${PORT}`);
});