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
  BookmarkPlus,
  FileText,
  ClipboardList,
  Upload
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
  const [isCreateClassRecordOpen, setIsCreateClassRecordOpen] = useState(false);
  const [isCreateWorkDetailOpen, setIsCreateWorkDetailOpen] = useState(false);

  // Work activity form state
  const [workForm, setWorkForm] = useState({
    title: '',
    description: '',
    activity_type: '',
    hours_spent: 0,
    start_date: '',
    end_date: ''
  });

  // Class record form state
  const [classRecordForm, setClassRecordForm] = useState({
    topic_covered: '',
    students_present: 0,
    students_absent: 0,
    total_students: 0,
    uploaded_file: null as File | null,
    description: '',
    remarks: '',
    session_date: new Date().toISOString().split('T')[0]
  });

  // Work detail form state
  const [workDetailForm, setWorkDetailForm] = useState({
    work_type: '',
    duration: '',
    uploaded_file: null as File | null,
    description: '',
    remarks: '',
    slot_type: 'morning',
    session_date: new Date().toISOString().split('T')[0]
  });

  // Real-time data fetching for faculty assignments and notifications
  const { data: assignments } = useQuery({
    queryKey: ['faculty-assignments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('work_activities')
        .select('*')
        .eq('faculty_id', user.id)
        .eq('activity_type', 'assignment')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 2000,
  });

  const { data: notifications } = useQuery({
    queryKey: ['faculty-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('work_activities')
        .select('*')
        .eq('faculty_id', user.id)
        .eq('activity_type', 'notification')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
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

  const { data: classRecords } = useQuery({
    queryKey: ['faculty-class-records', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('class_records')
        .select('*')
        .eq('faculty_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching class records:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 3000,
  });

  const { data: workDetails } = useQuery({
    queryKey: ['faculty-work-details', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('work_details')
        .select('*')
        .eq('faculty_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching work details:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 3000,
  });

  // File upload function
  const uploadFile = async (file: File, bucket: string) => {
    if (!file) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user?.id}/${fileName}`;

    console.log('Uploading file to bucket:', bucket, 'path:', filePath);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) {
      console.error('File upload error:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  };

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
      console.error('Work activity creation error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const createClassRecordMutation = useMutation({
    mutationFn: async (data: typeof classRecordForm) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      let fileUrl = null;
      if (data.uploaded_file) {
        try {
          fileUrl = await uploadFile(data.uploaded_file, 'class-documents');
        } catch (error) {
          console.error('File upload error:', error);
          // Continue without file if upload fails
        }
      }
      
      const { data: record, error } = await supabase
        .from('class_records')
        .insert({
          faculty_id: user.id,
          topic_covered: data.topic_covered,
          students_present: data.students_present,
          students_absent: data.students_absent,
          total_students: data.total_students,
          document_url: fileUrl,
          description: data.description || null,
          remarks: data.remarks || null,
          session_date: data.session_date
        })
        .select()
        .single();

      if (error) {
        console.error('Class record creation error:', error);
        throw error;
      }
      return record;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Class record created successfully" });
      setIsCreateClassRecordOpen(false);
      setClassRecordForm({
        topic_covered: '',
        students_present: 0,
        students_absent: 0,
        total_students: 0,
        uploaded_file: null,
        description: '',
        remarks: '',
        session_date: new Date().toISOString().split('T')[0]
      });
      queryClient.invalidateQueries({ queryKey: ['faculty-class-records'] });
    },
    onError: (error: any) => {
      console.error('Class record creation error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const createWorkDetailMutation = useMutation({
    mutationFn: async (data: typeof workDetailForm) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      let fileUrl = null;
      if (data.uploaded_file) {
        try {
          fileUrl = await uploadFile(data.uploaded_file, 'work-documents');
        } catch (error) {
          console.error('File upload error:', error);
          // Continue without file if upload fails
        }
      }
      
      const { data: detail, error } = await supabase
        .from('work_details')
        .insert({
          faculty_id: user.id,
          work_type: data.work_type,
          duration: data.duration,
          document_url: fileUrl,
          description: data.description,
          remarks: data.remarks || null,
          slot_type: data.slot_type,
          session_date: data.session_date
        })
        .select()
        .single();

      if (error) {
        console.error('Work detail creation error:', error);
        throw error;
      }
      return detail;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Work detail created successfully" });
      setIsCreateWorkDetailOpen(false);
      setWorkDetailForm({
        work_type: '',
        duration: '',
        uploaded_file: null,
        description: '',
        remarks: '',
        slot_type: 'morning',
        session_date: new Date().toISOString().split('T')[0]
      });
      queryClient.invalidateQueries({ queryKey: ['faculty-work-details'] });
    },
    onError: (error: any) => {
      console.error('Work detail creation error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const sidebarItems = [
    { id: 'assignments', label: 'My Assignments', icon: BookmarkPlus },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'work-activities', label: 'Work Activities', icon: BarChart3 },
    { id: 'class-records', label: 'Class Records', icon: FileText },
    { id: 'work-details', label: 'Work Details', icon: ClipboardList },
    { id: 'attendance', label: 'Attendance', icon: UserCheck },
  ];

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Please log in to access the faculty dashboard.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
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
                              <CardTitle className="dark:text-white">{title}</CardTitle>
                              <CardDescription className="dark:text-gray-300">
                                {new Date(notification.created_at).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            <Badge variant="outline">New</Badge>
                          </div>
                        </CardHeader>
                        {notification.description && (
                          <CardContent>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {notification.description}
                            </p>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })
                ) : (
                  <Card className="dark:bg-gray-800">
                    <CardContent className="text-center py-8">
                      <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
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
                      Add Work Activity
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dark:bg-gray-800">
                    <DialogHeader>
                      <DialogTitle className="dark:text-white">Create Work Activity</DialogTitle>
                      <DialogDescription className="dark:text-gray-300">
                        Add a new work activity record
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="dark:text-gray-300">Title</Label>
                        <Input
                          value={workForm.title}
                          onChange={(e) => setWorkForm({...workForm, title: e.target.value})}
                          className="dark:bg-gray-700 dark:text-white"
                          placeholder="Work activity title"
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
                        <Label className="dark:text-gray-300">Description</Label>
                        <Textarea
                          value={workForm.description}
                          onChange={(e) => setWorkForm({...workForm, description: e.target.value})}
                          className="dark:bg-gray-700 dark:text-white"
                          placeholder="Activity description"
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
                      <div>
                        <Label className="dark:text-gray-300">Hours Spent</Label>
                        <Input
                          type="number"
                          value={workForm.hours_spent}
                          onChange={(e) => setWorkForm({...workForm, hours_spent: parseInt(e.target.value) || 0})}
                          className="dark:bg-gray-700 dark:text-white"
                        />
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
                {workActivities && workActivities.length > 0 ? (
                  workActivities.map((activity) => (
                    <Card key={activity.id} className="dark:bg-gray-800">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="dark:text-white">{activity.title}</CardTitle>
                            <CardDescription className="dark:text-gray-300">
                              {activity.activity_type} • {activity.hours_spent} hours
                            </CardDescription>
                          </div>
                          <Badge variant="outline">{activity.status}</Badge>
                        </div>
                      </CardHeader>
                      {activity.description && (
                        <CardContent>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {activity.description}
                          </p>
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {activity.start_date} to {activity.end_date}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))
                ) : (
                  <Card className="dark:bg-gray-800">
                    <CardContent className="text-center py-8">
                      <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No work activities yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Class Records Section */}
          {activeSection === 'class-records' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white">Class Records</h2>
                <Dialog open={isCreateClassRecordOpen} onOpenChange={setIsCreateClassRecordOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Class Record
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dark:bg-gray-800 max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="dark:text-white">Create Class Record</DialogTitle>
                      <DialogDescription className="dark:text-gray-300">
                        Record details about your class session
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      <div>
                        <Label className="dark:text-gray-300">Topic Covered</Label>
                        <Input
                          value={classRecordForm.topic_covered}
                          onChange={(e) => setClassRecordForm({...classRecordForm, topic_covered: e.target.value})}
                          className="dark:bg-gray-700 dark:text-white"
                          placeholder="Topic covered in class"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="dark:text-gray-300">Students Present</Label>
                          <Input
                            type="number"
                            value={classRecordForm.students_present}
                            onChange={(e) => setClassRecordForm({...classRecordForm, students_present: parseInt(e.target.value) || 0})}
                            className="dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <Label className="dark:text-gray-300">Students Absent</Label>
                          <Input
                            type="number"
                            value={classRecordForm.students_absent}
                            onChange={(e) => setClassRecordForm({...classRecordForm, students_absent: parseInt(e.target.value) || 0})}
                            className="dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <Label className="dark:text-gray-300">Total Students</Label>
                          <Input
                            type="number"
                            value={classRecordForm.total_students}
                            onChange={(e) => setClassRecordForm({...classRecordForm, total_students: parseInt(e.target.value) || 0})}
                            className="dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="dark:text-gray-300">Session Date</Label>
                        <Input
                          type="date"
                          value={classRecordForm.session_date}
                          onChange={(e) => setClassRecordForm({...classRecordForm, session_date: e.target.value})}
                          className="dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <Label className="dark:text-gray-300">Upload File (Optional)</Label>
                        <Input
                          type="file"
                          onChange={(e) => setClassRecordForm({...classRecordForm, uploaded_file: e.target.files?.[0] || null})}
                          className="dark:bg-gray-700 dark:text-white"
                          accept="image/*,.pdf,.doc,.docx"
                        />
                        {classRecordForm.uploaded_file && (
                          <p className="text-sm text-green-600 mt-1">File selected: {classRecordForm.uploaded_file.name}</p>
                        )}
                      </div>
                      <div>
                        <Label className="dark:text-gray-300">Description</Label>
                        <Textarea
                          value={classRecordForm.description}
                          onChange={(e) => setClassRecordForm({...classRecordForm, description: e.target.value})}
                          className="dark:bg-gray-700 dark:text-white"
                          placeholder="Class description"
                        />
                      </div>
                      <div>
                        <Label className="dark:text-gray-300">Remarks</Label>
                        <Textarea
                          value={classRecordForm.remarks}
                          onChange={(e) => setClassRecordForm({...classRecordForm, remarks: e.target.value})}
                          className="dark:bg-gray-700 dark:text-white"
                          placeholder="Any additional remarks"
                        />
                      </div>
                      <Button 
                        onClick={() => createClassRecordMutation.mutate(classRecordForm)}
                        disabled={createClassRecordMutation.isPending}
                        className="w-full"
                      >
                        {createClassRecordMutation.isPending ? 'Creating...' : 'Create Class Record'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {classRecords && classRecords.length > 0 ? (
                  classRecords.map((record) => (
                    <Card key={record.id} className="dark:bg-gray-800">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="dark:text-white">{record.topic_covered}</CardTitle>
                            <CardDescription className="dark:text-gray-300">
                              {new Date(record.session_date).toLocaleDateString()} • {record.students_present}/{record.total_students} present
                            </CardDescription>
                          </div>
                          <Badge variant="outline">Class Record</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {record.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {record.description}
                          </p>
                        )}
                        {record.document_url && (
                          <a 
                            href={record.document_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            View attached file
                          </a>
                        )}
                        {record.remarks && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Remarks: {record.remarks}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="dark:bg-gray-800">
                    <CardContent className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No class records yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Work Details Section */}
          {activeSection === 'work-details' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white">Work Details</h2>
                <Dialog open={isCreateWorkDetailOpen} onOpenChange={setIsCreateWorkDetailOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Work Detail
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dark:bg-gray-800 max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="dark:text-white">Create Work Detail</DialogTitle>
                      <DialogDescription className="dark:text-gray-300">
                        Record details about your work activity
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      <div>
                        <Label className="dark:text-gray-300">Work Type</Label>
                        <Input
                          value={workDetailForm.work_type}
                          onChange={(e) => setWorkDetailForm({...workDetailForm, work_type: e.target.value})}
                          className="dark:bg-gray-700 dark:text-white"
                          placeholder="Type of work performed"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="dark:text-gray-300">Duration</Label>
                          <Input
                            value={workDetailForm.duration}
                            onChange={(e) => setWorkDetailForm({...workDetailForm, duration: e.target.value})}
                            className="dark:bg-gray-700 dark:text-white"
                            placeholder="e.g., 2 hours"
                          />
                        </div>
                        <div>
                          <Label className="dark:text-gray-300">Slot Type</Label>
                          <Select value={workDetailForm.slot_type} onValueChange={(value) => setWorkDetailForm({...workDetailForm, slot_type: value})}>
                            <SelectTrigger className="dark:bg-gray-700 dark:text-white">
                              <SelectValue placeholder="Select slot" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="morning">Morning</SelectItem>
                              <SelectItem value="afternoon">Afternoon</SelectItem>
                              <SelectItem value="evening">Evening</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="dark:text-gray-300">Session Date</Label>
                        <Input
                          type="date"
                          value={workDetailForm.session_date}
                          onChange={(e) => setWorkDetailForm({...workDetailForm, session_date: e.target.value})}
                          className="dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <Label className="dark:text-gray-300">Upload File (Optional)</Label>
                        <Input
                          type="file"
                          onChange={(e) => setWorkDetailForm({...workDetailForm, uploaded_file: e.target.files?.[0] || null})}
                          className="dark:bg-gray-700 dark:text-white"
                          accept="image/*,.pdf,.doc,.docx"
                        />
                        {workDetailForm.uploaded_file && (
                          <p className="text-sm text-green-600 mt-1">File selected: {workDetailForm.uploaded_file.name}</p>
                        )}
                      </div>
                      <div>
                        <Label className="dark:text-gray-300">Description</Label>
                        <Textarea
                          value={workDetailForm.description}
                          onChange={(e) => setWorkDetailForm({...workDetailForm, description: e.target.value})}
                          className="dark:bg-gray-700 dark:text-white"
                          placeholder="Work description"
                        />
                      </div>
                      <div>
                        <Label className="dark:text-gray-300">Remarks</Label>
                        <Textarea
                          value={workDetailForm.remarks}
                          onChange={(e) => setWorkDetailForm({...workDetailForm, remarks: e.target.value})}
                          className="dark:bg-gray-700 dark:text-white"
                          placeholder="Any additional remarks"
                        />
                      </div>
                      <Button 
                        onClick={() => createWorkDetailMutation.mutate(workDetailForm)}
                        disabled={createWorkDetailMutation.isPending}
                        className="w-full"
                      >
                        {createWorkDetailMutation.isPending ? 'Creating...' : 'Create Work Detail'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {workDetails && workDetails.length > 0 ? (
                  workDetails.map((detail) => (
                    <Card key={detail.id} className="dark:bg-gray-800">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="dark:text-white">{detail.work_type}</CardTitle>
                            <CardDescription className="dark:text-gray-300">
                              {new Date(detail.session_date).toLocaleDateString()} • {detail.duration} • {detail.slot_type}
                            </CardDescription>
                          </div>
                          <Badge variant="outline">Work Detail</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {detail.description}
                        </p>
                        {detail.document_url && (
                          <a 
                            href={detail.document_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            View attached file
                          </a>
                        )}
                        {detail.remarks && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Remarks: {detail.remarks}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="dark:bg-gray-800">
                    <CardContent className="text-center py-8">
                      <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No work details yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Attendance Section */}
          {activeSection === 'attendance' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white">Attendance Management</h2>
              </div>
              <Card className="dark:bg-gray-800">
                <CardContent className="text-center py-8">
                  <UserCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Attendance feature coming soon</p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default FacultyDashboard;
