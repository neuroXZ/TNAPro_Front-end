import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  User,
  ClipboardList,
  UserCheck,
  Award,
  FileText,
  GraduationCap,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  TrendingUp,
  BookOpen,
  Calendar,
  Download,
  Eye,
  Search
} from 'lucide-react'

const StaffDocumentationPage = () => {
  const menuFeatures = [
    {
      title: "Dashboard",
      icon: User,
      color: "blue",
      description: "Overview of your performance, assessments, and progress tracking"
    },
    {
      title: "Self Assessment",
      icon: ClipboardList,
      color: "green", 
      description: "Complete competency assessments for your current role"
    },
    {
      title: "Superior Assessment",
      icon: UserCheck,
      color: "purple",
      description: "Participate in assessments conducted by your supervisor"
    },
    {
      title: "My Competencies",
      icon: Award,
      color: "orange",
      description: "View your competency levels and skill development"
    },
    {
      title: "My IDP",
      icon: FileText,
      color: "red",
      description: "Individual Development Plan - your personalized growth roadmap"
    },
    {
      title: "My Training",
      icon: GraduationCap,
      color: "indigo",
      description: "Access assigned training programs and track completion"
    }
  ]

  const assessmentSteps = [
    {
      step: 1,
      title: "Access Assessment",
      description: "Navigate to Self Assessment or Superior Assessment from the sidebar",
      icon: PlayCircle
    },
    {
      step: 2,
      title: "Read Instructions",
      description: "Review assessment guidelines and competency descriptions carefully",
      icon: BookOpen
    },
    {
      step: 3,
      title: "Complete Questions",
      description: "Answer all assessment questions honestly and thoroughly",
      icon: CheckCircle
    },
    {
      step: 4,
      title: "Submit Assessment",
      description: "Review your answers and submit for evaluation",
      icon: Target
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">TNA Pro Staff Guide</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Complete guide for staff members to effectively use the Training Needs Analysis system
        </p>
        <Separator />
      </div>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-green-600" />
            Getting Started
          </CardTitle>
          <CardDescription>
            Essential steps to begin using TNA Pro as a staff member
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">First Time Login</h3>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                  <span>Log in with your provided credentials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                  <span>Update your profile information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
                  <span>Explore the dashboard to familiarize yourself</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</span>
                  <span>Check for any pending assessments</span>
                </li>
              </ol>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Regular Activities</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Complete assigned self-assessments</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Participate in superior assessments</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Review your competency progress</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Follow your Individual Development Plan</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Complete recommended training programs</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Features Overview</CardTitle>
          <CardDescription>
            Understanding each section of your staff portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 bg-${feature.color}-100 rounded-lg flex items-center justify-center`}>
                      <IconComponent className={`h-5 w-5 text-${feature.color}-600`} />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="assessment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="competencies">Competencies</TabsTrigger>
          <TabsTrigger value="idp">IDP</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="tips">Tips</TabsTrigger>
        </TabsList>

        {/* Assessment Tab */}
        <TabsContent value="assessment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-green-600" />
                Taking Assessments
              </CardTitle>
              <CardDescription>
                How to complete self-assessments and participate in superior assessments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-3">Assessment Process</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {assessmentSteps.map((step) => (
                      <div key={step.step} className="text-center">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <step.icon className="h-6 w-6 text-green-600" />
                          </div>
                          <h4 className="font-medium text-green-900">{step.title}</h4>
                          <p className="text-xs text-green-700">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Self Assessment</CardTitle>
                      <CardDescription>Evaluate your own competencies</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <p><strong>Purpose:</strong> Rate your own skills and competencies honestly</p>
                      <p><strong>Frequency:</strong> Typically conducted quarterly or bi-annually</p>
                      <p><strong>Duration:</strong> 30-45 minutes per assessment</p>
                      <p><strong>Scoring:</strong> Use the provided competency scale (1-5)</p>
                      <p><strong>Tips:</strong> Be honest and provide evidence for your ratings</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Superior Assessment</CardTitle>
                      <CardDescription>Assessments conducted by your supervisor</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <p><strong>Purpose:</strong> Receive evaluation from your direct supervisor</p>
                      <p><strong>Process:</strong> Supervisor assesses your performance and competencies</p>
                      <p><strong>Collaboration:</strong> May include discussion sessions</p>
                      <p><strong>Outcome:</strong> Forms basis for development planning</p>
                      <p><strong>Feedback:</strong> Receive constructive feedback for improvement</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Assessment Best Practices</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                    <div>
                      <p><strong>• Preparation:</strong> Review job requirements and competency definitions</p>
                      <p><strong>• Honesty:</strong> Provide accurate self-assessments</p>
                      <p><strong>• Examples:</strong> Prepare specific examples to support your ratings</p>
                    </div>
                    <div>
                      <p><strong>• Time Management:</strong> Allow sufficient time without rushing</p>
                      <p><strong>• Documentation:</strong> Keep notes of your achievements</p>
                      <p><strong>• Follow-up:</strong> Discuss results with your supervisor</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competencies Tab */}
        <TabsContent value="competencies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-600" />
                Understanding Your Competencies
              </CardTitle>
              <CardDescription>
                How to view and interpret your competency levels and development areas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Competency Levels</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-red-100 text-red-800">1 - Beginner</Badge>
                      <span className="text-sm">Basic understanding, requires guidance</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">2 - Developing</Badge>
                      <span className="text-sm">Learning and improving, some support needed</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">3 - Competent</Badge>
                      <span className="text-sm">Meets job requirements effectively</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">4 - Proficient</Badge>
                      <span className="text-sm">Exceeds requirements, can mentor others</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-green-100 text-green-800">5 - Expert</Badge>
                      <span className="text-sm">Exceptional level, organizational reference</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Gap Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p><strong>Current Level:</strong> Your current competency assessment score</p>
                    <p><strong>Required Level:</strong> Minimum level needed for your position</p>
                    <p><strong>Gap:</strong> Difference between current and required levels</p>
                    <p><strong>Priority:</strong> Critical gaps are highlighted for immediate attention</p>
                    <p><strong>Action:</strong> Recommended development activities to close gaps</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">How to Use Competency Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      View Results
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Check your competency dashboard regularly</li>
                      <li>• Review assessment feedback</li>
                      <li>• Compare with job requirements</li>
                      <li>• Track progress over time</li>
                    </ul>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Identify Gaps
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Focus on red/orange highlighted areas</li>
                      <li>• Understand the impact of each gap</li>
                      <li>• Prioritize critical competencies</li>
                      <li>• Discuss with your supervisor</li>
                    </ul>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Plan Development
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Create development goals</li>
                      <li>• Select appropriate training</li>
                      <li>• Seek mentoring opportunities</li>
                      <li>• Apply skills in real projects</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IDP Tab */}
        <TabsContent value="idp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-600" />
                Individual Development Plan (IDP)
              </CardTitle>
              <CardDescription>
                Your personalized roadmap for professional growth and skill development
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="font-semibold text-red-900 mb-3">What is an IDP?</h3>
                <p className="text-sm text-red-800 mb-3">
                  Your Individual Development Plan is a strategic document that outlines your career goals, 
                  identifies skill gaps, and provides a structured approach to professional development.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-red-800">
                  <div>
                    <p><strong>Purpose:</strong> Guide your professional development journey</p>
                    <p><strong>Timeline:</strong> Typically covers 6-12 months</p>
                  </div>
                  <div>
                    <p><strong>Collaboration:</strong> Developed with your supervisor</p>
                    <p><strong>Review:</strong> Regular progress reviews and updates</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">IDP Components</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p><strong>Development Goals:</strong></p>
                      <p className="text-muted-foreground">Specific objectives based on competency gaps</p>
                    </div>
                    <div>
                      <p><strong>Learning Activities:</strong></p>
                      <p className="text-muted-foreground">Training, courses, and development programs</p>
                    </div>
                    <div>
                      <p><strong>Timeline:</strong></p>
                      <p className="text-muted-foreground">Deadlines and milestones for each goal</p>
                    </div>
                    <div>
                      <p><strong>Resources:</strong></p>
                      <p className="text-muted-foreground">Support and tools needed for development</p>
                    </div>
                    <div>
                      <p><strong>Success Metrics:</strong></p>
                      <p className="text-muted-foreground">How progress will be measured</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">How to Use Your IDP</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p><strong>Regular Review:</strong></p>
                      <p className="text-muted-foreground">Check progress monthly or quarterly</p>
                    </div>
                    <div>
                      <p><strong>Track Activities:</strong></p>
                      <p className="text-muted-foreground">Log completed training and development</p>
                    </div>
                    <div>
                      <p><strong>Update Goals:</strong></p>
                      <p className="text-muted-foreground">Modify objectives as you progress</p>
                    </div>
                    <div>
                      <p><strong>Seek Support:</strong></p>
                      <p className="text-muted-foreground">Discuss challenges with your supervisor</p>
                    </div>
                    <div>
                      <p><strong>Celebrate Success:</strong></p>
                      <p className="text-muted-foreground">Acknowledge achievements and milestones</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-2">IDP Development Process</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-purple-600 font-bold">1</span>
                    </div>
                    <h4 className="font-medium text-purple-900">Assessment</h4>
                    <p className="text-xs text-purple-700">Complete competency assessment</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-purple-600 font-bold">2</span>
                    </div>
                    <h4 className="font-medium text-purple-900">Gap Analysis</h4>
                    <p className="text-xs text-purple-700">Identify development areas</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-purple-600 font-bold">3</span>
                    </div>
                    <h4 className="font-medium text-purple-900">Plan Creation</h4>
                    <p className="text-xs text-purple-700">Develop with supervisor</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-purple-600 font-bold">4</span>
                    </div>
                    <h4 className="font-medium text-purple-900">Implementation</h4>
                    <p className="text-xs text-purple-700">Execute and track progress</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-indigo-600" />
                My Training Programs
              </CardTitle>
              <CardDescription>
                Access and manage your assigned training programs and development activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Scheduled Training
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p><strong>Upcoming:</strong> View scheduled training sessions</p>
                    <p><strong>Calendar:</strong> Check dates, times, and locations</p>
                    <p><strong>Prerequisites:</strong> Review required preparations</p>
                    <p><strong>Materials:</strong> Download training resources</p>
                    <p><strong>Notifications:</strong> Receive reminders and updates</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PlayCircle className="h-4 w-4" />
                      In Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p><strong>Current:</strong> Training you're currently taking</p>
                    <p><strong>Progress:</strong> Track completion percentage</p>
                    <p><strong>Assignments:</strong> Complete required tasks</p>
                    <p><strong>Assessments:</strong> Take quizzes and evaluations</p>
                    <p><strong>Deadlines:</strong> Monitor completion dates</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Completed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p><strong>History:</strong> View completed training programs</p>
                    <p><strong>Certificates:</strong> Download completion certificates</p>
                    <p><strong>Scores:</strong> Review assessment results</p>
                    <p><strong>Feedback:</strong> Provide program evaluations</p>
                    <p><strong>Credits:</strong> Track professional development hours</p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Training Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">How to Access Training</h4>
                    <ol className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                        <span>Navigate to "My Training" from the sidebar</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                        <span>Review your assigned training programs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
                        <span>Click on a program to view details</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</span>
                        <span>Follow the provided instructions to complete</span>
                      </li>
                    </ol>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Training Types</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p><strong>Online Courses:</strong> Self-paced digital learning modules</p>
                      </div>
                      <div>
                        <p><strong>Classroom Training:</strong> Instructor-led sessions at specific locations</p>
                      </div>
                      <div>
                        <p><strong>Virtual Sessions:</strong> Live online training via video conferencing</p>
                      </div>
                      <div>
                        <p><strong>Workshops:</strong> Interactive hands-on learning experiences</p>
                      </div>
                      <div>
                        <p><strong>Mentoring:</strong> One-on-one guidance from experienced colleagues</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h3 className="font-semibold text-indigo-900 mb-2">Training Success Tips</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-indigo-800">
                  <div>
                    <p><strong>• Preparation:</strong> Review materials and prerequisites beforehand</p>
                    <p><strong>• Engagement:</strong> Actively participate in all activities</p>
                    <p><strong>• Application:</strong> Practice new skills in your daily work</p>
                  </div>
                  <div>
                    <p><strong>• Documentation:</strong> Take notes and keep training materials</p>
                    <p><strong>• Feedback:</strong> Provide honest evaluation to improve programs</p>
                    <p><strong>• Follow-up:</strong> Continue learning beyond the formal program</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Understanding Your Dashboard
              </CardTitle>
              <CardDescription>
                Navigate and interpret the information on your staff dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>• Current competency levels summary</p>
                    <p>• Recent assessment scores</p>
                    <p>• Progress tracking charts</p>
                    <p>• Goal achievement status</p>
                    <p>• Performance trends over time</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pending Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>• Outstanding assessments to complete</p>
                    <p>• Training programs to finish</p>
                    <p>• IDP milestones due</p>
                    <p>• Feedback requests</p>
                    <p>• Document updates needed</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Access</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>• Start new self-assessment</p>
                    <p>• View latest results</p>
                    <p>• Access current training</p>
                    <p>• Download certificates</p>
                    <p>• Contact support</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dashboard Navigation</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-2">Key Metrics to Monitor</h4>
                      <ul className="space-y-1">
                        <li>• Overall competency score</li>
                        <li>• Number of gaps closed</li>
                        <li>• Training completion rate</li>
                        <li>• Assessment frequency</li>
                        <li>• Goal achievement percentage</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Action Items</h4>
                      <ul className="space-y-1">
                        <li>• Complete overdue assessments</li>
                        <li>• Review feedback from supervisors</li>
                        <li>• Update personal development goals</li>
                        <li>• Schedule required training</li>
                        <li>• Check notification messages</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tips Tab */}
        <TabsContent value="tips" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Success Tips & Best Practices
              </CardTitle>
              <CardDescription>
                Maximize your experience with the TNA Pro system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-green-700">Do's</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Complete assessments honestly and thoughtfully</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Regularly check your dashboard for updates</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Engage actively with your IDP</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Complete training programs on time</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Seek feedback from supervisors</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Document your achievements and progress</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-700">Don'ts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      <span>Don't rush through assessments</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      <span>Don't ignore pending notifications</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      <span>Don't skip training prerequisites</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      <span>Don't leave assessments incomplete</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      <span>Don't hesitate to ask for help</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      <span>Don't neglect regular progress reviews</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Troubleshooting Common Issues</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2">Can't access an assessment</h4>
                        <p className="text-sm text-muted-foreground">
                          Check if the assessment period is active, ensure you have the required permissions, 
                          or contact your supervisor or IT support.
                        </p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2">Training materials won't load</h4>
                        <p className="text-sm text-muted-foreground">
                          Verify your internet connection, clear browser cache, try a different browser, 
                          or check if system maintenance is in progress.
                        </p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2">Results not showing up</h4>
                        <p className="text-sm text-muted-foreground">
                          Assessment results may take time to process. If delayed beyond expected timeframe, 
                          contact your supervisor or HR department.
                        </p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2">Forgot login credentials</h4>
                        <p className="text-sm text-muted-foreground">
                          Use the password reset function on the login page, or contact IT support 
                          for assistance with account recovery.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-900 mb-2">📞 Need Additional Help?</h3>
                  <div className="text-sm text-yellow-800 space-y-2">
                    <p><strong>Technical Support:</strong> Contact IT helpdesk for system-related issues</p>
                    <p><strong>HR Department:</strong> Reach out for policy or process questions</p>
                    <p><strong>Your Supervisor:</strong> Discuss assessment results and development planning</p>
                    <p><strong>Training Coordinator:</strong> Get help with training program access</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default StaffDocumentationPage