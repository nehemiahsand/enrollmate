import { describe, it, expect, beforeEach, vi } from "vitest";
import { authMiddleware } from "../../src/middleware/authMiddleware.js";
import jwt from "jsonwebtoken";
import { User } from "../../src/models/index.js";

// Mock jsonwebtoken
vi.mock("jsonwebtoken");

// Mock User model
vi.mock("../../src/models/index.js", () => ({
  User: {
    findByPk: vi.fn(),
  },
  Course: {},
  Enrollment: {},
}));

describe("Auth Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null,
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe("authMiddleware", () => {
    it("should authenticate valid token", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        role: "student",
      };

      req.headers.authorization = "Bearer valid-token";
      jwt.verify.mockReturnValue({ id: 1 });
      User.findByPk.mockResolvedValue(mockUser);

      await authMiddleware(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(
        "valid-token",
        process.env.JWT_SECRET || "secret"
      );
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(1);
      expect(req.user.role).toBe("student");
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should reject request without authorization header", async () => {
      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Missing token",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should reject request with invalid token format", async () => {
      req.headers.authorization = "InvalidFormat token";

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Missing token",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should reject request with invalid token", async () => {
      req.headers.authorization = "Bearer invalid-token";
      jwt.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid token",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should reject if user not found in database", async () => {
      req.headers.authorization = "Bearer valid-token";
      jwt.verify.mockReturnValue({ id: 999 });
      User.findByPk.mockResolvedValue(null);

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not found",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle different user roles", async () => {
      const roles = ["student", "instructor", "admin"];

      for (const role of roles) {
        vi.clearAllMocks();

        const mockUser = {
          id: 1,
          email: "test@example.com",
          role: role,
        };

        req.headers.authorization = "Bearer valid-token";
        jwt.verify.mockReturnValue({ id: 1 });
        User.findByPk.mockResolvedValue(mockUser);

        await authMiddleware(req, res, next);

        expect(req.user.role).toBe(role);
        expect(next).toHaveBeenCalled();
      }
    });
  });
});
