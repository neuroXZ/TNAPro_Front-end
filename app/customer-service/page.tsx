import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  BarChart3, 
  Users, 
  GraduationCap,
  Clock,
  Shield,
  ArrowRight,
  HelpCircle,
  Phone,
  Mail
} from 'lucide-react'

const CustomerServicePage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative px-6 lg:px-8 bg-gradient-to-b from-muted/50 to-background">
        <div className="mx-auto max-w-7xl pt-20 pb-16 sm:pt-24 sm:pb-20">
          <div className="text-center space-y-6">
            <Badge variant="primary">
              Training Needs Analysis System
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Welcome to{' '}
              <span className="text-primary">TNA Pro</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Leading competency assessment platform that helps organizations identify 
              training needs and develop employee potential through comprehensive and 
              accurate competency gap analysis.
            </p>
            <div className="flex items-center justify-center gap-4 pt-6">
              <Button size="lg">
                Start Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Link href="/customer-service/faq">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why Choose TNA Pro?
            </h2>
            <p className="text-lg text-muted-foreground">
              Innovative solution to optimize human resource development in your organization
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
              <Card>
                <CardHeader className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>In-Depth Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center leading-relaxed">
                    Get deep insights into employee competency gaps with 
                    comprehensive and easy-to-understand analytical reports.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Multi-Level Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center leading-relaxed">
                    Support assessment for various job levels from staff to 
                    management with customized competency frameworks.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Training Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center leading-relaxed">
                    Receive targeted training program recommendations based on 
                    assessment results to enhance employee competencies.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Benefits You Get
                </h2>
                <p className="text-lg text-muted-foreground">
                  TNA Pro is designed to provide maximum value for your organization's human resource development.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold">Time & Cost Efficiency</h3>
                    <p className="text-muted-foreground">
                      Accurately identify training needs in a cost-effective manner
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold">Fast & Easy Process</h3>
                    <p className="text-muted-foreground">
                      Assessment can be completed in 30-60 minutes with a user-friendly interface
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold">Secure & Reliable Data</h3>
                    <p className="text-muted-foreground">
                      Data security guaranteed with encryption system and automatic backup
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
                <CardDescription>TNA Pro system performance data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Assessment Completed</span>
                    <span className="font-bold text-2xl text-primary">15,000+</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Organizations Served</span>
                    <span className="font-bold text-2xl text-green-600">500+</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-bold text-2xl text-purple-600">98%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Need Help?
            </h2>
            <p className="text-lg text-muted-foreground">
              Our customer service team is ready to help you 24/7
            </p>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 lg:max-w-none lg:grid-cols-3">
            <Card className="text-center">
              <CardHeader className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <HelpCircle className="h-8 w-8 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <CardTitle>FAQ</CardTitle>
                  <CardDescription>
                    Find answers to frequently asked questions
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/customer-service/faq">
                  <Button variant="outline" className="w-full">
                    View FAQ
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <CardTitle>Contact Us</CardTitle>
                  <CardDescription>
                    Send messages or questions directly to our team
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/customer-service/contact-us">
                  <Button variant="outline" className="w-full">
                    Contact Us
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <Phone className="h-8 w-8 text-purple-600" />
                </div>
                <div className="space-y-2">
                  <CardTitle>Live Support</CardTitle>
                  <CardDescription>
                    Get direct assistance via live chat or phone
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Chat Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerServicePage