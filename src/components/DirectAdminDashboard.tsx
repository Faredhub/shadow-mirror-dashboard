
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Users, BookOpen, Calendar, BarChart3, Moon, Sun, Plus, Edit, Trash2, Bell, UserPlus } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const DirectAdminDashboard = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('faculty-management');
  const [isCreateFacultyOpen, setIsCreateFacultyOpen] = useState(false);
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);

  // Faculty form state
  const [facultyForm, setFacultyForm] = useState({
    full_name: '',
    email: '',
    department: '',
    employee_id: '',
    password: ''
  });

  // Course form state
  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    description: '',
    credits: 3,
    semester: '',
    academic_year: '2024-25'
  });

  // Assignment form state
  const [assignmentForm, setAssignmentForm] = useState({
    branch: '',
    semester: '',
    subject: '',
    time_slot: '',
    total_students: ''
  });

  // Notification form state
  const [notificationForm, setNotificationForm] = useState({
    recipient_id: '',
    title: '',
    message: ''
  });

  // Real-time data fetching
  const { data: allFaculty, isLoading: facultyLoading, refetch: refetchFaculty } = useQuery({
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
    refetchInterval: 3000,
  });

  const { data: allCourses, refetch: refetchCourses } = useQuery({
    queryKey: ['all-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          profiles (full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 3000,
  });

  const { data: workActivities } = useQuery({
    queryKey: ['all-work-activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_activities')
        .select(`
          *,
          profiles (full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });

  const { data: classRecords } = useQuery({
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
    refetchInterval: 3000,
  });

  // Mutations
  const createFacultyMutation = useMutation({
    mutationFn: async (data: typeof facultyForm) => {
      console.log('Creating faculty with data:', data);
      
      // First, try to sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            role: 'faculty'
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        // If auth signup fails, create profile directly
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: crypto.randomUUID(),
            full_name: data.full_name,
            email: data.email,
            department: data.department,
            employee_id: data.employee_id,
            role: 'faculty'
          })
          .select()
          .single();

        if (profileError) throw profileError;
        return profile;
      }

      // If auth signup succeeded, update the profile
      if (authData.user) {
        const { data: profile, error: updateError } = await supabase
          .from('profiles')
          .update({
            department: data.department,
            employee_id: data.employee_id
          })
          .eq('id', authData.user.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return profile;
      }

      throw new Error('Failed to create faculty');
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Faculty member created successfully" });
      setIsCreateFacultyOpen(false);
      setFacultyForm({ full_name: '', email: '', department: '', employee_id: '', password: '' });
      refetchFaculty();
    },
    onError: (error: any) => {
      console.error('Faculty creation error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteFacultyMutation = useMutation({
    mutationFn: async (facultyId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', facultyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Faculty member deleted successfully" });
      refetchFaculty();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: typeof courseForm) => {
      const { error } = await supabase
        .from('courses')
        .insert({
          name: data.name,
          code: data.code,
          description: data.description,
          credits: data.credits,
          semester: data.semester,
          academic_year: data.academic_year
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Course created successfully" });
      setIsCreateCourseOpen(false);
      setCourseForm({
        name: '',
        code: '',
        description: '',
        credits: 3,
        semester: '',
        academic_year: '2024-25'
      });
      refetchCourses();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteCourse = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Course deleted successfully" });
      refetchCourses();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const assignFacultyMutation = useMutation({
    mutationFn: async (data: { facultyId: string; assignment: typeof assignmentForm }) => {
      // Store assignment details in work_activities table as a temporary solution
      const { error } = await supabase
        .from('work_activities')
        .insert({
          faculty_id: data.facultyId,
          title: `Assignment: ${data.assignment.subject}`,
          description: `Branch: ${data.assignment.branch}, Semester: ${data.assignment.semester}, Time Slot: ${data.assignment.time_slot}, Students: ${data.assignment.total_students}`,
          activity_type: 'assignment',
          status: 'assigned'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Faculty assignment created successfully" });
      setIsAssignmentOpen(false);
      setAssignmentForm({ branch: '', semester: '', subject: '', time_slot: '', total_students: '' });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (data: typeof notificationForm) => {
      // Store notification in work_activities table as a temporary solution
      const { error } = await supabase
        .from('work_activities')
        .insert({
          faculty_id: data.recipient_id,
          title: `Notification: ${data.title}`,
          description: data.message,
          activity_type: 'notification',
          status: 'sent'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Notification sent successfully" });
      setIsNotificationOpen(false);
      setNotificationForm({ recipient_id: '', title: '', message: '' });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleAssignFaculty = (faculty: any) => {
    setSelectedFaculty(faculty);
    setIsAssignmentOpen(true);
  };

  const handleSendNotification = (faculty: any) => {
    setSelectedFaculty(faculty);
    setNotificationForm({
      recipient_id: faculty.id,
      title: '',
      message: ''
    });
    setIsNotificationOpen(true);
  };

  const sidebarItems = [
    { id: 'faculty-management', label: 'Faculty Management', icon: Users },
    { id: 'course-management', label: 'Course Management', icon: BookOpen },
    { id: 'work-activities', label: 'Work Activities', icon: BarChart3 },
    { id: 'class-reports', label: 'Class Reports', icon: Calendar },
    { id: 'attendance-reports', label: 'Attendance Reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-lg">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">NIT</span>
            </div>
            <span className="font-semibold dark:text-white">Admin Panel</span>
          </div>
        </div>
        
        <nav className="mt-4">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                activeSection === item.id ? 'bg-blue-50 dark:bg-blue-900 border-r-2 border-blue-500' : ''
              }`}
            >
              <item.icon className="h-4 w-4 dark:text-gray-300" />
              <span className="text-sm dark:text-gray-300">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
          <div className="px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold dark:text-white">
              {sidebarItems.find(item => item.id === activeSection)?.label || 'Admin Dashboard'}
            </h1>
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
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6">
          {activeSection === 'faculty-management' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white">Faculty Management</h2>
                <div className="space-x-2">
                  <Dialog open={isCreateFacultyOpen} onOpenChange={setIsCreateFacultyOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Faculty
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="dark:bg-gray-800">
                      <DialogHeader>
                        <DialogTitle className="dark:text-white">Create New Faculty</DialogTitle>
                        <DialogDescription className="dark:text-gray-300">
                          Add a new faculty member to the system with login credentials
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="fullName" className="dark:text-gray-300">Full Name</Label>
                          <Input
                            id="fullName"
                            value={facultyForm.full_name}
                            onChange={(e) => setFacultyForm({...facultyForm, full_name: e.target.value})}
                            className="dark:bg-gray-700 dark:text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="dark:text-gray-300">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={facultyForm.email}
                            onChange={(e) => setFacultyForm({...facultyForm, email: e.target.value})}
                            className="dark:bg-gray-700 dark:text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="password" className="dark:text-gray-300">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={facultyForm.password}
                            onChange={(e) => setFacultyForm({...facultyForm, password: e.target.value})}
                            className="dark:bg-gray-700 dark:text-white"
                            placeholder="Enter login password"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="department" className="dark:text-gray-300">Department</Label>
                          <Input
                            id="department"
                            value={facultyForm.department}
                            onChange={(e) => setFacultyForm({...facultyForm, department: e.target.value})}
                            className="dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="employeeId" className="dark:text-gray-300">Employee ID</Label>
                          <Input
                            id="employeeId"
                            value={facultyForm.employee_id}
                            onChange={(e) => setFacultyForm({...facultyForm, employee_id: e.target.value})}
                            className="dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <Button 
                          onClick={() => createFacultyMutation.mutate(facultyForm)}
                          disabled={createFacultyMutation.isPending}
                          className="w-full"
                        >
                          {createFacultyMutation.isPending ? 'Creating...' : 'Create Faculty'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Faculty List */}
              <Card className="dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="dark:text-white">All Faculty Members</CardTitle>
                  <CardDescription className="dark:text-gray-300">
                    Manage faculty members and their assignments
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
                        <TableHead className="dark:text-gray-300">Actions</TableHead>
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
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleAssignFaculty(faculty)}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleSendNotification(faculty)}
                              >
                                <Bell className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => deleteFacultyMutation.mutate(faculty.id)}
                                disabled={deleteFacultyMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Assignment Dialog */}
          <Dialog open={isAssignmentOpen} onOpenChange={setIsAssignmentOpen}>
            <DialogContent className="dark:bg-gray-800">
              <DialogHeader>
                <DialogTitle className="dark:text-white">
                  Assign Subjects to {selectedFaculty?.full_name}
                </DialogTitle>
                <DialogDescription className="dark:text-gray-300">
                  Assign branch, semester, subject, time slot and student count
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="dark:text-gray-300">Branch</Label>
                  <Input
                    value={assignmentForm.branch}
                    onChange={(e) => setAssignmentForm({...assignmentForm, branch: e.target.value})}
                    placeholder="e.g., B.Tech CSE"
                    className="dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <Label className="dark:text-gray-300">Semester</Label>
                  <Input
                    value={assignmentForm.semester}
                    onChange={(e) => setAssignmentForm({...assignmentForm, semester: e.target.value})}
                    placeholder="e.g., 3rd"
                    className="dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <Label className="dark:text-gray-300">Subject</Label>
                  <Input
                    value={assignmentForm.subject}
                    onChange={(e) => setAssignmentForm({...assignmentForm, subject: e.target.value})}
                    placeholder="e.g., Data Structures"
                    className="dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <Label className="dark:text-gray-300">Time Slot</Label>
                  <Input
                    value={assignmentForm.time_slot}
                    onChange={(e) => setAssignmentForm({...assignmentForm, time_slot: e.target.value})}
                    placeholder="e.g., 10:00-11:00"
                    className="dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <Label className="dark:text-gray-300">Total Students</Label>
                  <Input
                    type="number"
                    value={assignmentForm.total_students}
                    onChange={(e) => setAssignmentForm({...assignmentForm, total_students: e.target.value})}
                    placeholder="e.g., 60"
                    className="dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <Button 
                  onClick={() => selectedFaculty && assignFacultyMutation.mutate({ 
                    facultyId: selectedFaculty.id, 
                    assignment: assignmentForm 
                  })}
                  disabled={assignFacultyMutation.isPending}
                  className="w-full"
                >
                  {assignFacultyMutation.isPending ? 'Assigning...' : 'Assign Faculty'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Notification Dialog */}
          <Dialog open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
            <DialogContent className="dark:bg-gray-800">
              <DialogHeader>
                <DialogTitle className="dark:text-white">
                  Send Notification to {selectedFaculty?.full_name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="dark:text-gray-300">Title</Label>
                  <Input
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                    placeholder="Notification title"
                    className="dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <Label className="dark:text-gray-300">Message</Label>
                  <Textarea
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                    placeholder="Notification message"
                    className="dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <Button 
                  onClick={() => sendNotificationMutation.mutate(notificationForm)}
                  disabled={sendNotificationMutation.isPending}
                  className="w-full"
                >
                  {sendNotificationMutation.isPending ? 'Sending...' : 'Send Notification'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Other sections remain the same */}
          {activeSection === 'course-management' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white">Course Management</h2>
                <Dialog open={isCreateCourseOpen} onOpenChange={setIsCreateCourseOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dark:bg-gray-800">
                    <DialogHeader>
                      <DialogTitle className="dark:text-white">Create New Course</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="dark:text-gray-300">Course Name</Label>
                        <Input
                          value={courseForm.name}
                          onChange={(e) => setCourseForm({...courseForm, name: e.target.value})}
                          className="dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <Label className="dark:text-gray-300">Course Code</Label>
                        <Input
                          value={courseForm.code}
                          onChange={(e) => setCourseForm({...courseForm, code: e.target.value})}
                          className="dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <Label className="dark:text-gray-300">Description</Label>
                        <Textarea
                          value={courseForm.description}
                          onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                          className="dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <Button 
                        onClick={() => createCourseMutation.mutate(courseForm)}
                        disabled={createCourseMutation.isPending}
                        className="w-full"
                      >
                        {createCourseMutation.isPending ? 'Creating...' : 'Create Course'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Card className="dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="dark:text-white">All Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-gray-700">
                        <TableHead className="dark:text-gray-300">Name</TableHead>
                        <TableHead className="dark:text-gray-300">Code</TableHead>
                        <TableHead className="dark:text-gray-300">Faculty</TableHead>
                        <TableHead className="dark:text-gray-300">Credits</TableHead>
                        <TableHead className="dark:text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allCourses?.map((course) => (
                        <TableRow key={course.id} className="dark:border-gray-700">
                          <TableCell className="font-medium dark:text-white">{course.name}</TableCell>
                          <TableCell className="dark:text-gray-300">{course.code}</TableCell>
                          <TableCell className="dark:text-gray-300">{course.profiles?.full_name || 'Unassigned'}</TableCell>
                          <TableCell className="dark:text-gray-300">{course.credits}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => deleteCourse.mutate(course.id)}
                                disabled={deleteCourse.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'work-activities' && (
            <Card className="dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white">Work Activities</CardTitle>
                <CardDescription className="dark:text-gray-300">
                  View all faculty work activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="dark:text-gray-300">Faculty</TableHead>
                      <TableHead className="dark:text-gray-300">Title</TableHead>
                      <TableHead className="dark:text-gray-300">Type</TableHead>
                      <TableHead className="dark:text-gray-300">Hours</TableHead>
                      <TableHead className="dark:text-gray-300">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workActivities?.map((activity) => (
                      <TableRow key={activity.id} className="dark:border-gray-700">
                        <TableCell className="font-medium dark:text-white">{activity.profiles?.full_name}</TableCell>
                        <TableCell className="dark:text-gray-300">{activity.title}</TableCell>
                        <TableCell className="dark:text-gray-300">{activity.activity_type}</TableCell>
                        <TableCell className="dark:text-gray-300">{activity.hours_spent || 0}</TableCell>
                        <TableCell className="dark:text-gray-300">{activity.start_date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {activeSection === 'class-reports' && (
            <Card className="dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white">Class Reports</CardTitle>
                <CardDescription className="dark:text-gray-300">
                  View all class sessions and reports
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classRecords?.map((record) => (
                      <TableRow key={record.id} className="dark:border-gray-700">
                        <TableCell className="font-medium dark:text-white">{record.profiles?.full_name}</TableCell>
                        <TableCell className="dark:text-gray-300">{record.courses?.name}</TableCell>
                        <TableCell className="dark:text-gray-300">{record.session_date}</TableCell>
                        <TableCell className="dark:text-gray-300">{record.start_time}</TableCell>
                        <TableCell className="dark:text-gray-300">{record.topic}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {activeSection === 'attendance-reports' && (
            <Card className="dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white">Attendance Reports</CardTitle>
                <CardDescription className="dark:text-gray-300">
                  Generate and view attendance reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Button variant="outline">Daily Report</Button>
                  <Button variant="outline">Weekly Report</Button>
                  <Button variant="outline">Monthly Report</Button>
                </div>
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Select a report type to view attendance data
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default DirectAdminDashboard;
