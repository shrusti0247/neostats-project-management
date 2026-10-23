
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/comments/task/:taskId
router.get("/task/:taskId", authenticateToken, async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: { members: true },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const isMember = task.project.members.some(
      (m) => m.userId === req.user.userId
    );

    const canAccess =
      req.user.role === "ADMIN" ||
      (req.user.role === "PROJECT_MANAGER" &&
        task.project.managerId === req.user.userId) ||
      isMember;

    if (!canAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// POST /api/comments
// Body: { "taskId": 1, "content": "Work is underway." }
router.post("/", authenticateToken, async (req, res) => {
  try {
    const taskId = Number(req.body.taskId);
    const content = typeof req.body.content === "string"
      ? req.body.content.trim()
      : "";

    if (!Number.isInteger(taskId) || taskId <= 0 || !content) {
      return res.status(400).json({
        error: "A valid taskId and non-empty content are required",
      });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: { members: true },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const isMember = task.project.members.some(
      (m) => m.userId === req.user.userId
    );

    const canAccess =
      req.user.role === "ADMIN" ||
      (req.user.role === "PROJECT_MANAGER" &&
        task.project.managerId === req.user.userId) ||
      isMember;

    if (!canAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (req.user.role === "VIEWER") {
      return res.status(403).json({ error: "Viewers cannot comment" });
    }

    const comment = await prisma.comment.create({
      data: {
        taskId,
        content,
        authorId: req.user.userId,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

// DELETE /api/comments/:id
// Authors can delete their own comments; Admin can delete any.
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (
      req.user.role !== "ADMIN" &&
      comment.authorId !== req.user.userId
    ) {
      return res.status(403).json({ error: "Permission denied" });
    }

    await prisma.comment.delete({ where: { id } });

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

module.exports = router;
