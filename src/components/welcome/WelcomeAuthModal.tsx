import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, Loader2, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto').max(100),
  email: z.string().trim().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Mínimo 6 caracteres'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

interface WelcomeAuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function WelcomeAuthModal({ open, onClose, onSuccess }: WelcomeAuthModalProps) {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  const resetFields = () => {
    setErrors({});
    setShowPassword(false);
  };

  const handleLogin = async () => {
    setErrors({});
    const result = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => { fieldErrors[i.path[0] as string] = i.message; });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });
    setLoading(false);

    if (error) {
      toast({ title: 'Erro ao entrar', description: error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Bem-vindo(a) de volta! 🎉' });
    onSuccess?.();
    onClose();
  };

  const handleSignup = async () => {
    setErrors({});
    const result = signupSchema.safeParse({ name: signupName, email: signupEmail, password: signupPassword, confirmPassword: signupConfirm });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => { fieldErrors[i.path[0] as string] = i.message; });
      setErrors(fieldErrors);
      return;
    }

    // Check if name already exists
    setLoading(true);
    const { data: existingName } = await supabase
      .from('profiles')
      .select('id')
      .ilike('nome', result.data.name.trim())
      .limit(1)
      .maybeSingle();

    if (existingName) {
      setErrors({ name: 'Este nome já está cadastrado. Tente outro.' });
      setLoading(false);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        data: { full_name: result.data.name },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      toast({ title: 'Erro no cadastro', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Conta criada! 🎉', description: 'Verifique seu e-mail para confirmar o cadastro.' });
    onSuccess?.();
    onClose();
  };

  const handleForgotPassword = async () => {
    const email = tab === 'login' ? loginEmail : signupEmail;
    if (!email || !z.string().email().safeParse(email).success) {
      toast({ title: 'Digite seu e-mail', description: 'Preencha o campo de e-mail antes de recuperar a senha.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth?type=recovery` });
    setLoading(false);
    toast({ title: 'E-mail enviado! 📧', description: 'Verifique sua caixa de entrada para redefinir a senha.' });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="sm:max-w-[420px] p-0 gap-0 border-0 overflow-hidden bg-transparent"
        overlayClassName="backdrop-blur-xl bg-black/70"
      >
        <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(160deg, rgba(20,18,12,0.98) 0%, rgba(10,8,4,0.99) 100%)', border: '1px solid rgba(212,168,75,0.25)' }}>
          {/* Header */}
          <div className="px-6 pt-6 pb-4 text-center">
            <h2 className="text-xl font-black text-white" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              Direito Prime
            </h2>
            <p className="text-white/50 text-sm mt-1">Acesse sua conta ou crie uma nova</p>
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={(v) => { setTab(v as 'login' | 'signup'); resetFields(); }} className="px-6 pb-6">
            <TabsList className="w-full bg-white/5 border border-white/10 rounded-xl h-11 p-1 mb-5">
              <TabsTrigger value="login" className="flex-1 rounded-lg text-sm font-semibold data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 transition-all gap-1.5">
                <LogIn className="w-4 h-4" />
                Entrar
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-1 rounded-lg text-sm font-semibold data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 transition-all gap-1.5">
                <UserPlus className="w-4 h-4" />
                Primeiro acesso
              </TabsTrigger>
            </TabsList>

            {/* Login tab */}
            <TabsContent value="login" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs font-medium">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-amber-500/50 h-11"
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs font-medium">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-amber-500/50 h-11"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs">{errors.password}</p>}
              </div>


              <Button
                onClick={handleLogin}
                disabled={loading}
                className="w-full h-12 text-base font-bold rounded-xl text-white"
                style={{ background: 'linear-gradient(135deg, #d4a84b 0%, #92650a 100%)' }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <span className="flex items-center gap-2"><LogIn className="w-4 h-4" /> Entrar</span>
                )}
              </Button>
            </TabsContent>

            {/* Signup tab */}
            <TabsContent value="signup" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs font-medium">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    type="text"
                    placeholder="Seu nome completo"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-amber-500/50 h-11"
                  />
                </div>
                {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs font-medium">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-amber-500/50 h-11"
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs font-medium">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-amber-500/50 h-11"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs">{errors.password}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs font-medium">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-amber-500/50 h-11"
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs">{errors.confirmPassword}</p>}
              </div>

              <Button
                onClick={handleSignup}
                disabled={loading}
                className="w-full h-12 text-base font-bold rounded-xl text-white"
                style={{ background: 'linear-gradient(135deg, #d4a84b 0%, #92650a 100%)' }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Criar conta</span>
                )}
              </Button>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="px-6 pb-5 text-center">
            <p className="text-white/25 text-[11px]">É rápido e gratuito • Seus dados estão seguros</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
