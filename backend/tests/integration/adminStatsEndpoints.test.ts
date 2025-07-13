import request from "supertest";
import app from "../../src/app";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

describe("Admin Stats Endpoints", () => {
  let adminToken: string;
  let userToken: string;
  
  beforeAll(async () => {
    // Create admin user
    const hashedPassword = await bcrypt.hash("password", 12);
    const admin = await prisma.user.create({
      data: {
        email: "admin@test.com",
        password: hashedPassword,
        nom: "Admin",
        prenom: "Test",
        role: "ADMIN",
      },
    });

    // Create regular user
    const user = await prisma.user.create({
      data: {
        email: "user@test.com",
        password: hashedPassword,
        nom: "User",
        prenom: "Test",
        role: "USER",
      },
    });

    // Get admin token
    const adminLoginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@test.com",
        password: "password",
      });
    adminToken = adminLoginResponse.body.token;

    // Get user token
    const userLoginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "user@test.com",
        password: "password",
      });
    userToken = userLoginResponse.body.token;

    // Create test data across 12 months
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(startDate);
      monthDate.setMonth(monthDate.getMonth() + i);
      
      // Create users for this month
      for (let j = 0; j < (i + 1) * 2; j++) {
        await prisma.user.create({
          data: {
            email: `user-${i}-${j}@test.com`,
            password: hashedPassword,
            nom: `User${i}`,
            prenom: `Test${j}`,
            role: "USER",
            createdAt: monthDate,
          },
        });
      }

      // Create orders and invoices for this month
      for (let k = 0; k < (i + 1) * 3; k++) {
        const order = await prisma.commande.create({
          data: {
            userId: user.id,
            titre: `Test Order ${i}-${k}`,
            description: `Test order for month ${i}`,
            statut: "EN_ATTENTE",
            priorite: "NORMALE",
            amount: Math.round((100.00 + (i * 10)) * 100), // Convert to centimes
            createdAt: monthDate,
          },
        });

        // Create paid invoice for this order
        await prisma.invoice.create({
          data: {
            commandeId: order.id,
            number: `INV-TEST-${i}-${k}`,
            amount: Math.round((120.00 + (i * 12)) * 100), // Convert to centimes
            taxAmount: Math.round((120.00 + (i * 12)) * 100 * 0.2),
            status: "PAID",
            createdAt: monthDate,
          },
        });
      }
    }
  });

  afterAll(async () => {
    await prisma.invoice.deleteMany();
    await prisma.commande.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe("GET /api/admin/stats", () => {
    it("should return 403 for non-admin users", async () => {
      const response = await request(app)
        .get("/api/admin/stats")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it("should return 401 for unauthenticated requests", async () => {
      const response = await request(app)
        .get("/api/admin/stats");

      expect(response.status).toBe(401);
    });

    it("should return monthly stats for admin users", async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get("/api/admin/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(300); // Performance requirement
      
      const { months, revenue, newUsers, orders } = response.body;
      
      // Should return exactly 12 months
      expect(months).toHaveLength(12);
      expect(revenue).toHaveLength(12);
      expect(newUsers).toHaveLength(12);
      expect(orders).toHaveLength(12);
      
      // Months should be in YYYY-MM format
      months.forEach((month: string) => {
        expect(month).toMatch(/^\d{4}-\d{2}$/);
      });
      
      // Should have data (we created test data for all months)
      const totalRevenue = revenue.reduce((sum: number, val: number) => sum + val, 0);
      const totalUsers = newUsers.reduce((sum: number, val: number) => sum + val, 0);
      const totalOrders = orders.reduce((sum: number, val: number) => sum + val, 0);
      
      expect(totalRevenue).toBeGreaterThan(0);
      expect(totalUsers).toBeGreaterThan(0);
      expect(totalOrders).toBeGreaterThan(0);
    });

    it("should handle months with no data (return 0)", async () => {
      // Clear all test data
      await prisma.invoice.deleteMany();
      await prisma.commande.deleteMany();
      
      const response = await request(app)
        .get("/api/admin/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      const { months, revenue, newUsers, orders } = response.body;
      
      expect(months).toHaveLength(12);
      expect(revenue).toHaveLength(12);
      expect(newUsers).toHaveLength(12);
      expect(orders).toHaveLength(12);
      
      // Should all be 0 for orders and revenue (but might have users from setup)
      orders.forEach((count: number) => {
        expect(count).toBe(0);
      });
      
      revenue.forEach((amount: number) => {
        expect(amount).toBe(0);
      });
    });
  });

  describe("Performance benchmark", () => {
    it("should respond within 300ms with large dataset", async () => {
      // Create a larger dataset
      const promises = [];
      const testUser = await prisma.user.findFirst({ where: { role: "USER" } });
      
      if (testUser) {
        for (let i = 0; i < 100; i++) {
          const orderPromise = prisma.commande.create({
            data: {
              userId: testUser.id,
              titre: `Perf Test ${i}`,
              description: "Performance test order",
              statut: "EN_ATTENTE",
              priorite: "NORMALE",
              amount: 12000, // 120.00 in centimes
            },
          }).then(order => 
            prisma.invoice.create({
              data: {
                commandeId: order.id,
                number: `INV-PERF-${i}`,
                amount: 12000, // 120.00 in centimes
                taxAmount: 2400, // 20% VAT
                status: "PAID",
              },
            })
          );
          promises.push(orderPromise);
        }
        
        await Promise.all(promises);
      }

      const startTime = Date.now();
      
      const response = await request(app)
        .get("/api/admin/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(300);
    });
  });
});