const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const users = [
    {
      name: "Admin User",
      email: "admin@neostats.com",
      role: "ADMIN",
    },
    {
      name: "Project Manager",
      email: "manager@neostats.com",
      role: "PROJECT_MANAGER",
    },
    {
      name: "Team Member",
      email: "member@neostats.com",
      role: "TEAM_MEMBER",
    },
    {
      name: "Project Viewer",
      email: "viewer@neostats.com",
      role: "VIEWER",
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: {
        email: user.email,
      },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
        isActive: true,
      },
      create: {
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
        isActive: true,
      },
    });
  }

  console.log("Seed users created successfully.");
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });