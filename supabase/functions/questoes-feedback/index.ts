import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tipo, user_id, user_name } = await req.json();
    if (!user_id || !tipo) {
      return new Response(JSON.stringify({ error: "Missing tipo or user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user stats
    const { data: stats } = await supabase
      .from("user_questoes_stats")
      .select("area, tema, acertos, erros, ultima_resposta")
      .eq("user_id", user_id);

    if (!stats || stats.length === 0) {
      return new Response(
        JSON.stringify({ resposta: "Você ainda não respondeu questões suficientes para gerar um feedback. Comece praticando! 🎯" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Aggregate stats
    const areaMap = new Map<string, { acertos: number; erros: number }>();
    let totalAcertos = 0, totalErros = 0;

    stats.forEach((s: any) => {
      const a = s.acertos || 0, e = s.erros || 0;
      totalAcertos += a;
      totalErros += e;
      const ex = areaMap.get(s.area);
      if (ex) { ex.acertos += a; ex.erros += e; }
      else areaMap.set(s.area, { acertos: a, erros: e });
    });

    const total = totalAcertos + totalErros;
    const taxaGlobal = total > 0 ? Math.round((totalAcertos / total) * 100) : 0;

    // Build area summary
    const areaSummary = Array.from(areaMap.entries())
      .map(([area, v]) => {
        const t = v.acertos + v.erros;
        const pct = t > 0 ? Math.round((v.acertos / t) * 100) : 0;
        return { area, pct, total: t, acertos: v.acertos };
      })
      .sort((a, b) => b.total - a.total);

    const fortes = areaSummary.filter(a => a.pct >= 70 && a.total >= 5);
    const fracos = areaSummary.filter(a => a.pct < 50 && a.total >= 5);

    const nomeAluno = user_name || "Aluno(a)";

    const statsContext = `
Dados do aluno (${nomeAluno}):
- Total respondidas: ${total}
- Acertos: ${totalAcertos} (${taxaGlobal}%)
- Erros: ${totalErros}
- Áreas praticadas: ${areaSummary.length}

Desempenho por área:
${areaSummary.map(a => `- ${a.area}: ${a.pct}% (${a.total} questões)`).join("\n")}

Pontos fortes (≥70%): ${fortes.length > 0 ? fortes.map(f => f.area).join(", ") : "Nenhum ainda"}
Pontos fracos (<50%): ${fracos.length > 0 ? fracos.map(f => `${f.area} (${f.pct}%)`).join(", ") : "Nenhum"}
`;

    const promptMap: Record<string, string> = {
      resumo: `Dê um resumo de UMA FRASE CURTA (máximo 25 palavras) sobre o estado atual deste aluno. Sem markdown, sem emojis, sem formatação. Apenas texto puro direto e motivador. Exemplo: "Você está indo bem em Penal, mas Constitucional precisa de atenção."`,
      geral: `Faça uma análise geral e concisa do desempenho deste aluno de Direito em questões. Dê um panorama motivador, destacando pontos positivos e o que precisa melhorar. Use emojis e markdown. Máximo 200 palavras.`,
      estudar: `Com base no desempenho, sugira as 3 áreas mais importantes para o aluno focar nos próximos estudos, justificando brevemente. Priorize áreas com taxa baixa ou poucas questões respondidas. Use emojis e markdown. Máximo 150 palavras.`,
      fortes: `Destaque os pontos fortes deste aluno com base nas áreas com melhor taxa de acerto. Seja motivador e específico. Se não houver pontos fortes claros, incentive o aluno a continuar praticando. Use emojis e markdown. Máximo 150 palavras.`,
      melhorar: `Identifique as áreas onde o aluno mais precisa melhorar, com base nas taxas de acerto mais baixas. Dê dicas práticas e motivadoras para cada área. Use emojis e markdown. Máximo 150 palavras.`,
      dica: `Dê uma dica prática e motivadora de estudo para este aluno de Direito, baseada no seu desempenho atual. Pode sugerir técnicas de estudo, rotina, ou estratégias específicas para as áreas fracas. Use emojis e markdown. Máximo 120 palavras.`,
      diagnostico: `Você é a Dra. Arabella, tutora jurídica pessoal de ${nomeAluno}. Gere um DIAGNÓSTICO COMPLETO e DETALHADO do desempenho do(a) aluno(a) em questões de Direito.

Estruture assim com markdown:

### 🎯 Visão Geral
Panorama rápido e motivador do estado atual de ${nomeAluno}. Cite o nome dele(a).

### 💪 Pontos Fortes
Destaque as áreas com melhor taxa de acerto. Use **negrito** nos nomes das áreas e percentuais importantes. Seja específico.

### ⚠️ Pontos de Atenção
Áreas que precisam de reforço, com **negrito** nos termos-chave. Explique por que cada uma precisa de atenção.

### 📚 Plano de Ação
3-4 ações concretas e priorizadas para melhorar. Numere-as. Use **negrito** para destacar as matérias citadas.

### 💡 Dica Especial
Uma dica personalizada de estudo baseada no perfil de ${nomeAluno}. Pode incluir técnicas como revisão espaçada, mapas mentais, etc.

Use **negrito** generosamente para destacar termos-chave, percentuais e áreas do direito. Use emojis com moderação. Seja motivador mas realista. Máximo 400 palavras.`,
    };

    const userPrompt = promptMap[tipo] || promptMap.geral;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Você é a Dra. Arabella, uma tutora jurídica especializada em análise de desempenho em questões de Direito para concursos e OAB. Responda sempre em português brasileiro. Seja concisa, direta e motivadora. Use markdown para formatação.`,
          },
          {
            role: "user",
            content: `${statsContext}\n\n${userPrompt}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const text = await aiResponse.text();
      console.error("AI error:", status, text);
      
      if (status === 429) {
        return new Response(
          JSON.stringify({ resposta: "O serviço está temporariamente sobrecarregado. Tente novamente em alguns segundos. ⏳" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ resposta: "Créditos de IA esgotados. Tente novamente mais tarde." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ resposta: "Não foi possível gerar o feedback agora. Tente novamente." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const resposta = aiData.choices?.[0]?.message?.content || "Feedback indisponível no momento.";

    return new Response(
      JSON.stringify({ resposta }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("questoes-feedback error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
