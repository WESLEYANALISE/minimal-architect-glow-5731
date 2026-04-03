import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Mail, Phone, User, MapPin, Flag, Building2, GraduationCap, 
  Calendar, Users, Briefcase, BadgeCheck, DoorOpen, TrendingUp,
  Heart, Globe, ExternalLink, Scale, UserCheck, Landmark
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { DespesaCard } from "@/components/DespesaCard";
import { GraficoEvolucaoGastos } from "@/components/GraficoEvolucaoGastos";
import { useDeputadoFavorito } from "@/hooks/useDeputadoFavorito";
import { useAuth } from "@/contexts/AuthContext";

const CACHE_KEY = 'cache_deputado_detalhes_v2';
const CACHE_DURATION = 30 * 60 * 1000;

const CamaraDeputadoDetalhes = () => {
  const { id } = useParams();
  const deputadoId = Number(id) || 0;
  const [loading, setLoading] = useState(true);
  const [loadingDespesas, setLoadingDespesas] = useState(false);
  const [deputado, setDeputado] = useState<any>(null);
  const [orgaos, setOrgaos] = useState<any[]>([]);
  const [frentes, setFretes] = useState<any[]>([]);
  const [profissoes, setProfissoes] = useState<any[]>([]);
  const [ocupacoes, setOcupacoes] = useState<any[]>([]);
  const [despesas, setDespesas] = useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isFavorited, toggle, isLoading: favLoading } = useDeputadoFavorito(deputadoId);

  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      carregarDetalhes();
      carregarDespesas();
    }
  }, [id]);

  const carregarDetalhes = async () => {
    const cacheKey = `${CACHE_KEY}_${id}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION && data?.deputado) {
          setDeputado(data.deputado);
          setOrgaos(data.orgaos || []);
          setFretes(data.frentes || []);
          setProfissoes(data.profissoes || []);
          setOcupacoes(data.ocupacoes || []);
          setLoading(false);
          return;
        }
      } catch {}
    }

    try {
      const { data, error } = await supabase.functions.invoke("detalhes-deputado", {
        body: { idDeputado: id }
      });
      if (error) throw error;
      
      setDeputado(data.deputado);
      setOrgaos(data.orgaos || []);
      setFretes(data.frentes || []);
      setProfissoes(data.profissoes || []);
      setOcupacoes(data.ocupacoes || []);
      
      localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (error: any) {
      console.error("Erro ao carregar:", error);
      toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const carregarDespesas = async () => {
    if (!id) return;
    setLoadingDespesas(true);
    try {
      const anoAtual = new Date().getFullYear();
      const { data, error } = await supabase.functions.invoke("deputado-despesas", {
        body: { idDeputado: id, ano: anoAtual }
      });
      if (error) throw error;
      setDespesas(data.despesas || []);
    } catch (error: any) {
      toast({ title: "Erro ao carregar despesas", description: error.message, variant: "destructive" });
    } finally {
      setLoadingDespesas(false);
    }
  };

  const handleFavorite = () => {
    if (!user) {
      toast({ title: "Faça login para favoritar", variant: "destructive" });
      return;
    }
    const status = deputado?.ultimoStatus;
    toggle({
      nome: deputado?.nomeCivil || status?.nomeEleitoral,
      partido: status?.siglaPartido,
      uf: status?.siglaUf,
      foto: status?.urlFoto,
    });
  };

  if (loading) return <ContentGenerationLoader message="Carregando dados do deputado..." />;

  if (!deputado) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto">
        <p className="text-center text-muted-foreground">Deputado não encontrado</p>
      </div>
    );
  }

  const status = deputado.ultimoStatus;
  const gabinete = status?.gabinete;

  // Filter active organs (commissions)
  const orgaosAtivos = orgaos.filter((o: any) => !o.dataFim);
  const orgaosAntigos = orgaos.filter((o: any) => o.dataFim).slice(0, 5);

  return (
    <div className="px-3 py-2 max-w-4xl mx-auto pb-20 space-y-3">
      {/* Card Principal - Hero */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-4">
          <div className="flex gap-4">
            {status?.urlFoto ? (
              <img
                src={status.urlFoto}
                alt={deputado.nomeCivil}
                className="w-24 h-28 rounded-xl object-cover flex-shrink-0 shadow-lg ring-2 ring-background/50"
              />
            ) : (
              <div className="w-24 h-28 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <User className="w-12 h-12 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="text-lg font-bold leading-tight">{deputado.nomeCivil}</h1>
                  {status?.nomeEleitoral && status.nomeEleitoral !== deputado.nomeCivil && (
                    <p className="text-xs text-muted-foreground mt-0.5">Nome parlamentar: {status.nomeEleitoral}</p>
                  )}
                </div>
                <button
                  onClick={handleFavorite}
                  disabled={favLoading}
                  className="p-2 rounded-full transition-all hover:scale-110 active:scale-95 flex-shrink-0"
                >
                  <Heart className={`w-5 h-5 transition-colors ${isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs font-medium">
                  <Flag className="w-3 h-3" />
                  {status?.siglaPartido}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                  <MapPin className="w-3 h-3" />
                  {status?.siglaUf}
                </span>
                {status?.situacao && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                    <BadgeCheck className="w-3 h-3" />
                    {status.situacao}
                  </span>
                )}
              </div>

              {status?.condicaoEleitoral && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {status.condicaoEleitoral} • {status.idLegislatura}ª Legislatura
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Informações Pessoais */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Informações Pessoais
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {deputado.cpf && (
              <InfoItem icon={UserCheck} label="CPF" value={`***.***.${deputado.cpf.slice(-6, -3)}-${deputado.cpf.slice(-2)}`} />
            )}
            {deputado.dataNascimento && (
              <InfoItem icon={Calendar} label="Nascimento" value={new Date(deputado.dataNascimento).toLocaleDateString('pt-BR')} />
            )}
            {deputado.municipioNascimento && (
              <InfoItem icon={MapPin} label="Naturalidade" value={`${deputado.municipioNascimento}/${deputado.ufNascimento}`} />
            )}
            {deputado.escolaridade && (
              <InfoItem icon={GraduationCap} label="Escolaridade" value={deputado.escolaridade} />
            )}
            {deputado.sexo && (
              <InfoItem icon={Users} label="Sexo" value={deputado.sexo === 'F' ? 'Feminino' : 'Masculino'} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contato & Redes Sociais */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Contato & Redes Sociais
          </h2>
          <div className="space-y-2 text-sm">
            {gabinete?.email && (
              <a href={`mailto:${gabinete.email}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                <Mail className="w-4 h-4 text-primary/60" />
                <span className="truncate">{gabinete.email}</span>
              </a>
            )}
            {gabinete?.telefone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-500/60" />
                <span>(61) {gabinete.telefone}</span>
              </div>
            )}
            {deputado.urlWebsite && (
              <a href={deputado.urlWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Globe className="w-4 h-4 text-blue-400/60" />
                <span className="truncate">{deputado.urlWebsite}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            )}
            {deputado.redeSocial && deputado.redeSocial.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {deputado.redeSocial.map((rede: string, i: number) => (
                  <a key={i} href={rede} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors text-xs">
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="truncate">{rede}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gabinete */}
      {gabinete && (gabinete.predio || gabinete.sala) && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Gabinete
            </h2>
            <div className="grid grid-cols-3 gap-3 text-sm">
              {gabinete.predio && <InfoItem icon={Building2} label="Prédio" value={gabinete.predio} />}
              {gabinete.andar && <InfoItem icon={DoorOpen} label="Andar" value={`${gabinete.andar}º`} />}
              {gabinete.sala && <InfoItem icon={Briefcase} label="Sala" value={gabinete.sala} />}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profissões */}
      {profissoes.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Profissões
            </h2>
            <div className="flex flex-wrap gap-2">
              {profissoes.map((p: any, i: number) => (
                <span key={i} className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium">
                  {p.titulo || p.nome}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ocupações */}
      {ocupacoes.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Histórico de Ocupações
            </h2>
            <div className="space-y-2">
              {ocupacoes.slice(0, 8).map((o: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm border-l-2 border-primary/20 pl-3">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{o.titulo}</p>
                    {o.entidade && <p className="text-xs text-muted-foreground">{o.entidade}</p>}
                    {(o.anoInicio || o.anoFim) && (
                      <p className="text-[10px] text-muted-foreground/60">
                        {o.anoInicio || '?'} — {o.anoFim || 'Atual'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comissões & Órgãos */}
      {orgaosAtivos.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <Landmark className="w-4 h-4" />
              Comissões e Órgãos Atuais
            </h2>
            <div className="space-y-2">
              {orgaosAtivos.slice(0, 15).map((o: any, i: number) => (
                <div key={i} className="p-2.5 bg-secondary/30 rounded-lg">
                  <p className="text-xs font-medium text-foreground">{o.siglaOrgao} — {o.nomeOrgao}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                      {o.titulo || o.nomePublicacao || 'Membro'}
                    </span>
                    {o.dataInicio && (
                      <span className="text-[10px] text-muted-foreground">
                        Desde {new Date(o.dataInicio).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Órgãos Anteriores */}
      {orgaosAntigos.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">Órgãos Anteriores</h2>
            <div className="space-y-1.5">
              {orgaosAntigos.map((o: any, i: number) => (
                <div key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 flex-shrink-0" />
                  <span>{o.siglaOrgao} — {o.titulo || 'Membro'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Frentes Parlamentares */}
      {frentes.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Frentes Parlamentares ({frentes.length})
            </h2>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {frentes.map((f: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0 mt-1.5" />
                  <span className="text-foreground/80">{f.titulo}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evolução de Gastos */}
      {id && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-primary">Evolução de Gastos</h2>
            </div>
            <GraficoEvolucaoGastos politicoId={id} tipo="deputado" />
          </CardContent>
        </Card>
      )}

      {/* Despesas - Preview */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-primary">Despesas ({new Date().getFullYear()})</h2>
          </div>
          
          {loadingDespesas && <ContentGenerationLoader message="Carregando despesas..." />}
          
          {!loadingDespesas && despesas.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhuma despesa encontrada</p>
          )}

          {despesas.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Total: <span className="text-primary font-semibold">
                  {despesas.reduce((sum, d) => sum + d.valorLiquido, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </p>
              {despesas.slice(0, 5).map((despesa, index) => (
                <DespesaCard key={index} despesa={despesa} index={index} />
              ))}
              {despesas.length > 5 && (
                <Button
                  onClick={() => navigate(`/camara-deputados/deputado/${id}/despesas`)}
                  variant="outline"
                  className="w-full mt-2 text-xs"
                  size="sm"
                >
                  Ver todas as {despesas.length} despesas
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
    <div className="min-w-0">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="font-medium text-xs">{value}</p>
    </div>
  </div>
);

export default CamaraDeputadoDetalhes;
