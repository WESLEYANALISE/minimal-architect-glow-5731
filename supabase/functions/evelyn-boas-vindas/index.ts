import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Perfil = 'estudante' | 'concurseiro' | 'advogado';

// Templates de texto por perfil (em tópicos)
function gerarMensagemPorPerfil(perfil: Perfil, primeiroNome: string): string {
  switch (perfil) {
    case 'estudante':
      return `Olá, *${primeiroNome}*! 👋 Que alegria ter você aqui!

Eu sou a *Evelyn*, sua assistente jurídica do *Direito Premium*! 🎓

✨ *Fiz isso pensando em você, estudante de Direito:*

📚 *Leitura de PDFs* - Me manda o material da faculdade que eu leio e resumo pra você
🎧 *Áudios* - Pode falar comigo por áudio, eu entendo e respondo
📝 *Resumos* - Transformo qualquer tema em resumo prático
⚖️ *Artigos de Lei* - Explico artigos de forma simples com exemplos
🧠 *Quiz* - Fixe o conteúdo com questões interativas
📖 *+490 livros* - Biblioteca jurídica completa

🎁 *Teste grátis por 3 dias!*

💬 Manda um "oi" e começa agora!`;

    case 'concurseiro':
      return `Olá, *${primeiroNome}*! 👋 Preparado pra passar?

Eu sou a *Evelyn*, e minha missão é te ajudar a *CONQUISTAR SUA VAGA*! 🏆

✨ *Ferramentas que vão acelerar sua aprovação:*

📊 *Simulados* - Questões no estilo da banca
🧠 *Quiz diário* - Fixação com método ativo
⚖️ *Leis atualizadas* - Sempre na versão mais recente
📝 *Resumos direcionados* - Foco no que cai na prova
🎧 *Estude por áudio* - Aproveite deslocamentos
📚 *Flashcards* - Revisão espaçada inteligente
📖 *+490 livros* - Material de apoio completo

🎁 *3 dias grátis para testar tudo!*

💬 Manda um "oi" e bora passar!`;

    case 'advogado':
      return `Olá, *${primeiroNome}*! 👋 Prazer em conhecê-lo(a)!

Eu sou a *Evelyn*, assistente jurídica do *Direito Premium*! ⚖️

✨ *Como posso facilitar seu dia a dia:*

📄 *Petições* - Gero petições com base no seu caso
📋 *Contratos* - Modelos e análise de cláusulas
⚖️ *Leis atualizadas* - Artigos sempre na versão vigente
🔍 *Jurisprudência* - Busca de decisões relevantes
📚 *Análise de documentos* - Me manda PDFs que eu analiso
🎧 *Áudios* - Pode falar comigo, eu transcrevo e respondo
🧾 *Cálculos jurídicos* - Trabalhistas, cíveis e mais

🎁 *Experimente grátis por 3 dias!*

💬 Manda um "oi" e simplifica sua rotina!`;
  }
}

// Script SSML do áudio explicativo do app (SEGUNDO ÁUDIO - focado em quiz, questões, app)
const SCRIPT_EXPLICACAO_APP = `<speak>
  <prosody rate="1.15" pitch="+1.5st">
    Agora deixa eu te contar sobre as funcionalidades do app Direito Premium!
  </prosody>
  <break time="200ms"/>
  <prosody rate="1.15" pitch="+1.5st">
    Temos mais de setenta mil questões de concursos e OAB, todas comentadas! 
    <break time="80ms"/>
    Você pode fazer simulados personalizados, filtrar por banca, por ano, por assunto... 
    <break time="80ms"/>
    E tem estatísticas pra você acompanhar sua evolução!
  </prosody>
  <break time="300ms"/>
  <prosody rate="1.15" pitch="+1.5st">
    O app tem o maior Vade Mecum completo do Brasil! 
    <break time="80ms"/>
    São todas as leis e códigos organizados, com narração em áudio!
  </prosody>
  <break time="300ms"/>
  <prosody rate="1.15" pitch="+1.5st">
    Tem uma biblioteca com mais de mil livros jurídicos, 
    <break time="80ms"/>
    e cursos com aulas interativas sobre todas as áreas do direito!
  </prosody>
  <break time="300ms"/>
  <prosody rate="1.15" pitch="+1.5st">
    Além disso, flashcards pra memorizar conteúdo, 
    <break time="80ms"/>
    quizzes rápidos, 
    <break time="80ms"/>
    e documentários jurídicos pra aprender se divertindo!
  </prosody>
  <break time="300ms"/>
  <prosody rate="1.15" pitch="+2st">
    <emphasis level="strong">Tudo isso está nas suas mãos agora!</emphasis>
    <break time="100ms"/>
    Explora o app e aproveita!
  </prosody>
  <break time="150ms"/>
  <prosody rate="1.15" pitch="+2.5st">
    Qualquer dúvida, é só me chamar aqui no WhatsApp!
  </prosody>
</speak>`;

