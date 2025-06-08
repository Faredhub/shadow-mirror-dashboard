import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Home, 
  Users, 
  BookOpen, 
  Calendar, 
  BarChart3, 
  Moon, 
  Sun, 
  Plus, 
  LogOut,
  Clock,
  CheckCircle,
  Bell,
  UserCheck,
  BookmarkPlus
} from 'lucide-react';
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

const FacultyDashboard = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('assignments');
  const [isCreateWorkOpen, setIsCreateWorkOpen] = useState(false);
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);

  // Work activity form state
  const [workForm, setWorkForm] = useState({
    title: '',
    description: '',
    activity_type: '',
    hours_spent: 0,
    start_date: '',
    end_date: ''
  });

  // Class session form state
  const [classForm, setClassForm] = useState({
    course_id: '',
    session_date: '',
    start_time: '',
    end_time: '',
    topic: '',
    session_type: 'lecture',
    location: ''
  });

  // Real-time data fetching for faculty assignments and notifications
  const { data: assignments } = useQuery({
    queryKey: ['faculty-assignments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log('Fetching assignments for faculty:', user.id);
      
      const { data, error } = await supabase
        .from('work_activities')
        .select('*')
        .eq('faculty_id', user.id)
        .eq('activity_type', 'assignment')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching assignments:', error);
        throw error;
      }
      console.log('Assignments data:', data);
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 2000,
  });

  const { data: notifications } = useQuery({
    queryKey: ['faculty-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log('Fetching notifications for faculty:', user.id);
      
      const { data, error } = await supabase
        .from('work_activities')
        .select('*')
        .eq('faculty_id', user.id)
        .eq('activity_type', 'notification')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
      console.log('Notifications data:', data);
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 2000,
  });

  const { data: workActivities } = useQuery({
    queryKey: ['faculty-work-activities', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('work_activities')
        .select('*')
        .eq('faculty_id', user.id)
        .in('activity_type', ['teaching', 'research', 'admin', 'other'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 3000,
  });

  const { data: courses } = useQuery({
    queryKey: ['faculty-courses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('faculty_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 3000,
  });

  const { data: classSessions } = useQuery({
    queryKey: ['faculty-class-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('class_sessions')
        .select(`
          *,
          courses (name, code)
        `)
        .eq('faculty_id', user.id)
        .order('session_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 3000,
  });

  // Mutations
  const createWorkActivityMutation = useMutation({
    mutationFn: async (data: typeof workForm) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data: activity, error } = await supabase
        .from('work_activities')
        .insert({
          faculty_id: user.id,
          title: data.title,
          description: data.description,
          activity_type: data.activity_type,
          hours_spent: data.hours_spent,
          start_date: data.start_date,
          end_date: data.end_date,
          status: 'completed'
        })
        .select()
        .single();

      if (error) throw error;
      return activity;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Work activity created successfully" });
      setIsCreateWorkOpen(false);
      setWorkForm({
        title: '',
        description: '',
        activity_type: '',
        hours_spent: 0,
        start_date: '',
        end_date: ''
      });
      queryClient.invalidateQueries({ queryKey: ['faculty-work-activities'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const createClassSessionMutation = useMutation({
    mutationFn: async (data: typeof classForm) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data: session, error } = await supabase
        .from('class_sessions')
        .insert({
          faculty_id: user.id,
          course_id: data.course_id,
          session_date: data.session_date,
          start_time: data.start_time,
          end_time: data.end_time,
          topic: data.topic,
          session_type: data.session_type,
          location: data.location
        })
        .select()
        .single();

      if (error) throw error;
      return session;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Class session created successfully" });
      setIsCreateClassOpen(false);
      setClassForm({
        course_id: '',
        session_date: '',
        start_time: '',
        end_time: '',
        topic: '',
        session_type: 'lecture',
        location: ''
      });
      queryClient.invalidateQueries({ queryKey: ['faculty-class-sessions'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const sidebarItems = [
    { id: 'assignments', label: 'My Assignments', icon: BookmarkPlus },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'work-activities', label: 'Work Activities', icon: BarChart3 },
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'class-sessions', label: 'Class Sessions', icon: Calendar },
    { id: 'attendance', label: 'Attendance', icon: UserCheck },
  ];

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Please log in to access the faculty dashboard.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-lg">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">NIT</span>
            </div>
            <span className="font-semibold dark:text-white">Faculty Portal</span>
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
              {item.id === 'assignments' && assignments && assignments.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {assignments.length}
                </Badge>
              )}
              {item.id === 'notifications' && notifications && notifications.length > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {notifications.length}
                </Badge>
              )}
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
              {sidebarItems.find(item => item.id === activeSection)?.label || 'Faculty Dashboard'}
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
                Welcome, {user.email}
                <Badge variant="outline" className="ml-2">
                  Faculty
                </Badge>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6">
          {/* Assignments Section */}
          {activeSection === 'assignments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white">My Assignments</h2>
              </div>

              <div className="grid gap-4">
                {assignments && assignments.length > 0 ? (
                  assignments.map((assignment) => {
                    // Parse the description to extract assignment details
                    const description = assignment.description || '';
                    const branch = description.match(/Branch: ([^,]+)/)?.[1] || 'N/A';
                    const semester = description.match(/Semester: ([^,]+)/)?.[1] || 'N/A';
                    const timeSlot = description.match(/Time Slot: ([^,]+)/)?.[1] || 'N/A';
                    const students = description.match(/Students: ([^,]+)/)?.[1] || 'N/A';
                    const subject = assignment.title.replace('Assignment: ', '') || 'N/A';

                    return (
                      <Card key={assignment.id} className="dark:bg-gray-800">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="dark:text-white">{subject}</CardTitle>
                              <CardDescription className="dark:text-gray-300">
                                Assigned on {new Date(assignment.created_at).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            <Badge variant={assignment.status === 'assigned' ? 'default' : 'secondary'}>
                              {assignment.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium dark:text-gray-300">Branch:</span>
                              <span className="ml-2 dark:text-white">{branch}</span>
                            </div>
                            <div>
                              <span className="font-medium dark:text-gray-300">Semester:</span>
                              <span className="ml-2 dark:text-white">{semester}</span>
                            </div>
                            <div>
                              <span className="font-medium dark:text-gray-300">Time Slot:</span>
                              <span className="ml-2 dark:text-white">{timeSlot}</span>
                            </div>
                            <div>
                              <span className="font-medium dark:text-gray-300">Total Students:</span>
                              <span className="ml-2 dark:text-white">{students}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="dark:bg-gray-800">
                    <CardContent className="text-center py-8">
                      <BookmarkPlus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No assignments yet</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        Admin will assign subjects to you soon
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white">Notifications</h2>
              </div>

              <div className="space-y-4">
                {notifications && notifications.length > 0 ? (
                  notifications.map((notification) => {
                    const title = notification.title.replace('Notification: ', '') || 'Notification';
                    
                    return (
                      <Card key={notification.id} className="dark:bg-gray-800">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="dark:text-white flex items-center">
                                <Bell className="h-4 w-4 mr-2" />
                                {title}
                              </CardTitle>
                              <CardDescription className="dark:text-gray-300">
                                Received on {new Date(notification.created_at).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            <Badge variant="outline">
                              {notification.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="dark:text-gray-300">{notification.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="dark:bg-gray-800">
                    <CardContent className="text-center py-8">
                      <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No notifications</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        You'll receive notifications from admin here
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Work Activities Section */}
          {activeSection === 'work-activities' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white">Work Activities</h2>
                <Dialog open={isCreateWorkOpen} onOpenChange={setIsCreateWorkOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Activity
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dark:bg-gray-800">
                    <DialogHeader>
                      <DialogTitle className="dark:text-white">Create Work Activity</DialogTitle>
                      <DialogDescription className="dark:text-gray-300">
                        Record your teaching, research, or administrative activities
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="dark:text-gray-300">Title</Label>
                        <Input
                          value={workForm.title}
                          onChange={(e) => setWorkForm({...workForm, title: e.target.value})}
                          className="dark:bg-gray-700 dark:text-white"
                          placeholder="Activity title"
                        />
                      </div>
                      <div>
                        <Label className="dark:text-gray-300">Description</Label>
                        <Textarea
                          value={workForm.description}
                          onChange={(e) => setWorkForm({...workForm, description: e.target.value})}
                          className="dark:bg-gray-700 dark:text-white"
                          placeholder="Activity description"
                        />
                      </div>
                      <div>
                        <Label className="dark:text-gray-300">Activity Type</Label>
                        <Select value={workForm.activity_type} onValueChange={(value) => setWorkForm({...workForm, activity_type: value})}>
                          <SelectTrigger className="dark:bg-gray-700 dark:text-white">
                            <SelectValue placeholder="Select activity type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="teaching">Teaching</SelectItem>
                            <SelectItem value="research">Research</SelectItem>
                            <SelectItem value="admin">Administrative</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="dark:text-gray-300">Hours Spent</Label>
                        <Input
                          type="number"
                          value={workForm.hours_spent}
                          onChange={(e) => setWorkForm({...workForm, hours_spent: parseFloat(e.target.value)})}
                          className="dark:bg-gray-700 dark:text-white"
                          placeholder="0"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="dark:text-gray-300">Start Date</Label>
                          <Input
                            type="date"
                            value={workForm.start_date}
                            onChange={(e) => setWorkForm({...workForm, start_date: e.target.value})}
                            className="dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <Label className="dark:text-gray-300">End Date</Label>
                          <Input
                            type="date"
                            value={workForm.end_date}
                            onChange={(e) => setWorkForm({...workForm, end_date: e.target.value})}
                            className="dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={() => createWorkActivityMutation.mutate(workForm)}
                        disabled={createWorkActivityMutation.isPending}
                        className="w-full"
                      >
                        {createWorkActivityMutation.isPending ? 'Creating...' : 'Create Activity'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {workActivities?.map((activity) => (
                  <Card key={activity.id} className="dark:bg-gray-800">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="dark:text-white">{activity.title}</CardTitle>
                          <CardDescription className="dark:text-gray-300">
                            {activity.activity_type} • {activity.hours_spent} hours
                          </CardDescription>
                        </div>
                        <Badge variant="outline">
                          {activity.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="dark:text-gray-300 mb-2">{activity.description}</p>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {activity.start_date && (
                          <span>From {activity.start_date}</span>
                        )}
                        {activity.end_date && (
                          <span> to {activity.end_date}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Other sections remain the same */}
          {activeSection === 'courses' && (
            <Card className="dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white">My Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Course management coming soon
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'class-sessions' && (
            <Card className="dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white">Class Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Class session management coming soon
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'attendance' && (
            <Card className="dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white">Attendance Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Attendance management coming soon
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default FacultyDashboard;
