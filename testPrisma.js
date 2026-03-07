require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

async function main() {
  const domain = await prisma.domain.create({
    data: {
      domainName: "google.com",
      registrar: "Google Registrar",
      status: "active",
      lastCheckedAt: new Date()
    }
  });

  console.log("Dodano rekord:");
  console.log(domain);
}

main()
  .catch((e) => {
    console.error("Błąd:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });