import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  solicitarPermissaoNotificacao,
  escutarNotificacoesForeground,
  salvarTokenNoSupabase,
  salvarTokenPendente,
  inscreverNoTopico,
} from '@/services/firebase-messaging';

export function useNotificacoesPush() {
  const { user } = useAuth();
  const inicializadoRef = useRef(false);
  const unsubForegroundRef = useRef<(() => void) | null>(null);

  // Efeito principal: registrar push (roda uma vez, sem depender de user)
  useEffect(() => {
    if (inicializadoRef.current) return;
    inicializadoRef.current = true;

    const registrar = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          await registrarNativo();
        } else {
          await registrarWeb();
        }

        configurarForeground();
      } catch (error) {
        console.error('Erro ao registrar notificações push:', error);
      }
    };

    registrar();

    return () => {
      if (unsubForegroundRef.current) {
        unsubForegroundRef.current();
      }
    };
  }, []);

  // Efeito secundário: quando user logar, tentar salvar token pendente
  useEffect(() => {
    if (user) {
      salvarTokenPendente();
    }
  }, [user]);

  const registrarNativo = async () => {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      const permResult = await PushNotifications.requestPermissions();
      if (permResult.receive !== 'granted') {
        console.log('Permissão de notificação negada (nativo)');
        return;
      }

      // Listener para receber o token
      await PushNotifications.addListener('registration', async (tokenData) => {
        console.log('Token FCM nativo obtido:', tokenData.value?.substring(0, 30) + '...');
        const plataforma = Capacitor.getPlatform(); // 'ios' ou 'android'
        
        // Sempre inscrever no tópico (não precisa de login)
        await inscreverNoTopico(tokenData.value);
        // Salvar no banco (com ou sem login)
        await salvarTokenNoSupabase(tokenData.value, plataforma);
      });

      await PushNotifications.addListener('registrationError', (error) => {
        console.error('Erro ao registrar push nativo:', error);
      });

      // Listener de notificações recebidas com app aberto (nativo)
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Notificação nativa recebida em foreground:', notification);
        toast({
          title: notification.title || 'Nova notificação',
          description: notification.body || '',
        });
      });

      await PushNotifications.register();
    } catch (error) {
      console.error('Erro ao registrar push nativo:', error);
    }
  };

  const registrarWeb = async () => {
    const token = await solicitarPermissaoNotificacao();
    if (token) {
      console.log('Token FCM web registrado com sucesso');
    }
  };

  const configurarForeground = async () => {
    // Foreground listener apenas para web (nativo já tem listener próprio)
    if (Capacitor.isNativePlatform()) return;

    try {
      const unsub = await escutarNotificacoesForeground((payload) => {
        toast({
          title: payload.notification?.title || 'Nova notificação',
          description: payload.notification?.body || '',
        });
      });

      if (unsub) {
        unsubForegroundRef.current = unsub;
      }
    } catch (error) {
      console.error('Erro ao configurar listener foreground:', error);
    }
  };
}
