import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  User, 
  FileText, 
  Upload, 
  Activity, 
  BookOpen,
  Plus,
  Bell,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const FacultyDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Class Record Form State
  const [classRecord, setClassRecord] = useState({
    subject: '',
    branch: '',
    year: '',
    semester: '',
    time: '',
    topic: '',
    studentsPresent: '',
    studentsAbsent: '',
    totalStudents: ''
  });

  // Activity Report Form State
  const [activityReport, setActivityReport] = useState({
    date: '',
    timeSlot: '',
    workDetails: '',
    hours: ''
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

  const { data: classRecords } = useQuery({
    queryKey: ['class-records', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('class_sessions')
        .select(`
          *,
          courses (name, code)
        `)
        .eq('faculty_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const submitClassRecord = useMutation({
    mutationFn: async (data: typeof classRecord) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // First create or find the course
      let courseId;
      const { data: existingCourse } = await supabase
        .from('courses')
        .select('id')
        .eq('code', `${data.subject}-${data.branch}`)
        .single();

      if (existingCourse) {
        courseId = existingCourse.id;
      } else {
        const { data: newCourse, error: courseError } = await supabase
          .from('courses')
          .insert({
            code: `${data.subject}-${data.branch}`,
            name: data.subject,
            faculty_id: user.id,
            semester: data.semester,
            academic_year: data.year
          })
          .select('id')
          .single();

        if (courseError) throw courseError;
        courseId = newCourse.id;
      }

      // Create class session
      const { error } = await supabase
        .from('class_sessions')
        .insert({
          course_id: courseId,
          faculty_id: user.id,
          session_date: new Date().toISOString().split('T')[0],
          start_time: data.time,
          end_time: data.time,
          topic: data.topic,
          session_type: 'lecture'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Class record uploaded successfully",
      });
      setClassRecord({
        subject: '',
        branch: '',
        year: '',
        semester: '',
        time: '',
        topic: '',
        studentsPresent: '',
        studentsAbsent: '',
        totalStudents: ''
      });
      queryClient.invalidateQueries({ queryKey: ['class-records'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const submitActivityReport = useMutation({
    mutationFn: async (data: typeof activityReport) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('work_activities')
        .insert({
          faculty_id: user.id,
          title: `Work Activity - ${data.timeSlot}`,
          description: data.workDetails,
          activity_type: 'teaching',
          start_date: data.date,
          hours_spent: parseFloat(data.hours) || 0
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Activity report submitted successfully",
      });
      setActivityReport({
        date: '',
        timeSlot: '',
        workDetails: '',
        hours: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleClassRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitClassRecord.mutate(classRecord);
  };

  const handleActivityReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitActivityReport.mutate(activityReport);
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Faculty Dashboard', icon: User },
    { id: 'assignments', label: 'My Assignments', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'activity-report', label: 'Activity Report', icon: Activity },
    { id: 'class-report', label: 'Class Report', icon: FileText },
    { id: 'update-profile', label: 'Update Profile', icon: User },
    { id: 'view-last-record', label: 'View last record', icon: BookOpen },
    { id: 'view-class-record', label: 'View class record', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">NIT</span>
            </div>
            <span className="font-semibold">Faculty Dashboard</span>
          </div>
        </div>
        
        <nav className="mt-4">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-100 ${
                activeTab === item.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className="h-4 w-4" />
                <span className="text-sm">{item.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold">
              {sidebarItems.find(item => item.id === activeTab)?.label || 'Faculty Dashboard'}
            </h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Welcome, {profile?.full_name}
                <Badge variant="secondary" className="ml-2">
                  {profile?.role}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome to Faculty Dashboard</CardTitle>
                  <CardDescription>
                    Manage your classes, attendance, and activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Button 
                          onClick={() => setActiveTab('class-report')}
                          className="w-full justify-start"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Upload Class Record
                        </Button>
                        <Button 
                          onClick={() => setActiveTab('activity-report')}
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          Submit Activity Report
                        </Button>
                        <Button 
                          onClick={() => setActiveTab('assignments')}
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          View Assignments
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Classes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {classRecords?.slice(0, 3).map((record) => (
                          <div key={record.id} className="text-sm text-gray-600 mb-2">
                            <div className="font-medium">{record.topic}</div>
                            <div>{record.session_date} - {record.start_time}</div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Assignments</CardTitle>
                  <CardDescription>
                    View your assigned subjects, branches, and time slots
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-gray-500 py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Assignment functionality will be available once admin configures your assignments.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Messages and notifications from administration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-gray-500 py-8">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Notification functionality will be available once the system is fully configured.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'class-report' && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Class Record</CardTitle>
                <CardDescription>
                  Enter details about your class session and student attendance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleClassRecordSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={classRecord.subject}
                        onChange={(e) => setClassRecord({...classRecord, subject: e.target.value})}
                        placeholder="e.g., Data Structures"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="branch">Branch</Label>
                      <Input
                        id="branch"
                        value={classRecord.branch}
                        onChange={(e) => setClassRecord({...classRecord, branch: e.target.value})}
                        placeholder="e.g., B.Tech CSE"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        value={classRecord.year}
                        onChange={(e) => setClassRecord({...classRecord, year: e.target.value})}
                        placeholder="e.g., 2nd Year"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="semester">Semester</Label>
                      <Input
                        id="semester"
                        value={classRecord.semester}
                        onChange={(e) => setClassRecord({...classRecord, semester: e.target.value})}
                        placeholder="e.g., 3rd"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={classRecord.time}
                        onChange={(e) => setClassRecord({...classRecord, time: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="topic">Topic Covered</Label>
                    <Textarea
                      id="topic"
                      value={classRecord.topic}
                      onChange={(e) => setClassRecord({...classRecord, topic: e.target.value})}
                      placeholder="Describe the topics covered in this class"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="present">No. of students present</Label>
                      <Input
                        id="present"
                        type="number"
                        value={classRecord.studentsPresent}
                        onChange={(e) => setClassRecord({...classRecord, studentsPresent: e.target.value})}
                        placeholder="25"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="absent">No. of students absent</Label>
                      <Input
                        id="absent"
                        type="number"
                        value={classRecord.studentsAbsent}
                        onChange={(e) => setClassRecord({...classRecord, studentsAbsent: e.target.value})}
                        placeholder="5"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="total">Total no. of students</Label>
                      <Input
                        id="total"
                        type="number"
                        value={classRecord.totalStudents}
                        onChange={(e) => setClassRecord({...classRecord, totalStudents: e.target.value})}
                        placeholder="30"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="document">Upload Document (Optional)</Label>
                    <div className="mt-2 flex items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF, DOC, or DOCX (MAX. 10MB)</p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={submitClassRecord.isPending}
                  >
                    {submitClassRecord.isPending ? 'Submitting...' : 'SUBMIT'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === 'activity-report' && (
            <Card>
              <CardHeader>
                <CardTitle>Activity Report</CardTitle>
                <CardDescription>
                  Report your work activities and hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleActivityReportSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={activityReport.date}
                        onChange={(e) => setActivityReport({...activityReport, date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="timeSlot">Time Slot</Label>
                      <Input
                        id="timeSlot"
                        value={activityReport.timeSlot}
                        onChange={(e) => setActivityReport({...activityReport, timeSlot: e.target.value})}
                        placeholder="e.g., Morning (9 AM - 12 PM)"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="workDetails">Work Details</Label>
                    <Textarea
                      id="workDetails"
                      value={activityReport.workDetails}
                      onChange={(e) => setActivityReport({...activityReport, workDetails: e.target.value})}
                      placeholder="Describe your work activities for this time slot"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="hours">Hours Spent</Label>
                    <Input
                      id="hours"
                      type="number"
                      step="0.5"
                      value={activityReport.hours}
                      onChange={(e) => setActivityReport({...activityReport, hours: e.target.value})}
                      placeholder="3.5"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={submitActivityReport.isPending}
                  >
                    {submitActivityReport.isPending ? 'Submitting...' : 'Submit Activity Report'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === 'view-class-record' && (
            <Card>
              <CardHeader>
                <CardTitle>Class Records</CardTitle>
                <CardDescription>
                  View all your submitted class records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classRecords?.map((record) => (
                    <Card key={record.id} className="p-4">
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-orange-600">Subject: {record.courses?.name || 'N/A'}</div>
                          <div>Time: {record.start_time}</div>
                        </div>
                        <div>
                          <div className="font-medium">Branch: B.Tech</div>
                          <div>Semester: 3rd</div>
                        </div>
                        <div>
                          <div>Date: {record.session_date}</div>
                          <div>Topic: {record.topic}</div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">Active</Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {(!classRecords || classRecords.length === 0) && (
                    <div className="text-center text-gray-500 py-8">
                      No class records found. Upload your first class record to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'update-profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Update Profile</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profile?.full_name || ''}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profile?.email || ''}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={profile?.role || ''}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={profile?.department || ''}
                      placeholder="Enter your department"
                    />
                  </div>
                  <Button>Update Profile</Button>
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
