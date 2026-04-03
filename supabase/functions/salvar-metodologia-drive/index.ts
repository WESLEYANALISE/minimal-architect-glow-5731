import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { area, tema, metodo, subtema, pngBase64, pdfBase64 } = await req.json();

    if (!area || !tema) {
      return new Response(JSON.stringify({ error: 'area e tema são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalizar para ASCII - remove acentos e caracteres especiais
    function toAsciiSlug(str: string): string {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '_');
    }

    const areaSlug = toAsciiSlug(area);
    const temaSlug = toAsciiSlug(tema);
    const suffix = subtema ? `-${toAsciiSlug(subtema)}` : '';
    const cleanName = `${(metodo || 'mapamental')}${suffix}`.replace(/[^a-zA-Z0-9_-]/g, '_');

    console.log(`[salvar-metodologia] Uploading to Supabase Storage: ${area} > ${tema} > ${cleanName}`);

    const results: { drive_png_url?: string; drive_pdf_url?: string } = {};

    // Upload PNG
    if (pngBase64) {
      const pngData = Uint8Array.from(atob(pngBase64), c => c.charCodeAt(0));
      const pngPath = `mapas-mentais/${areaSlug}/${temaSlug}/${cleanName}.png`;

      const { error: pngError } = await supabase.storage
        .from('gerador-imagens')
        .upload(pngPath, pngData, { contentType: 'image/png', upsert: true });

      if (pngError) throw new Error(`PNG upload failed: ${pngError.message}`);

      const { data: pngUrl } = supabase.storage
        .from('gerador-imagens')
        .getPublicUrl(pngPath);

      results.drive_png_url = pngUrl.publicUrl;
      console.log(`[salvar-metodologia] PNG: ${results.drive_png_url}`);
    }

    // Upload PDF
    if (pdfBase64) {
      const pdfData = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
      const pdfPath = `mapas-mentais/${areaSlug}/${temaSlug}/${cleanName}.pdf`;

      const { error: pdfError } = await supabase.storage
        .from('gerador-imagens')
        .upload(pdfPath, pdfData, { contentType: 'application/pdf', upsert: true });

      if (pdfError) throw new Error(`PDF upload failed: ${pdfError.message}`);

      const { data: pdfUrl } = supabase.storage
        .from('gerador-imagens')
        .getPublicUrl(pdfPath);

      results.drive_pdf_url = pdfUrl.publicUrl;
      console.log(`[salvar-metodologia] PDF: ${results.drive_pdf_url}`);
    }

    // Update DB with URLs
    if (results.drive_png_url || results.drive_pdf_url) {
      const updateData: Record<string, string> = {};
      if (results.drive_png_url) updateData.drive_png_url = results.drive_png_url;
      if (results.drive_pdf_url) updateData.drive_pdf_url = results.drive_pdf_url;

      await supabase
        .from('METODOLOGIAS_GERADAS')
        .update(updateData)
        .eq('area', area)
        .eq('tema', tema)
        .eq('subtema', subtema || '')
        .eq('metodo', metodo || 'mapamental');
    }

    console.log(`[salvar-metodologia] ✅ Success`);
    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[salvar-metodologia] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
