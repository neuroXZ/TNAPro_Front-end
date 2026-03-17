import Link from 'next/link'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'

interface FAQItem {
  id: string
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    id: 'item-1',
    question: "What is the TNAPro assessment system?",
    answer: "TNAPro is a competency assessment system that helps organizations identify training needs and employee development based on competency gap analysis."
  },
  {
    id: 'item-2',
    question: "How do I access assessments?",
    answer: "You can access assessments through the dashboard after logging in with your registered account. Select the 'Assessment' menu and follow the available instructions."
  },
  {
    id: 'item-3',
    question: "How long does it take to complete an assessment?",
    answer: "Assessment completion time varies depending on the number of competencies being evaluated, generally ranging from 30-60 minutes per assessment session."
  },
  {
    id: 'item-4',
    question: "Can I view my assessment results?",
    answer: "Yes, assessment results can be viewed on your dashboard after the evaluation process is complete. Complete reports will be available in graphical format and detailed analysis."
  },
  {
    id: 'item-5',
    question: "What should I do if I forget my password?",
    answer: "Click 'Forgot Password' on the login page, enter your registered email, and follow the password reset instructions sent to your email."
  },
  {
    id: 'item-6',
    question: "Who can access my assessment results?",
    answer: "Assessment results can only be accessed by you, your direct supervisor, and authorized HR team members in accordance with company privacy policies."
  }
]

const FAQ = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-primary">
          Frequently Asked Questions (FAQ)
        </h1>
        <p className="text-muted-foreground">
          Find answers to frequently asked questions about the TNAPro system
        </p>
      </div>

      <Accordion type="multiple" className="w-full space-y-4">
        {faqData.map((item) => (
          <AccordionItem 
            key={item.id} 
            value={item.id}
            className="border border-border rounded-lg px-6 bg-card shadow-sm"
          >
            <AccordionTrigger className="text-left">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-12 p-6 bg-muted/50 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2">
          Still have questions?
        </h3>
        <p className="text-muted-foreground mb-4">
          If your question is not answered above, please contact our customer service team.
        </p>
        <Link href="/customer-service/contact-us">
          <Button>
            Contact Customer Service
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default FAQ