// Scripts SSML de áudio por perfil (PRIMEIRO ÁUDIO - focado na Evelyn e suas funções)
function gerarScriptPorPerfil(perfil: Perfil, primeiroNome: string): string {
  switch (perfil) {
    case 'estudante':
      return `<speak>
  <prosody rate="1.12" pitch="+2st">
    Oi, ${primeiroNome}! Que alegria ter você aqui!
  </prosody>
  <break time="150ms"/>
  <prosody rate="1.12" pitch="+1.5st">
    Eu sou a Evelyn, sua assistente jurídica inteligente do Direito Premium!
    <break time="100ms"/>
    Deixa eu te explicar tudo que eu posso fazer por você!
  </prosody>
  <break time="200ms"/>
  <prosody rate="1.12" pitch="+1.5st">
    Primeiro: você pode me mandar qualquer PDF da faculdade, 
    <break time="60ms"/>
    apostilas, livros, materiais de aula... 
    <break time="60ms"/>
    Eu leio tudo e faço resumos completos pra você estudar!
  </prosody>
  <break time="200ms"/>
  <prosody rate="1.12" pitch="+1.5st">
    Também entendo áudios! Pode gravar sua dúvida falando que eu respondo.
    <break time="80ms"/>
    E se quiser que eu explique um artigo de lei, é só me pedir!
    <break time="80ms"/>
    Eu explico de forma simples, com exemplos práticos do dia a dia.
  </prosody>
  <break time="200ms"/>
  <prosody rate="1.12" pitch="+1.5st">
    Posso fazer resumos de qualquer tema jurídico,
    <break time="60ms"/>
    tirar dúvidas sobre qualquer matéria,
    <break time="60ms"/>
    e até analisar imagens de documentos que você me enviar!
  </prosody>
  <break time="200ms"/>
  <prosody rate="1.12" pitch="+2st">
    <emphasis level="strong">Você tem três dias grátis pra testar tudo isso!</emphasis>
  </prosody>
  <break time="150ms"/>
  <prosody rate="1.12" pitch="+2.5st">
    Manda um oi aqui e bora arrasar nas provas!
  </prosody>
</speak>`;

    case 'concurseiro':
      return `<speak>
  <prosody rate="1.12" pitch="+2st">
    Oi, ${primeiroNome}! Tudo pronto pra conquistar sua vaga?
  </prosody>
  <break time="150ms"/>
  <prosody rate="1.12" pitch="+1.5st">
    Eu sou a Evelyn, sua assistente jurídica inteligente!
    <break time="100ms"/>
    Vou te mostrar como posso acelerar seus estudos!
  </prosody>
  <break time="200ms"/>
  <prosody rate="1.12" pitch="+1.5st">
    Pode me mandar PDFs de apostilas, editais, materiais de cursinhos...
    <break time="60ms"/>
    Eu leio, resumo e destaco o que é mais importante pra sua prova!
  </prosody>
  <break time="200ms"/>
  <prosody rate="1.12" pitch="+1.5st">
    Também entendo áudios! Pode me perguntar qualquer coisa falando.
    <break time="80ms"/>
    E se precisar de explicação de artigos de lei, eu explico detalhadamente,
    <break time="60ms"/>
    com a forma que mais cai em concurso!
  </prosody>
  <break time="200ms"/>
  <prosody rate="1.12" pitch="+1.5st">
    Faço resumos direcionados pra qualquer tema,
    <break time="60ms"/>
    analiso documentos e imagens,
    <break time="60ms"/>
    e tiro todas as suas dúvidas jurídicas na hora!
  </prosody>
  <break time="200ms"/>
  <prosody rate="1.12" pitch="+2st">
    <emphasis level="strong">Você tem três dias grátis pra testar!</emphasis>
  </prosody>
  <break time="150ms"/>
  <prosody rate="1.12" pitch="+2.5st">
    Manda um oi e bora rumo à aprovação!
  </prosody>
</speak>`;

    case 'advogado':
      return `<speak>
  <prosody rate="1.12" pitch="+1.5st">
    Olá, ${primeiroNome}! Prazer em conhecê-lo!
  </prosody>
  <break time="150ms"/>
  <prosody rate="1.12" pitch="+1.5st">
    Eu sou a Evelyn, sua assistente jurídica inteligente!
    <break time="100ms"/>
    Deixa eu te mostrar como posso facilitar sua rotina!
  </prosody>
  <break time="200ms"/>
  <prosody rate="1.12" pitch="+1.5st">
    Pode me mandar qualquer PDF: contratos, petições, documentos de clientes...
    <break time="60ms"/>
    Eu analiso em segundos, destaco cláusulas importantes e identifico riscos!
  </prosody>
  <break time="200ms"/>
  <prosody rate="1.12" pitch="+1.5st">
    Também entendo áudios! Pode me mandar notas de voz com informações do caso
    <break time="60ms"/>
    que eu transcrevo e organizo pra você.
    <break time="80ms"/>
    E se precisar de explicação de artigos, eu explico com jurisprudência atualizada!
  </prosody>
  <break time="200ms"/>
  <prosody rate="1.12" pitch="+1.5st">
    Gero petições, analiso contratos cláusula por cláusula,
    <break time="60ms"/>
    faço cálculos trabalhistas e cíveis,
    <break time="60ms"/>
    e tiro qualquer dúvida jurídica na hora!
  </prosody>
  <break time="200ms"/>
  <prosody rate="1.12" pitch="+2st">
    <emphasis level="strong">Você tem três dias grátis pra experimentar!</emphasis>
  </prosody>
  <break time="150ms"/>
  <prosody rate="1.12" pitch="+2st">
    Manda um oi e simplifica sua rotina jurídica!
  </prosody>
</speak>`;
  }
}

