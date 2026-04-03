import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ valido: false, motivo: 'E-mail não informado.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailTrimmed = email.trim().toLowerCase();

    // Timeout de 5 segundos — fail-open se a API estiver fora do ar
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    let apiData: Record<string, unknown> | null = null;

    try {
      const url = `https://rapid-email-verifier.fly.dev/api/validate?email=${encodeURIComponent(emailTrimmed)}`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (response.ok) {
        apiData = await response.json();
      }
    } catch (fetchErr) {
      clearTimeout(timeout);
      // API fora do ar ou timeout → fail-open (deixa o cadastro prosseguir)
      console.warn('verificar-email: API indisponível, fail-open.', fetchErr);
      return new Response(
        JSON.stringify({ valido: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // API retornou dados — aplicar lógica de validação
    if (apiData) {
      if (apiData.is_valid_format === false) {
        return new Response(
          JSON.stringify({ valido: false, motivo: 'O formato deste e-mail é inválido.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (apiData.is_disposable === true) {
        return new Response(
          JSON.stringify({ valido: false, motivo: 'E-mails temporários não são aceitos. Use seu e-mail real.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (apiData.mx_records_found === false) {
        return new Response(
          JSON.stringify({ valido: false, motivo: 'O domínio deste e-mail não existe.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (apiData.deliverable === false) {
        return new Response(
          JSON.stringify({ valido: false, motivo: 'Este e-mail não parece existir. Verifique e tente novamente.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Tudo ok
    return new Response(
      JSON.stringify({ valido: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('verificar-email: erro inesperado:', err);
    // Fail-open em caso de erro interno
    return new Response(
      JSON.stringify({ valido: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
