const express = require("express");
const { PrismaClient } = require("@prisma/client");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

/*
  GET /api/projects
  - Admin: sees all projects
  - Project Manager: sees projects they manage
  - Team Member / Viewer: sees projects they belong to
*/
router.get("/", authenticateToken, async (req, res) => {
  try {
    let where = {};

    if (req.user.role === "ADMIN") {
      where = {};
    } else if (req.user.role === "PROJECT_MANAGER") {
      where = {
        managerId: req.user.userId,
      };
    } else {
      where = {
        members: {
          some: {
            userId: req.user.userId,
          },
        },
      };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(projects);
  } catch (error) {
    console.error("Fetch projects error:", error);
    res.status(500).json({
      error: "Failed to fetch projects",
    });
  }
});

/*
  GET /api/projects/:id
*/
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const projectId = Number(req.params.id);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        error: "Project not found",
      });
    }

    // Admin can see everything
    if (req.user.role === "ADMIN") {
      return res.json(project);
    }

    // Manager can see their own projects
    if (
      req.user.role === "PROJECT_MANAGER" &&
      project.managerId === req.user.userId
    ) {
      return res.json(project);
    }

    // Member/viewer must belong to project
    const isMember = project.members.some(
      (member) => member.userId === req.user.userId
    );

    if (!isMember) {
      return res.status(403).json({
        error: "You do not have access to this project",
      });
    }

    res.json(project);
  } catch (error) {
    console.error("Fetch project error:", error);

    res.status(500).json({
      error: "Failed to fetch project",
    });
  }
});

/*
  POST /api/projects
  Only Admin can create projects.
*/
router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { name, description, managerId } = req.body;

      if (!name || !managerId) {
        return res.status(400).json({
          error: "Name and managerId are required",
        });
      }

      const manager = await prisma.user.findFirst({
        where: {
          id: Number(managerId),
          role: "PROJECT_MANAGER",
          isActive: true,
        },
      });

      if (!manager) {
        return res.status(400).json({
          error: "Invalid project manager",
        });
      }

      const project = await prisma.project.create({
        data: {
          name,
          description: description || null,
          managerId: manager.id,
          members: {
            create: {
              userId: manager.id,
              role: "PROJECT_MANAGER",
            },
          },
        },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          members: true,
        },
      });

      res.status(201).json(project);
    } catch (error) {
      console.error("Create project error:", error);

      res.status(500).json({
        error: "Failed to create project",
      });
    }
  }
);

/*
  PUT /api/projects/:id
  Admin or the assigned Project Manager can update.
*/
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const projectId = Number(req.params.id);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({
        error: "Project not found",
      });
    }

    const isAdmin = req.user.role === "ADMIN";
    const isManager =
      req.user.role === "PROJECT_MANAGER" &&
      project.managerId === req.user.userId;

    if (!isAdmin && !isManager) {
      return res.status(403).json({
        error: "You do not have permission to update this project",
      });
    }

    const { name, description, archived } = req.body;

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(archived !== undefined && { archived }),
      },
    });

    res.json(updatedProject);
  } catch (error) {
    console.error("Update project error:", error);

    res.status(500).json({
      error: "Failed to update project",
    });
  }
});

/*
  DELETE /api/projects/:id
  Only Admin can delete.
*/
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const projectId = Number(req.params.id);

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return res.status(404).json({
          error: "Project not found",
        });
      }

      await prisma.project.delete({
        where: { id: projectId },
      });

      res.json({
        message: "Project deleted successfully",
      });
    } catch (error) {
      console.error("Delete project error:", error);

      res.status(500).json({
        error: "Failed to delete project",
      });
    }
  }
);

module.exports = router;