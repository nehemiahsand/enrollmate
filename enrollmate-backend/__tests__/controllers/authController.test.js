import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import { register, login } from "../../src/controllers/authController.js";
import AuthService from "../../src/services/authService.js";

// Mock AuthService
vi.mock("../../src/services/authService.js");

// Create test app
const app = express();
app.use(express.json());
app.post("/register", register);
app.post("/login", login);

describe("Auth Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        role: "student",
      };

      const mockResponse = {
        token: "test-token",
        user: {
          id: 1,
          name: userData.name,
          email: userData.email,
          role: userData.role,
        },
      };

      AuthService.register.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/register")
        .send(userData)
        .expect(201);

      expect(response.body).toEqual(mockResponse);
      expect(AuthService.register).toHaveBeenCalledWith(userData);
    });

    it("should return 400 if registration fails", async () => {
      const userData = {
        name: "Test User",
        email: "existing@example.com",
        password: "password123",
      };

      AuthService.register.mockRejectedValue(
        new Error("User with this email already exists")
      );

      const response = await request(app)
        .post("/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("User with this email already exists");
    });

    it("should return 400 if required fields are missing", async () => {
      const incompleteData = {
        email: "test@example.com",
      };

      AuthService.register.mockRejectedValue(
        new Error("Name, email, and password are required")
      );

      const response = await request(app)
        .post("/register")
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /login", () => {
    it("should login successfully with valid credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      const mockResponse = {
        token: "test-token",
        user: {
          id: 1,
          name: "Test User",
          email: loginData.email,
          role: "student",
        },
      };

      AuthService.login.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/login")
        .send(loginData)
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(AuthService.login).toHaveBeenCalledWith(loginData);
    });

    it("should return 401 with invalid credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      AuthService.login.mockRejectedValue(
        new Error("Invalid email or password")
      );

      const response = await request(app)
        .post("/login")
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Invalid email or password");
    });

    it("should return 401 if user not found", async () => {
      const loginData = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      AuthService.login.mockRejectedValue(
        new Error("Invalid email or password")
      );

      const response = await request(app)
        .post("/login")
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 401 if email or password is missing", async () => {
      const incompleteData = {
        email: "test@example.com",
      };

      AuthService.login.mockRejectedValue(
        new Error("Email and password are required")
      );

      const response = await request(app)
        .post("/login")
        .send(incompleteData)
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });
});
