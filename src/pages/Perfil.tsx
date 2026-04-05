import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Briefcase, GraduationCap, FileText, Loader2, LogOut, ChevronDown, Smile, Trash2, Bell } from 'lucide-react';
import { useDeviceType } from '@/hooks/use-device-type';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { PhoneInput } from '@/components/PhoneInput';
import { PerfilPlanoTab } from '@/components/perfil/PerfilPlanoTab';
import { PerfilSuporteTab } from '@/components/perfil/PerfilSuporteTab';
import { PerfilLocalizacaoTab } from '@/components/perfil/PerfilLocalizacaoTab';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const AVATAR_IDS = [1, 3, 5, 7, 8, 10, 12, 15, 20, 25, 32, 35];

const ADMIN_EMAIL = 'wn7corporation@gmail.com';
type Intencao = 'universitario' | 'concurseiro' | 'oab' | 'advogado';

interface ProfileData {
  nome: string | null;
  email: string | null;
  telefone: string | null;
  avatar_url: string | null;
  intencao: Intencao | null;
}

const intencaoOptions: { value: Intencao; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    value: 'universitario', 
    label: 'Universitário', 
    icon: <GraduationCap className="h-5 w-5" />,
    description: 'Estudo Direito na faculdade'
  },
  { 
    value: 'concurseiro', 
    label: 'Concurseiro', 
    icon: <FileText className="h-5 w-5" />,
    description: 'Quero passar em concursos públicos'
  },
  { 
    value: 'oab', 
    label: 'OAB', 
    icon: <FileText className="h-5 w-5" />,
    description: 'Quero estudar para 1ª e 2ª Fase da OAB'
  },
  { 
    value: 'advogado', 
    label: 'Advogado', 
    icon: <Briefcase className="h-5 w-5" />,
    description: 'Sou advogado e quero me atualizar'
  },
];

