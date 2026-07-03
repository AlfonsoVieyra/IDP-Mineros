"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Target, User, ShieldAlert, LogOut, Sun, Moon, Menu, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { signOut } from '@/app/login/actions';
import { useTheme } from 'next-themes';

export default function TopNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<'entrenador' | 'jugador' | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    { name: 'Objetivos', href: '/' },
    { name: 'Progreso Individual', href: '/progreso' },
    { name: 'Videoteca', href: '/videoteca' },
  ];

  useEffect(() => {
    setMounted(true);
    
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('usuarios')
          .select('nombre, apellidos, rol')
          .eq('id', user.id)
          .single();
          
        if (data) {
          const u = data as any;
          setRole(u.rol);
          setUserName(u.apellidos ? `${u.nombre} ${u.apellidos}` : u.nombre);
        }
      }
    }
    
    loadUser();
  }, [supabase]);

  // Si estamos en la página de login, no mostrar la navegación
  if (pathname === '/login') return null;

  return (
    <>
    <header className="w-full h-16 border-b border-gray-200 dark:border-border-accent/30 bg-white dark:bg-background flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
      <div className="flex items-center gap-3">
        <div className="bg-primary-600 p-2 rounded-lg text-white">
          <Target size={20} />
        </div>
        <span className="font-bold text-lg tracking-tight">
          IDP <span className="text-primary-600">MINEROS</span>
        </span>
      </div>
      
      <nav className="hidden md:flex items-center gap-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          // Si el rol es jugador y es la página principal '/', no la renderizamos
          if (role === 'jugador' && item.href === '/') return null;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary-500 ${
                isActive ? 'text-primary-600 dark:text-primary-400 font-semibold' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
        {/* Visualización del Rol Activo */}
        {mounted && role && (
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              role === 'entrenador' 
                ? 'bg-primary-950/40 border border-primary-500/30 text-primary-400' 
                : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400'
            }`}>
              {role === 'entrenador' ? (
                <>
                  <ShieldAlert size={14} />
                  <span>Míster: {userName}</span>
                </>
              ) : (
                <>
                  <User size={14} />
                  <span>Jugador: {userName}</span>
                </>
              )}
            </div>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 border border-gray-200 dark:border-border-accent/30 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-500 dark:text-gray-400"
              aria-label="Alternar modo oscuro"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <form action={signOut}>
              <button 
                type="submit"
                className="text-xs border border-gray-200 dark:border-border-accent/30 rounded-lg px-3 py-1.5 hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-500/20 hover:border-red-500/30 transition-all text-white font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <LogOut size={14} /> Salir
              </button>
            </form>

            {/* Botón hamburguesa móvil */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 border border-gray-200 dark:border-border-accent/30 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-500 dark:text-gray-400 cursor-pointer"
              aria-label="Menú"
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        )}
      </div>
    </header>

    {/* Menú desplegable móvil */}
    {mobileMenuOpen && (
      <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-[#0b0f19] border-b border-gray-200 dark:border-border-accent/30 flex flex-col p-4 space-y-2.5 z-50 shadow-xl animate-in slide-in-from-top-2 duration-200">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          if (role === 'jugador' && item.href === '/') return null;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm font-bold py-2.5 px-4 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-white/5 hover:text-primary-500 flex items-center ${
                isActive ? 'text-primary-600 dark:text-primary-400 bg-primary-500/5' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </div>
    )}
    </>
  );
}
