"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Bell
} from "lucide-react";
import { useState, useEffect } from "react";

export default function AnalyticsPage() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(75), 500);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: BarChart3,
      title: "Interactive Charts",
      description: "Dynamic data visualization with real-time updates",
      status: "In Development"
    },
    {
      icon: TrendingUp,
      title: "Performance Metrics",
      description: "Track KPIs and performance indicators",
      status: "Coming Soon"
    },
    {
      icon: PieChart,
      title: "Advanced Reports",
      description: "Comprehensive analytics and reporting tools",
      status: "Planning"
    },
    {
      icon: Activity,
      title: "Real-time Dashboard",
      description: "Live monitoring and alerts system",
      status: "Coming Soon"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4 pt-12">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-12 h-12 text-primary animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-6 h-6 text-yellow-500 animate-bounce" />
            </div>
          </div>
        </div>
        
        <Badge variant="secondary" className="mb-4">
          <Clock className="w-3 h-3 mr-1" />
          Coming Soon
        </Badge>
        
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Analytics Dashboard
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We're building powerful analytics tools to help you gain insights from your data. 
          Get ready for comprehensive reporting and real-time monitoring.
        </p>
      </div>

      {/* Progress Section */}
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Development Progress</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Started</span>
              <span>In Progress</span>
              <span>Launch</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-center mb-8">What's Coming</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{feature.title}</h3>
                      <Badge 
                        variant={
                          feature.status === "In Development" ? "default" : 
                          feature.status === "Coming Soon" ? "secondary" : 
                          "outline"
                        }
                        className="text-xs"
                      >
                        {feature.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator className="max-w-2xl mx-auto" />

      {/* Timeline Section */}
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Expected Launch
            </h3>
            <div className="text-3xl font-bold text-primary">Q1 2025</div>
            <p className="text-muted-foreground">
              Be the first to know when our analytics dashboard goes live
            </p>
            <Button className="mt-4 group">
              <Bell className="w-4 h-4 mr-2" />
              Notify Me
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer Note */}
      <div className="text-center text-sm text-muted-foreground max-w-lg mx-auto">
        <p>
          This page is under active development. Features and timeline may change based on development progress and user feedback.
        </p>
      </div>
    </div>
  );
}
