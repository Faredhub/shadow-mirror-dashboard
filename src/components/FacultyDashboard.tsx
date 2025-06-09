
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
      
      if (error) {
        console.error('Error fetching assignments:', error);
        throw error;
      }
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
      
      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 2000,
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
        throw error;
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
        throw error;
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

  const createClassRecordMutation = useMutation({
    mutationFn: async (data: typeof classRecordForm) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      console.log('Creating class record with data:', data);
      
      let fileUrl = null;
      if (data.uploaded_file) {
        try {
          fileUrl = await uploadFile(data.uploaded_file, 'class-documents');
          console.log('File uploaded successfully:', fileUrl);
        } catch (error) {
          console.error('File upload error:', error);
          // Continue without file if upload fails
        }
      }
      
      const insertData = {
        faculty_id: user.id,
        topic_covered: data.topic_covered,
        students_present: data.students_present,
        students_absent: data.students_absent,
        total_students: data.total_students,
        document_url: fileUrl,
        description: data.description || null,
        remarks: data.remarks || null,
        session_date: data.session_date
      };
      
      console.log('Inserting class record:', insertData);
      
      const { data: record, error } = await supabase
        .from('class_records')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Class record insertion error:', error);
        throw error;
      }
      
      console.log('Class record created successfully:', record);
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
      queryClient.invalidateQueries({ queryKey: ['all-class-records'] });
    },
    onError: (error: any) => {
      console.error('Class record mutation error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const createWorkDetailMutation = useMutation({
    mutationFn: async (data: typeof workDetailForm) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      console.log('Creating work detail with data:', data);
      
      let fileUrl = null;
      if (data.uploaded_file) {
        try {
          fileUrl = await uploadFile(data.uploaded_file, 'work-documents');
          console.log('File uploaded successfully:', fileUrl);
        } catch (error) {
          console.error('File upload error:', error);
          // Continue without file if upload fails
        }
      }
      
      const insertData = {
        faculty_id: user.id,
        work_type: data.work_type,
        duration: data.duration,
        document_url: fileUrl,
        description: data.description,
        remarks: data.remarks || null,
        slot_type: data.slot_type,
        session_date: data.session_date
      };
      
      console.log('Inserting work detail:', insertData);
      
      const { data: detail, error } = await supabase
        .from('work_details')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Work detail insertion error:', error);
        throw error;
      }
      
      console.log('Work detail created successfully:', detail);
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
      queryClient.invalidateQueries({ queryKey: ['all-work-details'] });
    },
    onError: (error: any) => {
      console.error('Work detail mutation error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const sidebarItems = [
    { id: 'assignments', label: 'My Assignments', icon: BookmarkPlus },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'class-records', label: 'Class Records', icon: FileText },
    { id: 'work-details', label: 'Work Details', icon: ClipboardList },
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
                                Received on {new Date(notification.created_at).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            <Badge variant="outline">
                              {notification.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm dark:text-gray-300">{notification.description}</p>
                        </CardContent>
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
                        <Label htmlFor="topic_covered" className="dark:text-white">Topic Covered</Label>
                        <Input
                          id="topic_covered"
                          value={classRecordForm.topic_covered}
                          onChange={(e) => setClassRecordForm(prev => ({ ...prev, topic_covered: e.target.value }))}
                          placeholder="Enter the topic covered in class"
                          className="dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="students_present" className="dark:text-white">Students Present</Label>
                          <Input
                            id="students_present"
                            type="number"
                            value={classRecordForm.students_present}
                            onChange={(e) => setClassRecordForm(prev => ({ ...prev, students_present: parseInt(e.target.value) || 0 }))}
                            className="dark:bg-gray-700 dark:border-gray-600"
                          />
                        </div>
                        <div>
                          <Label htmlFor="students_absent" className="dark:text-white">Students Absent</Label>
                          <Input
                            id="students_absent"
                            type="number"
                            value={classRecordForm.students_absent}
                            onChange={(e) => setClassRecordForm(prev => ({ ...prev, students_absent: parseInt(e.target.value) || 0 }))}
                            className="dark:bg-gray-700 dark:border-gray-600"
                          />
                        </div>
                        <div>
                          <Label htmlFor="total_students" className="dark:text-white">Total Students</Label>
                          <Input
                            id="total_students"
                            type="number"
                            value={classRecordForm.total_students}
                            onChange={(e) => setClassRecordForm(prev => ({ ...prev, total_students: parseInt(e.target.value) || 0 }))}
                            className="dark:bg-gray-700 dark:border-gray-600"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="session_date" className="dark:text-white">Session Date</Label>
                        <Input
                          id="session_date"
                          type="date"
                          value={classRecordForm.session_date}
                          onChange={(e) => setClassRecordForm(prev => ({ ...prev, session_date: e.target.value }))}
                          className="dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description" className="dark:text-white">Description (Optional)</Label>
                        <Textarea
                          id="description"
                          value={classRecordForm.description}
                          onChange={(e) => setClassRecordForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Additional details about the class"
                          className="dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="remarks" className="dark:text-white">Remarks (Optional)</Label>
                        <Textarea
                          id="remarks"
                          value={classRecordForm.remarks}
                          onChange={(e) => setClassRecordForm(prev => ({ ...prev, remarks: e.target.value }))}
                          placeholder="Any additional remarks"
                          className="dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="class_document" className="dark:text-white">Upload Document (Optional)</Label>
                        <Input
                          id="class_document"
                          type="file"
                          onChange={(e) => setClassRecordForm(prev => ({ ...prev, uploaded_file: e.target.files?.[0] || null }))}
                          className="dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <Button 
                        onClick={() => createClassRecordMutation.mutate(classRecordForm)}
                        disabled={createClassRecordMutation.isPending || !classRecordForm.topic_covered}
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
                              {new Date(record.session_date).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <Badge variant="outline">
                            {record.students_present}/{record.total_students} Present
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {record.description && (
                            <p className="text-sm dark:text-gray-300">{record.description}</p>
                          )}
                          {record.document_url && (
                            <div>
                              <a 
                                href={record.document_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                View Document
                              </a>
                            </div>
                          )}
                        </div>
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
                        Record details about your work activities
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      <div>
                        <Label htmlFor="work_type" className="dark:text-white">Work Type</Label>
                        <Select value={workDetailForm.work_type} onValueChange={(value) => 
                          setWorkDetailForm(prev => ({ ...prev, work_type: value }))
                        }>
                          <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                            <SelectValue placeholder="Select work type" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-700">
                            <SelectItem value="teaching">Teaching</SelectItem>
                            <SelectItem value="research">Research</SelectItem>
                            <SelectItem value="administrative">Administrative</SelectItem>
                            <SelectItem value="evaluation">Evaluation</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="duration" className="dark:text-white">Duration</Label>
                        <Input
                          id="duration"
                          value={workDetailForm.duration}
                          onChange={(e) => setWorkDetailForm(prev => ({ ...prev, duration: e.target.value }))}
                          placeholder="e.g., 2 hours, 1 day"
                          className="dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="slot_type" className="dark:text-white">Time Slot</Label>
                        <Select value={workDetailForm.slot_type} onValueChange={(value) => 
                          setWorkDetailForm(prev => ({ ...prev, slot_type: value }))
                        }>
                          <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                            <SelectValue placeholder="Select time slot" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-700">
                            <SelectItem value="morning">Morning</SelectItem>
                            <SelectItem value="afternoon">Afternoon</SelectItem>
                            <SelectItem value="evening">Evening</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="work_date" className="dark:text-white">Work Date</Label>
                        <Input
                          id="work_date"
                          type="date"
                          value={workDetailForm.session_date}
                          onChange={(e) => setWorkDetailForm(prev => ({ ...prev, session_date: e.target.value }))}
                          className="dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="work_description" className="dark:text-white">Description</Label>
                        <Textarea
                          id="work_description"
                          value={workDetailForm.description}
                          onChange={(e) => setWorkDetailForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe the work performed"
                          className="dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="work_remarks" className="dark:text-white">Remarks (Optional)</Label>
                        <Textarea
                          id="work_remarks"
                          value={workDetailForm.remarks}
                          onChange={(e) => setWorkDetailForm(prev => ({ ...prev, remarks: e.target.value }))}
                          placeholder="Any additional remarks"
                          className="dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="work_document" className="dark:text-white">Upload Document (Optional)</Label>
                        <Input
                          id="work_document"
                          type="file"
                          onChange={(e) => setWorkDetailForm(prev => ({ ...prev, uploaded_file: e.target.files?.[0] || null }))}
                          className="dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <Button 
                        onClick={() => createWorkDetailMutation.mutate(workDetailForm)}
                        disabled={createWorkDetailMutation.isPending || !workDetailForm.work_type || !workDetailForm.description}
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
                            <CardTitle className="dark:text-white capitalize">{detail.work_type}</CardTitle>
                            <CardDescription className="dark:text-gray-300">
                              {new Date(detail.session_date).toLocaleDateString()} - {detail.slot_type}
                            </CardDescription>
                          </div>
                          <Badge variant="outline">
                            {detail.duration}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm dark:text-gray-300">{detail.description}</p>
                          {detail.remarks && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">{detail.remarks}</p>
                          )}
                          {detail.document_url && (
                            <div>
                              <a 
                                href={detail.document_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                View Document
                              </a>
                            </div>
                          )}
                        </div>
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
                  <p className="text-gray-500 dark:text-gray-400">Attendance features coming soon</p>
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
