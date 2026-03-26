import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Bell,
  ClipboardList, FileText, Calendar, BarChart3, MessageSquare,
  Upload, BookMarked, Image as ImageIcon, Mail, LogOut
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useNavigate } from 'react-router-dom';

const adminItems = [
  { title: 'Dashboard', url: '/dashboard/admin', icon: LayoutDashboard },
  { title: 'Students', url: '/dashboard/admin/students', icon: Users },
  { title: 'Teachers', url: '/dashboard/admin/teachers', icon: GraduationCap },
  { title: 'Courses', url: '/dashboard/admin/courses', icon: BookOpen },
  { title: 'Announcements', url: '/dashboard/admin/announcements', icon: Bell },
  { title: 'Gallery', url: '/dashboard/admin/gallery', icon: ImageIcon },
  { title: 'Messages', url: '/dashboard/admin/messages', icon: Mail },
  { title: 'Reviews', url: '/dashboard/admin/reviews', icon: MessageSquare },
];

const teacherItems = [
  { title: 'Dashboard', url: '/dashboard/teacher', icon: LayoutDashboard },
  { title: 'Assignments', url: '/dashboard/teacher/assignments', icon: ClipboardList },
  { title: 'Quizzes', url: '/dashboard/teacher/quizzes', icon: FileText },
  { title: 'Grades', url: '/dashboard/teacher/grades', icon: BookMarked },
  { title: 'Attendance', url: '/dashboard/teacher/attendance', icon: Calendar },
  { title: 'Materials', url: '/dashboard/teacher/materials', icon: Upload },
  { title: 'Performance', url: '/dashboard/teacher/performance', icon: BarChart3 },
  { title: 'Announcements', url: '/dashboard/teacher/announcements', icon: Bell },
];

const studentItems = [
  { title: 'Dashboard', url: '/dashboard/student', icon: LayoutDashboard },
  { title: 'My Courses', url: '/dashboard/student/courses', icon: BookOpen },
  { title: 'Assignments', url: '/dashboard/student/assignments', icon: ClipboardList },
  { title: 'Quizzes', url: '/dashboard/student/quizzes', icon: FileText },
  { title: 'Attendance', url: '/dashboard/student/attendance', icon: Calendar },
  { title: 'Grades', url: '/dashboard/student/grades', icon: BarChart3 },
  { title: 'Announcements', url: '/dashboard/student/announcements', icon: Bell },
  { title: 'Remarks', url: '/dashboard/student/remarks', icon: MessageSquare },
];

const DashboardSidebar = () => {
  const { role, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const navigate = useNavigate();

  const items = role === 'admin' ? adminItems : role === 'teacher' ? teacherItems : studentItems;
  const label = role === 'admin' ? 'Admin Panel' : role === 'teacher' ? 'Teacher Portal' : 'Student Portal';

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        {!collapsed && (
          <div className="px-5 py-6 border-b border-sidebar-border">
            <h2 className="font-display text-xl font-bold text-sidebar-foreground tracking-tight">Muslim Academy</h2>
            <p className="text-xs text-sidebar-foreground/50 mt-0.5">{label}</p>
          </div>
        )}
        <SidebarGroup className="flex-1 pt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="px-4 pb-5 mt-auto">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-[18px] w-[18px]" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default DashboardSidebar;
