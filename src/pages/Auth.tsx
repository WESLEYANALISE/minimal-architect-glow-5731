import React, { useState, useEffect, useRef, memo } from 'react';
import { getStoredUtmParams } from '@/hooks/useUtmCapture';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { InfiniteSlider } from '@/components/ui/infinite-slider';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, User, Eye, EyeOff, ChevronDown, ChevronLeft, ArrowRight, KeyRound } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { motion } from 'framer-motion';

import themisFull from '@/assets/themis-full.webp';
import themisFaceCloseup from '@/assets/themis-face-closeup.webp';
import { useHomePreloader } from '@/hooks/useHomePreloader';
import { useDeviceType } from '@/hooks/use-device-type';
import { preloadOnboardingVideo } from '@/hooks/useOnboardingVideoPreloader';
import DesktopLandingSections from '@/components/landing/DesktopLandingSections';
import logoDireitoPremium from "@/assets/logo-direito-premium-new.webp";

type AuthMode = 'login' | 'signup' | 'forgot' | 'otp' | 'reset';

// Validation schemas
const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
});

const signupSchema = z.object({
  nome: z.string()
    .trim()
    .min(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
    .max(100, { message: 'Nome muito longo' })
    .refine((val) => !val.includes('@'), {
      message: 'Este campo é para o seu nome, não para o e-mail. Digite seu nome.',
    }),
  email: z.string().trim().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

const forgotSchema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }),
});

