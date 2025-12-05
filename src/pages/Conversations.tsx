import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Search, Trash2, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import ConversationDialog from "@/components/ConversationDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DmSession {
  id: string;
  coach_id: string;
  user_handle: string;
  question_count: number | null;
  messages: { role: string; content: string }[] | null;
  last_question_at: string | null;
  created_at: string | null;
}

const Conversations = () => {
  const [sessions, setSessions] = useState<DmSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState<DmSession | null>(null);
  const [conversationOpen, setConversationOpen] = useState(false);
  const [deleteSession, setDeleteSession] = useState<DmSession | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("dm_sessions")
        .select("*")
        .order("last_question_at", { ascending: false });

      if (error) throw error;
      setSessions((data as DmSession[]) || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter out sessions with placeholder handles
  const filteredSessions = sessions
    .filter(session => !session.user_handle.includes("{{") && !session.user_handle.includes("cuf_"))
    .filter(session => 
      session.user_handle.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleViewConversation = (session: DmSession) => {
    setSelectedSession(session);
    setConversationOpen(true);
  };

  const handleDeleteSession = async () => {
    if (!deleteSession) return;

    try {
      const { error } = await supabase
        .from("dm_sessions")
        .delete()
        .eq("id", deleteSession.id);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== deleteSession.id));
      toast.success("Conversation deleted");
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete conversation");
    } finally {
      setDeleteSession(null);
    }
  };

  const getMessageCount = (session: DmSession) => {
    if (!session.messages || !Array.isArray(session.messages)) return 0;
    return session.messages.length;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">DM Conversations</h1>
            <p className="text-muted-foreground mt-1">
              View and manage your AI DM conversations
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            <MessageSquare className="w-4 h-4 mr-1" />
            {filteredSessions.length} conversations
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                All Conversations
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by handle..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No conversations yet</p>
                <p className="text-sm">DM conversations will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Handle</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <button
                            onClick={() => handleViewConversation(session)}
                            className="font-medium text-primary hover:underline cursor-pointer flex items-center gap-1"
                          >
                            @{session.user_handle}
                            <MessageCircle className="w-3 h-3" />
                          </button>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getMessageCount(session)} msgs
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {session.question_count || 0} Qs
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {session.last_question_at 
                            ? format(new Date(session.last_question_at), "MMM d, yyyy h:mm a")
                            : "-"
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteSession(session)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedSession && (
        <ConversationDialog
          open={conversationOpen}
          onOpenChange={setConversationOpen}
          userHandle={selectedSession.user_handle}
          messages={Array.isArray(selectedSession.messages) ? selectedSession.messages : []}
          lastActivity={selectedSession.last_question_at || undefined}
        />
      )}

      <AlertDialog open={!!deleteSession} onOpenChange={() => setDeleteSession(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the conversation with @{deleteSession?.user_handle}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Conversations;
