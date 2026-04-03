import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function splitIntoChunks(text: string, chunkSize = 500): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > chunkSize && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += ' ' + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texto, pergunta } = await req.json();
    if (!texto || !pergunta) {
      return new Response(JSON.stringify({ error: 'Texto e pergunta são obrigatórios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const apiKey = Deno.env.get('GEMINI_KEY_1');
    if (!apiKey) throw new Error('GEMINI_KEY_1 não configurada');

    const getEmbedding = async (text: string): Promise<number[]> => {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'models/text-embedding-004', content: { parts: [{ text }] } }),
      });
      const data = await res.json();
      return data.embedding?.values || [];
    };

    // 1. Split text into chunks
    const chunks = splitIntoChunks(texto);

    // 2. Embed all chunks + query
    const [queryEmbedding, ...chunkEmbeddings] = await Promise.all([
      getEmbedding(pergunta),
      ...chunks.map(c => getEmbedding(c)),
    ]);

    // 3. Rank by similarity
    const ranked = chunks
      .map((chunk, i) => ({ chunk, score: cosineSimilarity(queryEmbedding, chunkEmbeddings[i]) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // 4. Generate answer with context
    const context = ranked.map(r => r.chunk).join('\n\n');
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Baseado nos seguintes trechos de um documento jurídico:\n\n${context}\n\nResponda à pergunta: "${pergunta}"\n\nSe a resposta não estiver nos trechos, diga que não encontrou informação suficiente.` }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    });
    const data = await res.json();
    const resposta = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta';

    return new Response(JSON.stringify({
      resposta,
      chunks_relevantes: ranked.map(r => ({ texto: r.chunk, similaridade: Math.round(r.score * 100) })),
      total_chunks: chunks.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
