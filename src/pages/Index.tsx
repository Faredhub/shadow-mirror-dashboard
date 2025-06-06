
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Calendar, BarChart3, Shield, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

const Index = () => {
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header with Admin Access and Dark Mode Toggle */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="bg-white/80 dark:bg-gray-800/80"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="sm" asChild className="bg-red-600 text-white border-red-600 hover:bg-red-700">
          <a href="/admin">
            <Shield className="h-4 w-4 mr-2" />
            Admin Access
          </a>
        </Button>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            NIT Faculty Management System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Complete faculty management solution for academic institutions. Manage courses, track attendance, 
            monitor student progress, record work activities, and generate comprehensive reports.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild>
              <a href="/auth">Faculty Login</a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="/auth">New Registration</a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow dark:bg-gray-800">
            <CardHeader>
              <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="dark:text-white">Course Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="dark:text-gray-300">
                Create and manage courses with subject details, branch, year, and scheduling.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow dark:bg-gray-800">
            <CardHeader>
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="dark:text-white">Class Records</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="dark:text-gray-300">
                Upload class records with topics covered, student attendance, and session details.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow dark:bg-gray-800">
            <CardHeader>
              <Calendar className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="dark:text-white">Attendance Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="dark:text-gray-300">
                Track present, absent, and total students with detailed attendance reports.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow dark:bg-gray-800">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle className="dark:text-white">Activity Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="dark:text-gray-300">
                Record work activities, track hours, and manage faculty schedules and duties.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Step by Step Process */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">Faculty Registration</h3>
              <p className="text-gray-600 dark:text-gray-300">Register as a teacher to get your unique login credentials and access to the system.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">Course & Class Setup</h3>
              <p className="text-gray-600 dark:text-gray-300">Create courses with subject name, branch, year, and schedule your classes with timing.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">Record & Report</h3>
              <p className="text-gray-600 dark:text-gray-300">Upload class records, track attendance, and manage work activities with detailed reports.</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Card className="max-w-2xl mx-auto dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl dark:text-white">Direct Admin Access</CardTitle>
              <CardDescription className="text-lg dark:text-gray-300">
                Click the Admin Access button in the top-right corner for immediate access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-left">
                  <p className="dark:text-gray-300"><strong>Quick Access:</strong> No login required</p>
                  <p className="dark:text-gray-300"><strong>Features:</strong> View all faculty data, manage courses, monitor activities</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Direct access to admin dashboard with real-time data</p>
                </div>
                <Button size="lg" asChild className="w-full">
                  <a href="/admin">Access Admin Portal</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
