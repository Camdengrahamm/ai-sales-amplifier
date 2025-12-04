import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chunk text into smaller pieces for better retrieval
function chunkText(text: string, maxChunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  
  // Simple chunking by character count with sentence awareness
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxChunkSize, text.length);
    
    // Try to end at a sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastQuestion = text.lastIndexOf('?', end);
      const lastExclaim = text.lastIndexOf('!', end);
      const lastBreak = Math.max(lastPeriod, lastQuestion, lastExclaim);
      
      if (lastBreak > start + maxChunkSize / 2) {
        end = lastBreak + 1;
      }
    }
    
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 50) {
      chunks.push(chunk);
    }
    
    // Move start with overlap
    start = end - overlap;
    if (start >= text.length - overlap) break;
  }
  
  return chunks;
}

// Extract readable text from any content
function extractReadableText(content: string): string {
  // Remove binary/non-printable characters but keep basic punctuation and newlines
  let text = content
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ');
  
  // Clean up whitespace
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
  
  return text;
}

// Extract text from different file types
async function extractText(fileUrl: string, filename: string): Promise<string> {
  console.log(`Fetching file: ${fileUrl}`);
  
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status}`);
  }
  
  const lowerFilename = filename.toLowerCase();
  
  // For text files, read directly
  if (lowerFilename.endsWith('.txt') || lowerFilename.endsWith('.md')) {
    const text = await response.text();
    console.log(`Extracted ${text.length} chars from text file`);
    return text;
  }
  
  // For PDF and DOCX, we'll extract what text we can
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // Convert to string safely (avoid stack overflow)
  let content = '';
  const chunkSize = 65536; // Process in 64KB chunks
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    content += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  if (lowerFilename.endsWith('.pdf')) {
    console.log('Processing PDF file...');
    return extractPdfText(content);
  }
  
  if (lowerFilename.endsWith('.docx') || lowerFilename.endsWith('.doc')) {
    console.log('Processing DOCX file...');
    return extractDocxText(content);
  }
  
  // For other files, try to extract readable text
  return extractReadableText(content);
}

// Basic PDF text extraction
function extractPdfText(content: string): string {
  const textParts: string[] = [];
  
  // Method 1: Look for text in parentheses (PDF text objects)
  const parenMatches = content.match(/\(([^)]{3,})\)/g);
  if (parenMatches) {
    for (const match of parenMatches) {
      const text = match.slice(1, -1);
      // Filter to only keep readable text
      if (/[a-zA-Z]{2,}/.test(text)) {
        textParts.push(text);
      }
    }
  }
  
  // Method 2: Look for readable text sequences
  const readableMatches = content.match(/[A-Za-z][A-Za-z\s.,!?;:'"()\-]{15,}/g);
  if (readableMatches) {
    textParts.push(...readableMatches);
  }
  
  // Combine and clean
  let text = textParts.join(' ');
  text = extractReadableText(text);
  
  // Remove duplicates (PDF often has repeated text)
  const seen = new Set<string>();
  const unique = text.split(/\s+/).filter(word => {
    if (seen.has(word.toLowerCase())) return false;
    seen.add(word.toLowerCase());
    return true;
  });
  
  text = unique.join(' ');
  console.log(`Extracted ${text.length} chars from PDF`);
  
  if (text.length < 100) {
    return "Content extracted from PDF document. Note: Complex PDF formatting may limit text extraction. Consider uploading as .txt for best results.";
  }
  
  return text;
}

// Basic DOCX text extraction
function extractDocxText(content: string): string {
  const textParts: string[] = [];
  
  // DOCX XML text content
  const xmlMatches = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
  if (xmlMatches) {
    for (const match of xmlMatches) {
      const text = match.replace(/<[^>]+>/g, '');
      if (text.length > 1) {
        textParts.push(text);
      }
    }
  }
  
  // Also look for readable text
  const readableMatches = content.match(/[A-Za-z][A-Za-z\s.,!?;:'"()\-]{10,}/g);
  if (readableMatches) {
    textParts.push(...readableMatches);
  }
  
  let text = textParts.join(' ');
  text = extractReadableText(text);
  console.log(`Extracted ${text.length} chars from DOCX`);
  
  if (text.length < 50) {
    return "Content extracted from document.";
  }
  
  return text;
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
    let extractedText: string;
    
    try {
      extractedText = await extractText(file_url, filename);
    } catch (extractError) {
      console.error('Text extraction error:', extractError);
      extractedText = `Content from ${filename}. Text extraction encountered an error.`;
    }
    
    console.log(`Extracted ${extractedText.length} characters`);

    // Chunk the text
    const chunks = chunkText(extractedText);
    console.log(`Created ${chunks.length} chunks`);

    if (chunks.length === 0) {
      // Create at least one chunk with the filename
      chunks.push(`Content from file: ${filename}`);
    }

    // Store chunks in embeddings table
    const embeddingsToInsert = chunks.map(chunk => ({
      coach_id,
      content_chunk: chunk,
      embedding_vector: null,
    }));

    // Insert in batches
    const batchSize = 20;
    let insertedCount = 0;
    
    for (let i = 0; i < embeddingsToInsert.length; i += batchSize) {
      const batch = embeddingsToInsert.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('embeddings')
        .insert(batch);
      
      if (insertError) {
        console.error(`Error inserting batch:`, insertError);
        throw insertError;
      }
      insertedCount += batch.length;
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}, total: ${insertedCount}`);
    }

    console.log(`Total inserted: ${insertedCount} embeddings for coach ${coach_id}`);

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
