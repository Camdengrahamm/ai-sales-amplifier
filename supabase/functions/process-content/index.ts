import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chunk text into smaller pieces for better retrieval
function chunkText(text: string, maxChunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  
  // Split by paragraphs/sections first
  const sections = text.split(/\n\n+/).filter(p => p.trim().length > 30);
  
  let currentChunk = '';
  for (const section of sections) {
    if ((currentChunk + '\n\n' + section).length > maxChunkSize && currentChunk.length > 100) {
      chunks.push(currentChunk.trim());
      // Keep some overlap
      const words = currentChunk.split(' ');
      currentChunk = words.slice(-30).join(' ') + '\n\n' + section;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + section;
    }
  }
  
  if (currentChunk.trim().length > 50) {
    chunks.push(currentChunk.trim());
  }
  
  // If we got very few chunks from a large text, do sentence-based chunking
  if (chunks.length < 3 && text.length > 2000) {
    chunks.length = 0;
    const sentences = text.split(/(?<=[.!?])\s+/);
    currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + ' ' + sentence).length > maxChunkSize && currentChunk.length > 200) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }
    
    if (currentChunk.trim().length > 50) {
      chunks.push(currentChunk.trim());
    }
  }
  
  return chunks.filter(c => c.length > 50);
}

// Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Use AI with document/vision capabilities to extract text from PDF
async function extractPdfWithVision(fileUrl: string, filename: string, apiKey: string): Promise<string> {
  console.log('Using AI vision to extract PDF content from:', filename);
  
  // Fetch the file and convert to base64
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const base64Data = arrayBufferToBase64(arrayBuffer);
  const mimeType = 'application/pdf';
  
  console.log(`File size: ${arrayBuffer.byteLength} bytes, sending to AI...`);
  
  // Use Gemini's document understanding with inline_data
  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'file',
            file: {
              filename: filename,
              file_data: `data:${mimeType};base64,${base64Data}`
            }
          },
          {
            type: 'text',
            text: `You are a document transcription expert. Please extract ALL text content from this PDF document.

Instructions:
1. Read through the ENTIRE document, page by page
2. Extract ALL text content including headings, paragraphs, bullet points, lists, and any other text
3. Preserve the document structure (headings, sections, bullet points)
4. Include ALL information - do not summarize or skip anything
5. Format the output as clean, readable text with proper line breaks between sections

Important: This is training content for an AI assistant. Every detail matters. Extract the complete text, not a summary.

Please begin the full transcription:`
          }
        ]
      }],
      max_tokens: 16000,
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error('AI vision extraction failed:', aiResponse.status, errorText);
    throw new Error(`AI vision extraction failed: ${aiResponse.status}`);
  }

  const data = await aiResponse.json();
  const extractedText = data.choices?.[0]?.message?.content || '';
  
  console.log(`AI extracted ${extractedText.length} characters`);
  
  if (extractedText.length < 200) {
    console.error('Extraction too short, likely failed');
    throw new Error('Could not extract meaningful content from PDF');
  }
  
  return extractedText;
}

// Extract text from plain text files
async function extractTextFile(fileUrl: string): Promise<string> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status}`);
  }
  return await response.text();
}

// Main extraction function
async function extractText(fileUrl: string, filename: string, apiKey: string): Promise<string> {
  console.log(`Extracting text from: ${filename}`);
  
  const lowerFilename = filename.toLowerCase();
  
  // Plain text files - read directly
  if (lowerFilename.endsWith('.txt') || lowerFilename.endsWith('.md') || lowerFilename.endsWith('.csv')) {
    const text = await extractTextFile(fileUrl);
    console.log(`Extracted ${text.length} chars from text file`);
    return text;
  }
  
  // PDFs and other documents - use AI vision
  if (lowerFilename.endsWith('.pdf')) {
    return await extractPdfWithVision(fileUrl, filename, apiKey);
  }
  
  // For DOCX and other formats, try text extraction first, then AI
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // Try to extract readable text
  let content = '';
  for (let i = 0; i < bytes.length && content.length < 100000; i++) {
    const charCode = bytes[i];
    if ((charCode >= 32 && charCode <= 126) || charCode === 10 || charCode === 13 || charCode === 9) {
      content += String.fromCharCode(charCode);
    }
  }
  
  // Clean up
  content = content.replace(/\s+/g, ' ').trim();
  
  // Check if content is readable
  const readableRatio = (content.match(/[a-zA-Z]/g) || []).length / Math.max(content.length, 1);
  console.log(`Readable ratio: ${readableRatio.toFixed(2)}`);
  
  if (readableRatio < 0.4 || content.length < 500) {
    // Fall back to AI for this file type too
    return await extractPdfWithVision(fileUrl, filename, apiKey);
  }
  
  return content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file_id, coach_id, file_url, filename } = await req.json();
    
    console.log(`Processing file: ${filename} for coach: ${coach_id}`);
    
    if (!file_url || !coach_id || !filename) {
      throw new Error("Missing required fields: file_url, coach_id, filename");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract text from file
    console.log(`Starting extraction for: ${filename}`);
    let extractedText: string;
    
    try {
      extractedText = await extractText(file_url, filename, lovableApiKey);
    } catch (extractError) {
      console.error('Text extraction error:', extractError);
      throw new Error(`Could not extract content from ${filename}. Error: ${extractError instanceof Error ? extractError.message : 'Unknown'}`);
    }
    
    console.log(`Extracted ${extractedText.length} characters of content`);
    console.log(`First 500 chars preview: ${extractedText.slice(0, 500)}`);

    // Chunk the text
    const chunks = chunkText(extractedText);
    console.log(`Created ${chunks.length} content chunks`);
    
    // Log chunk sizes for debugging
    chunks.forEach((chunk, i) => {
      console.log(`Chunk ${i + 1}: ${chunk.length} chars`);
    });

    if (chunks.length === 0) {
      throw new Error('No meaningful content chunks could be created from the file');
    }

    // Store chunks in embeddings table
    const embeddingsToInsert = chunks.map(chunk => ({
      coach_id,
      content_chunk: chunk,
      embedding_vector: null,
    }));

    // Insert in batches
    const batchSize = 10;
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
      console.log(`Inserted batch ${Math.ceil((i + 1) / batchSize)}, total: ${insertedCount}`);
    }

    console.log(`Successfully stored ${insertedCount} content chunks for ${filename}`);

    // Mark file as processed
    if (file_id) {
      await supabase
        .from('course_files')
        .update({ processed: true })
        .eq('id', file_id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        chunks_created: insertedCount,
        total_chars: extractedText.length,
        message: `Successfully processed ${filename} - ${insertedCount} chunks created from ${extractedText.length} characters` 
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
