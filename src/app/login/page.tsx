"use client";

import { useState } from 'react';
import { signIn } from './actions';
import { Lock, Mail, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    setError(null);
    try {
      const result = await signIn(formData);
      if (result?.error) {
        setError(result.error);
        setIsPending(false);
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Por favor intenta de nuevo.');
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0b] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decorators */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#111424] border border-white/5 rounded-2xl shadow-2xl relative z-10 overflow-hidden">
        
        {/* Header */}
        <div className="p-8 pb-6 text-center border-b border-white/5 bg-white/5">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-primary-500/20">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight uppercase">
            IDP Mineros
          </h1>
          <p className="text-sm text-gray-400 mt-2 font-medium">
            Plataforma de Desarrollo Individual
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form action={handleSubmit} className="space-y-5">
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold px-4 py-3 rounded-lg flex items-center gap-2">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                Correo Institucional
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="email" 
                  name="email"
                  required
                  placeholder="tu@correo.com"
                  className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="password" 
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={isPending}
                className="w-full bg-primary-700 hover:bg-primary-600 text-white border-2 border-transparent dark:bg-transparent dark:border-primary-500 dark:text-primary-500 dark:hover:bg-primary-600 dark:hover:text-white dark:shadow-[0_0_15px_rgba(212,64,99,0.4)] font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>VERIFICANDO...</span>
                  </>
                ) : (
                  'INICIAR SESIÓN'
                )}
              </button>
            </div>
            
            <p className="text-center text-xs text-gray-500 font-medium pt-4">
              ¿No tienes cuenta? Solicita acceso al Cuerpo Técnico.
            </p>
          </form>
        </div>
      </div>
      
    </div>
  );
}
