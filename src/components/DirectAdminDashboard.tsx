
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, Users, BookOpen, Calendar, BarChart3, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const DirectAdminDashboard = () => {
  const { theme, setTheme } = useTheme();

  // Real-time data fetching with shorter refetch intervals
  const { data: allFaculty, isLoading: facultyLoading } = useQuery({
    queryKey: ['all-faculty'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'faculty')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  const { data: allClassRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ['all-class-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_sessions')
        .select(`
          *,
          courses (name, code),
          profiles (full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 3000, // Real-time updates every 3 seconds
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [facultyResult, coursesResult, sessionsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'faculty'),
        supabase.from('courses').select('id', { count: 'exact' }),
        supabase.from('class_sessions').select('id', { count: 'exact' }),
      ]);

      return {
        faculty: facultyResult.count || 0,
        courses: coursesResult.count || 0,
        sessions: sessionsResult.count || 0,
      };
    },
    refetchInterval: 10000, // Real-time updates every 10 seconds
  });

  if (facultyLoading || recordsLoading || statsLoading) {
    return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">NIT</span>
                </div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Admin Dashboard
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Direct Admin Access
                <Badge variant="destructive" className="ml-2">
                  Administrator
                </Badge>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Real-time Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-white">Total Faculty</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{stats?.faculty || 0}</div>
              <p className="text-xs text-muted-foreground">Live count</p>
            </CardContent>
          </Card>
          
          <Card className="dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-white">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{stats?.courses || 0}</div>
              <p className="text-xs text-muted-foreground">Live count</p>
            </CardContent>
          </Card>
          
          <Card className="dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-white">Class Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{stats?.sessions || 0}</div>
              <p className="text-xs text-muted-foreground">Live count</p>
            </CardContent>
          </Card>
        </div>

        {/* Faculty Management */}
        <Card className="mb-8 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Faculty Management</CardTitle>
            <CardDescription className="dark:text-gray-300">
              Real-time view of all faculty members (Updates every 5 seconds)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-gray-300">Name</TableHead>
                  <TableHead className="dark:text-gray-300">Email</TableHead>
                  <TableHead className="dark:text-gray-300">Department</TableHead>
                  <TableHead className="dark:text-gray-300">Employee ID</TableHead>
                  <TableHead className="dark:text-gray-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allFaculty?.map((faculty) => (
                  <TableRow key={faculty.id} className="dark:border-gray-700">
                    <TableCell className="font-medium dark:text-white">{faculty.full_name}</TableCell>
                    <TableCell className="dark:text-gray-300">{faculty.email}</TableCell>
                    <TableCell className="dark:text-gray-300">{faculty.department || 'Not Set'}</TableCell>
                    <TableCell className="dark:text-gray-300">{faculty.employee_id || 'Not Set'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Class Records Management */}
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">All Class Records</CardTitle>
            <CardDescription className="dark:text-gray-300">
              Real-time view of all class records (Updates every 3 seconds)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-gray-300">Faculty</TableHead>
                  <TableHead className="dark:text-gray-300">Course</TableHead>
                  <TableHead className="dark:text-gray-300">Date</TableHead>
                  <TableHead className="dark:text-gray-300">Time</TableHead>
                  <TableHead className="dark:text-gray-300">Topic</TableHead>
                  <TableHead className="dark:text-gray-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allClassRecords?.map((record) => (
                  <TableRow key={record.id} className="dark:border-gray-700">
                    <TableCell className="font-medium dark:text-white">{record.profiles?.full_name}</TableCell>
                    <TableCell className="dark:text-gray-300">{record.courses?.name || record.courses?.code}</TableCell>
                    <TableCell className="dark:text-gray-300">{record.session_date}</TableCell>
                    <TableCell className="dark:text-gray-300">{record.start_time}</TableCell>
                    <TableCell className="max-w-xs truncate dark:text-gray-300">{record.topic}</TableCell>
                    <TableCell>
                      <Badge variant="default">Completed</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DirectAdminDashboard;
