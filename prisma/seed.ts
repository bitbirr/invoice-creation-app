import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.issuerProfile.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      legalName: "BitBirr Technology Solutions",
      address: "Addis Ababa, Ethiopia",
      email: "billing@bitbirr.nl",
      phone: "",
      taxId: "",
      defaultCurrency: "ETB",
      defaultTaxRateBps: 1500,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
