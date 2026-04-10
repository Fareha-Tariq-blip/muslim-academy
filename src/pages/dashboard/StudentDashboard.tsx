import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Routes, Route } from 'react-router-dom';
import StudentOverview from '@/components/student/StudentOverview';
import StudentCourses from '@/components/student/StudentCourses';
import StudentAssignments from '@/components/student/StudentAssignments';
import QuizAttempt from '@/components/student/QuizAttempt';
import StudentAttendance from '@/components/student/StudentAttendance';
import StudentGrades from '@/components/student/StudentGrades';
import StudentAnnouncements from '@/components/student/StudentAnnouncements';
import StudentRemarks from '@/components/student/StudentRemarks';
import UserProfile from '@/components/dashboard/UserProfile';

const StudentDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route index element={<StudentOverview />} />
      <Route path="profile" element={<UserProfile />} />
      <Route path="courses" element={<StudentCourses />} />
      <Route path="assignments" element={<StudentAssignments />} />
      <Route path="quizzes" element={<QuizAttempt />} />
      <Route path="attendance" element={<StudentAttendance />} />
      <Route path="grades" element={<StudentGrades />} />
      <Route path="announcements" element={<StudentAnnouncements />} />
      <Route path="remarks" element={<StudentRemarks />} />
    </Routes>
  </DashboardLayout>
);

export default StudentDashboard;
