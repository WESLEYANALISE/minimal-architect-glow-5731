import { useState, useEffect } from "react";
import { MessageCircle, Mic, FileText, BookOpen, Video, Brain, Scale, Sparkles, Check, User, ArrowRight, ExternalLink, Play, Settings, Edit, Crown, Lock, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cadastrarUsuarioEvelyn } from "@/lib/api/evelynApi";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PhoneInput } from "@/components/PhoneInput";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";

const funcionalidades = [
  {
    icon: MessageCircle,
    titulo: "Tirar Dúvidas Jurídicas",
    descricao: "Pergunte sobre qualquer área do Direito"
  },
  {
    icon: Mic,
    titulo: "Transcrever Áudios",
    descricao: "Envie áudios e receba transcrição + resposta"
  },
  {
    icon: FileText,
    titulo: "Analisar Documentos",
    descricao: "Envie PDFs e imagens para análise"
  },
  {
    icon: Scale,
    titulo: "Consultar Artigos de Lei",
    descricao: "Busca artigos com narração em áudio"
  },
  {
    icon: Brain,
    titulo: "Quiz",
    descricao: "Estude com questões interativas"
  },
  {
    icon: Video,
    titulo: "Vídeo-aulas",
    descricao: "Receba vídeos sobre o tema"
  },
  {
    icon: BookOpen,
    titulo: "Livros e PDFs",
    descricao: "Biblioteca com +490 materiais"
  },
  {
    icon: Sparkles,
    titulo: "Fazer Petições",
    descricao: "Ajuda a criar documentos jurídicos"
  }
];

// Funções da Evelyn para o carrossel com ícones
const funcoesCarrossel = [
  { icon: MessageCircle, titulo: "Tirar Dúvidas Jurídicas" },
  { icon: Mic, titulo: "Transcrever Áudios" },
  { icon: FileText, titulo: "Analisar PDFs e Documentos" },
  { icon: Scale, titulo: "Consultar Artigos de Lei" },
  { icon: Brain, titulo: "Quiz e Questões" },
  { icon: Video, titulo: "Enviar Vídeo-aulas" },
  { icon: BookOpen, titulo: "Acessar +490 Livros" },
  { icon: Sparkles, titulo: "Fazer Petições com IA" },
];

const WHATSAPP_NUMBER = "5511940432865";
const VIDEO_ID = "HlE9u1c_MPQ";
const VIDEO_URL = `https://www.youtube.com/embed/${VIDEO_ID}`;
const THUMBNAIL_URL = `https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`;

type TrialState = 'loading' | 'premium' | 'trial_active' | 'trial_not_started' | 'trial_expired';

