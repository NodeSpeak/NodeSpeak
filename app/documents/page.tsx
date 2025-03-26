'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { HackMDImportButton } from '@/components/hackmd/HackMDImportButton';
import { Home, Folder, FileText, Import } from 'lucide-react';

export default function DocumentsPage() {
  const router = useRouter();

  const documentSources = [
    {
      id: 'hackmd',
      title: 'Documentos de HackMD',
      description: 'Notas y documentos importados desde HackMD',
      icon: <FileText className="h-8 w-8 text-blue-500" />,
      route: '/documents/hackmd'
    },
    // Podrían añadirse más fuentes de documentos aquí en el futuro
  ];

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <Home className="h-3.5 w-3.5 mr-1" />
              Inicio
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Documentos</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Folder className="h-6 w-6 mr-2" />
          Mis Documentos
        </h1>
        <div className="flex space-x-2">
          <HackMDImportButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documentSources.map((source) => (
          <Card key={source.id} className="transition-all hover:shadow-md cursor-pointer" onClick={() => router.push(source.route)}>
            <CardHeader>
              <div className="flex items-start">
                {source.icon}
                <div className="ml-4">
                  <CardTitle>{source.title}</CardTitle>
                  <CardDescription>{source.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => router.push(source.route)}>
                Ver documentos
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        <Card className="border-dashed hover:border-blue-400 transition-all cursor-pointer">
          <CardHeader>
            <div className="flex items-start">
              <Import className="h-8 w-8 text-gray-400" />
              <div className="ml-4">
                <CardTitle>Importar documentos</CardTitle>
                <CardDescription>Importa documentos desde varias fuentes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => router.push('/import/hackmd')}>
              Importar
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
