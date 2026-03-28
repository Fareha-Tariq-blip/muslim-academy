import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Bell,
  ClipboardList, FileText, Calendar, BarChart3, MessageSquare,
  Upload, BookMarked, Image as ImageIcon, Mail, CalendarCheck
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import logo from '@/assets/muslim-academy-logo.png';

const adminItems = [
  { title: 'Overview', url: '/dashboard/admin', icon: LayoutDashboard },
  { title: 'Students', url: '/dashboard/admin/students', icon: Users },
  { title: 'Teachers', url: '/dashboard/admin/teachers', icon: GraduationCap },
  { title: 'Courses', url: '/dashboard/admin/courses', icon: BookOpen },
  { title: 'Teacher Attendance', url: '/dashboard/admin/teacher-attendance', icon: CalendarCheck },
  { title: 'Announcements', url: '/dashboard/admin/announcements', icon: Bell },
  { title: 'Gallery', url: '/dashboard/admin/gallery', icon: ImageIcon },
  { title: 'Messages', url: '/dashboard/admin/messages', icon: Mail },
  { title: 'Reviews', url: '/dashboard/admin/reviews', icon: MessageSquare },
];

const teacherItems = [
  { title: 'Overview', url: '/dashboard/teacher', icon: LayoutDashboard },
  { title: 'Assignments', url: '/dashboard/teacher/assignments', icon: ClipboardList },
  { title: 'Quizzes', url: '/dashboard/teacher/quizzes', icon: FileText },
  { title: 'Grades', url: '/dashboard/teacher/grades', icon: BookMarked },
  { title: 'Attendance', url: '/dashboard/teacher/attendance', icon: Calendar },
  { title: 'Materials', url: '/dashboard/teacher/materials', icon: Upload },
  { title: 'Performance', url: '/dashboard/teacher/performance', icon: BarChart3 },
  { title: 'Announcements', url: '/dashboard/teacher/announcements', icon: Bell },
];

const studentItems = [
  { title: 'Overview', url: '/dashboard/student', icon: LayoutDashboard },
  { title: 'My Courses', url: '/dashboard/student/courses', icon: BookOpen },
  { title: 'Assignments', url: '/dashboard/student/assignments', icon: ClipboardList },
  { title: 'Quizzes', url: '/dashboard/student/quizzes', icon: FileText },
  { title: 'Attendance', url: '/dashboard/student/attendance', icon: Calendar },
  { title: 'Grades', url: '/dashboard/student/grades', icon: BarChart3 },
  { title: 'Announcements', url: '/dashboard/student/announcements', icon: Bell },
  { title: 'Remarks', url: '/dashboard/student/remarks', icon: MessageSquare },
];

const DashboardSidebar = () => {
  const { role } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const items = role === 'admin' ? adminItems : role === 'teacher' ? teacherItems : studentItems;
  const label = role === 'admin' ? 'Admin Panel' : role === 'teacher' ? 'Teacher Portal' : 'Student Portal';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {!collapsed && (
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Muslim Academy" className="h-6 w-6 rounded-full" />
              <div>
                <p className="font-display text-sm font-bold text-sidebar-foreground">Muslim Academy</p>
                <p className="text-[10px] text-sidebar-foreground/60">{label}</p>
              </div>
            </div>
          </div>
        )}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default DashboardSidebar;
