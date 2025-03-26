import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { hackmdService, HackMDTeam, HackMDNote } from '@/lib/services/hackmd-service';
import { Loader2, Users, FileText, RefreshCw } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const HackMDTeamsList: React.FC = () => {
  const [teams, setTeams] = useState<HackMDTeam[]>([]);
  const [teamNotes, setTeamNotes] = useState<{[teamId: string]: HackMDNote[]}>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingNotes, setLoadingNotes] = useState<{[teamId: string]: boolean}>({});
  const [error, setError] = useState<string | null>(null);
  
  // Fetch teams on component mount
  useEffect(() => {
    fetchTeams();
  }, []);
  
  // Fetch teams from HackMD
  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedTeams = await hackmdService.getTeams();
      setTeams(fetchedTeams);
    } catch (err) {
      setError('Failed to load teams. Please try again later.');
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch notes for a team
  const fetchTeamNotes = async (teamId: string) => {
    // Skip if already loaded
    if (teamNotes[teamId]) return;
    
    try {
      setLoadingNotes(prev => ({ ...prev, [teamId]: true }));
      const notes = await hackmdService.getTeamNotes(teamId);
      setTeamNotes(prev => ({ ...prev, [teamId]: notes }));
    } catch (err) {
      console.error(`Error fetching notes for team ${teamId}:`, err);
    } finally {
      setLoadingNotes(prev => ({ ...prev, [teamId]: false }));
    }
  };
  
  // Handle accordion change
  const handleAccordionChange = (teamId: string) => {
    fetchTeamNotes(teamId);
  };
  
  // Show loading state
  if (loading && teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p>Loading your HackMD teams...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }
  
  if (teams.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg bg-muted/20">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
        <h3 className="text-lg font-medium">No teams found</h3>
        <p className="text-muted-foreground">
          You are not a member of any HackMD teams
        </p>
      </div>
    );
  }
  
  return (
    <div className="teams-list-container">
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={fetchTeams}
          title="Refresh teams"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        {teams.map((team) => (
          <AccordionItem key={team.id} value={team.id}>
            <AccordionTrigger onClick={() => handleAccordionChange(team.id)}>
              <div className="flex items-center">
                {team.logo ? (
                  <img 
                    src={team.logo} 
                    alt={team.name} 
                    className="w-5 h-5 mr-2 rounded-full" 
                  />
                ) : (
                  <Users className="h-5 w-5 mr-2" />
                )}
                <span>{team.name}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {loadingNotes[team.id] ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : teamNotes[team.id]?.length ? (
                <div className="space-y-2 pt-2">
                  {teamNotes[team.id].map((note) => (
                    <Card key={note.id}>
                      <CardHeader className="py-3">
                        <CardTitle className="text-base flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          {note.title}
                        </CardTitle>
                      </CardHeader>
                      <CardFooter className="pt-0 pb-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(note.url, '_blank')}
                        >
                          Open in HackMD
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No notes found in this team
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
