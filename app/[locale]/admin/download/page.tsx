"use client";

import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import AdminIdpDownloadPage from "@/features/admin/download/components/idpdownload"
import { useTranslations } from "next-intl"


const page = () => {
  const t = useTranslations('AdminDownloadPage');
  return (
    <Tabs defaultValue="idp" className="w-full">
      <TabsList>
        <TabsTrigger value="idp">{t('tabIdp')}</TabsTrigger>
        <TabsTrigger value="dataManagement">{t('tabDataManagement')}</TabsTrigger>
        <TabsTrigger value="reports">{t('tabReports')}</TabsTrigger>
        <TabsTrigger value="settings">{t('tabSettings')}</TabsTrigger>
      </TabsList>
      <TabsContent value="idp">
        <Card>
          <CardHeader>
            <CardTitle>{t('idpTitle')}</CardTitle>
            <CardDescription>
              {t('idpDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            <AdminIdpDownloadPage />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="dataManagement">
        <Card>
          <CardHeader>
            <CardTitle>{t('dataManagementTitle')}</CardTitle>
            <CardDescription>
              {t('dataManagementDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {t('dataManagementContent')}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="reports">
        <Card>
          <CardHeader>
            <CardTitle>{t('reportsTitle')}</CardTitle>
            <CardDescription>
              {t('reportsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {t('reportsContent')}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle>{t('settingsTitle')}</CardTitle>
            <CardDescription>
              {t('settingsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {t('settingsContent')}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

export default page