
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Calendar, BarChart3, Shield } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Admin Access Button - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <Button variant="outline" size="sm" asChild className="bg-red-600 text-white border-red-600 hover:bg-red-700">
          <a href="/auth">
            <Shield className="h-4 w-4 mr-2" />
            Admin Access
          </a>
        </Button>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            NIT Faculty Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
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
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Course Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create and manage courses with subject details, branch, year, and scheduling.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Class Records</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload class records with topics covered, student attendance, and session details.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Calendar className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Attendance Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track present, absent, and total students with detailed attendance reports.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Activity Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Record work activities, track hours, and manage faculty schedules and duties.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Step by Step Process */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-2">Faculty Registration</h3>
              <p className="text-gray-600">Register as a teacher to get your unique login credentials and access to the system.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-2">Course & Class Setup</h3>
              <p className="text-gray-600">Create courses with subject name, branch, year, and schedule your classes with timing.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-2">Record & Report</h3>
              <p className="text-gray-600">Upload class records, track attendance, and manage work activities with detailed reports.</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Admin Test Credentials</CardTitle>
              <CardDescription className="text-lg">
                Use these credentials to test the complete system functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg text-left">
                  <p><strong>Admin Email:</strong> nitfaculty@gmail.com</p>
                  <p><strong>Password:</strong> @NITFSP</p>
                  <p><strong>Role:</strong> Administrator</p>
                  <p className="text-sm text-gray-600 mt-2">Access all features including user management, reports, and system settings</p>
                </div>
                <Button size="lg" asChild className="w-full">
                  <a href="/auth">Access Admin Portal</a>
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
