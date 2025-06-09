
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, Users, BookOpen, Calendar, Moon, Sun, FileText, ClipboardList, Plus, Bell, BookmarkPlus } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useState } from 'react';

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [isCreateNotificationOpen, setIsCreateNotificationOpen] = useState(false);
  
  const [assignmentForm, setAssignmentForm] = useState({
    faculty_id: '',
    subject: '',
    branch: '',
    semester: '',
    time_slot: '',
    students_count: ''
  });

  const [notificationForm, setNotificationForm] = useState({
    faculty_id: '',
    title: '',
    message: ''
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Real-time data fetching
  const { data: allFaculty } = useQuery({
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
    enabled: !!user,
    refetchInterval: 5000,
  });

  const { data: allClassRecords } = useQuery({
    queryKey: ['all-class-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_records')
        .select(`
          *,
          profiles (full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 3000,
  });

  const { data: allWorkDetails } = useQuery({
    queryKey: ['all-work-details'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_details')
        .select(`
          *,
          profiles (full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 3000,
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [facultyResult, coursesResult, classRecordsResult, workDetailsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'faculty'),
        supabase.from('courses').select('id', { count: 'exact' }),
        supabase.from('class_records').select('id', { count: 'exact' }),
        supabase.from('work_details').select('id', { count: 'exact' }),
      ]);

      return {
        faculty: facultyResult.count || 0,
        courses: coursesResult.count || 0,
        classRecords: classRecordsResult.count || 0,
        workDetails: workDetailsResult.count || 0,
      };
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: typeof assignmentForm) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data: assignment, error } = await supabase
        .from('work_activities')
        .insert({
          faculty_id: data.faculty_id,
          title: `Assignment: ${data.subject}`,
          description: `Branch: ${data.branch}, Semester: ${data.semester}, Time Slot: ${data.time_slot}, Students: ${data.students_count}`,
          activity_type: 'assignment',
          status: 'assigned'
        })
        .select()
        .single();

      if (error) {
        console.error('Assignment creation error:', error);
        throw error;
      }
      return assignment;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Assignment created successfully" });
      setIsCreateAssignmentOpen(false);
      setAssignmentForm({
        faculty_id: '',
        subject: '',
        branch: '',
        semester: '',
        time_slot: '',
        students_count: ''
      });
      queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] });
    },
    onError: (error: any) => {
      console.error('Assignment mutation error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Create notification mutation
  const createNotificationMutation = useMutation({
    mutationFn: async (data: typeof notificationForm) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data: notification, error } = await supabase
        .from('work_activities')
        .insert({
          faculty_id: data.faculty_id,
          title: `Notification: ${data.title}`,
          description: data.message,
          activity_type: 'notification',
          status: 'sent'
        })
        .select()
        .single();

      if (error) {
        console.error('Notification creation error:', error);
        throw error;
      }
      return notification;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Notification sent successfully" });
      setIsCreateNotificationOpen(false);
      setNotificationForm({
        faculty_id: '',
        title: '',
        message: ''
      });
      queryClient.invalidateQueries({ queryKey: ['faculty-notifications'] });
    },
    onError: (error: any) => {
      console.error('Notification mutation error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
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
                Welcome, {profile?.full_name}
                <Badge variant="destructive" className="ml-2">
                  {profile?.role}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Dialog open={isCreateAssignmentOpen} onOpenChange={setIsCreateAssignmentOpen}>
            <DialogTrigger asChild>
              <Button>
                <BookmarkPlus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="dark:bg-gray-800">
              <DialogHeader>
                <DialogTitle className="dark:text-white">Create Assignment</DialogTitle>
                <DialogDescription className="dark:text-gray-300">
                  Assign teaching responsibilities to faculty members
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="faculty_select" className="dark:text-white">Select Faculty</Label>
                  <Select value={assignmentForm.faculty_id} onValueChange={(value) => 
                    setAssignmentForm(prev => ({ ...prev, faculty_id: value }))
                  }>
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                      <SelectValue placeholder="Choose faculty member" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700">
                      {allFaculty?.map((faculty) => (
                        <SelectItem key={faculty.id} value={faculty.id}>
                          {faculty.full_name} ({faculty.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subject" className="dark:text-white">Subject</Label>
                  <Input
                    id="subject"
                    value={assignmentForm.subject}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter subject name"
                    className="dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="branch" className="dark:text-white">Branch</Label>
                  <Input
                    id="branch"
                    value={assignmentForm.branch}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, branch: e.target.value }))}
                    placeholder="e.g., Computer Science"
                    className="dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="semester" className="dark:text-white">Semester</Label>
                  <Input
                    id="semester"
                    value={assignmentForm.semester}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, semester: e.target.value }))}
                    placeholder="e.g., 5th Semester"
                    className="dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="time_slot" className="dark:text-white">Time Slot</Label>
                  <Input
                    id="time_slot"
                    value={assignmentForm.time_slot}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, time_slot: e.target.value }))}
                    placeholder="e.g., 9:00 AM - 10:00 AM"
                    className="dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="students_count" className="dark:text-white">Total Students</Label>
                  <Input
                    id="students_count"
                    value={assignmentForm.students_count}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, students_count: e.target.value }))}
                    placeholder="Number of students"
                    className="dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <Button 
                  onClick={() => createAssignmentMutation.mutate(assignmentForm)}
                  disabled={createAssignmentMutation.isPending || !assignmentForm.faculty_id || !assignmentForm.subject}
                  className="w-full"
                >
                  {createAssignmentMutation.isPending ? 'Creating...' : 'Create Assignment'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateNotificationOpen} onOpenChange={setIsCreateNotificationOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                Send Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="dark:bg-gray-800">
              <DialogHeader>
                <DialogTitle className="dark:text-white">Send Notification</DialogTitle>
                <DialogDescription className="dark:text-gray-300">
                  Send important notifications to faculty members
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notification_faculty" className="dark:text-white">Select Faculty</Label>
                  <Select value={notificationForm.faculty_id} onValueChange={(value) => 
                    setNotificationForm(prev => ({ ...prev, faculty_id: value }))
                  }>
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                      <SelectValue placeholder="Choose faculty member" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700">
                      {allFaculty?.map((faculty) => (
                        <SelectItem key={faculty.id} value={faculty.id}>
                          {faculty.full_name} ({faculty.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notification_title" className="dark:text-white">Title</Label>
                  <Input
                    id="notification_title"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Notification title"
                    className="dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="notification_message" className="dark:text-white">Message</Label>
                  <Textarea
                    id="notification_message"
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Enter notification message"
                    className="dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <Button 
                  onClick={() => createNotificationMutation.mutate(notificationForm)}
                  disabled={createNotificationMutation.isPending || !notificationForm.faculty_id || !notificationForm.title}
                  className="w-full"
                >
                  {createNotificationMutation.isPending ? 'Sending...' : 'Send Notification'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-white">Total Faculty</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{stats?.faculty || 0}</div>
              <p className="text-xs text-muted-foreground">Live updates</p>
            </CardContent>
          </Card>
          
          <Card className="dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-white">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{stats?.courses || 0}</div>
              <p className="text-xs text-muted-foreground">Live updates</p>
            </CardContent>
          </Card>
          
          <Card className="dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-white">Class Records</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{stats?.classRecords || 0}</div>
              <p className="text-xs text-muted-foreground">Live updates</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-white">Work Details</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{stats?.workDetails || 0}</div>
              <p className="text-xs text-muted-foreground">Live updates</p>
            </CardContent>
          </Card>
        </div>

        {/* Faculty Management */}
        <Card className="mb-8 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Faculty Management</CardTitle>
            <CardDescription className="dark:text-gray-300">
              Real-time view and management of all faculty members
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
        <Card className="mb-8 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Faculty Class Records</CardTitle>
            <CardDescription className="dark:text-gray-300">
              Real-time view of all class records submitted by faculty
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-gray-300">Faculty</TableHead>
                  <TableHead className="dark:text-gray-300">Topic Covered</TableHead>
                  <TableHead className="dark:text-gray-300">Date</TableHead>
                  <TableHead className="dark:text-gray-300">Present/Total</TableHead>
                  <TableHead className="dark:text-gray-300">Description</TableHead>
                  <TableHead className="dark:text-gray-300">Document</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allClassRecords?.map((record) => (
                  <TableRow key={record.id} className="dark:border-gray-700">
                    <TableCell className="font-medium dark:text-white">{record.profiles?.full_name}</TableCell>
                    <TableCell className="dark:text-gray-300">{record.topic_covered}</TableCell>
                    <TableCell className="dark:text-gray-300">{new Date(record.session_date).toLocaleDateString()}</TableCell>
                    <TableCell className="dark:text-gray-300">{record.students_present}/{record.total_students}</TableCell>
                    <TableCell className="max-w-xs truncate dark:text-gray-300">{record.description || 'N/A'}</TableCell>
                    <TableCell>
                      {record.document_url ? (
                        <a 
                          href={record.document_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 text-sm"
                        >
                          View File
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">No file</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Work Details Management */}
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Faculty Work Details</CardTitle>
            <CardDescription className="dark:text-gray-300">
              Real-time view of all work details submitted by faculty
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-gray-300">Faculty</TableHead>
                  <TableHead className="dark:text-gray-300">Work Type</TableHead>
                  <TableHead className="dark:text-gray-300">Duration</TableHead>
                  <TableHead className="dark:text-gray-300">Date</TableHead>
                  <TableHead className="dark:text-gray-300">Slot</TableHead>
                  <TableHead className="dark:text-gray-300">Description</TableHead>
                  <TableHead className="dark:text-gray-300">Document</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allWorkDetails?.map((detail) => (
                  <TableRow key={detail.id} className="dark:border-gray-700">
                    <TableCell className="font-medium dark:text-white">{detail.profiles?.full_name}</TableCell>
                    <TableCell className="dark:text-gray-300">{detail.work_type}</TableCell>
                    <TableCell className="dark:text-gray-300">{detail.duration}</TableCell>
                    <TableCell className="dark:text-gray-300">{new Date(detail.session_date).toLocaleDateString()}</TableCell>
                    <TableCell className="dark:text-gray-300 capitalize">{detail.slot_type}</TableCell>
                    <TableCell className="max-w-xs truncate dark:text-gray-300">{detail.description}</TableCell>
                    <TableCell>
                      {detail.document_url ? (
                        <a 
                          href={detail.document_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 text-sm"
                        >
                          View File
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">No file</span>
                      )}
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

export default AdminDashboard;
