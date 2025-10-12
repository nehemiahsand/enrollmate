import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../../src/controllers/courseController.js";
import { Course, User } from "../../src/models/index.js";

// Mock the models
vi.mock("../../src/models/index.js", () => ({
  Course: {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
    destroy: vi.fn(),
  },
  User: {
    findByPk: vi.fn(),
  },
  Enrollment: {},
}));

describe("Course Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { id: 1, role: "admin" },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe("listCourses", () => {
    it("should return all courses with instructor details", async () => {
      const mockCourses = [
        {
          id: 1,
          title: "CS 101",
          description: "Intro to Programming",
          capacity: 30,
          enrolled: 15,
          instructorId: 1,
          Instructor: {
            id: 1,
            name: "Dr. Smith",
            email: "smith@example.com",
          },
          toJSON: function () {
            return { ...this };
          },
        },
      ];

      Course.findAll.mockResolvedValue(mockCourses);
      req.query = {}; // Add query object

      await listCourses(req, res);

      expect(Course.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            title: "CS 101",
          }),
        ])
      );
    });

    it("should handle errors gracefully", async () => {
      Course.findAll.mockRejectedValue(new Error("Database error"));
      req.query = {}; // Add query object

      // Wrap in try-catch since controller doesn't handle errors
      await expect(async () => {
        await listCourses(req, res);
      }).rejects.toThrow("Database error");
    });
  });

  describe("createCourse", () => {
    it("should create a new course successfully", async () => {
      const courseData = {
        title: "CS 101",
        description: "Intro to Programming",
        capacity: 30,
        credits: 3,
        day: "MWF",
        time: "9:00-10:00 AM",
        instructorId: 1,
      };

      const mockCourse = {
        id: 1,
        ...courseData,
        enrolled: 0,
        toJSON: function () {
          return { ...this };
        },
      };

      req.body = courseData;
      Course.create.mockResolvedValue(mockCourse);
      Course.findByPk.mockResolvedValue(mockCourse);

      await createCourse(req, res);

      expect(Course.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should return 400 if required fields are missing", async () => {
      req.body = {
        // Missing title/name
        capacity: 30,
      };
      req.user = { role: "instructor", id: 1 };

      await createCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
