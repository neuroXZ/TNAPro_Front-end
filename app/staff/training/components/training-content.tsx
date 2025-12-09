import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconSchool, IconCalendar, IconTarget, IconClock, IconDownload } from "@tabler/icons-react"
import { format } from "date-fns"
import { TrainingGroup, TrainingStatus } from "../types"

interface TrainingContentProps {
  trainings: TrainingGroup[]
  activeTab: TrainingStatus
  setActiveTab: (tab: TrainingStatus) => void
  upcomingCount: number
  ongoingCount: number
  pastCount: number
  isExporting: boolean
  onExport: () => void
  getTrainingStatus: (training: TrainingGroup) => TrainingStatus
  filterTrainingsByStatus: (status: TrainingStatus) => TrainingGroup[]
}

export function TrainingContent({
  trainings,
  activeTab,
  setActiveTab,
  upcomingCount,
  ongoingCount,
  pastCount,
  isExporting,
  onExport,
  getTrainingStatus,
  filterTrainingsByStatus
}: TrainingContentProps) {
  return (
    <div className="space-y-6">
      {/* Page Header with Export */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Recommended Training Programs</h1>
          <p className="text-muted-foreground mt-1">
            Training programs recommended based on your competency gaps
          </p>
        </div>
        <Button onClick={onExport} disabled={isExporting || trainings.length === 0}>
          <IconDownload className="h-4 w-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export Report'}
        </Button>
      </div>

      {/* Training Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Upcoming Training" 
          count={upcomingCount} 
          icon={<IconCalendar className="size-5 text-blue-500" />}
          description="Training programs starting soon"
        />
        <StatCard 
          title="Ongoing Training" 
          count={ongoingCount} 
          icon={<IconSchool className="size-5 text-green-500" />}
          description="Currently active programs"
        />
        <StatCard 
          title="Past Training" 
          count={pastCount} 
          icon={<IconClock className="size-5 text-gray-500" />}
          description="Completed training programs"
        />
      </div>

      {/* Training Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TrainingStatus)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming" className="gap-2">
            Upcoming
            <Badge variant="secondary" className="ml-1 text-xs">
              {upcomingCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="ongoing" className="gap-2">
            Ongoing
            <Badge variant="secondary" className="ml-1 text-xs">
              {ongoingCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-2">
            Past
            <Badge variant="secondary" className="ml-1 text-xs">
              {pastCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <TrainingList trainings={filterTrainingsByStatus('upcoming')} status="upcoming" />
        </TabsContent>
        
        <TabsContent value="ongoing" className="space-y-4">
          <TrainingList trainings={filterTrainingsByStatus('ongoing')} status="ongoing" />
        </TabsContent>
        
        <TabsContent value="past" className="space-y-4">
          <TrainingList trainings={filterTrainingsByStatus('past')} status="past" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({ title, count, icon, description }: {
  title: string
  count: number
  icon: React.ReactNode
  description: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function TrainingList({ trainings, status }: { 
  trainings: TrainingGroup[]
  status: TrainingStatus 
}) {
  if (trainings.length === 0) {
    const messages = {
      upcoming: "No upcoming training programs",
      ongoing: "No ongoing training programs", 
      past: "No completed training programs"
    }
    
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {messages[status]}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {trainings.map((training) => (
        <TrainingCard key={training.trainingId} training={training} status={status} />
      ))}
    </div>
  )
}

function TrainingCard({ training, status }: {
  training: TrainingGroup
  status: TrainingStatus
}) {
  const statusStyles = {
    upcoming: "border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950",
    ongoing: "border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950", 
    past: "border-l-4 border-l-gray-500 bg-gray-50 dark:bg-gray-950"
  }

  const statusBadges = {
    upcoming: <Badge className="bg-blue-500">Upcoming</Badge>,
    ongoing: <Badge className="bg-green-500">Ongoing</Badge>,
    past: <Badge className="bg-gray-500">Completed</Badge>
  }

  return (
    <Card className={statusStyles[status]}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{training.trainingName}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <IconCalendar className="size-4" />
              {format(new Date(training.startDate), 'MMM dd, yyyy')} - {format(new Date(training.endDate), 'MMM dd, yyyy')}
            </CardDescription>
          </div>
          {statusBadges[status]}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <IconTarget className="size-4 text-primary" />
            Addresses Competency Gaps:
          </h4>
          <div className="grid gap-2">
            {training.competencies.map((comp, index) => (
              <div key={index} className="flex justify-between items-center p-3 rounded-md bg-background border">
                <div className="flex-1">
                  <div className="font-medium text-sm">{comp.competencyName}</div>
                  <div className="text-xs text-muted-foreground">{comp.clusterName}</div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Gap:</span>
                  <Badge variant="destructive" className="text-xs">
                    {comp.weightedGap}
                  </Badge>
                  <span className="text-muted-foreground">RCL:</span>
                  <Badge variant="outline" className="text-xs">
                    {comp.requiredLevel}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}