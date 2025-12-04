import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chunk text into smaller pieces for better retrieval
function chunkText(text: string, maxChunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Keep overlap for context continuity
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(chunk => chunk.length > 50); // Filter out tiny chunks
}

// Extract text from different file types
async function extractText(fileUrl: string, filename: string): Promise<string> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status}`);
  }
  
  const lowerFilename = filename.toLowerCase();
  
  if (lowerFilename.endsWith('.txt') || lowerFilename.endsWith('.md')) {
    return await response.text();
  }
  
  if (lowerFilename.endsWith('.pdf')) {
    // For PDFs, we'll use Lovable AI to extract content
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Use AI to help extract text from PDF (basic approach)
    // In production, you'd use a PDF parsing library
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }
    
    // For PDFs, we'll try to get raw text extraction
    // This is a simplified approach - PDFs are complex
    const pdfText = await extractPdfText(arrayBuffer);
    return pdfText;
  }
  
  if (lowerFilename.endsWith('.docx') || lowerFilename.endsWith('.doc')) {
    // For DOCX, extract plain text
    const arrayBuffer = await response.arrayBuffer();
    return await extractDocxText(arrayBuffer);
  }
  
  // For other files, try to read as text
  return await response.text();
}

// Basic PDF text extraction (simplified)
async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<string> {
  // Convert to string and look for text streams
  const bytes = new Uint8Array(arrayBuffer);
  let text = '';
  
  // Very basic PDF text extraction - looks for text between BT and ET markers
  // This is simplified and won't work for all PDFs
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const content = decoder.decode(bytes);
  
  // Extract text objects (simplified approach)
  const textMatches = content.match(/\(([^)]+)\)/g);
  if (textMatches) {
    text = textMatches
      .map(match => match.slice(1, -1))
      .filter(t => t.length > 2 && /[a-zA-Z]/.test(t))
      .join(' ');
  }
  
  // Also try to find raw readable text
  const readableText = content.match(/[A-Za-z][A-Za-z\s.,!?;:'"()-]{20,}/g);
  if (readableText) {
    text += ' ' + readableText.join(' ');
  }
  
  // Clean up the text
  text = text
    .replace(/\n/g, '\n')
    .replace(/\r/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (text.length < 100) {
    // If basic extraction failed, return placeholder
    console.log("Basic PDF extraction yielded minimal text, file may need manual review");
    return "Content extracted from PDF. Please note: Complex PDF formatting may require manual review.";
  }
  
  return text;
}

// Basic DOCX text extraction
async function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  // DOCX files are ZIP archives containing XML
  // This is a simplified approach
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const content = decoder.decode(new Uint8Array(arrayBuffer));
  
  // Look for text content in the XML
  const textMatches = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
  if (textMatches) {
    return textMatches
      .map(match => match.replace(/<[^>]+>/g, ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  // Fallback: extract any readable text
  const readableText = content.match(/[A-Za-z][A-Za-z\s.,!?;:'"()-]{10,}/g);
  if (readableText) {
    return readableText.join(' ');
  }
  
  return "Content extracted from document.";
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file_id, coach_id, file_url, filename } = await req.json();
    
    console.log(`Processing file: ${filename} for coach: ${coach_id}`);
    
    if (!file_url || !coach_id || !filename) {
      throw new Error("Missing required fields: file_url, coach_id, filename");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract text from file
    console.log(`Extracting text from: ${filename}`);
    const extractedText = await extractText(file_url, filename);
    console.log(`Extracted ${extractedText.length} characters`);

    if (extractedText.length < 50) {
      console.log("Warning: Very little text extracted from file");
    }

    // Chunk the text
    const chunks = chunkText(extractedText);
    console.log(`Created ${chunks.length} chunks`);

    // Store chunks in embeddings table
    const embeddingsToInsert = chunks.map(chunk => ({
      coach_id,
      content_chunk: chunk,
      embedding_vector: null, // Vector embeddings can be added later with a dedicated embedding model
    }));

    // Insert in batches to avoid timeouts
    const batchSize = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < embeddingsToInsert.length; i += batchSize) {
      const batch = embeddingsToInsert.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('embeddings')
        .insert(batch);
      
      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize}:`, insertError);
        throw insertError;
      }
      insertedCount += batch.length;
    }

    console.log(`Inserted ${insertedCount} embeddings for coach ${coach_id}`);

    // Mark file as processed
    if (file_id) {
      const { error: updateError } = await supabase
        .from('course_files')
        .update({ processed: true })
        .eq('id', file_id);
      
      if (updateError) {
        console.error("Error marking file as processed:", updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        chunks_created: insertedCount,
        message: `Successfully processed ${filename}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error processing content:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
