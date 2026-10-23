const express = require("express");
const { PrismaClient } = require("@prisma/client");

const {
  authenticateToken,
} = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

/*
  Helper:
  Check whether the logged-in user can access a project.
*/
async function canAccessProject(user, projectId) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      members: true,
    },
  });

  if (!project) {
    return {
      allowed: false,
      project: null,
    };
  }

  if (user.role === "ADMIN") {
    return {
      allowed: true,
      project,
    };
  }

  if (
    user.role === "PROJECT_MANAGER" &&
    project.managerId === user.userId
  ) {
    return {
      allowed: true,
      project,
    };
  }

  const isMember = project.members.some(
    (member) => member.userId === user.userId
  );

  return {
    allowed: isMember,
    project,
  };
}

/*
  GET /api/tasks
  Get tasks visible to the current user.
*/
router.get("/", authenticateToken, async (req, res) => {
  try {
    const projectId = req.query.projectId
      ? Number(req.query.projectId)
      : null;

    let where = {};

    if (projectId) {
      where.projectId = projectId;
    }

    // Admin can see everything.
    if (req.user.role === "ADMIN") {
      // No additional filter.
    }

    // Project Manager sees tasks from projects they manage.
    else if (req.user.role === "PROJECT_MANAGER") {
      where.project = {
        managerId: req.user.userId,
      };
    }

    // Team Member sees tasks assigned to them
    // or tasks in projects they belong to.
    else if (req.user.role === "TEAM_MEMBER") {
      where.OR = [
        {
          assignedToId: req.user.userId,
        },
        {
          project: {
            members: {
              some: {
                userId: req.user.userId,
              },
            },
          },
        },
      ];
    }

    // Viewer sees tasks from projects they belong to.
    else if (req.user.role === "VIEWER") {
      where.project = {
        members: {
          some: {
            userId: req.user.userId,
          },
        },
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(tasks);
  } catch (error) {
    console.error("Fetch tasks error:", error);

    res.status(500).json({
      error: "Failed to fetch tasks",
    });
  }
});

/*
  GET /api/tasks/:id
*/
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const taskId = Number(req.params.id);

    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: {
          include: {
            members: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    const access = await canAccessProject(
      req.user,
      task.projectId
    );

    if (!access.allowed) {
      return res.status(403).json({
        error: "You do not have access to this task",
      });
    }

    res.json(task);
  } catch (error) {
    console.error("Fetch task error:", error);

    res.status(500).json({
      error: "Failed to fetch task",
    });
  }
});

/*
  POST /api/tasks
  Admin or Project Manager can create tasks.
*/
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      projectId,
      assignedToId,
      dueDate,
    } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({
        error: "Title and projectId are required",
      });
    }

    const project = await prisma.project.findUnique({
      where: {
        id: Number(projectId),
      },
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
        error: "Only Admin or Project Manager can create tasks",
      });
    }

    let assignedUser = null;

    if (assignedToId) {
      assignedUser = await prisma.user.findUnique({
        where: {
          id: Number(assignedToId),
        },
      });

      if (!assignedUser || !assignedUser.isActive) {
        return res.status(400).json({
          error: "Invalid assigned user",
        });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        projectId: Number(projectId),
        assignedToId: assignedToId
          ? Number(assignedToId)
          : null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error("Create task error:", error);

    res.status(500).json({
      error: "Failed to create task",
    });
  }
});

/*
  PUT /api/tasks/:id

  IMPORTANT:
  Optimistic concurrency control.

  Client sends:
  {
    "title": "...",
    "version": 1
  }

  If database version is no longer 1,
  return HTTP 409 Conflict.
*/
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const taskId = Number(req.params.id);

    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: true,
      },
    });

    if (!task) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    const {
      title,
      description,
      status,
      assignedToId,
      dueDate,
      version,
    } = req.body;

    if (version === undefined) {
      return res.status(400).json({
        error: "Version is required for updates",
      });
    }

    if (Number(version) !== task.version) {
      return res.status(409).json({
        error:
          "Conflict: task was modified by another user",
        currentVersion: task.version,
      });
    }

    const isAdmin = req.user.role === "ADMIN";

    const isManager =
      req.user.role === "PROJECT_MANAGER" &&
      task.project.managerId === req.user.userId;

    const isAssignedMember =
      req.user.role === "TEAM_MEMBER" &&
      task.assignedToId === req.user.userId;

    if (!isAdmin && !isManager && !isAssignedMember) {
      return res.status(403).json({
        error: "You do not have permission to update this task",
      });
    }

    const updatedTask = await prisma.task.updateMany({
      where: {
        id: taskId,
        version: Number(version),
      },
      data: {
        ...(title !== undefined && {
          title,
        }),

        ...(description !== undefined && {
          description,
        }),

        ...(status !== undefined && {
          status,
        }),

        ...(assignedToId !== undefined && {
          assignedToId: assignedToId
            ? Number(assignedToId)
            : null,
        }),

        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),

        version: {
          increment: 1,
        },
      },
    });

    if (updatedTask.count === 0) {
      return res.status(409).json({
        error:
          "Conflict: task was modified by another user",
      });
    }

    const result = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(result);
  } catch (error) {
    console.error("Update task error:", error);

    res.status(500).json({
      error: "Failed to update task",
    });
  }
});

/*
  DELETE /api/tasks/:id
  Admin or Project Manager can delete.
*/
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const taskId = Number(req.params.id);

    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: true,
      },
    });

    if (!task) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    const isAdmin = req.user.role === "ADMIN";

    const isManager =
      req.user.role === "PROJECT_MANAGER" &&
      task.project.managerId === req.user.userId;

    if (!isAdmin && !isManager) {
      return res.status(403).json({
        error: "Only Admin or Project Manager can delete tasks",
      });
    }

    await prisma.task.delete({
      where: {
        id: taskId,
      },
    });

    res.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);

    res.status(500).json({
      error: "Failed to delete task",
    });
  }
});

module.exports = router;