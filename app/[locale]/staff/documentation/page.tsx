import React from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('StaffDocumentationPage')
  const menuFeatures = [
    {
      title: t('feature1Title'),
      icon: User,
      color: "blue",
      description: t('feature1Desc')
    },
    {
      title: t('feature2Title'),
      icon: ClipboardList,
      color: "green", 
      description: t('feature2Desc')
    },
    {
      title: t('feature3Title'),
      icon: UserCheck,
      color: "purple",
      description: t('feature3Desc')
    },
    {
      title: t('feature4Title'),
      icon: Award,
      color: "orange",
      description: t('feature4Desc')
    },
    {
      title: t('feature5Title'),
      icon: FileText,
      color: "red",
      description: t('feature5Desc')
    },
    {
      title: t('feature6Title'),
      icon: GraduationCap,
      color: "indigo",
      description: t('feature6Desc')
    }
  ]

  const assessmentSteps = [
    {
      step: 1,
      title: t('assessStep1Title'),
      description: t('assessStep1Desc'),
      icon: PlayCircle
    },
    {
      step: 2,
      title: t('assessStep2Title'),
      description: t('assessStep2Desc'),
      icon: BookOpen
    },
    {
      step: 3,
      title: t('assessStep3Title'),
      description: t('assessStep3Desc'),
      icon: CheckCircle
    },
    {
      step: 4,
      title: t('assessStep4Title'),
      description: t('assessStep4Desc'),
      icon: Target
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{t('title')}</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          {t('subtitle')}
        </p>
        <Separator />
      </div>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-green-600" />
            {t('gettingStarted')}
          </CardTitle>
          <CardDescription>
            {t('gettingStartedDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{t('firstTimeLogin')}</h3>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                  <span>{t('loginStep1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                  <span>{t('loginStep2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
                  <span>{t('loginStep3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</span>
                  <span>{t('loginStep4')}</span>
                </li>
              </ol>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{t('regularActivities')}</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{t('activity1')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{t('activity2')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{t('activity3')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{t('activity4')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{t('activity5')}</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{t('featureOverview')}</CardTitle>
          <CardDescription>
            {t('featureOverviewDesc')}
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
          <TabsTrigger value="assessment">{t('tabAssessment')}</TabsTrigger>
          <TabsTrigger value="competencies">{t('tabCompetencies')}</TabsTrigger>
          <TabsTrigger value="idp">{t('tabIdp')}</TabsTrigger>
          <TabsTrigger value="training">{t('tabTraining')}</TabsTrigger>
          <TabsTrigger value="dashboard">{t('tabDashboard')}</TabsTrigger>
          <TabsTrigger value="tips">{t('tabTips')}</TabsTrigger>
        </TabsList>

        {/* Assessment Tab */}
        <TabsContent value="assessment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-green-600" />
                {t('assessmentTitle')}
              </CardTitle>
              <CardDescription>
                {t('assessmentDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-3">{t('assessmentProcess')}</h3>
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
                      <CardTitle className="text-lg">{t('selfAssessmentTitle')}</CardTitle>
                      <CardDescription>{t('selfAssessmentDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <p><strong>Purpose:</strong> {t('selfAssessmentPurpose')}</p>
                      <p><strong>Frequency:</strong> {t('selfAssessmentFrequency')}</p>
                      <p><strong>Duration:</strong> {t('selfAssessmentDuration')}</p>
                      <p><strong>Scoring:</strong> {t('selfAssessmentScoring')}</p>
                      <p><strong>Tips:</strong> {t('selfAssessmentTips')}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('superiorAssessmentTitle')}</CardTitle>
                      <CardDescription>{t('superiorAssessmentDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <p><strong>Purpose:</strong> {t('superiorAssessmentPurpose')}</p>
                      <p><strong>Process:</strong> {t('superiorAssessmentProcess')}</p>
                      <p><strong>Collaboration:</strong> {t('superiorAssessmentCollab')}</p>
                      <p><strong>Outcome:</strong> {t('superiorAssessmentOutcome')}</p>
                      <p><strong>Feedback:</strong> {t('superiorAssessmentFeedback')}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">{t('assessBestPractices')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                    <div>
                      <p><strong>• {t('bestPractice1')}</strong></p>
                      <p><strong>• {t('bestPractice2')}</strong></p>
                      <p><strong>• {t('bestPractice3')}</strong></p>
                    </div>
                    <div>
                      <p><strong>• {t('bestPractice4')}</strong></p>
                      <p><strong>• {t('bestPractice5')}</strong></p>
                      <p><strong>• {t('bestPractice6')}</strong></p>
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
                {t('competenciesTitle')}
              </CardTitle>
              <CardDescription>
                {t('competenciesDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('competencyLevelsTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-red-100 text-red-800">{t('level1')}</Badge>
                      <span className="text-sm">{t('level1Desc')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">{t('level2')}</Badge>
                      <span className="text-sm">{t('level2Desc')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">{t('level3')}</Badge>
                      <span className="text-sm">{t('level3Desc')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">{t('level4')}</Badge>
                      <span className="text-sm">{t('level4Desc')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-green-100 text-green-800">{t('level5')}</Badge>
                      <span className="text-sm">{t('level5Desc')}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('gapAnalysisTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p>{t('gapCurrentLevel')}</p>
                    <p>{t('gapRequiredLevel')}</p>
                    <p>{t('gapGap')}</p>
                    <p>{t('gapPriority')}</p>
                    <p>{t('gapAction')}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('howToUseCompetencies')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      {t('viewResults')}
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• {t('viewResultsList1')}</li>
                      <li>• {t('viewResultsList2')}</li>
                      <li>• {t('viewResultsList3')}</li>
                      <li>• {t('viewResultsList4')}</li>
                    </ul>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      {t('identifyGaps')}
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• {t('identifyGapsList1')}</li>
                      <li>• {t('identifyGapsList2')}</li>
                      <li>• {t('identifyGapsList3')}</li>
                      <li>• {t('identifyGapsList4')}</li>
                    </ul>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      {t('planDevelopment')}
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• {t('planDevelopmentList1')}</li>
                      <li>• {t('planDevelopmentList2')}</li>
                      <li>• {t('planDevelopmentList3')}</li>
                      <li>• {t('planDevelopmentList4')}</li>
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
                {t('idpTitle')}
              </CardTitle>
              <CardDescription>
                {t('idpDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="font-semibold text-red-900 mb-3">{t('whatIsIdp')}</h3>
                <p className="text-sm text-red-800 mb-3">
                  {t('idpExplanation')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-red-800">
                  <div>
                    <p>{t('idpPurpose')}</p>
                    <p>{t('idpTimeline')}</p>
                  </div>
                  <div>
                    <p>{t('idpCollab')}</p>
                    <p>{t('idpReview')}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('idpComponentsTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p><strong>{t('idpGoals')}</strong></p>
                      <p className="text-muted-foreground">{t('idpGoalsDesc')}</p>
                    </div>
                    <div>
                      <p><strong>{t('idpActivities')}</strong></p>
                      <p className="text-muted-foreground">{t('idpActivitiesDesc')}</p>
                    </div>
                    <div>
                      <p><strong>{t('idpTimelineLabel')}</strong></p>
                      <p className="text-muted-foreground">{t('idpTimelineDesc')}</p>
                    </div>
                    <div>
                      <p><strong>{t('idpResources')}</strong></p>
                      <p className="text-muted-foreground">{t('idpResourcesDesc')}</p>
                    </div>
                    <div>
                      <p><strong>{t('idpMetrics')}</strong></p>
                      <p className="text-muted-foreground">{t('idpMetricsDesc')}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('howToUseIdp')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p><strong>{t('idpRegularReview')}</strong></p>
                      <p className="text-muted-foreground">{t('idpRegularReviewDesc')}</p>
                    </div>
                    <div>
                      <p><strong>{t('idpTrackActivities')}</strong></p>
                      <p className="text-muted-foreground">{t('idpTrackActivitiesDesc')}</p>
                    </div>
                    <div>
                      <p><strong>{t('idpUpdateGoals')}</strong></p>
                      <p className="text-muted-foreground">{t('idpUpdateGoalsDesc')}</p>
                    </div>
                    <div>
                      <p><strong>{t('idpSeekSupport')}</strong></p>
                      <p className="text-muted-foreground">{t('idpSeekSupportDesc')}</p>
                    </div>
                    <div>
                      <p><strong>{t('idpCelebrate')}</strong></p>
                      <p className="text-muted-foreground">{t('idpCelebrateDesc')}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-2">{t('idpProcess')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-purple-600 font-bold">1</span>
                    </div>
                    <h4 className="font-medium text-purple-900">{t('idpProcess1')}</h4>
                    <p className="text-xs text-purple-700">{t('idpProcess1Desc')}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-purple-600 font-bold">2</span>
                    </div>
                    <h4 className="font-medium text-purple-900">{t('idpProcess2')}</h4>
                    <p className="text-xs text-purple-700">{t('idpProcess2Desc')}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-purple-600 font-bold">3</span>
                    </div>
                    <h4 className="font-medium text-purple-900">{t('idpProcess3')}</h4>
                    <p className="text-xs text-purple-700">{t('idpProcess3Desc')}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-purple-600 font-bold">4</span>
                    </div>
                    <h4 className="font-medium text-purple-900">{t('idpProcess4')}</h4>
                    <p className="text-xs text-purple-700">{t('idpProcess4Desc')}</p>
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
                {t('trainingTitle')}
              </CardTitle>
              <CardDescription>
                {t('trainingDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {t('scheduledTraining')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p>{t('scheduledUpcoming')}</p>
                    <p>{t('scheduledCalendar')}</p>
                    <p>{t('scheduledPrerequisites')}</p>
                    <p>{t('scheduledMaterials')}</p>
                    <p>{t('scheduledNotifications')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PlayCircle className="h-4 w-4" />
                      {t('inProgress')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p>{t('inProgressCurrent')}</p>
                    <p>{t('inProgressProgress')}</p>
                    <p>{t('inProgressAssignments')}</p>
                    <p>{t('inProgressAssessments')}</p>
                    <p>{t('inProgressDeadlines')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {t('completed')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p>{t('completedHistory')}</p>
                    <p>{t('completedCertificates')}</p>
                    <p>{t('completedScores')}</p>
                    <p>{t('completedFeedback')}</p>
                    <p>{t('completedCredits')}</p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('trainingManagement')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">{t('howToAccessTraining')}</h4>
                    <ol className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                        <span>{t('trainingStep1')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                        <span>{t('trainingStep2')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
                        <span>{t('trainingStep3')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</span>
                        <span>{t('trainingStep4')}</span>
                      </li>
                    </ol>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">{t('trainingTypes')}</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p>{t('trainingOnline')}</p>
                      </div>
                      <div>
                        <p>{t('trainingClassroom')}</p>
                      </div>
                      <div>
                        <p>{t('trainingVirtual')}</p>
                      </div>
                      <div>
                        <p>{t('trainingWorkshops')}</p>
                      </div>
                      <div>
                        <p>{t('trainingMentoring')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h3 className="font-semibold text-indigo-900 mb-2">{t('trainingSuccessTips')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-indigo-800">
                    <div>
                      <p><strong>• {t('trainingTip1')}</strong></p>
                      <p><strong>• {t('trainingTip2')}</strong></p>
                      <p><strong>• {t('trainingTip3')}</strong></p>
                    </div>
                    <div>
                      <p><strong>• {t('trainingTip4')}</strong></p>
                      <p><strong>• {t('trainingTip5')}</strong></p>
                      <p><strong>• {t('trainingTip6')}</strong></p>
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
                {t('dashboardTitle')}
              </CardTitle>
              <CardDescription>
                {t('dashboardDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('performanceOverview')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>• {t('performanceList1')}</p>
                    <p>• {t('performanceList2')}</p>
                    <p>• {t('performanceList3')}</p>
                    <p>• {t('performanceList4')}</p>
                    <p>• {t('performanceList5')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('pendingActions')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>• {t('pendingList1')}</p>
                    <p>• {t('pendingList2')}</p>
                    <p>• {t('pendingList3')}</p>
                    <p>• {t('pendingList4')}</p>
                    <p>• {t('pendingList5')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('quickAccess')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>• {t('quickList1')}</p>
                    <p>• {t('quickList2')}</p>
                    <p>• {t('quickList3')}</p>
                    <p>• {t('quickList4')}</p>
                    <p>• {t('quickList5')}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('dashboardNavigation')}</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-2">{t('keyMetrics')}</h4>
                      <ul className="space-y-1">
                        <li>• {t('metricList1')}</li>
                        <li>• {t('metricList2')}</li>
                        <li>• {t('metricList3')}</li>
                        <li>• {t('metricList4')}</li>
                        <li>• {t('metricList5')}</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">{t('actionItems')}</h4>
                      <ul className="space-y-1">
                        <li>• {t('actionList1')}</li>
                        <li>• {t('actionList2')}</li>
                        <li>• {t('actionList3')}</li>
                        <li>• {t('actionList4')}</li>
                        <li>• {t('actionList5')}</li>
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
                {t('tipsTitle')}
              </CardTitle>
              <CardDescription>
                {t('tipsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-green-700">{t('dos')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>{t('do1')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>{t('do2')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>{t('do3')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>{t('do4')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>{t('do5')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>{t('do6')}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-700">{t('donts')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <span>{t('dont1')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <span>{t('dont2')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <span>{t('dont3')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <span>{t('dont4')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <span>{t('dont5')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <span>{t('dont6')}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('troubleshootingTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2">{t('trouble1Title')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('trouble1Desc')}
                        </p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2">{t('trouble2Title')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('trouble2Desc')}
                        </p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2">{t('trouble3Title')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('trouble3Desc')}
                        </p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2">{t('trouble4Title')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('trouble4Desc')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-900 mb-2">{t('needHelp')}</h3>
                  <div className="text-sm text-yellow-800 space-y-2">
                    <p>{t('techSupport')}</p>
                    <p>{t('hrDept')}</p>
                    <p>{t('supervisor')}</p>
                    <p>{t('trainingCoord')}</p>
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