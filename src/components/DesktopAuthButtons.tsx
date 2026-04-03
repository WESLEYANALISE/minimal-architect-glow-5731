import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, User } from 'lucide-react';

export function DesktopAuthButtons() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/auth?mode=login')}
          className="text-white/90 hover:text-white hover:bg-white/10 font-medium"
        >
          <LogIn className="w-4 h-4 mr-1.5" />
          Login
        </Button>
        <Button
          size="sm"
          onClick={() => navigate('/auth?mode=signup')}
          className="bg-white text-[#8B0000] hover:bg-white/90 font-medium rounded-full px-4"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          Quero ser Aluno(a)!
        </Button>
      </div>
    );
  }

  // Logged in: show Perfil button
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/perfil')}
        className="text-white/90 hover:text-white hover:bg-white/10 font-medium"
      >
        <User className="w-4 h-4 mr-1.5" />
        Perfil
      </Button>
    </div>
  );
}
