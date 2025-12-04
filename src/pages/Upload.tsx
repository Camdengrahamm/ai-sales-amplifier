import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload as UploadIcon, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Upload = () => {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get coach ID
      const { data: coach } = await supabase
        .from("coaches")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!coach) throw new Error("Coach profile not found");

      // Upload files - use user.id for folder name to match storage RLS policy
      for (const file of Array.from(files)) {
        // Robust filename sanitization: only allow alphanumeric, dots, dashes, underscores
        const sanitizedName = file.name
          .normalize('NFD') // Normalize unicode characters
          .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
          .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace ALL non-safe chars with underscore
          .replace(/_+/g, '_') // Collapse multiple underscores
          .replace(/^_|_$/g, ''); // Trim leading/trailing underscores
        
        const fileName = `${user.id}/${Date.now()}-${sanitizedName}`;
        console.log("Uploading file:", fileName);
        
        const { error: uploadError } = await supabase.storage
          .from("course-files")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("course-files")
          .getPublicUrl(fileName);

        // Record in database
        const { data: fileRecord, error: dbError } = await supabase
          .from("course_files")
          .insert({
            coach_id: coach.id,
            filename: file.name,
            file_url: publicUrl,
            processed: false,
          })
          .select('id')
          .single();

        if (dbError) throw dbError;

        // Trigger content processing
        const { error: processError } = await supabase.functions.invoke('process-content', {
          body: {
            file_id: fileRecord?.id,
            coach_id: coach.id,
            file_url: publicUrl,
            filename: file.name,
          }
        });

        if (processError) {
          console.error("Processing error:", processError);
          toast.error(`Upload succeeded but processing failed for ${file.name}`);
        }
      }

      // Mark content as uploaded for this coach
      await supabase
        .from("coaches")
        .update({ content_uploaded: true })
        .eq("id", coach.id);

      toast.success(`${files.length} file(s) uploaded and processing started!`);
      
    } catch (error: any) {
      console.error("Error uploading files:", error);
      toast.error(error.message || "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Upload Course Content</h1>
          <p className="text-muted-foreground mt-1">
            Upload your course materials to train your AI assistant
          </p>
        </div>

        <Card className="border-2 border-dashed hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadIcon className="w-5 h-5" />
              Upload Files
            </CardTitle>
            <CardDescription>
              Supported formats: PDF, TXT, DOCX, images, video transcripts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploading || processing ? (
                    <>
                      <Loader2 className="w-10 h-10 mb-3 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">
                        {uploading ? "Uploading..." : "Processing..."}
                      </p>
                    </>
                  ) : (
                    <>
                      <FileText className="w-10 h-10 mb-3 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, TXT, DOCX, or images
                      </p>
                    </>
                  )}
                </div>
                <Input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  multiple
                  accept=".pdf,.txt,.docx,.doc,.png,.jpg,.jpeg"
                  disabled={uploading || processing}
                />
              </label>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-sm">What happens after upload?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Text is extracted from your files</li>
                <li>✓ Content is chunked and optimized</li>
                <li>✓ AI embeddings are generated</li>
                <li>✓ Your assistant learns from the material</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Assistant Configuration</CardTitle>
            <CardDescription>
              Your AI assistant will use the uploaded content to answer questions in Instagram DMs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>How it works:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li>HighLevel sends DM questions to your AI endpoint</li>
              <li>AI searches your course content for relevant answers</li>
              <li>After 3 questions, AI automatically pitches your program</li>
              <li>Tracking links attribute sales to your DM conversations</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Upload;