export default function Perfil() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    nome: '',
    email: null,
    telefone: '',
    avatar_url: null,
    intencao: null,
  });

  const [deleting, setDeleting] = useState(false);
  const { isDesktop } = useDeviceType();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nome, email, telefone, avatar_url, intencao')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', error);
      }

      if (data) {
        setProfile({
          nome: data.nome || user.email?.split('@')[0] || '',
          email: data.email || user.email || null,
          telefone: data.telefone || '',
          avatar_url: data.avatar_url,
          intencao: data.intencao as Intencao | null,
        });
      } else {
        setProfile(prev => ({
          ...prev,
          nome: user.email?.split('@')[0] || '',
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Upload original image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-original.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL of uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Convert to WebP using edge function
      const response = await supabase.functions.invoke('otimizar-imagem', {
        body: {
          imageUrl: publicUrl,
          preset: 'logo-md', // 128x128
        },
      });

      if (response.error) throw response.error;

      const webpUrl = response.data?.urlWebp || response.data?.webpUrl || publicUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: webpUrl,
        });

      if (updateError) throw updateError;

      // Sincronizar com Auth Users (para aparecer no Supabase Dashboard)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          avatar_url: webpUrl,
          picture: webpUrl  // Compatibilidade com formato OAuth
        }
      });

      if (authError) {
        console.warn('Não foi possível sincronizar avatar com Auth:', authError);
      }

      setProfile(prev => ({ ...prev, avatar_url: webpUrl }));

      toast({
        title: 'Foto atualizada!',
        description: 'Sua foto de perfil foi alterada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro ao enviar imagem',
        description: 'Não foi possível atualizar sua foto. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSelectAvatar = async (avatarId: number) => {
    if (!user) return;
    const avatarUrl = `https://i.pravatar.cc/150?img=${avatarId}`;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, avatar_url: avatarUrl });

      if (error) throw error;

      await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl, picture: avatarUrl }
      });

      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
      setShowAvatarPicker(false);

      toast({
        title: 'Avatar atualizado!',
        description: 'Seu avatar foi alterado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar avatar:', error);
      toast({
        title: 'Erro ao salvar avatar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);

    try {
      // Salvar na tabela profiles
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          nome: profile.nome,
          telefone: profile.telefone,
          intencao: profile.intencao,
          avatar_url: profile.avatar_url,
        });

      if (error) throw error;

      // Atualizar telefone na tabela auth.users (se telefone foi preenchido)
      if (profile.telefone) {
        const { error: authError } = await supabase.auth.updateUser({
          phone: profile.telefone,
        });
        
        if (authError) {
          console.warn('Aviso: Não foi possível atualizar telefone na autenticação:', authError.message);
        }
      }

      toast({
        title: 'Perfil salvo!',
        description: 'Suas alterações foram salvas com sucesso.',
      });

      // Voltar para a página anterior após salvar
      navigate(-1);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar suas alterações. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);

    try {
      const { data, error } = await supabase.functions.invoke('delete-account');

      if (error) throw error;

      await supabase.auth.signOut({ scope: 'local' });

      toast({
        title: 'Conta excluída',
        description: 'Sua conta e todos os dados foram removidos com sucesso.',
      });

      navigate('/', { replace: true });
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast({
        title: 'Erro ao excluir conta',
        description: 'Não foi possível excluir sua conta. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { isDesktop } = useDeviceType();

  return (
    <div className={cn("min-h-screen bg-background", isDesktop ? "pb-4" : "pb-24")}>
      <main className={cn(
        "mx-auto px-4 py-6 space-y-6",
        isDesktop ? "max-w-5xl" : "max-w-2xl"
      )}>
        {/* Page Title */}
        {!isDesktop && (
          <div className="text-center">
            <h1 className="text-xl font-bold">Meu Perfil</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Configure suas informações</p>
          </div>
        )}

        {isDesktop ? (
          /* Desktop: 2 column layout */
          <div className="grid grid-cols-12 gap-8">
            {/* Left column - Avatar + form */}
            <div className="col-span-5 space-y-6">
              <div className="text-left">
                <h1 className="text-2xl font-bold">Meu Perfil</h1>
                <p className="text-sm text-muted-foreground mt-1">Configure suas informações</p>
              </div>

              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-sm"
                onClick={() => navigate('/notificacoes-preferencias')}
              >
                <Bell className="h-4 w-4 text-primary" />
                Preferências de Notificações
              </Button>

              {/* Avatar + info */}
              <div className="flex items-center gap-5 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-muted border-4 border-background shadow-xl overflow-hidden">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <User className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-lg text-foreground truncate">{profile.nome || 'Usuário'}</p>
                  <p className="text-sm text-muted-foreground truncate">{profile.email || user?.email}</p>
                  <button
                    onClick={() => setShowAvatarPicker(true)}
                    className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Smile className="h-4 w-4" />
                    Escolher avatar
                  </button>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nome" className="text-sm">Nome</Label>
                  <Input id="nome" value={profile.nome || ''} onChange={(e) => setProfile(prev => ({ ...prev, nome: e.target.value }))} placeholder="Seu nome" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm">E-mail</Label>
                  <Input id="email" value={profile.email || user?.email || ''} readOnly disabled className="h-10 opacity-70" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefone" className="text-sm">Telefone (WhatsApp)</Label>
                  <PhoneInput value={profile.telefone || ''} onChange={(_, fullNumber) => setProfile(prev => ({ ...prev, telefone: fullNumber }))} placeholder="(11) 99999-9999" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Qual é o seu objetivo?</Label>
                  <Select value={profile.intencao || undefined} onValueChange={(value) => setProfile(prev => ({ ...prev, intencao: value as Intencao }))}>
                    <SelectTrigger className="h-auto p-3">
                      <SelectValue placeholder="Selecione seu objetivo">
                        {profile.intencao && (() => {
                          const selected = intencaoOptions.find(o => o.value === profile.intencao);
                          return selected ? (
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-full bg-primary text-primary-foreground">{selected.icon}</div>
                              <div className="text-left">
                                <p className="font-medium text-sm">{selected.label}</p>
                                <p className="text-xs text-muted-foreground">{selected.description}</p>
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {intencaoOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-full bg-muted">{option.icon}</div>
                            <div>
                              <p className="font-medium text-sm">{option.label}</p>
                              <p className="text-xs text-muted-foreground">{option.description}</p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSave} disabled={saving} className="flex-1 h-10">
                    {saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>) : ('Salvar alterações')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try { await supabase.auth.signOut({ scope: 'local' }); } catch (error) { console.error('Erro ao sair:', error); }
                      navigate('/', { replace: true });
                    }}
                    className="h-10 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>

                {/* Excluir conta */}
                <div className="pt-6 border-t border-border/50">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir minha conta
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir conta</AlertDialogTitle>
                        <AlertDialogDescription>Você realmente deseja excluir sua conta? Esta ação é irreversível.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          {deleting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Excluindo...</>) : ('Sim, excluir minha conta')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>

            {/* Right column - Tabs Plano/Suporte */}
            <div className="col-span-7">
              <Tabs defaultValue={isAdmin ? "perfil" : "plano"} className="w-full">
                <TabsList className={cn("grid w-full mb-4", isAdmin ? "grid-cols-1" : "grid-cols-2")}>
                  {!isAdmin && <TabsTrigger value="plano">Plano</TabsTrigger>}
                  <TabsTrigger value="suporte" onClick={(e) => { e.preventDefault(); navigate('/suporte'); }}>Suporte</TabsTrigger>
                </TabsList>
                <TabsContent value="plano"><PerfilPlanoTab /></TabsContent>
                <TabsContent value="suporte"><PerfilSuporteTab /></TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
          /* Mobile: original layout */
          <>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => navigate('/notificacoes-preferencias')}
            >
              <Bell className="h-4 w-4 text-primary" />
              Preferências de Notificações
            </Button>

            <Tabs defaultValue="perfil" className="w-full">
              <TabsList className={cn("grid w-full mb-4", isAdmin ? "grid-cols-2" : "grid-cols-3")}>
                <TabsTrigger value="perfil">Perfil</TabsTrigger>
                {!isAdmin && <TabsTrigger value="plano">Plano</TabsTrigger>}
                <TabsTrigger value="suporte" onClick={(e) => { e.preventDefault(); navigate('/suporte'); }}>Suporte</TabsTrigger>
              </TabsList>

          {/* Perfil Tab */}
          <TabsContent value="perfil" className="space-y-6">
            {/* Avatar + info em linha compacta */}
            <div className="flex items-center gap-5 p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-muted border-4 border-background shadow-xl overflow-hidden">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{profile.nome || 'Usuário'}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.email || user?.email}</p>
                <button
                  onClick={() => setShowAvatarPicker(true)}
                  className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Smile className="h-3 w-3" />
                  Escolher avatar
                </button>
              </div>
            </div>


            {/* Form fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome" className="text-sm">Nome</Label>
                <Input
                  id="nome"
                  value={profile.nome || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Seu nome"
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">E-mail</Label>
                <Input
                  id="email"
                  value={profile.email || user?.email || ''}
                  readOnly
                  disabled
                  className="h-10 opacity-70"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefone" className="text-sm">Telefone (WhatsApp)</Label>
                <PhoneInput
                  value={profile.telefone || ''}
                  onChange={(_, fullNumber) => setProfile(prev => ({ ...prev, telefone: fullNumber }))}
                  placeholder="(11) 99999-9999"
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Este número será usado para acessar a Evelyn no WhatsApp
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Qual é o seu objetivo?</Label>
                <Select
                  value={profile.intencao || undefined}
                  onValueChange={(value) => setProfile(prev => ({ ...prev, intencao: value as Intencao }))}
                >
                  <SelectTrigger className="h-auto p-3">
                    <SelectValue placeholder="Selecione seu objetivo">
                      {profile.intencao && (() => {
                        const selected = intencaoOptions.find(o => o.value === profile.intencao);
                        return selected ? (
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-full bg-primary text-primary-foreground">
                              {selected.icon}
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-sm">{selected.label}</p>
                              <p className="text-xs text-muted-foreground">{selected.description}</p>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {intencaoOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full bg-muted">{option.icon}</div>
                          <div>
                            <p className="font-medium text-sm">{option.label}</p>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-10"
                >
                  {saving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                  ) : (
                    'Salvar alterações'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await supabase.auth.signOut({ scope: 'local' });
                    } catch (error) {
                      console.error('Erro ao sair:', error);
                    }
                    navigate('/', { replace: true });
                  }}
                  className="h-10 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>

              {/* Excluir conta */}
              <div className="pt-6 border-t border-border/50">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir minha conta
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir conta</AlertDialogTitle>
                      <AlertDialogDescription>
                        Você realmente deseja excluir sua conta? Esta ação é irreversível. Todos os seus dados, progresso e informações serão permanentemente removidos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleting ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Excluindo...</>
                        ) : (
                          'Sim, excluir minha conta'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </TabsContent>

          {/* Plano Tab */}
          <TabsContent value="plano">
            <PerfilPlanoTab />
          </TabsContent>

          {/* Suporte Tab */}
          <TabsContent value="suporte">
            <PerfilSuporteTab />
          </TabsContent>
        </Tabs>
          </>
        )}

        {/* Avatar Picker Dialog - shared */}
        <Dialog open={showAvatarPicker} onOpenChange={setShowAvatarPicker}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Escolher avatar</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-4 gap-3 py-2">
              {AVATAR_IDS.map((id) => (
                <button
                  key={id}
                  onClick={() => handleSelectAvatar(id)}
                  className="rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-colors p-1"
                >
                  <img src={`https://i.pravatar.cc/150?img=${id}`} alt={`Avatar ${id}`} className="w-full h-full rounded-full" />
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
