import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Message {
  role: string;
  content: string;
}

interface ConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userHandle: string;
  messages: Message[];
  platform?: string;
  lastActivity?: string;
}

const ConversationDialog = ({ 
  open, 
  onOpenChange, 
  userHandle, 
  messages,
  platform,
  lastActivity 
}: ConversationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            @{userHandle}
            {platform && (
              <Badge variant="outline" className="text-xs">
                {platform}
              </Badge>
            )}
          </DialogTitle>
          {lastActivity && (
            <p className="text-sm text-muted-foreground">
              Last active: {format(new Date(lastActivity), "MMM d, yyyy h:mm a")}
            </p>
          )}
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'assistant'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ConversationDialog;
