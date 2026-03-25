import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Routes, Route } from 'react-router-dom';
import TeacherOverview from '@/components/teacher/TeacherOverview';
import AssignmentManager from '@/components/teacher/AssignmentManager';
import QuizCreator from '@/components/teacher/QuizCreator';
import AttendanceMarker from '@/components/teacher/AttendanceMarker';
import CourseMaterialsManager from '@/components/teacher/CourseMaterialsManager';
import StudentPerformance from '@/components/teacher/StudentPerformance';
import StudentAnnouncements from '@/components/student/StudentAnnouncements';

const TeacherDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route index element={<TeacherOverview />} />
      <Route path="assignments" element={<AssignmentManager />} />
      <Route path="quizzes" element={<QuizCreator />} />
      <Route path="attendance" element={<AttendanceMarker />} />
      <Route path="materials" element={<CourseMaterialsManager />} />
      <Route path="performance" element={<StudentPerformance />} />
      <Route path="announcements" element={<StudentAnnouncements />} />
    </Routes>
  </DashboardLayout>
);

export default TeacherDashboard;
