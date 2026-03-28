import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Routes, Route } from 'react-router-dom';
import AdminOverview from '@/components/admin/AdminOverview';
import StudentManagement from '@/components/admin/StudentManagement';
import TeacherManagement from '@/components/admin/TeacherManagement';
import CourseManagement from '@/components/admin/CourseManagement';
import AdminAnnouncements from '@/components/admin/AdminAnnouncements';
import AdminGallery from '@/components/admin/AdminGallery';
import AdminMessages from '@/components/admin/AdminMessages';
import AdminReviews from '@/components/admin/AdminReviews';
import TeacherAttendance from '@/components/admin/TeacherAttendance';

const AdminDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route index element={<AdminOverview />} />
      <Route path="students" element={<StudentManagement />} />
      <Route path="teachers" element={<TeacherManagement />} />
      <Route path="courses" element={<CourseManagement />} />
      <Route path="announcements" element={<AdminAnnouncements />} />
      <Route path="gallery" element={<AdminGallery />} />
      <Route path="messages" element={<AdminMessages />} />
      <Route path="reviews" element={<AdminReviews />} />
      <Route path="teacher-attendance" element={<TeacherAttendance />} />
    </Routes>
  </DashboardLayout>
);

export default AdminDashboard;
