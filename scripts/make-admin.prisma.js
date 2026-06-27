const prisma = require("../prisma/prisma");

const email = process.argv[2];

const makeAdmin = async () => {
  if (!email) {
    throw new Error("Usage: npm run user:make-admin -- mirbek@example.com");
  }

  const users = await prisma.$queryRaw`
    UPDATE "Users"
    SET role = 'admin', "updatedAt" = NOW()
    WHERE email = ${email}
    RETURNING id, name, email, role::text AS role, "updatedAt"
  `;

  const user = users[0];

  if (!user) {
    throw Object.assign(new Error(`User not found with email: ${email}`), {
      code: "P2025",
    });
  }

  console.log("User role updated:");
  console.table([
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      updatedAt: user.updatedAt.toISOString(),
    },
  ]);
};

makeAdmin()
  .catch((error) => {
    if (error.code === "P2025") {
      console.error(`User not found with email: ${email}`);
    } else {
      console.error(error.message);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
