
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const teamRoutes = require("./routes/team");
const commentRoutes = require("./routes/comments");

const {
  authenticateToken,
  authorizeRoles,
} = require("./middleware/auth");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/comments", commentRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    message: "Backend is running!",
  });
});

// Admin-only users route
app.get(
  "/api/users",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json(users);
    } catch (error) {
      console.error("Fetch users error:", error);

      res.status(500).json({
        error: "Failed to fetch users",
      });
    }
  }
);

const PORT = 5002;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
