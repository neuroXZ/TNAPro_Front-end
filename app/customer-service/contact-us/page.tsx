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


export default function CustomerServicePage() {
  const router = useRouter()
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
    emailjs.init("rGxvYtK8V-fLHjjdO") // Public key for TNA Pro
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
      // EmailJS configuration for TNA Pro
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
This message was sent from the TNA Pro Customer Service contact form.`
      }

      // Send email directly via EmailJS
      const result = await emailjs.send(serviceID, templateID, templateParams)
      
      if (result.status === 200) {
        toast.success("Your message has been sent successfully! We'll get back to you soon.", {
          description: "Email sent directly to our support team.",
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
      toast.error("Direct email failed. Opening your email client as backup.", {
        description: "Please send the message manually.",
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
This message was sent from the TNA Pro Customer Service contact form.`

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
        <h1 className="text-4xl font-bold text-primary mb-4">Customer Service</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          We're here to help! Get in touch with our customer service team for any questions, 
          support, or feedback you may have.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Contact Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconMail className="text-primary" />
                Get in Touch
              </CardTitle>
              <CardDescription>
                Multiple ways to reach our support team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <IconMail className="text-primary size-5" />
                <div>
                  <p className="font-medium">Email Support</p>
                  <p className="text-sm text-muted-foreground">enquiry@mmcsb.com.my</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <IconPhone className="text-primary size-5" />
                <div>
                  <p className="font-medium">Phone Support</p>
                  <p className="text-sm text-muted-foreground">03-8679 3909</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <IconClock className="text-primary size-5" />
                <div>
                  <p className="font-medium">Business Hours</p>
                  <p className="text-sm text-muted-foreground">Mon - Fri, 9:00 AM - 5:00 PM (MYT)</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <IconMapPin className="text-primary size-5" />
                <div>
                  <p className="font-medium">Office Location</p>
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
              Send us a Message
            </CardTitle>
            <CardDescription>
              Fill out the form below and we'll get back to you as soon as possible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder="What is this regarding?"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Please describe your question or issue in detail..."
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
                    Sending...
                  </>
                ) : (
                  <>
                    <IconSend className="mr-2 size-4" />
                    Send Message
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                * Required fields. Your message will be sent to tnaprosupport@mmcsb.com.my
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
      
    </div>
  )
}