const Evelyn = () => {
  const { user } = useAuth();
  const { isPremium, hasEvelynAccess, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [cadastrado, setCadastrado] = useState(false);
  const [currentPropositoIndex, setCurrentPropositoIndex] = useState(0);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [hasProfilePhone, setHasProfilePhone] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(true); // Auto-play video on entry
  const [trialState, setTrialState] = useState<TrialState>('loading');
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);

  // Fetch profile data and trial status
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfileLoaded(true);
        setTrialState('trial_not_started');
        return;
      }
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('nome, telefone')
          .eq('id', user.id)
          .single();
        
        if (data) {
          if (data.nome) setNome(data.nome);
          if (data.telefone) {
            setTelefone(data.telefone);
            setHasProfilePhone(true);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setProfileLoaded(true);
      }
    };
    
    fetchProfile();
  }, [user]);

  // Determine access state - Evelyn is premium-only now
  useEffect(() => {
    if (!profileLoaded) return;
    
    if (isPremium || hasEvelynAccess) {
      setTrialState('premium');
    } else {
      setTrialState('trial_expired');
    }
  }, [profileLoaded, hasEvelynAccess, isPremium]);

  // Carrossel infinito de funções
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPropositoIndex((prev) => (prev + 1) % funcoesCarrossel.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCadastro = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!nome.trim() || nome.trim().length < 2) {
      toast.error("Digite seu nome completo");
      return;
    }
    
    if (telefone.replace(/\D/g, '').length < 10) {
      toast.error("Digite um telefone válido");
      return;
    }
    
    setLoading(true);
    
    try {
      const resultado = await cadastrarUsuarioEvelyn(nome.trim(), telefone);
      toast.success(resultado.message);
      setCadastrado(true);
      
      // Send first welcome message via edge function
      const phoneClean = telefone.replace(/\D/g, '');
      const phoneWithCountry = phoneClean.startsWith('55') ? phoneClean : `55${phoneClean}`;
      
      try {
        const { data: instanceData } = await supabase
          .from('evelyn_conversas')
          .select('instance_name')
          .eq('telefone', phoneWithCountry)
          .maybeSingle();
        
        const instanceName = instanceData?.instance_name || 'direitopremium';
        
        let conversaId = null;
        const { data: conversa } = await supabase
          .from('evelyn_conversas')
          .select('id')
          .eq('telefone', phoneWithCountry)
          .maybeSingle();
        
        if (conversa) {
          conversaId = conversa.id;
        } else {
          const { data: novaConversa } = await supabase
            .from('evelyn_conversas')
            .insert({
              telefone: phoneWithCountry,
              instance_name: instanceName,
            })
            .select('id')
            .single();
          conversaId = novaConversa?.id;
        }
        
        const mensagemBoasVindas = `Olá, ${nome.trim()}! 😊 Sou a sua *Assistente Jurídica* no WhatsApp.\n\nVocê tem um *teste gratuito de 3 dias*! 🎉\n\nMe pergunte qualquer coisa sobre Direito — posso analisar documentos, tirar dúvidas, enviar vídeo-aulas e muito mais!`;
        
        await supabase.functions.invoke('evelyn-enviar-mensagem', {
          body: {
            instanceName,
            telefone: phoneWithCountry,
            mensagem: mensagemBoasVindas,
            conversaId,
          }
        });
        
        toast.success("A Assistente vai te enviar uma mensagem no WhatsApp! 🎉");
      } catch (msgError) {
        console.error('Erro ao enviar mensagem de boas-vindas:', msgError);
      }
      
      setTrialState('trial_active');
      setTrialDaysLeft(3);
      setHasProfilePhone(true);
    } catch (error: any) {
      toast.error(error.message || "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  };

  const abrirWhatsApp = () => {
    const mensagem = encodeURIComponent("Olá Assistente! 👋");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensagem}`, '_blank');
  };

  const handleAcessarAgora = () => {
    abrirWhatsApp();
  };

  // Página da Evelyn é livre para todos — gate premium é no WhatsApp

  return (
    <div className="flex flex-col min-h-screen bg-background lg:items-center lg:justify-center lg:p-8">
      {/* Background gradient — cinza neutro */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background pointer-events-none" />

      {/* Header com botão voltar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3 max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Assistente</h1>
        </div>
      </div>

      <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-6 relative lg:max-w-3xl lg:mx-auto lg:w-full">
        {/* Hero Section — sem ícone, com descrição */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-foreground">Assistente</h1>
          <p className="text-muted-foreground">Sua Assistente Jurídica no WhatsApp</p>
          <p className="text-sm text-muted-foreground/80 max-w-sm mx-auto leading-relaxed">
            Tire dúvidas, analise documentos, estude com flashcards, receba vídeo-aulas e muito mais — tudo pelo WhatsApp, 24h por dia.
          </p>
        </div>

        {/* Menu Principal com Tabs */}
        <Tabs defaultValue="acessar" className="w-full max-w-2xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="acessar" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-semibold">
              <MessageCircle className="w-4 h-4 mr-2" />
              Acessar
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-semibold">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Aba Acessar Agora */}
          <TabsContent value="acessar" className="space-y-6">
            {/* Vídeo de Apresentação — auto-play */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Play className="w-5 h-5 text-accent" />
                Conheça a Assistente
              </h2>
              
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-900 shadow-xl ring-1 ring-white/10">
                {videoPlaying ? (
                  <iframe
                    src={`${VIDEO_URL}?autoplay=1&mute=0`}
                    title="Apresentação Evelyn"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : (
                  <button
                    onClick={() => setVideoPlaying(true)}
                    className="w-full h-full relative group cursor-pointer"
                  >
                    <img
                      src={THUMBNAIL_URL}
                      alt="Apresentação Evelyn"
                      className="w-full h-full object-cover"
                      loading="eager"
                      decoding="sync"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Botão Acessar */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                Tire dúvidas, analise documentos, estude com flashcards e muito mais. 
                Tudo pelo WhatsApp, 24 horas por dia!
              </p>
              
              {trialState === 'premium' || hasEvelynAccess ? (
                <Button 
                  onClick={abrirWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg px-6 py-3 h-12 font-bold"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Acessar agora
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              ) : trialState === 'trial_active' ? (
                <Button 
                  onClick={abrirWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg px-6 py-3 h-12 font-bold"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Acessar agora
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              ) : trialState === 'trial_expired' ? (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-1.5 rounded-full text-sm font-medium">
                    <AlertCircle className="w-4 h-4" />
                    Teste gratuito expirado
                  </div>
                  <Button 
                    onClick={() => navigate('/assinatura')}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg px-6 py-3 h-12"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Assinar para continuar
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Assine o Direito Premium para ter acesso ilimitado à Assistente
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button 
                    onClick={handleAcessarAgora}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg px-6 py-3 h-12 font-bold"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Acessar agora
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Experimente a Assistente gratuitamente! Ela entende áudio, texto, imagem e PDF.
                  </p>
                </div>
              )}
            </div>

            {/* Carrossel de Funções com Ícones */}
            <div className="overflow-hidden py-4">
              <div className="relative h-16 flex items-center justify-center">
                <div className="absolute flex items-center gap-3">
                  {(() => {
                    const funcao = funcoesCarrossel[currentPropositoIndex];
                    const IconComponent = funcao.icon;
                    return (
                      <>
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-medium text-foreground">
                          {funcao.titulo}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              <div className="flex justify-center gap-1.5 mt-3">
                {funcoesCarrossel.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                      index === currentPropositoIndex 
                        ? "bg-foreground w-4" 
                        : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Funcionalidades */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                O que a Evelyn faz
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {funcionalidades.map((func) => (
                  <Card key={func.titulo} className="h-full hover:border-border transition-colors">
                    <CardContent className="p-3 text-center space-y-2">
                      <div className="mx-auto w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <func.icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <h3 className="text-xs font-medium text-foreground leading-tight">{func.titulo}</h3>
                      <p className="text-xs text-muted-foreground leading-tight">{func.descricao}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Aba Configurações */}
          <TabsContent value="configuracoes" className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-semibold">Seus Dados</h3>
                </div>
                
                {cadastrado ? (
                  <div className="text-center space-y-4 py-4">
                    <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <Check className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Cadastro Realizado!</h3>
                      <p className="text-sm text-muted-foreground">Agora é só conversar com a Evelyn no WhatsApp</p>
                    </div>
                    <Button 
                      onClick={abrirWhatsApp}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Conversar no WhatsApp
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ) : hasProfilePhone && !isEditing ? (
                  <div className="space-y-4 py-2">
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Nome</p>
                          <p className="font-medium">{nome}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">WhatsApp</p>
                          <p className="font-medium">
                            +{telefone.slice(0, 2)} ({telefone.slice(2, 4)}) {telefone.slice(4, 9)}-{telefone.slice(9)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="w-full"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar número
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {hasProfilePhone 
                        ? "Informe o novo número para a Evelyn"
                        : "Informe seu nome e telefone para liberar o acesso"
                      }
                    </p>
                    
                    <form onSubmit={handleCadastro} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome-config" className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Nome completo
                        </Label>
                        <Input
                          id="nome-config"
                          placeholder="Digite seu nome"
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          Telefone (WhatsApp)
                        </Label>
                        <PhoneInput
                          value={telefone}
                          onChange={(_, fullNumber) => setTelefone(fullNumber)}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        {hasProfilePhone && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                          >
                            Voltar
                          </Button>
                        )}
                        <Button 
                          type="submit" 
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={loading}
                        >
                          {loading ? (
                            "Salvando..."
                          ) : (
                            <>
                              Salvar
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Evelyn;
