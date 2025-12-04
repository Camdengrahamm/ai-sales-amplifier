import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chunk text into smaller pieces for better retrieval
function chunkText(text: string, maxChunkSize = 800, overlap = 150): string[] {
  const chunks: string[] = [];
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 20);
  
  let currentChunk = '';
  for (const para of paragraphs) {
    if ((currentChunk + '\n\n' + para).length > maxChunkSize && currentChunk.length > 100) {
      chunks.push(currentChunk.trim());
      // Keep some overlap
      const words = currentChunk.split(' ');
      currentChunk = words.slice(-20).join(' ') + '\n\n' + para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }
  
  if (currentChunk.trim().length > 50) {
    chunks.push(currentChunk.trim());
  }
  
  // If we got very few chunks, do character-based chunking
  if (chunks.length < 3 && text.length > 1000) {
    chunks.length = 0;
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + maxChunkSize, text.length);
      const chunk = text.slice(start, end).trim();
      if (chunk.length > 50) {
        chunks.push(chunk);
      }
      start = end - overlap;
    }
  }
  
  return chunks.filter(c => c.length > 50);
}

// Use AI to extract and summarize content from binary file data
async function extractWithAI(fileContent: string, filename: string, apiKey: string): Promise<string> {
  console.log('Using AI to extract content from:', filename);
  
  // For PDFs and complex docs, ask AI to identify and extract meaningful content
  const prompt = `You are a content extraction assistant. The following is raw data from a file named "${filename}".

Your task:
1. Identify any readable text content (ignore binary garbage, encoding artifacts, PDF stream markers like "endstream endobj")
2. Extract and reconstruct the meaningful human-readable text
3. If you find structured content (headings, bullet points, paragraphs), preserve that structure
4. If the content appears to be training material or documentation, extract the key information
5. Ignore any URLs, metadata, or technical markers unless they're part of the actual content

Raw file content (first 15000 chars):
${fileContent.slice(0, 15000)}

Please extract and return ONLY the meaningful, readable text content. If no meaningful content can be extracted, respond with "NO_CONTENT_FOUND".`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    console.error('AI extraction failed:', response.status);
    throw new Error('AI extraction failed');
  }

  const data = await response.json();
  const extractedText = data.choices?.[0]?.message?.content || '';
  
  if (extractedText.includes('NO_CONTENT_FOUND') || extractedText.length < 100) {
    throw new Error('No meaningful content could be extracted from the file');
  }
  
  return extractedText;
}

// Extract text from different file types
async function extractText(fileUrl: string, filename: string, apiKey: string): Promise<string> {
  console.log(`Fetching file: ${fileUrl}`);
  
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status}`);
  }
  
  const lowerFilename = filename.toLowerCase();
  
  // For plain text files, read directly
  if (lowerFilename.endsWith('.txt') || lowerFilename.endsWith('.md')) {
    const text = await response.text();
    console.log(`Extracted ${text.length} chars from text file`);
    return text;
  }
  
  // For PDF and other binary formats, use AI extraction
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // Convert to string safely in chunks
  let content = '';
  const chunkSize = 32768;
  for (let i = 0; i < bytes.length && content.length < 50000; i += chunkSize) {
    const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.length));
    for (let j = 0; j < chunk.length; j++) {
      const charCode = chunk[j];
      // Only include printable ASCII and common whitespace
      if ((charCode >= 32 && charCode <= 126) || charCode === 10 || charCode === 13 || charCode === 9) {
        content += String.fromCharCode(charCode);
      } else {
        content += ' ';
      }
    }
  }
  
  // Clean up the content
  content = content
    .replace(/\s+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
  
  // Check if content looks like actual text or binary garbage
  const readableRatio = (content.match(/[a-zA-Z]/g) || []).length / content.length;
  console.log(`Readable ratio: ${readableRatio.toFixed(2)}`);
  
  if (readableRatio < 0.3 || content.includes('endstream') || content.includes('FlateDecode')) {
    // Content is mostly binary/encoded, use AI to extract
    console.log('Content appears encoded, using AI extraction...');
    return await extractWithAI(content, filename, apiKey);
  }
  
  // Content looks readable, but still clean it up with AI for better results
  if (lowerFilename.endsWith('.pdf') || lowerFilename.endsWith('.docx')) {
    return await extractWithAI(content, filename, apiKey);
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

    // Extract text from file using AI when needed
    console.log(`Extracting text from: ${filename}`);
    let extractedText: string;
    
    try {
      extractedText = await extractText(file_url, filename, lovableApiKey);
    } catch (extractError) {
      console.error('Text extraction error:', extractError);
      throw new Error(`Could not extract content from ${filename}. Please try uploading as a .txt file.`);
    }
    
    console.log(`Extracted ${extractedText.length} characters of meaningful content`);

    // Chunk the text
    const chunks = chunkText(extractedText);
    console.log(`Created ${chunks.length} content chunks`);

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
      console.log(`Inserted batch, total: ${insertedCount}`);
    }

    console.log(`Successfully stored ${insertedCount} content chunks`);

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
        message: `Successfully processed ${filename} - ${insertedCount} content chunks created` 
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
