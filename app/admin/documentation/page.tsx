import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Building,
  Users,
  Target,
  GraduationCap,
  ClipboardList,
  BarChart3,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Upload,
  Download,
  FileText,
  Search,
  Filter,
  Save,
  RefreshCw
} from 'lucide-react'

const AdminDocumentationPage = () => {
  const menuSections = [
    {
      title: "Organization Management",
      icon: Building,
      color: "blue",
      items: ["Unit Types", "Units", "Grades", "Positions"]
    },
    {
      title: "Staff Development", 
      icon: Users,
      color: "green",
      items: ["Staff Management", "Assessors"]
    },
    {
      title: "Competency Management",
      icon: Target,
      color: "purple", 
      items: ["Levels", "Clusters", "Competencies", "Competency Mapping"]
    },
    {
      title: "Training Management",
      icon: GraduationCap,
      color: "orange",
      items: ["Training Programs", "Training Mapping"]
    },
    {
      title: "Assessment Management",
      icon: ClipboardList,
      color: "red",
      items: ["Assessments", "Assessment Results"]
    },
    {
      title: "Reports & Analytics",
      icon: BarChart3,
      color: "indigo",
      items: ["IDP", "Reports", "Analytics"]
    }
  ]

  const operations = [
    {
      id: "create",
      title: "Create",
      icon: Plus,
      color: "green",
      description: "Add new records to the system"
    },
    {
      id: "view",
      title: "View",
      icon: Eye,
      color: "blue",
      description: "Display and search existing records"
    },
    {
      id: "edit",
      title: "Edit",
      icon: Edit3,
      color: "orange",
      description: "Modify existing records"
    },
    {
      id: "delete",
      title: "Delete",
      icon: Trash2,
      color: "red",
      description: "Remove records from the system"
    },
    {
      id: "import",
      title: "Import",
      icon: Upload,
      color: "purple",
      description: "Upload data from external files"
    },
    {
      id: "export",
      title: "Export",
      icon: Download,
      color: "indigo",
      description: "Download data and reports"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">TNA Pro Admin Documentation</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Complete guide for administrators to effectively manage the Training Needs Analysis system
        </p>
        <Separator />
      </div>

      {/* Quick Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Quick Navigation
          </CardTitle>
          <CardDescription>
            Jump to specific sections based on your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuSections.map((section, index) => {
              const IconComponent = section.icon
              return (
                <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 bg-${section.color}-100 rounded-lg flex items-center justify-center`}>
                      <IconComponent className={`h-4 w-4 text-${section.color}-600`} />
                    </div>
                    <h3 className="font-semibold">{section.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {section.items.map((item, idx) => (
                      <Badge key={idx} variant="primary" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Documentation */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="view">View</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="delete">Delete</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>
                Understanding the TNA Pro admin interface and common operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {operations.map((op) => {
                  const IconComponent = op.icon
                  return (
                    <div key={op.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className={`w-10 h-10 bg-${op.color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className={`h-5 w-5 text-${op.color}-600`} />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{op.title}</h3>
                        <p className="text-sm text-muted-foreground">{op.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">General Navigation Tips</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p><strong>• Sidebar Navigation:</strong> Use the left sidebar to navigate between different modules</p>
                    <p><strong>• Breadcrumbs:</strong> Track your location using the breadcrumb navigation</p>
                    <p><strong>• Search & Filter:</strong> Use search bars and filters to find specific records</p>
                  </div>
                  <div className="space-y-2">
                    <p><strong>• Pagination:</strong> Navigate through large datasets using page controls</p>
                    <p><strong>• Actions Menu:</strong> Right-click or use action buttons for record operations</p>
                    <p><strong>• Notifications:</strong> Check notifications for system updates and alerts</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Tab */}
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                Creating New Records
              </CardTitle>
              <CardDescription>
                Step-by-step guide to add new data across all modules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                {menuSections.map((section, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <section.icon className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{section.title}</h3>
                    </div>
                    <div className="grid gap-4">
                      {section.items.map((item, idx) => (
                        <div key={idx} className="bg-muted/30 p-3 rounded-md">
                          <h4 className="font-medium mb-2">{item}</h4>
                          <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                            <li>1. Navigate to {section.title} → {item}</li>
                            <li>2. Click the "Add New" or "+" button</li>
                            <li>3. Fill in all required fields (marked with *)</li>
                            <li>4. Upload files if needed (images, documents)</li>
                            <li>5. Review the information for accuracy</li>
                            <li>6. Click "Save" to create the record</li>
                          </ol>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Pro Tips for Creating Records</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Always fill required fields first to avoid validation errors</li>
                  <li>• Use consistent naming conventions across all records</li>
                  <li>• Double-check relationships (parent-child dependencies)</li>
                  <li>• Save drafts frequently for complex forms</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Tab */}
        <TabsContent value="view" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Viewing & Searching Records
              </CardTitle>
              <CardDescription>
                How to find, filter, and view existing data in the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Search Operations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p><strong>Global Search:</strong> Use the search bar in the header to find records across modules</p>
                    <p><strong>Module Search:</strong> Each page has its own search function for specific data</p>
                    <p><strong>Advanced Search:</strong> Use filters and date ranges for precise results</p>
                    <p><strong>Quick Filters:</strong> Apply pre-defined filters for common searches</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filtering Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p><strong>Status Filters:</strong> Active, Inactive, Pending, Completed</p>
                    <p><strong>Date Filters:</strong> Creation date, last modified, date ranges</p>
                    <p><strong>Category Filters:</strong> Department, position, level, type</p>
                    <p><strong>Custom Filters:</strong> Combine multiple criteria for specific results</p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Data Display Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Table View</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Sortable columns</li>
                      <li>• Customizable display</li>
                      <li>• Bulk selection</li>
                      <li>• Export options</li>
                    </ul>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Detail View</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Complete record information</li>
                      <li>• Related records</li>
                      <li>• Audit trail</li>
                      <li>• Action history</li>
                    </ul>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Dashboard View</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Summary statistics</li>
                      <li>• Visual charts</li>
                      <li>• Quick insights</li>
                      <li>• Real-time updates</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Tab */}
        <TabsContent value="edit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-orange-600" />
                Editing Existing Records
              </CardTitle>
              <CardDescription>
                How to modify and update records safely and efficiently
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="font-semibold text-orange-900 mb-3">General Edit Process</h3>
                  <ol className="text-sm text-orange-800 space-y-2">
                    <li><strong>1. Locate Record:</strong> Find the record using search or navigation</li>
                    <li><strong>2. Access Edit Mode:</strong> Click "Edit" button or double-click the record</li>
                    <li><strong>3. Modify Fields:</strong> Update the necessary information</li>
                    <li><strong>4. Validate Changes:</strong> Ensure all required fields are completed</li>
                    <li><strong>5. Save Changes:</strong> Click "Save" to commit modifications</li>
                    <li><strong>6. Verify Update:</strong> Check that changes are reflected correctly</li>
                  </ol>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Edit Permissions</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p><strong>Admin Level:</strong> Full edit access to all records</p>
                      <p><strong>Department Level:</strong> Edit records within department</p>
                      <p><strong>Personal Level:</strong> Edit own records only</p>
                      <p><strong>Read-Only:</strong> View only, no edit permissions</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Safety Features</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p><strong>Auto-Save:</strong> Periodic automatic saving of drafts</p>
                      <p><strong>Change Tracking:</strong> All modifications are logged</p>
                      <p><strong>Validation:</strong> Real-time field validation</p>
                      <p><strong>Confirmation:</strong> Confirm critical changes</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Considerations</h3>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Always backup important data before major edits</li>
                    <li>• Check dependencies before modifying linked records</li>
                    <li>• Use bulk edit for similar changes across multiple records</li>
                    <li>• Review audit logs for tracking changes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delete Tab */}
        <TabsContent value="delete" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Deleting Records
              </CardTitle>
              <CardDescription>
                Safe deletion procedures and data management guidelines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="font-semibold text-red-900 mb-3">⚠️ Critical Warning</h3>
                <p className="text-sm text-red-800 mb-3">
                  Deletion is often <strong>permanent</strong> and cannot be undone. Always follow proper procedures.
                </p>
                <ol className="text-sm text-red-800 space-y-1">
                  <li>1. <strong>Verify:</strong> Ensure you're deleting the correct record</li>
                  <li>2. <strong>Check Dependencies:</strong> Look for linked records that might be affected</li>
                  <li>3. <strong>Backup:</strong> Export or backup important data first</li>
                  <li>4. <strong>Confirm:</strong> Double-check the deletion confirmation</li>
                </ol>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Deletion Types</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p><strong>Soft Delete:</strong></p>
                      <p className="text-muted-foreground">Records are hidden but can be restored</p>
                    </div>
                    <div>
                      <p><strong>Hard Delete:</strong></p>
                      <p className="text-muted-foreground">Permanently removes records from database</p>
                    </div>
                    <div>
                      <p><strong>Bulk Delete:</strong></p>
                      <p className="text-muted-foreground">Delete multiple records at once</p>
                    </div>
                    <div>
                      <p><strong>Cascade Delete:</strong></p>
                      <p className="text-muted-foreground">Automatically deletes related records</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Safety Measures</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p><strong>Permission Checks:</strong></p>
                      <p className="text-muted-foreground">Verify user has deletion rights</p>
                    </div>
                    <div>
                      <p><strong>Dependency Validation:</strong></p>
                      <p className="text-muted-foreground">Check for linked records before deletion</p>
                    </div>
                    <div>
                      <p><strong>Confirmation Dialog:</strong></p>
                      <p className="text-muted-foreground">Multiple confirmation prompts</p>
                    </div>
                    <div>
                      <p><strong>Audit Logging:</strong></p>
                      <p className="text-muted-foreground">Track all deletion activities</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Module-Specific Deletion Guidelines</h3>
                <div className="grid gap-3">
                  {menuSections.map((section, index) => (
                    <div key={index} className="bg-muted/30 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <section.icon className="h-4 w-4" />
                        <h4 className="font-medium">{section.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {section.title === "Organization Management" && "Check for staff assignments before deleting organizational units"}
                        {section.title === "Staff Development" && "Verify no active assessments or assignments before staff deletion"}
                        {section.title === "Competency Management" && "Ensure no position mappings exist before deleting competencies"}
                        {section.title === "Training Management" && "Check for enrolled participants before removing training programs"}
                        {section.title === "Assessment Management" && "Preserve assessment results before deleting assessment records"}
                        {section.title === "Reports & Analytics" && "Archive important reports before deletion"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-purple-600" />
                Importing Data
              </CardTitle>
              <CardDescription>
                Upload and import data from external files and systems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Supported File Formats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span><strong>Excel Files:</strong> .xlsx, .xls</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span><strong>CSV Files:</strong> .csv (comma-separated)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span><strong>JSON Files:</strong> .json (structured data)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span><strong>Template Files:</strong> Pre-formatted templates</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Import Process</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                        <span>Download the appropriate template</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                        <span>Fill in your data following the format</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
                        <span>Upload the file using the import function</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</span>
                        <span>Review and validate the imported data</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">5</span>
                        <span>Confirm the import to save to database</span>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">Import Templates Available</h3>
                {menuSections.map((section, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <section.icon className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">{section.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Templates available: {section.items.join(", ")}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Download Templates
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">📝 Import Best Practices</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Always use the latest template version</li>
                  <li>• Validate data before uploading (check for duplicates, format issues)</li>
                  <li>• Import in small batches for large datasets</li>
                  <li>• Review the import summary before confirming</li>
                  <li>• Keep backup of original files</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-indigo-600" />
                Exporting Data & Reports
              </CardTitle>
              <CardDescription>
                Download data, generate reports, and export information from the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Data Export
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p><strong>Excel Export:</strong> Structured data with formatting</p>
                    <p><strong>CSV Export:</strong> Raw data for external processing</p>
                    <p><strong>PDF Export:</strong> Formatted reports and documents</p>
                    <p><strong>JSON Export:</strong> API-friendly structured data</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Report Generation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p><strong>Summary Reports:</strong> Overview and statistics</p>
                    <p><strong>Detailed Reports:</strong> Complete data analysis</p>
                    <p><strong>Custom Reports:</strong> User-defined criteria</p>
                    <p><strong>Scheduled Reports:</strong> Automatic generation</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Export Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p><strong>Filtered Data:</strong> Export based on search criteria</p>
                    <p><strong>Selected Records:</strong> Export specific selections</p>
                    <p><strong>Date Range:</strong> Export data within time periods</p>
                    <p><strong>Custom Fields:</strong> Choose specific columns</p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Available Reports by Module</h3>
                <div className="grid gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building className="h-4 w-4 text-blue-600" />
                        Organization Reports
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>• Organization Structure:</strong> Complete hierarchy report</p>
                        <p><strong>• Staff Distribution:</strong> Personnel across units/positions</p>
                      </div>
                      <div>
                        <p><strong>• Position Analysis:</strong> Job roles and requirements</p>
                        <p><strong>• Grade Statistics:</strong> Salary grades and levels</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-600" />
                        Competency Reports
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>• Competency Matrix:</strong> Skills mapping per position</p>
                        <p><strong>• Gap Analysis:</strong> Skill gaps across organization</p>
                      </div>
                      <div>
                        <p><strong>• Level Assessment:</strong> Proficiency levels report</p>
                        <p><strong>• Training Needs:</strong> Required training programs</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-red-600" />
                        Assessment Reports
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>• Assessment Results:</strong> Individual and group scores</p>
                        <p><strong>• Performance Analysis:</strong> Statistical performance data</p>
                      </div>
                      <div>
                        <p><strong>• Progress Tracking:</strong> Improvement over time</p>
                        <p><strong>• IDP Reports:</strong> Individual development plans</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-orange-600" />
                        Training Reports
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>• Training Effectiveness:</strong> Program impact analysis</p>
                        <p><strong>• Participation Rates:</strong> Attendance and completion</p>
                      </div>
                      <div>
                        <p><strong>• Training Calendar:</strong> Scheduled programs</p>
                        <p><strong>• Cost Analysis:</strong> Training investment reports</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">🎯 Export Tips</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Use filters to export only relevant data</li>
                  <li>• Schedule regular exports for backup purposes</li>
                  <li>• Choose appropriate format based on intended use</li>
                  <li>• Include metadata and timestamps for tracking</li>
                  <li>• Verify data integrity after export</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminDocumentationPage