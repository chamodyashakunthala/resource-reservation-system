import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Helper: a time N days from today at a given hour (local time)
function at(daysFromNow: number, hour: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  // Clear in dependency order so the seed can be re-run safely
  await prisma.reservation.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.resourceCategory.deleteMany();
  await prisma.user.deleteMany();

  const [adminHash, memberHash] = await Promise.all([
    bcrypt.hash("Admin@123", 10),
    bcrypt.hash("Member@123", 10),
  ]);

  const admin = await prisma.user.create({
    data: { name: "Office Admin", email: "admin@company.test", passwordHash: adminHash, role: "ADMIN" },
  });
  const nimal = await prisma.user.create({
    data: { name: "Nimal Perera", email: "nimal@company.test", passwordHash: memberHash, role: "MEMBER" },
  });
  const sara = await prisma.user.create({
    data: { name: "Sara Fernando", email: "sara@company.test", passwordHash: memberHash, role: "MEMBER" },
  });

  const rooms = await prisma.resourceCategory.create({
    data: { name: "Meeting Rooms", description: "Bookable rooms for meetings and training" },
  });
  const equipment = await prisma.resourceCategory.create({
    data: { name: "Equipment", description: "Shared devices and gear" },
  });
  const vehicles = await prisma.resourceCategory.create({
    data: { name: "Vehicles", description: "Company vehicles for official trips" },
  });
  const workspaces = await prisma.resourceCategory.create({
    data: { name: "Workspaces", description: "Desks and focus areas" },
  });

  const boardroom = await prisma.resource.create({
    data: { categoryId: rooms.id, name: "Boardroom", location: "Floor 3", capacity: 12, description: "Large table, wall display, video conferencing" },
  });
  await prisma.resource.create({
    data: { categoryId: rooms.id, name: "Huddle Room", location: "Floor 2", capacity: 4, description: "Quick stand-ups and calls" },
  });
  await prisma.resource.create({
    data: { categoryId: rooms.id, name: "Training Room", location: "Floor 1", capacity: 30, description: "Classroom layout with projector" },
  });
  const projector = await prisma.resource.create({
    data: { categoryId: equipment.id, name: "Portable Projector", location: "IT Store", description: "HDMI and USB-C" },
  });
  await prisma.resource.create({
    data: { categoryId: equipment.id, name: "DSLR Camera", location: "IT Store", description: "With tripod and spare battery" },
  });
  await prisma.resource.create({
    data: { categoryId: equipment.id, name: "Conference Speaker Kit", location: "IT Store", description: "Bluetooth speakerphone" },
  });
  const van = await prisma.resource.create({
    data: { categoryId: vehicles.id, name: "Company Van", location: "Basement Parking", capacity: 9, description: "9-seater van" },
  });
  await prisma.resource.create({
    data: { categoryId: vehicles.id, name: "Pool Car", location: "Basement Parking", capacity: 4, description: "Compact sedan" },
  });
  await prisma.resource.create({
    data: { categoryId: workspaces.id, name: "Quiet Pod", location: "Floor 2", capacity: 1, description: "Soundproof focus booth" },
  });
  await prisma.resource.create({
    data: { categoryId: workspaces.id, name: "Hot Desk A1", location: "Floor 2", capacity: 1, description: "Shared desk with monitor" },
  });

  // Sample reservations (tomorrow and the day after)
  await prisma.reservation.createMany({
    data: [
      { resourceId: boardroom.id, userId: nimal.id, title: "Sprint planning", startTime: at(1, 10), endTime: at(1, 12) },
      { resourceId: boardroom.id, userId: sara.id, title: "Client review", startTime: at(1, 14), endTime: at(1, 15) },
      { resourceId: projector.id, userId: sara.id, title: "Demo for client", startTime: at(1, 13), endTime: at(1, 16) },
      { resourceId: van.id, userId: admin.id, title: "Team outing", startTime: at(2, 9), endTime: at(2, 17) },
    ],
  });

  console.log("Seed complete: 3 users, 4 categories, 10 resources, 4 reservations");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());