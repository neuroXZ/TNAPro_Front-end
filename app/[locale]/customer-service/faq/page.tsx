import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'

const FAQ = () => {
  const t = useTranslations('CustomerServiceFaqPage')

  const faqData = [
    { id: 'item-1', question: t('faq1Question'), answer: t('faq1Answer') },
    { id: 'item-2', question: t('faq2Question'), answer: t('faq2Answer') },
    { id: 'item-3', question: t('faq3Question'), answer: t('faq3Answer') },
    { id: 'item-4', question: t('faq4Question'), answer: t('faq4Answer') },
    { id: 'item-5', question: t('faq5Question'), answer: t('faq5Answer') },
    { id: 'item-6', question: t('faq6Question'), answer: t('faq6Answer') },
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-primary">
          {t('title')}
        </h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
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
          {t('stillHaveQuestions')}
        </h3>
        <p className="text-muted-foreground mb-4">
          {t('contactNote')}
        </p>
        <Link href="/customer-service/contact-us">
          <Button>
            {t('contactButton')}
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default FAQ