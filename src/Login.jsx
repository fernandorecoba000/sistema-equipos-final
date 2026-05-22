import { useState } from 'react';
import { supabase } from './supabaseClient'; // Asegúrate de tener este archivo bien configurado

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        alert("Error al entrar: " + error.message);
    } else {
        window.location.reload(); // Recarga para entrar al sistema
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
      <h2>Bienvenido al Sistema</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Contraseña" onChange={(e) => setPassword(e.target.value)} />
        <button disabled={loading}>{loading ? 'Entrando...' : 'Iniciar Sesión'}</button>
      </form>
    </div>
  );
}