// Função para gerar áudio com Google TTS usando SSML
async function gerarAudioTTS(ssml: string, geminiKey: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { ssml: ssml },
          voice: { 
            languageCode: 'pt-BR', 
            name: 'pt-BR-Chirp3-HD-Aoede' 
          },
          audioConfig: { 
            audioEncoding: 'MP3'
          }
        })
      }
    );

    if (!response.ok) {
      console.error('Erro TTS:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.audioContent; // base64
  } catch (error) {
    console.error('Erro ao gerar áudio TTS:', error);
    return null;
  }
}

// Função para mixar áudio da voz com música de fundo usando Cloudconvert
async function mixarAudioComFundo(
  vozBase64: string,
  musicaUrl: string,
  cloudconvertKey: string
): Promise<string | null> {
  try {
    console.log('Iniciando mixagem de áudio com Cloudconvert...');
    
    const createJobResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cloudconvertKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tasks: {
          'import-voice': {
            operation: 'import/base64',
            file: vozBase64,
            filename: 'voz.mp3'
          },
          'import-music': {
            operation: 'import/url',
            url: musicaUrl
          },
          'mix-audio': {
            operation: 'command',
            input: ['import-voice', 'import-music'],
            engine: 'ffmpeg',
            command: '-i import-voice -i import-music -filter_complex "[1:a]volume=0.12[bg];[0:a][bg]amix=inputs=2:duration=first:dropout_transition=2" -c:a libmp3lame -q:a 2 output.mp3'
          },
          'export-result': {
            operation: 'export/url',
            input: ['mix-audio'],
            inline: false,
            archive_multiple_files: false
          }
        }
      })
    });

    if (!createJobResponse.ok) {
      const errorText = await createJobResponse.text();
      console.error('Erro ao criar job Cloudconvert:', errorText);
      return null;
    }

    const jobData = await createJobResponse.json();
    const jobId = jobData.data.id;
    console.log('Job criado:', jobId);

    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${cloudconvertKey}`
        }
      });

      if (!statusResponse.ok) {
        console.error('Erro ao verificar status do job');
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();
      const status = statusData.data.status;
      
      console.log(`Status do job: ${status} (tentativa ${attempts + 1})`);

      if (status === 'finished') {
        const exportTask = statusData.data.tasks.find((t: any) => t.name === 'export-result');
        if (exportTask && exportTask.result && exportTask.result.files && exportTask.result.files[0]) {
          const audioUrl = exportTask.result.files[0].url;
          console.log('Áudio mixado disponível:', audioUrl);
          return audioUrl;
        }
        console.error('URL do áudio não encontrada no resultado');
        return null;
      } else if (status === 'error') {
        console.error('Job falhou:', JSON.stringify(statusData.data.tasks));
        return null;
      }

      attempts++;
    }

    console.error('Timeout aguardando job do Cloudconvert');
    return null;
  } catch (error) {
    console.error('Erro na mixagem de áudio:', error);
    return null;
  }
}

// Função para upload de áudio para Supabase Storage
async function uploadAudioParaStorage(
  supabase: any, 
  audioBase64: string, 
  telefone: string
): Promise<string | null> {
  try {
    const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
    const fileName = `boas-vindas/${telefone}_${Date.now()}.mp3`;

    const { error: uploadError } = await supabase.storage
      .from('audios')
      .upload(fileName, audioBytes, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Erro ao fazer upload do áudio:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('audios')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Erro no upload do áudio:', error);
    return null;
  }
}

// Função para baixar áudio de URL e fazer upload para Storage
async function baixarEUploadAudio(
  supabase: any,
  audioUrl: string,
  telefone: string
): Promise<string | null> {
  try {
    console.log('Baixando áudio mixado...');
    const response = await fetch(audioUrl);
    if (!response.ok) {
      console.error('Erro ao baixar áudio:', response.status);
      return null;
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);
    const fileName = `boas-vindas/${telefone}_mixado_${Date.now()}.mp3`;

    const { error: uploadError } = await supabase.storage
      .from('audios')
      .upload(fileName, audioBytes, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Erro ao fazer upload do áudio mixado:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('audios')
      .getPublicUrl(fileName);

    console.log('Áudio mixado salvo no Storage:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Erro ao baixar/upload áudio:', error);
    return null;
  }
}

// Função para obter áudio explicativo do app (com cache no Storage)
async function obterAudioExplicacaoApp(
  supabase: any,
  geminiKey: string,
  cloudconvertKey?: string
): Promise<string | null> {
  const caminhoAudio = 'app/evelyn-explicacao-app.mp3';
  
  try {
    // 1. Verificar se já existe no Storage
    const { data: existingFiles } = await supabase.storage
      .from('audios')
      .list('app', { search: 'evelyn-explicacao-app.mp3' });
    
    if (existingFiles && existingFiles.length > 0) {
      const { data: { publicUrl } } = supabase.storage
        .from('audios')
        .getPublicUrl(caminhoAudio);
      console.log('Usando áudio explicativo do cache:', publicUrl);
      return publicUrl;
    }
    
    // 2. Gerar áudio novo com TTS
    console.log('Gerando áudio explicativo do app pela primeira vez...');
    const audioBase64 = await gerarAudioTTS(SCRIPT_EXPLICACAO_APP, geminiKey);
    
    if (!audioBase64) {
      console.error('Falha ao gerar áudio explicativo');
      return null;
    }
    
    // 3. Tentar mixar com música de fundo
    let audioFinalUrl: string | null = null;
    
    if (cloudconvertKey) {
      const musicaFundoUrl = 'https://juridico.lovable.app/audio/assinatura-fundo.mp3';
      console.log('Mixando áudio explicativo com música de fundo...');
      const audioMixadoUrl = await mixarAudioComFundo(audioBase64, musicaFundoUrl, cloudconvertKey);
      
      if (audioMixadoUrl) {
        // Download e upload para Storage
        const response = await fetch(audioMixadoUrl);
        if (response.ok) {
          const audioBuffer = await response.arrayBuffer();
          const audioBytes = new Uint8Array(audioBuffer);
          
          const { error: uploadError } = await supabase.storage
            .from('audios')
            .upload(caminhoAudio, audioBytes, {
              contentType: 'audio/mpeg',
              upsert: true
            });
          
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('audios')
              .getPublicUrl(caminhoAudio);
            audioFinalUrl = publicUrl;
            console.log('Áudio explicativo mixado salvo:', audioFinalUrl);
          }
        }
      }
    }
    
    // 4. Fallback: usar áudio sem mixagem
    if (!audioFinalUrl) {
      console.log('Salvando áudio explicativo sem mixagem (fallback)');
      const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
      
      const { error: uploadError } = await supabase.storage
        .from('audios')
        .upload(caminhoAudio, audioBytes, {
          contentType: 'audio/mpeg',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Erro ao salvar áudio explicativo:', uploadError);
        return null;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('audios')
        .getPublicUrl(caminhoAudio);
      
      audioFinalUrl = publicUrl;
    }
    
    console.log('Áudio explicativo gerado e salvo:', audioFinalUrl);
    return audioFinalUrl;
  } catch (error) {
    console.error('Erro ao obter áudio explicativo:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nome, telefone, userId, perfil } = await req.json();

    if (!nome || !telefone) {
      return new Response(
        JSON.stringify({ error: 'Nome e telefone são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perfil padrão se não especificado
    const perfilUsuario: Perfil = perfil || 'estudante';

    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { getRotatedKeyStrings } = await import("../_shared/gemini-keys.ts");
    const geminiKey = getRotatedKeyStrings()[0] || null;
    const cloudconvertKey = Deno.env.get('CLOUDCONVERT_API_KEY');

    if (!evolutionApiKey || !evolutionApiUrl) {
      console.error('Evolution API não configurada');
      return new Response(
        JSON.stringify({ error: 'Evolution API não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Formatar telefone
    let telefoneFormatado = telefone.replace(/\D/g, '');
    if (!telefoneFormatado.startsWith('55')) {
      telefoneFormatado = '55' + telefoneFormatado;
    }

    const primeiroNome = nome.split(' ')[0];
    const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'direitopremium';
    const sendTextUrl = `${evolutionApiUrl}/message/sendText/${instanceName}`;
    const sendAudioUrl = `${evolutionApiUrl}/message/sendWhatsAppAudio/${instanceName}`;

    console.log(`Enviando boas-vindas para ${telefoneFormatado} (perfil: ${perfilUsuario})`);

    // Gerar mensagem de texto personalizada por perfil
    const mensagemTexto = gerarMensagemPorPerfil(perfilUsuario, primeiroNome);

    // PRIMEIRO: Gerar o áudio (aguardar conclusão antes de enviar texto)
    let audioFinalUrl: string | null = null;
    let audioEnviado = false;

    if (geminiKey) {
      console.log('Gerando áudio personalizado para perfil:', perfilUsuario);
      const scriptSSML = gerarScriptPorPerfil(perfilUsuario, primeiroNome);
      const audioBase64 = await gerarAudioTTS(scriptSSML, geminiKey);

      if (audioBase64) {
        console.log('Áudio TTS gerado com sucesso');
        
        // Tentar mixar com música de fundo se Cloudconvert estiver configurado
        if (cloudconvertKey) {
          const musicaFundoUrl = 'https://juridico.lovable.app/audio/assinatura-fundo.mp3';
          console.log('URL da música de fundo:', musicaFundoUrl);
          
          const audioMixadoUrl = await mixarAudioComFundo(audioBase64, musicaFundoUrl, cloudconvertKey);
          
          if (audioMixadoUrl) {
            audioFinalUrl = await baixarEUploadAudio(supabase, audioMixadoUrl, telefoneFormatado);
          }
        }

        // Se a mixagem falhou ou não está configurada, usar áudio puro
        if (!audioFinalUrl) {
          console.log('Usando áudio sem música de fundo (fallback)');
          audioFinalUrl = await uploadAudioParaStorage(supabase, audioBase64, telefoneFormatado);
        }
      }
    } else {
      console.log('Chave Gemini não configurada, pulando geração de áudio');
    }

    // SEGUNDO: Enviar texto (só após áudio estar pronto ou falhar)
    console.log('Enviando mensagem de texto...');
    const textResponse = await fetch(sendTextUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        number: telefoneFormatado,
        text: mensagemTexto,
      }),
    });

    if (!textResponse.ok) {
      const errorText = await textResponse.text();
      console.error('Erro ao enviar mensagem:', errorText);
      throw new Error(`Falha ao enviar mensagem: ${errorText}`);
    }

    console.log('Mensagem de boas-vindas enviada com sucesso');

    // TERCEIRO: Enviar áudio imediatamente após o texto (sem delay)
    if (audioFinalUrl) {
      console.log('Enviando áudio via WhatsApp...');

      const audioResponse = await fetch(sendAudioUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          number: telefoneFormatado,
          audio: audioFinalUrl,
        }),
      });

      if (audioResponse.ok) {
        console.log('Áudio de boas-vindas enviado com sucesso!');
        audioEnviado = true;
        
        // ========== SEGUNDO ÁUDIO: Explicação do App ==========
        
        // Primeiro, carregar/gerar o áudio (antes de enviar qualquer mensagem)
        if (geminiKey) {
          console.log('Carregando áudio explicativo do app...');
          const audioExplicacaoUrl = await obterAudioExplicacaoApp(
            supabase, 
            geminiKey, 
            cloudconvertKey
          );
          
          // Só enviar texto + áudio se o áudio estiver pronto
          if (audioExplicacaoUrl) {
            // Aguardar 2 segundos após o primeiro áudio
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Enviar texto introdutório
            console.log('Enviando texto introdutório do segundo áudio...');
            await fetch(sendTextUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionApiKey,
              },
              body: JSON.stringify({
                number: telefoneFormatado,
                text: 'Agora vou te mandar um áudio explicando sobre o app, tudo bem? 🎧',
              }),
            });
            
            // Enviar áudio IMEDIATAMENTE após o texto (sem delay)
            console.log('Enviando áudio explicativo do app...');
            const audioAppResponse = await fetch(sendAudioUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionApiKey,
              },
              body: JSON.stringify({
                number: telefoneFormatado,
                audio: audioExplicacaoUrl,
              }),
            });
            
            if (audioAppResponse.ok) {
              console.log('Áudio explicativo do app enviado com sucesso!');
            } else {
              console.error('Erro ao enviar áudio explicativo:', await audioAppResponse.text());
            }
          } else {
            console.error('Não foi possível obter o áudio explicativo');
          }
        }
        
        // ========== FIM SEGUNDO ÁUDIO ==========
        
      } else {
        const audioError = await audioResponse.text();
        console.error('Erro ao enviar áudio:', audioError);
      }
    }

    // 4. Registrar ou atualizar usuário na tabela evelyn_usuarios
    const { error: upsertError } = await supabase
      .from('evelyn_usuarios')
      .upsert({
        telefone: telefoneFormatado,
        nome: nome,
        perfil: perfilUsuario,
        autorizado: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'telefone',
      });

    if (upsertError) {
      console.error('Erro ao registrar usuário Evelyn:', upsertError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Boas-vindas enviada com sucesso',
        telefone: telefoneFormatado,
        perfil: perfilUsuario,
        audioEnviado: audioEnviado
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função evelyn-boas-vindas:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
