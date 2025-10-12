import { describe, it, expect, beforeEach, vi } from "vitest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AuthService from "../../src/services/authService.js";
import { User } from "../../src/models/index.js";

// Mock the User model
vi.mock("../../src/models/index.js", () => ({
  User: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
  Course: {},
  Enrollment: {},
}));

// Mock bcrypt
vi.mock("bcrypt");

// Mock jsonwebtoken
vi.mock("jsonwebtoken");

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("should successfully register a new user", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        role: "student",
      };

      const hashedPassword = "hashedPassword123";
      const mockUser = {
        id: 1,
        ...userData,
        password: hashedPassword,
        toJSON: function () {
          const { password, ...userWithoutPassword } = this;
          return userWithoutPassword;
        },
      };

      User.findOne.mockResolvedValue(null); // User doesn't exist
      bcrypt.hash.mockResolvedValue(hashedPassword);
      User.create.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue("test-token");

      const result = await AuthService.register(userData);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: userData.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(User.create).toHaveBeenCalledWith({
        name: userData.name,
        email: userData.email,
        passwordHash: hashedPassword,
        role: userData.role,
      });
      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("user");
      expect(result.user).not.toHaveProperty("password");
    });

    it("should throw error if user already exists", async () => {
      const userData = {
        name: "Test User",
        email: "existing@example.com",
        password: "password123",
      };

      User.findOne.mockResolvedValue({ id: 1, email: userData.email });

      await expect(AuthService.register(userData)).rejects.toThrow(
        "Email already exists"
      );
    });

    it("should throw error if required fields are missing", async () => {
      const incompleteData = {
        email: "test@example.com",
      };

      await expect(AuthService.register(incompleteData)).rejects.toThrow(
        "Missing fields"
      );
    });
  });

  describe("login", () => {
    it("should successfully login with valid credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      const mockUser = {
        id: 1,
        name: "Test User",
        email: loginData.email,
        passwordHash: "hashedPassword",
        role: "student",
        toJSON: function () {
          const { password, ...userWithoutPassword } = this;
          return userWithoutPassword;
        },
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("test-token");

      const result = await AuthService.login(loginData);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: loginData.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginData.password,
        mockUser.passwordHash
      );
      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("user");
      expect(result.user).not.toHaveProperty("password");
    });

    it("should throw error if user not found", async () => {
      const loginData = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      User.findOne.mockResolvedValue(null);

      await expect(AuthService.login(loginData)).rejects.toThrow(
        "User not found"
      );
    });

    it("should throw error if password is incorrect", async () => {
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      const mockUser = {
        id: 1,
        email: loginData.email,
        password: "hashedPassword",
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(AuthService.login(loginData)).rejects.toThrow(
        "Invalid credentials"
      );
    });

    it("should throw error if email or password is missing", async () => {
      const incompleteData = {
        email: "test@example.com",
      };

      await expect(AuthService.login(incompleteData)).rejects.toThrow(
        "Missing credentials"
      );
    });
  });
});
