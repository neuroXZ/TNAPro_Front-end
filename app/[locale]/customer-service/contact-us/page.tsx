"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { IconMail, IconPhone, IconClock, IconMapPin, IconSend, IconArrowLeft } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import emailjs from '@emailjs/browser'
import { useTranslations } from 'next-intl'


export default function CustomerServicePage() {
  const router = useRouter()
  const t = useTranslations('CustomerServiceContactPage')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize EmailJS
  useEffect(() => {
    // Initialize EmailJS with public key 
    emailjs.init("rGxvYtK8V-fLHjjdO") // Public key for TNAPro
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // EmailJS configuration for TNAPro
      const serviceID = 'service_tnapro123'
      const templateID = 'template_contact_form'
      
      // Prepare email template parameters
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        to_email: 'tnaprosupport@mmcsb.com.my',
        subject: `Customer Service: ${formData.subject}`,
        message: formData.message,
        reply_to: formData.email,
        // Additional formatting
        formatted_message: `Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}

Message:
${formData.message}

---
This message was sent from the TNAPro Customer Service contact form.`
      }

      // Send email directly via EmailJS
      const result = await emailjs.send(serviceID, templateID, templateParams)
      
      if (result.status === 200) {
        toast.success(t('successMessage'), {
          description: t('successDescription'),
          duration: 5000,
        })
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        })
      } else {
        throw new Error('Failed to send email')
      }
      
    } catch (error: any) {
      console.error('Error sending email:', error)
      
      // Fallback to mailto if EmailJS fails
      toast.error(t('errorMessage'), {
        description: t('errorDescription'),
        duration: 6000,
      })
      
      // Create mailto link as fallback
      const subject = `Customer Service: ${formData.subject}`
      const body = `Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}

Message:
${formData.message}

---
This message was sent from the TNAPro Customer Service contact form.`

      const mailtoLink = `mailto:tnaprosupport@mmcsb.com.my?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      
      if (typeof window !== 'undefined') {
        window.open(mailtoLink, '_blank')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary mb-4">{t('title')}</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Contact Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconMail className="text-primary" />
                {t('getInTouch')}
              </CardTitle>
              <CardDescription>
                {t('multipleWays')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <IconMail className="text-primary size-5" />
                <div>
                  <p className="font-medium">{t('emailSupport')}</p>
                  <p className="text-sm text-muted-foreground">enquiry@mmcsb.com.my</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <IconPhone className="text-primary size-5" />
                <div>
                  <p className="font-medium">{t('phoneSupport')}</p>
                  <p className="text-sm text-muted-foreground">03-8679 3909</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <IconClock className="text-primary size-5" />
                <div>
                  <p className="font-medium">{t('businessHours')}</p>
                  <p className="text-sm text-muted-foreground">{t('businessHoursValue')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <IconMapPin className="text-primary size-5" />
                <div>
                  <p className="font-medium">{t('officeLocation')}</p>
                  <p className="text-sm text-muted-foreground">1005 Level 10, Block A, Phileo Damansara II, Jalan 16/11, <br/>Pusat Perdagangan Phileo Damansara,<br/> 46350 Petaling Jaya, Selangor</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconSend className="text-primary" />
              {t('sendMessage')}
            </CardTitle>
            <CardDescription>
              {t('formDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('fullName')}</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder={t('fullNamePlaceholder')}
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('emailAddress')}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">{t('subject')}</Label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder={t('subjectPlaceholder')}
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">{t('message')}</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder={t('messagePlaceholder')}
                  rows={6}
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full size-4 border-b-2 border-white mr-2" />
                    {t('sending')}
                  </>
                ) : (
                  <>
                    <IconSend className="mr-2 size-4" />
                    {t('sendButton')}
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                {t('requiredNote')}
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
      
    </div>
  )
}