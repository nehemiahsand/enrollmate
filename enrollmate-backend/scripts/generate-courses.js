import { User, Course } from "../src/models/index.js";
import bcrypt from "bcrypt";

async function generateProfessorsAndCourses() {
  console.log("🎓 Generating Professors and Courses...\n");

  // Create Professors
  console.log("→ Creating professors...");

  const professors = [
    {
      name: "Dr. Sarah Smith",
      email: "s.smith@uab.edu",
      department: "Computer Science",
    },
    {
      name: "Dr. Michael Johnson",
      email: "m.johnson@uab.edu",
      department: "Mathematics",
    },
    {
      name: "Dr. Emily Williams",
      email: "e.williams@uab.edu",
      department: "Physics",
    },
    {
      name: "Dr. James Brown",
      email: "j.brown@uab.edu",
      department: "Chemistry",
    },
    { name: "Dr. Lisa Davis", email: "l.davis@uab.edu", department: "Biology" },
  ];

  const hashedPassword = await bcrypt.hash("prof123", 10);
  const createdProfs = [];

  for (const prof of professors) {
    const [user, created] = await User.findOrCreate({
      where: { email: prof.email },
      defaults: {
        name: prof.name,
        email: prof.email,
        password: hashedPassword,
        role: "instructor",
      },
    });

    if (!created && user.role !== "instructor") {
      await user.update({ role: "instructor" });
    }

    createdProfs.push({ ...prof, id: user.id });
    console.log(`  ✓ ${prof.name} (${prof.department})`);
  }

  console.log(`\n✓ Created ${createdProfs.length} professors\n`);

  // Create Courses
  console.log("→ Creating courses...\n");

  const courses = [
    // Computer Science (Dr. Smith)
    {
      title: "CS 101 - Introduction to Programming",
      description:
        "Learn fundamental programming concepts using Python. Topics include variables, control structures, functions, and basic data structures.",
      instructorId: createdProfs[0].id,
      capacity: 30,
      credits: 3,
      day: "MWF",
      time: "9:00-10:00 AM",
      department: "Computer Science",
    },
    {
      title: "CS 203 - Data Structures",
      description:
        "Study of abstract data types including stacks, queues, linked lists, trees, and graphs. Emphasis on algorithm analysis.",
      instructorId: createdProfs[0].id,
      capacity: 25,
      credits: 3,
      day: "TTh",
      time: "10:30-12:00 PM",
      department: "Computer Science",
    },
    {
      title: "CS 468 - Software Engineering",
      description:
        "Comprehensive study of software development lifecycle, design patterns, testing strategies, and project management.",
      instructorId: createdProfs[0].id,
      capacity: 20,
      credits: 3,
      day: "MW",
      time: "2:00-3:30 PM",
      department: "Computer Science",
    },

    // Mathematics (Dr. Johnson)
    {
      title: "MATH 125 - Calculus I",
      description:
        "Limits, continuity, derivatives, and applications. Introduction to integration and the Fundamental Theorem of Calculus.",
      instructorId: createdProfs[1].id,
      capacity: 35,
      credits: 4,
      day: "MWF",
      time: "10:00-11:00 AM",
      department: "Mathematics",
    },
    {
      title: "MATH 226 - Calculus II",
      description:
        "Techniques of integration, applications of integration, sequences and series, parametric equations.",
      instructorId: createdProfs[1].id,
      capacity: 30,
      credits: 4,
      day: "MWF",
      time: "11:00-12:00 PM",
      department: "Mathematics",
    },
    {
      title: "MATH 310 - Linear Algebra",
      description:
        "Vector spaces, linear transformations, matrices, determinants, eigenvalues and eigenvectors.",
      instructorId: createdProfs[1].id,
      capacity: 25,
      credits: 3,
      day: "TTh",
      time: "1:00-2:30 PM",
      department: "Mathematics",
    },

    // Physics (Dr. Williams)
    {
      title: "PHY 113 - General Physics I",
      description:
        "Mechanics, heat, and sound. Calculus-based introduction to physics for science and engineering majors.",
      instructorId: createdProfs[2].id,
      capacity: 40,
      credits: 4,
      day: "MWF",
      time: "8:00-9:00 AM",
      department: "Physics",
    },
    {
      title: "PHY 114 - General Physics II",
      description:
        "Electricity, magnetism, light, and modern physics. Continuation of PHY 113.",
      instructorId: createdProfs[2].id,
      capacity: 35,
      credits: 4,
      day: "MWF",
      time: "1:00-2:00 PM",
      department: "Physics",
    },
    {
      title: "PHY 301 - Modern Physics",
      description:
        "Special relativity, quantum mechanics, atomic and nuclear physics. Introduction to contemporary physics.",
      instructorId: createdProfs[2].id,
      capacity: 20,
      credits: 3,
      day: "TTh",
      time: "3:00-4:30 PM",
      department: "Physics",
    },

    // Chemistry (Dr. Brown)
    {
      title: "CHEM 115 - General Chemistry I",
      description:
        "Atomic structure, chemical bonding, stoichiometry, and thermodynamics. Laboratory included.",
      instructorId: createdProfs[3].id,
      capacity: 40,
      credits: 4,
      day: "MWF",
      time: "9:00-10:00 AM",
      department: "Chemistry",
    },
    {
      title: "CHEM 116 - General Chemistry II",
      description:
        "Chemical kinetics, equilibrium, acids and bases, electrochemistry. Laboratory included.",
      instructorId: createdProfs[3].id,
      capacity: 35,
      credits: 4,
      day: "MWF",
      time: "11:00-12:00 PM",
      department: "Chemistry",
    },
    {
      title: "CHEM 231 - Organic Chemistry I",
      description:
        "Structure, properties, and reactions of organic compounds. Emphasis on reaction mechanisms.",
      instructorId: createdProfs[3].id,
      capacity: 30,
      credits: 3,
      day: "TTh",
      time: "9:00-10:30 AM",
      department: "Chemistry",
    },

    // Biology (Dr. Davis)
    {
      title: "BIO 110 - Principles of Biology I",
      description:
        "Cell structure and function, genetics, evolution, and ecology. Laboratory included.",
      instructorId: createdProfs[4].id,
      capacity: 45,
      credits: 4,
      day: "MWF",
      time: "10:00-11:00 AM",
      department: "Biology",
    },
    {
      title: "BIO 111 - Principles of Biology II",
      description:
        "Plant and animal systems, physiology, development, and behavior. Laboratory included.",
      instructorId: createdProfs[4].id,
      capacity: 40,
      credits: 4,
      day: "MWF",
      time: "1:00-2:00 PM",
      department: "Biology",
    },
    {
      title: "BIO 320 - Genetics",
      description:
        "Principles of heredity, molecular genetics, gene regulation, and genomics.",
      instructorId: createdProfs[4].id,
      capacity: 25,
      credits: 3,
      day: "TTh",
      time: "2:00-3:30 PM",
      department: "Biology",
    },
    {
      title: "BIO 450 - Molecular Biology",
      description:
        "Advanced study of DNA replication, transcription, translation, and gene expression.",
      instructorId: createdProfs[4].id,
      capacity: 20,
      credits: 3,
      day: "MW",
      time: "3:00-4:30 PM",
      department: "Biology",
    },
  ];

  let coursesCreated = 0;
  const deptCounts = {};

  for (const courseData of courses) {
    const [course, created] = await Course.findOrCreate({
      where: { title: courseData.title },
      defaults: courseData,
    });

    if (created) {
      coursesCreated++;
      deptCounts[courseData.department] =
        (deptCounts[courseData.department] || 0) + 1;
      console.log(`  ✓ ${courseData.title}`);
    }
  }

  console.log(`\n✓ Created ${coursesCreated} courses\n`);

  // Summary
  console.log("✅ Course Generation Complete!\n");
  console.log("📊 Summary:");
  console.log(`  • ${createdProfs.length} Professors`);
  console.log(
    `  • ${coursesCreated} Courses across ${
      Object.keys(deptCounts).length
    } departments\n`
  );

  console.log("👨‍🏫 Professors:");
  createdProfs.forEach((prof) => {
    console.log(`  • ${prof.name} (${prof.department}) - ${prof.email}`);
  });

  console.log("\n📚 Departments:");
  Object.entries(deptCounts).forEach(([dept, count]) => {
    console.log(`  • ${dept}: ${count} courses`);
  });

  console.log("\n🔑 All professors have password: prof123\n");

  process.exit(0);
}

generateProfessorsAndCourses().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
