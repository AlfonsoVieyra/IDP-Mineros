"use server";

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Por favor ingresa correo y contraseña.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Error signing in:", error.message);
    return { error: 'Credenciales inválidas. Verifica tu correo y contraseña.' };
  }

  // Verificar el rol para redirigir
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single();

    revalidatePath('/', 'layout');

    if (usuario?.rol === 'jugador') {
      redirect('/progreso');
    } else {
      redirect('/');
    }
  }

  redirect('/');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
