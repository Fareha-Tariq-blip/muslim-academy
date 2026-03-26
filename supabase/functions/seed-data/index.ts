import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Create test users
    const users = [
      { email: "admin@muslimacademy.com", password: "admin123", full_name: "Administrator", role: "admin" },
      { email: "teacher1@muslimacademy.com", password: "teacher123", full_name: "Ustadh Ahmad Khan", role: "teacher" },
      { email: "teacher2@muslimacademy.com", password: "teacher123", full_name: "Ustadha Fatima Ali", role: "teacher" },
      { email: "teacher3@muslimacademy.com", password: "teacher123", full_name: "Ustadh Ibrahim Malik", role: "teacher" },
      { email: "student1@muslimacademy.com", password: "student123", full_name: "Ayesha Khan", role: "student" },
      { email: "student2@muslimacademy.com", password: "student123", full_name: "Ali Ahmed", role: "student" },
      { email: "student3@muslimacademy.com", password: "student123", full_name: "Zainab Malik", role: "student" },
      { email: "student4@muslimacademy.com", password: "student123", full_name: "Muhammad Hassan", role: "student" },
      { email: "student5@muslimacademy.com", password: "student123", full_name: "Maryam Siddiqui", role: "student" },
    ];

    const createdUsers: Record<string, string> = {};

    for (const u of users) {
      // Delete existing user if any
      const { data: existingUsers } = await admin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((x: any) => x.email === u.email);
      if (existing) {
        await admin.auth.admin.deleteUser(existing.id);
      }

      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name, role: u.role },
      });
      if (error) {
        console.error(`Failed to create ${u.email}:`, error.message);
        continue;
      }
      createdUsers[u.email] = data.user.id;
    }

    // Wait for triggers to fire
    await new Promise(r => setTimeout(r, 2000));

    // Create teacher records
    const teacherRecords = [
      { user_id: createdUsers["teacher1@muslimacademy.com"], subject: "Quran & Tajweed", qualification: "Ijazah in Quran", phone: "+92-300-1234567" },
      { user_id: createdUsers["teacher2@muslimacademy.com"], subject: "Islamic Studies", qualification: "MA Islamic Studies", phone: "+92-300-2345678" },
      { user_id: createdUsers["teacher3@muslimacademy.com"], subject: "Arabic Language", qualification: "BA Arabic Literature", phone: "+92-300-3456789" },
    ];

    const teacherIds: Record<string, string> = {};
    for (const t of teacherRecords) {
      if (!t.user_id) continue;
      const { data } = await admin.from("teachers").insert(t).select("id").single();
      if (data) teacherIds[t.user_id] = data.id;
    }

    // Create student records
    const studentData = [
      { email: "student1@muslimacademy.com", class: "1", section: "A", roll_number: "1A-001", guardian_name: "Mr. Khan", phone: "+92-301-1111111" },
      { email: "student2@muslimacademy.com", class: "1", section: "A", roll_number: "1A-002", guardian_name: "Mr. Ahmed", phone: "+92-301-2222222" },
      { email: "student3@muslimacademy.com", class: "2", section: "A", roll_number: "2A-001", guardian_name: "Mr. Malik", phone: "+92-301-3333333" },
      { email: "student4@muslimacademy.com", class: "3", section: "A", roll_number: "3A-001", guardian_name: "Mr. Hassan", phone: "+92-301-4444444" },
      { email: "student5@muslimacademy.com", class: "1", section: "B", roll_number: "1B-001", guardian_name: "Mr. Siddiqui", phone: "+92-301-5555555" },
    ];

    const studentIds: Record<string, string> = {};
    for (const s of studentData) {
      const uid = createdUsers[s.email];
      if (!uid) continue;
      const { data } = await admin.from("students").insert({
        user_id: uid, class: s.class, section: s.section,
        roll_number: s.roll_number, guardian_name: s.guardian_name, phone: s.phone,
      }).select("id").single();
      if (data) studentIds[s.email] = data.id;
    }

    // Create courses
    const t1Id = teacherIds[createdUsers["teacher1@muslimacademy.com"]];
    const t2Id = teacherIds[createdUsers["teacher2@muslimacademy.com"]];
    const t3Id = teacherIds[createdUsers["teacher3@muslimacademy.com"]];

    const coursesData = [
      { name: "Quran Recitation", class: "1", section: "A", teacher_id: t1Id, description: "Learn proper Quran recitation with Tajweed rules" },
      { name: "Islamic Studies", class: "1", section: "A", teacher_id: t2Id, description: "Foundations of Islamic knowledge" },
      { name: "Arabic Basics", class: "1", section: "A", teacher_id: t3Id, description: "Introduction to Arabic language" },
      { name: "Quran Memorization", class: "1", section: "B", teacher_id: t1Id, description: "Hifz program for selected surahs" },
      { name: "Islamic History", class: "2", section: "A", teacher_id: t2Id, description: "History of Islam and the Prophets" },
      { name: "Advanced Arabic", class: "3", section: "A", teacher_id: t3Id, description: "Advanced Arabic grammar and composition" },
    ];

    const courseIds: Record<string, string> = {};
    for (const c of coursesData) {
      const { data } = await admin.from("courses").insert(c).select("id").single();
      if (data) courseIds[`${c.class}-${c.section}-${c.name}`] = data.id;
    }

    // Create enrollments for students in matching classes
    const enrollments = [];
    for (const s of studentData) {
      const sid = studentIds[s.email];
      if (!sid) continue;
      for (const c of coursesData) {
        if (c.class === s.class && c.section === s.section) {
          const cid = courseIds[`${c.class}-${c.section}-${c.name}`];
          if (cid) enrollments.push({ student_id: sid, course_id: cid });
        }
      }
    }
    if (enrollments.length) await admin.from("enrollments").insert(enrollments);

    // Create grades for students
    const gradeEntries = [];
    for (const s of studentData) {
      const sid = studentIds[s.email];
      if (!sid) continue;
      for (const c of coursesData) {
        if (c.class === s.class && c.section === s.section) {
          const cid = courseIds[`${c.class}-${c.section}-${c.name}`];
          if (!cid) continue;
          for (const term of ["1st Term", "Mid Term"]) {
            const marks = Math.floor(Math.random() * 30) + 70;
            const letter = marks >= 90 ? "A+" : marks >= 80 ? "A" : marks >= 70 ? "B" : "C";
            gradeEntries.push({ student_id: sid, course_id: cid, term, marks, grade_letter: letter });
          }
        }
      }
    }
    if (gradeEntries.length) await admin.from("grades").insert(gradeEntries);

    // Create announcements
    await admin.from("announcements").insert([
      { title: "Welcome to New Academic Year", content: "We are pleased to welcome all students and teachers to the new academic session. May Allah bless our journey of knowledge.", target_role: null, author_id: createdUsers["admin@muslimacademy.com"] },
      { title: "Quran Competition Next Week", content: "Annual Quran recitation competition will be held next Friday. All students are encouraged to participate.", target_role: "student", author_id: createdUsers["teacher1@muslimacademy.com"] },
      { title: "Staff Meeting", content: "Monthly staff meeting scheduled for Wednesday at 2 PM in the conference room.", target_role: "teacher", author_id: createdUsers["admin@muslimacademy.com"] },
    ]);

    // Create attendance records
    const attendanceRecords = [];
    const today = new Date();
    for (let d = 0; d < 5; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split("T")[0];
      for (const s of studentData) {
        const sid = studentIds[s.email];
        if (!sid) continue;
        for (const c of coursesData) {
          if (c.class === s.class && c.section === s.section) {
            const cid = courseIds[`${c.class}-${c.section}-${c.name}`];
            if (!cid) continue;
            attendanceRecords.push({
              student_id: sid, course_id: cid, date: dateStr,
              status: Math.random() > 0.15 ? "present" : "absent",
            });
          }
        }
      }
    }
    if (attendanceRecords.length) await admin.from("attendance").insert(attendanceRecords);

    return new Response(JSON.stringify({
      success: true,
      created: {
        users: Object.keys(createdUsers).length,
        teachers: Object.keys(teacherIds).length,
        students: Object.keys(studentIds).length,
        courses: Object.keys(courseIds).length,
        enrollments: enrollments.length,
        grades: gradeEntries.length,
        attendance: attendanceRecords.length,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
