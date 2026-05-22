import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Intentamos el inicio de sesión
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert("Error al entrar: " + error.message);
      setLoading(false);
      return;
    }

    // 2. Si es exitoso, buscamos el rol en la tabla "perfiles"
    try {
      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('email', email)
        .single();

      if (perfil) {
        // Guardamos el rol para usarlo en otras partes de la app
        localStorage.setItem('userRole', perfil.rol);
      } else {
        // Si no se encuentra en perfiles, por seguridad asumimos técnico
        localStorage.setItem('userRole', 'tecnico');
      }
    } catch (err) {
      console.error("Error al obtener el rol:", err);
      localStorage.setItem('userRole', 'tecnico');
    }

    // 3. Recargamos para que el sistema detecte el usuario logueado
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
      <h2>Bienvenido al Sistema</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          type="email" 
          placeholder="Email" 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <button disabled={loading}>{loading ? 'Entrando...' : 'Iniciar Sesión'}</button>
      </form>
    </div>
  );
}