const resetSchema = z.object({
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

// ─── AuthFormCard – componente estável (não é recriado a cada render do pai) ───
interface AuthFormCardProps {
  mode: AuthMode;
  formData: { nome: string; telefone: string; email: string; password: string; confirmPassword: string };
  errors: Record<string, string>;
  isLoading: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
  otpCode: string;
  setOtpCode: React.Dispatch<React.SetStateAction<string>>;
  getTitle: () => string;
  getDescription: () => string | null;
  getButtonText: () => string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  switchMode: (m: AuthMode) => void;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  setShowConfirmPassword: React.Dispatch<React.SetStateAction<boolean>>;
  onNavigate: (path: string) => void;
}

const AuthFormCard = memo(({
  mode,
  formData,
  errors,
  isLoading,
  showPassword,
  showConfirmPassword,
  otpCode,
  setOtpCode,
  getTitle,
  getDescription,
  getButtonText,
  handleInputChange,
  handleSubmit,
  switchMode,
  setShowPassword,
  setShowConfirmPassword,
  onNavigate,
}: AuthFormCardProps) => {
  return (
    <div className="rounded-t-3xl bg-[hsl(var(--card))] border-t border-x border-border/20 shadow-2xl overflow-visible px-6 pt-6 pb-6">
      {/* Logo */}
      <div className="flex flex-col items-center mb-4">
        <img 
          src={logoDireitoPremium} 
          alt="Direito Prime" 
          className="w-12 h-12 mb-1.5 rounded-xl"
        />
        <span className="text-base font-bold text-foreground" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>Direito Prime</span>
        <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: '0.04em' }}>Estudos Jurídicos</span>
      </div>

      {/* Toggle Entrar / Cadastrar */}
      {(mode === 'login' || mode === 'signup') && (
        <div className="flex mb-5 bg-zinc-800/80 rounded-xl p-1">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              mode === 'login'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              mode === 'signup'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Cadastrar
          </button>
        </div>
      )}

      {/* Título e descrição */}
      <div className="text-center mb-5">
        <h2 className="text-xl font-bold text-foreground">{getTitle()}</h2>
        {mode === 'login' && (
          <p className="text-sm text-muted-foreground mt-1">Entre com suas credenciais para acessar</p>
        )}
        {mode === 'signup' && (
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Crie sua conta e tenha acesso a todas as ferramentas para exercer seu Direito.
          </p>
        )}
        {mode !== 'login' && mode !== 'signup' && (
          <p className="text-sm text-muted-foreground mt-1">{getDescription()}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo Nome - só no signup */}
        <div className={`grid transition-all duration-300 ease-out ${
          mode === 'signup' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}>
          <div className="overflow-hidden">
            <div className="space-y-2 pb-1">
              <div className="relative">
                <Input
                  id="nome"
                  name="nome"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  className={`h-12 bg-zinc-800 border border-zinc-700 rounded-xl pl-4 pr-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/40 transition-colors ${errors.nome ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                  tabIndex={mode === 'signup' ? 0 : -1}
                />
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.nome && (
                <p className="text-xs text-destructive">{errors.nome}</p>
              )}
            </div>
          </div>
        </div>


        {/* Email */}
        {mode !== 'reset' && mode !== 'otp' && (
          <div className="space-y-2">
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="E-mail"
                value={formData.email}
                onChange={handleInputChange}
                className={`h-12 bg-zinc-800 border border-zinc-700 rounded-xl pl-4 pr-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/40 transition-colors ${errors.email ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>
        )}

        {/* OTP Code Input */}
        {mode === 'otp' && (
          <div className="flex flex-col items-center gap-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-2">
              <KeyRound className="w-7 h-7 text-primary" />
            </div>
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={setOtpCode}
              disabled={isLoading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="h-12 w-12 text-lg bg-zinc-800 border-zinc-700 rounded-lg" />
                <InputOTPSlot index={1} className="h-12 w-12 text-lg bg-zinc-800 border-zinc-700 rounded-lg" />
                <InputOTPSlot index={2} className="h-12 w-12 text-lg bg-zinc-800 border-zinc-700 rounded-lg" />
                <InputOTPSlot index={3} className="h-12 w-12 text-lg bg-zinc-800 border-zinc-700 rounded-lg" />
                <InputOTPSlot index={4} className="h-12 w-12 text-lg bg-zinc-800 border-zinc-700 rounded-lg" />
                <InputOTPSlot index={5} className="h-12 w-12 text-lg bg-zinc-800 border-zinc-700 rounded-lg" />
              </InputOTPGroup>
            </InputOTP>
            {errors.otp && (
              <p className="text-xs text-destructive">{errors.otp}</p>
            )}
          </div>
        )}

        {/* Senha */}
        {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
          <div className="space-y-2">
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                value={formData.password}
                onChange={handleInputChange}
                className={`h-12 bg-zinc-800 border border-zinc-700 rounded-xl pl-4 pr-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/40 transition-colors ${errors.password ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>
        )}

        {/* Confirmar Senha */}
        <div className={`grid transition-all duration-300 ease-out ${
          mode === 'signup' || mode === 'reset' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}>
          <div className="overflow-hidden">
            <div className="space-y-2 pb-1">
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirmar senha"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`h-12 bg-zinc-800 border border-zinc-700 rounded-xl pl-4 pr-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/40 transition-colors ${errors.confirmPassword ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                  tabIndex={mode === 'signup' || mode === 'reset' ? 0 : -1}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
          </div>
        </div>


        {/* Botão principal */}
        <Button
          type="submit"
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base btn-shine"
          disabled={isLoading || (mode === 'otp' && otpCode.length < 6)}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Aguarde...
            </>
          ) : (
            <span className="flex items-center gap-2 relative z-10">
              {getButtonText()}
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex"
              >
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            </span>
          )}
        </Button>

        {/* Esqueci minha senha - only on login */}
        {mode === 'login' && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="text-sm text-white/90 hover:text-white transition-colors underline underline-offset-2"
              disabled={isLoading}
            >
              Esqueci minha senha
            </button>
          </div>
        )}

        {(mode === 'forgot' || mode === 'reset' || mode === 'otp') && (
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
          >
            ← Voltar para o login
          </button>
        )}
      </form>
    </div>
  );
});

AuthFormCard.displayName = 'AuthFormCard';

// ─── Componente principal ────────────────────────────────────────────────────
const Auth: React.FC = () => {
  // Pré-carregar dados da Home em background enquanto usuário faz login
  useHomePreloader();

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  // Detectar modo de recuperação de senha SINCRONAMENTE na inicialização
  const isRecoveryFromUrl = searchParams.get('type') === 'recovery';
  const urlMode = searchParams.get('mode');
  const initialMode: AuthMode = isRecoveryFromUrl ? 'reset' : (urlMode === 'signup' ? 'signup' : 'login');
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const hideToggle = !!urlMode && (urlMode === 'login' || urlMode === 'signup');

  // Pré-carregar vídeo do onboarding quando estiver no modo signup
  useEffect(() => {
    if (mode === 'signup') {
      preloadOnboardingVideo();
    }
  }, [mode]);

  const [isLoading, setIsLoading] = useState(false);
  const isSigningUpRef = useRef(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailEntered, setEmailEntered] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetSuccess, setResetSuccess] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [savedEmail, setSavedEmail] = useState('');
  const { isDesktop } = useDeviceType();

  const from = '/inicio';

  // Listen for PASSWORD_RECOVERY event as fallback
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirect if already logged in (except during password reset or signup flow)
  useEffect(() => {
    if (user && mode !== 'reset' && !isRecoveryFromUrl && !isSigningUpRef.current) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from, mode, isRecoveryFromUrl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Validação em tempo real para o campo nome - impedir e-mail
    if (name === 'nome' && value.includes('@')) {
      setErrors((prev) => ({ 
        ...prev, 
        nome: 'Este campo é para o seu nome, não para o e-mail. Digite seu nome completo.' 
      }));
      return;
    }
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    
    // Detectar quando o email foi preenchido (para mostrar campo de senha)
    if (name === 'email' && mode === 'login') {
      const isValidEmail = value.includes('@') && value.includes('.');
      setEmailEntered(isValidEmail && value.length >= 5);
    }
  };

  // Reset emailEntered quando mudar de modo
  useEffect(() => {
    setEmailEntered(false);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const result = loginSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Erro de autenticação',
              description: 'Email ou senha incorretos.',
              variant: 'destructive',
            });
          } else if (error.message.includes('Email not confirmed')) {
            toast({
              title: 'Email não confirmado',
              description: 'Por favor, confirme seu email antes de entrar.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro',
              description: 'Ocorreu um erro ao fazer login. Tente novamente.',
              variant: 'destructive',
            });
          }
          setIsLoading(false);
          return;
        }

        // Login silencioso - sem toast de boas-vindas
      } else if (mode === 'signup') {
        const result = signupSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const redirectUrl = `${window.location.origin}/`;

        // Rodar verificações em paralelo para máxima velocidade
        const [emailCheckResult, deviceModule, ipResult] = await Promise.all([
          supabase.functions.invoke('verificar-email', {
            body: { email: formData.email.trim() },
          }).catch(() => ({ data: null, error: null })),
          import('@/lib/deviceDetection').catch(() => null),
          supabase.functions.invoke('capturar-ip').catch(() => ({ data: null })),
        ]);

        // Verificar e-mail
        if (emailCheckResult?.data && !emailCheckResult.error && !emailCheckResult.data.valido) {
          toast({
            title: 'E-mail inválido',
            description: emailCheckResult.data.motivo || 'Por favor, use um e-mail real e válido.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        const deviceInfo = deviceModule?.getDetailedDeviceInfo?.() || {};
        const dispositivoResumo = deviceModule?.getDeviceSummary?.() || 'desconhecido';
        const ipCadastro = ipResult?.data?.ip || null;
        const paisCadastro = ipResult?.data?.country || null;
        const estadoCadastro = ipResult?.data?.region || null;

        const { error } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              nome: formData.nome.trim(),
              full_name: formData.nome.trim(),
              
              dispositivo: dispositivoResumo,
              device_info_json: JSON.stringify(deviceInfo),
              ip_cadastro: ipCadastro,
              pais_cadastro: paisCadastro,
              estado_cadastro: estadoCadastro,
              ...getStoredUtmParams(),
            },
          },
        });

        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: 'Usuário já cadastrado',
              description: 'Este email já está cadastrado. Tente fazer login.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro',
              description: 'Ocorreu um erro ao criar a conta. Tente novamente.',
              variant: 'destructive',
            });
          }
          setIsLoading(false);
          return;
        }

        // Detectar IP duplicado — bloquear trial se IP já usado com trial expirado
        if (ipCadastro) {
          try {
            const { data: dupes } = await supabase
              .from('profiles')
              .select('id, created_at')
              .eq('ip_cadastro', ipCadastro)
              .neq('email', formData.email.trim())
              .limit(5);
            
            if (dupes && dupes.length > 0) {
              // IP already exists in other accounts — mark new user as blocked
              // Wait briefly for the profile to be created by the trigger
              setTimeout(async () => {
                try {
                  const { data: { user: newUser } } = await supabase.auth.getUser();
                  if (newUser) {
                    await supabase
                      .from('profiles')
                      .update({ trial_bloqueado_ip: true })
                      .eq('id', newUser.id);
                  }
                } catch {}
              }, 2000);
            }
          } catch {}
        }

        // Track CompleteRegistration event for Facebook Ads
        try {
          const eventId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          if (window.fbq) {
            window.fbq('track', 'CompleteRegistration', { content_name: 'Signup', status: true }, { eventID: eventId });
          }

          // Build richer user_data for CAPI
          const capiUserData: Record<string, string> = { em: formData.email.trim() };
          try {
            const fbpCookie = document.cookie.match(/(^| )_fbp=([^;]+)/)?.[2];
            if (fbpCookie) capiUserData.fbp = fbpCookie;
            const storedFbclid = localStorage.getItem('_fbclid');
            const storedTs = localStorage.getItem('_fbclid_ts');
            if (storedFbclid) {
              const ts = storedTs ? parseInt(storedTs, 10) : Date.now();
              capiUserData.fbc = `fb.1.${ts}.${storedFbclid}`;
            }
            const urlFbclid = new URLSearchParams(window.location.search).get('fbclid');
            if (urlFbclid) capiUserData.fbc = `fb.1.${Date.now()}.${urlFbclid}`;
          } catch {}

          supabase.functions.invoke('facebook-conversions', {
            body: {
              event_name: 'CompleteRegistration',
              event_id: eventId,
              event_source_url: window.location.href,
              action_source: 'website',
              user_data: {
                ...capiUserData,
                client_user_agent: navigator.userAgent,
                country: 'br',
              },
              custom_data: { content_name: 'Signup', status: true },
            },
          }).catch(() => {});
        } catch {}

        // Notificação WhatsApp movida para o onboarding (handleFinish)
        // para enviar apenas quando o usuário completa todo o quiz

        // Redirecionar direto para o quiz de onboarding
        isSigningUpRef.current = true;
        navigate('/onboarding-telefone', { replace: true });
      } else if (mode === 'forgot') {
        const result = forgotSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(formData.email.trim());

        if (error) {
          toast({
            title: 'Erro',
            description: 'Ocorreu um erro ao enviar o código. Tente novamente.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: 'Código enviado!',
          description: 'Verifique sua caixa de entrada e digite o código de 6 dígitos.',
        });
        setSavedEmail(formData.email.trim());
        setOtpCode('');
        setMode('otp');
      } else if (mode === 'otp') {
        if (otpCode.length < 6) {
          setErrors({ otp: 'Digite o código de 6 dígitos' });
          setIsLoading(false);
          return;
        }

        const { error } = await supabase.auth.verifyOtp({
          email: savedEmail,
          token: otpCode,
          type: 'recovery',
        });

        if (error) {
          toast({
            title: 'Código inválido',
            description: 'O código digitado está incorreto ou expirou. Tente novamente.',
            variant: 'destructive',
          });
          setOtpCode('');
          setIsLoading(false);
          return;
        }

        toast({
          title: 'Código verificado!',
          description: 'Agora digite sua nova senha.',
        });
        setMode('reset');
      } else if (mode === 'reset') {
        const result = resetSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const { error } = await supabase.auth.updateUser({
          password: formData.password,
        });

        if (error) {
          toast({
            title: 'Erro',
            description: 'Ocorreu um erro ao redefinir a senha. Tente novamente.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        await supabase.auth.signOut();
        setResetSuccess(true);
      }
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setOtpCode('');
    if (newMode !== 'otp' && newMode !== 'reset') {
      setFormData({ nome: '', telefone: '', email: '', password: '', confirmPassword: '' });
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Entrar';
      case 'signup': return 'Vamos cadastrar você!';
      case 'forgot': return 'Recuperar senha';
      case 'otp': return 'Código de verificação';
      case 'reset': return 'Nova senha';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login': return 'Entre com suas credenciais para acessar';
      case 'signup': return null;
      case 'forgot': return 'Enviaremos um código de 6 dígitos para seu e-mail';
      case 'otp': return 'Digite o código de 6 dígitos enviado para seu e-mail';
      case 'reset': return 'Digite sua nova senha';
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case 'login': return 'Entrar';
      case 'signup': return 'Criar conta';
      case 'forgot': return 'Enviar código';
      case 'otp': return 'Verificar código';
      case 'reset': return 'Redefinir senha';
    }
  };

  // Props estáveis passadas para o componente filho
  const formCardProps: AuthFormCardProps = {
    mode,
    formData,
    errors,
    isLoading,
    showPassword,
    showConfirmPassword,
    otpCode,
    setOtpCode,
    getTitle,
    getDescription,
    getButtonText,
    handleInputChange,
    handleSubmit,
    switchMode,
    setShowPassword,
    setShowConfirmPassword,
    onNavigate: navigate,
  };

  // Tela de sucesso após redefinição de senha
  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full text-center space-y-6 bg-card border border-border rounded-2xl p-8 shadow-lg"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Senha redefinida com sucesso!</h1>
          <p className="text-muted-foreground">
            Agora acesse o app e faça login com sua nova senha.
          </p>
          <Button
            onClick={() => {
              setResetSuccess(false);
              switchMode('login');
            }}
            className="w-full"
          >
            Ir para Login
          </Button>
        </motion.div>
      </div>
    );
  }

  // Layout Desktop
  if (isDesktop) {
    return (
      <div className="min-h-screen">
        {/* Hero Section - Fullscreen */}
        <div className="h-screen flex relative">
          {/* Esquerda - Themis corpo inteiro (36%) */}
          <div className="w-[36%] relative overflow-hidden">
            <img 
              src={themisFull}
              alt="Themis - Deusa da Justiça"
              className="h-full w-full object-cover object-left"
              decoding="sync"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-background from-0% via-background/50 via-20% to-transparent to-40%" />
            
            <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 pb-12">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <h1 className="text-2xl xl:text-3xl font-bold text-white mb-3 font-playfair leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  Sua jornada jurídica<br />
                  <span className="text-red-500">começa aqui</span>
                </h1>
                <p className="text-sm text-white/70 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  falando todo o conteúdo que você precisa estudar pra faculdade e prova OAB em um só lugar.
                </p>
              </motion.div>
            </div>
          </div>

          {/* Centro - Formulário centralizado (28%) */}
          <div className="w-[28%] bg-background flex flex-col items-center justify-center px-3 py-4 overflow-y-auto">
            {/* Branding no topo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex flex-col items-center mb-6"
            >
              <div className="flex items-center gap-3">
                <img 
                  src={logoDireitoPremium} 
                  alt="Direito Premium" 
                  className="w-10 h-10 rounded-lg"
                />
                <span className="text-2xl font-bold text-foreground font-playfair">
                  Direito Premium
                </span>
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                Estudos Jurídicos
              </span>
            </motion.div>
            
            {/* Formulário - animação apenas na montagem inicial */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
              className="w-full max-w-sm"
            >
              <AuthFormCard {...formCardProps} />

              {mode === 'signup' && (
                <p className="text-center text-xs text-muted-foreground mt-6">
                  Ao continuar, você concorda com nossos{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/termos-de-uso')}
                    className="text-red-500 hover:text-red-400 transition-colors underline"
                  >
                    Termos de Uso
                  </button>
                  <br />
                  e{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/politica-de-privacidade')}
                    className="text-red-500 hover:text-red-400 transition-colors underline"
                  >
                    Política de Privacidade
                  </button>
                </p>
              )}

              {/* Scroll Indicator */}
              <motion.div 
                className="flex flex-col items-center gap-2 mt-6 cursor-pointer"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.8 }}
              >
                <span 
                  className="text-sm font-medium tracking-wider uppercase animate-shimmer"
                  style={{
                    background: 'linear-gradient(90deg, hsl(var(--muted-foreground)) 40%, hsl(var(--foreground)) 50%, hsl(var(--muted-foreground)) 60%)',
                    backgroundSize: '200% 100%',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Role para descobrir
                </span>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  <ChevronDown className="w-6 h-6 text-primary" />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* Direita - Close-up rosto Themis (36%) */}
          <div className="w-[36%] relative overflow-hidden">
            <img 
              src={themisFaceCloseup}
              alt="Themis - Close-up"
              className="h-full w-full object-cover object-[30%_center]"
              decoding="sync"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background from-0% via-background/50 via-20% to-transparent to-40%" />
          </div>
        </div>

        {/* Landing Sections */}
        <DesktopLandingSections />
      </div>
    );
  }

  // Layout Mobile/Tablet — wrapper sem re-animação (só classe CSS)
  return (
    <div className="h-screen overflow-hidden animate-fade-in">
      {/* Hero Section */}
      <div className="h-screen relative overflow-hidden">
        {/* Background Image - Themis */}
        <div 
          className="absolute inset-0 bg-cover bg-top bg-no-repeat"
          style={{ backgroundImage: `url(${themisFull})` }}
        />
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        
        {/* Botão voltar */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-5 left-4 z-20 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-primary-foreground" />
        </button>

        {/* Formulário na parte inferior */}
        <div className="relative z-10 h-screen flex items-end justify-center">
          <div className="w-full">
            <AuthFormCard {...formCardProps} />

            {mode === 'signup' && (
              <p className="text-center text-xs text-white/60 mt-4 leading-relaxed">
                Ao continuar, você concorda com nossos
                <br />
                <button
                  type="button"
                  onClick={() => navigate('/termos-de-uso')}
                  className="text-primary hover:text-primary/80 transition-colors underline"
                >
                  Termos de Uso
                </button>
                {' '}e{' '}
                <button
                  type="button"
                  onClick={() => navigate('/politica-de-privacidade')}
                  className="text-primary hover:text-primary/80 transition-colors underline"
                >
                  Política de Privacidade
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Landing Sections removidas no mobile */}
    </div>
  );
};

export default Auth;
