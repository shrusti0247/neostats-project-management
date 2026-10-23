
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const {
  authenticateToken,
} = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

async function getProjectAccess(user, projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project) return { project: null, allowed: false };

  const isManager =
    user.role === "PROJECT_MANAGER" &&
    project.managerId === user.userId;

  return {
    project,
    allowed:
      user.role === "ADMIN" ||
      isManager ||
      project.members.some((m) => m.userId === user.userId),
    canManage: user.role === "ADMIN" || isManager,
  };
}

// GET /api/team/:projectId
router.get("/:projectId", authenticateToken, async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const access = await getProjectAccess(req.user, projectId);

    if (!access.project) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (!access.allowed) {
      return res.status(403).json({ error: "Access denied" });
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch team members" });
  }
});

// POST /api/team/:projectId
// Body: { "userId": 3, "role": "TEAM_MEMBER" }
router.post("/:projectId", authenticateToken, async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const access = await getProjectAccess(req.user, projectId);

    if (!access.project) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (!access.canManage) {
      return res.status(403).json({ error: "Only Admin or project manager can manage the team" });
    }

    const userId = Number(req.body.userId);
    const role = req.body.role || "TEAM_MEMBER";

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: "A valid userId is required" });
    }

    if (!["PROJECT_MANAGER", "TEAM_MEMBER", "VIEWER"].includes(role)) {
      return res.status(400).json({ error: "Invalid project-level role" });
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      return res.status(404).json({ error: "Active user not found" });
    }

    const member = await prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId, userId },
      },
      update: { role },
      create: { projectId, userId, role },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    res.status(201).json(member);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add or update team member" });
  }
});

// PATCH /api/team/:projectId/:userId
// Body: { "role": "VIEWER" }
router.patch("/:projectId/:userId", authenticateToken, async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const userId = Number(req.params.userId);
    const access = await getProjectAccess(req.user, projectId);

    if (!access.project) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (!access.canManage) {
      return res.status(403).json({ error: "Permission denied" });
    }

    const { role } = req.body;

    if (!["PROJECT_MANAGER", "TEAM_MEMBER", "VIEWER"].includes(role)) {
      return res.status(400).json({ error: "Invalid project-level role" });
    }

    const member = await prisma.projectMember.updateMany({
      where: { projectId, userId },
      data: { role },
    });

    if (member.count === 0) {
      return res.status(404).json({ error: "Team member not found" });
    }

    res.json({ message: "Team member role updated", role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update team member" });
  }
});

// DELETE /api/team/:projectId/:userId
router.delete("/:projectId/:userId", authenticateToken, async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const userId = Number(req.params.userId);
    const access = await getProjectAccess(req.user, projectId);

    if (!access.project) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (!access.canManage) {
      return res.status(403).json({ error: "Permission denied" });
    }

    const removed = await prisma.projectMember.deleteMany({
      where: { projectId, userId },
    });

    if (removed.count === 0) {
      return res.status(404).json({ error: "Team member not found" });
    }

    res.json({ message: "Team member removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to remove team member" });
  }
});

module.exports = router;
