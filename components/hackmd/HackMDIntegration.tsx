import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hackmdService, HackMDNote, HackMDTeam, HackMDUser } from '@/lib/services/hackmd-service';
import { Loader2, FileText, Users, Plus, Trash } from 'lucide-react';
import { HackMDNotesList } from './HackMDNotesList';
import { HackMDNoteEditor } from './HackMDNoteEditor';
import { HackMDTeamsList } from './HackMDTeamsList';

export const HackMDIntegration: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<HackMDUser | null>(null);
  const [activeTab, setActiveTab] = useState<string>('notes');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  
  // Check login status on component mount
  useEffect(() => {
    checkLoginStatus();
  }, []);
  
  // Check if the user is logged in to HackMD
  const checkLoginStatus = async () => {
    setLoading(true);
    try {
      const profile = await hackmdService.getProfile();
      setUser(profile);
      setIsLoggedIn(true);
    } catch (error) {
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle login button click
  const handleLogin = () => {
    hackmdService.login();
  };
  
  // Handle logout button click
  const handleLogout = () => {
    hackmdService.logout();
  };
  
  // Handle note selection
  const handleNoteSelect = (noteId: string) => {
    setSelectedNoteId(noteId);
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSelectedNoteId(null);
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading HackMD integration...</span>
      </div>
    );
  }
  
  // Show login screen if not logged in
  if (!isLoggedIn) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>HackMD Integration</CardTitle>
          <CardDescription>Connect to your HackMD account to access your notes and collaborate</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">You need to log in to your HackMD account to use this feature.</p>
          <Button onClick={handleLogin}>
            Log in to HackMD
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Main integration UI when logged in
  return (
    <div className="hackmd-integration w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">HackMD Integration</h2>
          {user && (
            <p className="text-sm text-gray-500">
              Logged in as {user.name} ({user.email})
            </p>
          )}
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="notes">
            <FileText className="h-4 w-4 mr-2" />
            My Notes
          </TabsTrigger>
          <TabsTrigger value="teams">
            <Users className="h-4 w-4 mr-2" />
            Teams
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="notes">
          {selectedNoteId ? (
            <HackMDNoteEditor 
              noteId={selectedNoteId} 
              onBack={() => setSelectedNoteId(null)} 
            />
          ) : (
            <HackMDNotesList onNoteSelect={handleNoteSelect} />
          )}
        </TabsContent>
        
        <TabsContent value="teams">
          <HackMDTeamsList />
        </TabsContent>
      </Tabs>
    </div>
  );
};
