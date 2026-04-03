import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const horario = body.horario || "08:00";

    console.log(`[cron-notificacoes] Executando para horário: ${horario}`);

    // Buscar preferências dos usuários que querem receber via WhatsApp
    const { data: evelynPrefs } = await supabase
      .from("evelyn_preferencias_notificacao")
      .select("*")
      .eq("ativo", true)
      .eq("horario_envio", horario);

    // Buscar preferências da nova tabela
    const { data: userPrefs } = await supabase
      .from("notificacoes_preferencias_usuario")
      .select("*, profiles:user_id(email, telefone)");

    const tipos = [
      "boletim_diario",
      "leis_dia",
      "livro_dia",
      "filme_dia",
      "dica_estudo",
      "novidades",
    ];

    let totalEnviados = 0;
    let totalErros = 0;

    // Para cada tipo, disparar para quem optou
    for (const tipo of tipos) {
      const colunaEvelyn = `receber_${tipo}`;
      const colunaPrefs = `receber_${tipo}`;

      // WhatsApp via Evelyn (tabela antiga)
      const telefonesWpp = (evelynPrefs || [])
        .filter((p: any) => p[colunaEvelyn] === true)
        .map((p: any) => p.telefone)
        .filter(Boolean);

      // WhatsApp via nova tabela
      const telefonesNovaTabela = (userPrefs || [])
        .filter((p: any) => p[colunaPrefs] === true && p.canal_whatsapp === true)
        .map((p: any) => (p as any).profiles?.telefone)
        .filter(Boolean);

      const todosTelefones = [...new Set([...telefonesWpp, ...telefonesNovaTabela])];

      if (todosTelefones.length > 0) {
        try {
          const { data, error } = await supabase.functions.invoke(
            "evelyn-disparar-notificacoes",
            {
              body: { tipo, telefones: todosTelefones },
            }
          );
          if (error) {
            console.error(`Erro ao disparar ${tipo} WhatsApp:`, error);
            totalErros++;
          } else {
            totalEnviados += data?.enviados || 0;
          }
        } catch (err) {
          console.error(`Erro ao disparar ${tipo}:`, err);
          totalErros++;
        }
      }

      // TODO: E-mail e Push serão implementados quando os serviços estiverem configurados
      // Por enquanto, log dos inscritos
      const emailInscritos = (userPrefs || []).filter(
        (p: any) => p[colunaPrefs] === true && p.canal_email === true
      ).length;
      const pushInscritos = (userPrefs || []).filter(
        (p: any) => p[colunaPrefs] === true && p.canal_push === true
      ).length;

      if (emailInscritos > 0) {
        console.log(`[${tipo}] ${emailInscritos} inscritos via e-mail (pendente implementação)`);
      }
      if (pushInscritos > 0) {
        console.log(`[${tipo}] ${pushInscritos} inscritos via push (pendente implementação)`);
      }
    }

    console.log(`[cron-notificacoes] Concluído: ${totalEnviados} enviados, ${totalErros} erros`);

    return new Response(
      JSON.stringify({ success: true, enviados: totalEnviados, erros: totalErros }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[cron-notificacoes] Erro geral:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
