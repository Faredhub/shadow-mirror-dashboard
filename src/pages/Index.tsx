
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Calendar, BarChart3 } from 'lucide-react';

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
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Faculty Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your academic operations with our comprehensive faculty management platform. 
            Manage courses, track attendance, monitor student progress, and organize work activities 
            all in one place.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild>
              <a href="/auth">Get Started</a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="/auth">Login</a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Course Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Organize and manage academic courses, curriculum, and enrollment efficiently.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Student Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor student progress, manage profiles, and track academic performance.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Calendar className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Attendance System</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Digital attendance tracking with real-time updates and comprehensive reports.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track faculty work activities, hours spent, and generate detailed reports.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
              <CardDescription className="text-lg">
                Join the NIT Faculty Management System today and experience the future of academic administration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Use the following credentials to test the system:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg text-left">
                  <p><strong>Email:</strong> nitfaculty@gmail.com</p>
                  <p><strong>Password:</strong> @NITFSP</p>
                  <p><strong>Role:</strong> Admin</p>
                </div>
                <Button size="lg" asChild className="w-full">
                  <a href="/auth">Access Portal</a>
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
