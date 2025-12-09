import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconRefresh } from "@tabler/icons-react"

interface LoadingStateProps {
  onRetry?: () => void
}

export function LoadingState() {
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Recommended Training Programs</h1>
          <p className="text-muted-foreground mt-1">
            Loading your recommended training programs...
          </p>
        </div>
      </div>

      {/* Loading Card */}
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <span>Loading recommended training programs...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ErrorStateProps {
  error: string
  isSuccessMessage: boolean
  onRetry: () => void
}

export function ErrorState({ error, isSuccessMessage, onRetry }: ErrorStateProps) {
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Recommended Training Programs</h1>
          <p className="text-muted-foreground mt-1">
            Training programs recommended based on your competency gaps
          </p>
        </div>
      </div>
      
      {/* Error Content */}
      {isSuccessMessage ? (
        <SuccessMessage onRefresh={onRetry} />
      ) : (
        <ErrorMessage error={error} onRetry={onRetry} />
      )}
    </div>
  )
}

function SuccessMessage({ onRefresh }: { onRefresh: () => void }) {
  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
      <CardContent className="py-6">
        <div className="text-center space-y-3">
          <div className="size-12 mx-auto text-green-600">🎉</div>
          <div>
            <h3 className="font-semibold text-green-800 dark:text-green-200">Excellent Performance!</h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Your competency levels are meeting or exceeding requirements. No additional training recommendations at this time.
            </p>
          </div>
          <Button 
            onClick={onRefresh} 
            variant="outline" 
            className="mt-4 border-green-300 text-green-700 hover:bg-green-100"
          >
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh Assessment
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ErrorMessage({ error, onRetry }: { error: string, onRetry: () => void }) {
  return (
    <>
      <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
        <CardContent className="py-6">
          <div className="text-center space-y-3">
            <div className="size-12 mx-auto text-red-600">⚠️</div>
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200">Unable to Load Training</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex gap-2 mt-4">
        <Button onClick={onRetry}>
          <IconRefresh className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    </>
  )
}