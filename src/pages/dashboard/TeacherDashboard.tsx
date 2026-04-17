import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Routes, Route } from 'react-router-dom';
import TeacherOverview from '@/components/teacher/TeacherOverview';
import AssignmentManager from '@/components/teacher/AssignmentManager';
import QuizCreator from '@/components/teacher/QuizCreator';
import AttendanceMarker from '@/components/teacher/AttendanceMarker';
import CourseMaterialsManager from '@/components/teacher/CourseMaterialsManager';
import StudentPerformance from '@/components/teacher/StudentPerformance';
import GradeManager from '@/components/teacher/GradeManager';
import TeacherAnnouncements from '@/components/teacher/TeacherAnnouncements';
import CommunityPosts from '@/components/community/CommunityPosts';
import UserProfile from '@/components/dashboard/UserProfile';

const TeacherDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route index element={<TeacherOverview />} />
      <Route path="profile" element={<UserProfile />} />
      <Route path="assignments" element={<AssignmentManager />} />
      <Route path="quizzes" element={<QuizCreator />} />
      <Route path="attendance" element={<AttendanceMarker />} />
      <Route path="materials" element={<CourseMaterialsManager />} />
      <Route path="performance" element={<StudentPerformance />} />
      <Route path="grades" element={<GradeManager />} />
      <Route path="announcements" element={<TeacherAnnouncements />} />
      <Route path="community" element={<CommunityPosts />} />
    </Routes>
  </DashboardLayout>
);

export default TeacherDashboard;
