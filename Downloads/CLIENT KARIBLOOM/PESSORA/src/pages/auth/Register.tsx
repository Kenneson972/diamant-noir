// src/pages/auth/Register.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@heroui/react';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerUser({ email, password, firstName, lastName });
      navigate('/mon-espace');
    } catch {
      setError('Impossible de créer le compte. Vérifiez vos informations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <Link
          to="/"
          className="block text-center font-display font-light text-[28px] tracking-[0.28em] uppercase text-black mb-10"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Pessóra
        </Link>
        <Card className="bg-white rounded-[16px] border border-black/[0.06] shadow-none">
          <CardContent className="p-8 gap-0">
            <h1
              className="font-display font-light text-[32px] leading-none text-black mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Créer un compte
            </h1>
            <p className="text-[11px] text-black/38 mb-8">Rejoignez la communauté Pessóra</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <User
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-black/35 pointer-events-none"
                    strokeWidth={1.5}
                  />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Prénom"
                    required
                    className="w-full h-10 pl-9 pr-3 border border-black/15 rounded-lg text-[13px] bg-white placeholder:text-black/30 focus:outline-none focus:border-black/40 transition-colors"
                  />
                </div>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Nom"
                    required
                    className="w-full h-10 pl-3 pr-3 border border-black/15 rounded-lg text-[13px] bg-white placeholder:text-black/30 focus:outline-none focus:border-black/40 transition-colors"
                  />
                </div>
              </div>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-black/35 pointer-events-none"
                  strokeWidth={1.5}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Adresse email"
                  required
                  className="w-full h-10 pl-9 pr-3 border border-black/15 rounded-lg text-[13px] bg-white placeholder:text-black/30 focus:outline-none focus:border-black/40 transition-colors"
                />
              </div>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-black/35 pointer-events-none"
                  strokeWidth={1.5}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  required
                  className="w-full h-10 pl-9 pr-3 border border-black/15 rounded-lg text-[13px] bg-white placeholder:text-black/30 focus:outline-none focus:border-black/40 transition-colors"
                />
              </div>
              {error && (
                <p className="text-[11px] text-red-500" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-black text-white text-[11px] font-normal tracking-[0.12em] uppercase h-11 mt-2 hover:bg-black/85 transition-colors disabled:opacity-50"
              >
                {loading ? 'Création…' : 'Créer mon compte'}
              </button>
            </form>
            <p className="text-[11px] text-black/38 text-center mt-6">
              Déjà membre ?{' '}
              <Link to="/connexion" className="text-black border-b border-black/30 pb-px">
                Se connecter
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
