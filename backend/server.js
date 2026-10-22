const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    message: "Backend is running!",
  });
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch users",
    });
  }
});

const PORT = 5002;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});