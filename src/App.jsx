import React, { useState, useEffect } from 'react';
import { supabase } from './config/supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';

// ============================================================
// COMPONENTE LOGIN
// ============================================================
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', width: '100%', maxWidth: '380px' }}>
        <h1 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>⚙️ Taller Tracker</h1>
        <p style={{ margin: '0 0 28px 0', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Ingresá con tu cuenta para continuar.</p>

        {error && (
          <div style={{ padding: '10px 14px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', color: '#1e293b', backgroundColor: '#ffffff', width: '100%', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', color: '#1e293b', backgroundColor: '#ffffff', width: '100%', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '12px', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', marginTop: '4px' }}
          >
            {loading ? 'Ingresando...' : '🔐 Ingresar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL APP
// ============================================================
export default function App() {
  // ── SESIÓN ──
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Mientras verifica la sesión
  if (loadingSession) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', backgroundColor: '#f8fafc' }}>
        <p style={{ color: '#64748b', fontWeight: '600' }}>Verificando sesión...</p>
      </div>
    );
  }

  // Si no hay sesión, mostrar login
  if (!session) return <Login />;

  // ── RESTO DE ESTADOS (solo se ejecutan si hay sesión) ──
  return <AppContent session={session} />;
}

// ============================================================
// CONTENIDO PRINCIPAL (separado para que los hooks no rompan)
// ============================================================
function AppContent({ session }) {
  const [userRole, setUserRole] = useState('admin');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchEquipo, setSearchEquipo] = useState('');
  const [searchCliente, setSearchCliente] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  const [metricas, setMetricas] = useState({ disponibles: 0, enReparacion: 0, enClientes: 0, deBaja: 0, totalEquipos: 0 });
  const [porCategoria, setPorCategoria] = useState({});
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const [listaInstalaciones, setListaInstalaciones] = useState([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [infoEquipoSeleccionado, setInfoEquipoSeleccionado] = useState(null);
  const [historialReparaciones, setHistorialReparaciones] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [historialLocaciones, setHistorialLocaciones] = useState([]);
  const [nuevoDestinoTraslado, setNuevoDestinoTraslado] = useState('En Base Principal');
  const [loadingTraslado, setLoadingTraslado] = useState(false);

  const [listaClientes, setListaClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [equiposDelCliente, setEquiposDelCliente] = useState([]);
  const [formCliente, setFormCliente] = useState({ nombre: '', direccion: '', telefono: '' });
  const [msgCliente, setMsgCliente] = useState({ tipo: '', texto: '' });

  const [formEquipo, setFormEquipo] = useState({ id_codigo: '', marca: '', modelo: '', cliente_asociado: 'En Base Principal', estado: 'disponible' });
  const [msgEquipo, setMsgEquipo] = useState({ tipo: '', texto: '' });

  const [formData, setFormData] = useState({ instalacion_id: '', descripcion_falla: '', solucion: '', costo: 0 });
  const [loadingService, setLoadingService] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [vistaServiceMode, setVistaServiceMode] = useState('formulario');

  useEffect(() => {
    let scanner = null;
    if (showScanner) {
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true }, false);
      scanner.render((decodedText) => {
        let idDetectado = decodedText;
        if (decodedText.includes('?eq=')) idDetectado = decodedText.split('?eq=')[1];
        setShowScanner(false);
        scanner.clear();
        setActiveTab('instalaciones');
        cargarHistorialEquipo(idDetectado);
      }, () => {});
    }
    return () => { if (scanner) { try { scanner.clear(); } catch(e) {} } };
  }, [showScanner]);

  const cargarDatosDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const { data: equipos, error } = await supabase.from('instalaciones').select('*');
      if (error) throw error;
      if (equipos) {
        let disp = 0, rep = 0, clie = 0, baja = 0, categorias = {};
        equipos.forEach(equipo => {
          const est = equipo.estado?.toLowerCase();
          if (est === 'disponible') disp++;
          else if (est === 'en_reparacion' || est === 'en reparacion') rep++;
          else if (est === 'en_cliente' || est === 'en cliente') clie++;
          else if (est === 'de_baja' || est === 'de baja') baja++;
          let cat = 'Otros';
          const codigo = equipo.id_codigo?.toUpperCase() || '';
          if (codigo.startsWith('HRN')) cat = 'Hornos';
          else if (codigo.startsWith('FRZ') || codigo.startsWith('FRE')) cat = 'Freezers';
          else if (codigo.startsWith('MAQ')) cat = 'Máquinas';
          if (!categorias[cat]) categorias[cat] = { disponibles: 0, enReparacion: 0, enClientes: 0, deBaja: 0, total: 0 };
          categorias[cat].total++;
          if (est === 'disponible') categorias[cat].disponibles++;
          else if (est === 'en_reparacion' || est === 'en reparacion') categorias[cat].enReparacion++;
          else if (est === 'en_cliente' || est === 'en cliente') categorias[cat].enClientes++;
          else if (est === 'de_baja' || est === 'de baja') categorias[cat].deBaja++;
        });
        setMetricas({ disponibles: disp, enReparacion: rep, enClientes: clie, deBaja: baja, totalEquipos: equipos.length });
        setPorCategoria(categorias);
      }
    } catch (error) { console.error(error.message); }
    finally { setLoadingDashboard(false); }
  };

  const cargarInstalaciones = async () => {
    try {
      const { data, error } = await supabase.from('instalaciones').select('*').order('id_codigo', { ascending: true });
      if (error) throw error;
      setListaInstalaciones(data || []);
    } catch (error) { console.error(error.message); }
  };

  const cargarHistorialEquipo = async (equipoId) => {
    setLoadingHistorial(true);
    setEquipoSeleccionado(equipoId);
    try {
      const { data: eqData, error: eqError } = await supabase.from('instalaciones').select('*').eq('id_codigo', equipoId).maybeSingle();
      if (eqError) throw eqError;
      setInfoEquipoSeleccionado(eqData);
      if (eqData) setNuevoDestinoTraslado(eqData.cliente_asociado || 'En Base Principal');
      const { data: repData, error: repError } = await supabase.from('reparaciones').select('*').eq('instalacion_id', equipoId).order('fecha', { ascending: false });
      if (repError) throw repError;
      setHistorialReparaciones(repData || []);
      const { data: locData, error: locError } = await supabase.from('historial_locaciones').select('*').eq('instalacion_id', equipoId).order('fecha', { ascending: false });
      if (locError) throw locError;
      setHistorialLocaciones(locData || []);
    } catch (error) { console.error(error.message); }
    finally { setLoadingHistorial(false); }
  };

  const manejarNavegacionInteligente = (idCodigo) => {
    setActiveTab('instalaciones');
    setTimeout(() => cargarHistorialEquipo(idCodigo), 100);
  };

  const handleTrasladarEquipo = async (e) => {
    e.preventDefault();
    if (!equipoSeleccionado || !infoEquipoSeleccionado) return;
    const origenActual = infoEquipoSeleccionado.cliente_asociado || 'En Base Principal';
    if (origenActual === nuevoDestinoTraslado) { alert("El equipo ya se encuentra en ese destino."); return; }
    setLoadingTraslado(true);
    try {
      const nuevoEstado = nuevoDestinoTraslado === 'En Base Principal' ? 'disponible' : 'en_cliente';
      const { error: errorUpdate } = await supabase.from('instalaciones').update({ cliente_asociado: nuevoDestinoTraslado, estado: nuevoEstado }).eq('id_codigo', equipoSeleccionado);
      if (errorUpdate) throw errorUpdate;
      const { error: errorLog } = await supabase.from('historial_locaciones').insert([{ instalacion_id: equipoSeleccionado, cliente_anterior: origenActual, cliente_nuevo: nuevoDestinoTraslado, tecnico_movio: userRole === 'admin' ? 'Admin (Traslado Manual)' : 'Técnico en Calle' }]);
      if (errorLog) throw errorLog;
      alert(`🚚 Equipo ${equipoSeleccionado} trasladado a: ${nuevoDestinoTraslado}`);
      await cargarInstalaciones();
      await cargarHistorialEquipo(equipoSeleccionado);
    } catch (error) { alert("Error: " + error.message); }
    finally { setLoadingTraslado(false); }
  };

  const darDeBajaEquipo = async (equipoId) => {
    if (!window.confirm(`¿Dar de baja definitiva el equipo ${equipoId}?`)) return;
    try {
      const { error } = await supabase.from('instalaciones').update({ estado: 'de_baja', cliente_asociado: '❌ BAJA / CHATARRA DEFINITIVA' }).eq('id_codigo', equipoId);
      if (error) throw error;
      await supabase.from('historial_locaciones').insert([{ instalacion_id: equipoId, cliente_anterior: infoEquipoSeleccionado?.cliente_asociado || 'Desconocido', cliente_nuevo: '❌ BAJA / CHATARRA DEFINITIVA', tecnico_movio: userRole }]);
      alert(`El equipo ${equipoId} fue pasado a Chatarra.`);
      setEquipoSeleccionado(null);
      cargarInstalaciones();
    } catch (error) { alert("Error: " + error.message); }
  };

  const descargarRespaldo = async () => {
    try {
      const { data: instalaciones } = await supabase.from('instalaciones').select('*');
      const { data: reparaciones } = await supabase.from('reparaciones').select('*');
      const { data: clientes } = await supabase.from('clientes').select('*');
      const respaldo = { fecha: new Date().toISOString(), instalaciones, reparaciones, clientes };
      const blob = new Blob([JSON.stringify(respaldo, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_taller_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert("✅ Respaldo descargado.");
    } catch (error) { alert("❌ Error: " + error.message); }
  };

  const cargarClientes = async () => {
    try {
      const { data, error } = await supabase.from('clientes').select('*').order('nombre', { ascending: true });
      if (error) throw error;
      setListaClientes(data || []);
    } catch (error) { console.error(error.message); }
  };

  const seleccionarCliente = async (cliente) => {
    setClienteSeleccionado(cliente);
    try {
      const { data, error } = await supabase.from('instalaciones').select('*').eq('cliente_asociado', cliente.nombre);
      if (error) throw error;
      setEquiposDelCliente(data || []);
    } catch (error) { console.error(error.message); }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') cargarDatosDashboard();
    if (activeTab === 'instalaciones') { cargarInstalaciones(); cargarClientes(); }
    if (activeTab === 'clientes' || activeTab === 'alta') { cargarClientes(); setClienteSeleccionado(null); setEquiposDelCliente([]); }
    if (activeTab === 'service') cargarInstalaciones();
  }, [activeTab]);

  useEffect(() => {
    if (userRole === 'tecnico' && activeTab !== 'instalaciones' && activeTab !== 'service') setActiveTab('instalaciones');
  }, [userRole]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmitService = async (e) => {
    e.preventDefault();
    setLoadingService(true);
    setMensaje({ tipo: '', texto: '' });
    const idReparacionNumerico = Math.floor(100000 + Math.random() * 900000);
    try {
      const { error: errorReparacion } = await supabase.from('reparaciones').insert([{ id_codigo: idReparacionNumerico, instalacion_id: formData.instalacion_id, descripcion_falla: formData.descripcion_falla, solucion: formData.solucion, costo: parseFloat(formData.costo) || 0 }]);
      if (errorReparacion) throw errorReparacion;
      const nuevoEstado = formData.solucion && formData.solucion.trim() !== '' ? 'disponible' : 'en_reparacion';
      const { error: errorEstado } = await supabase.from('instalaciones').update({ estado: nuevoEstado }).eq('id_codigo', formData.instalacion_id);
      if (errorEstado) throw errorEstado;
      setMensaje({ tipo: 'exito', texto: '¡Service registrado con éxito!' });
      setFormData({ instalacion_id: '', descripcion_falla: '', solucion: '', costo: 0 });
      cargarInstalaciones();
    } catch (error) { setMensaje({ tipo: 'error', texto: `Error: ${error.message}` }); }
    finally { setLoadingService(false); }
  };

  const accionarCierreDesdeTaller = (equipo) => {
    setFormData({ instalacion_id: equipo.id_codigo, descripcion_falla: 'Mantenimiento en Taller / Reparación pendiente', solucion: '', costo: 0 });
    setVistaServiceMode('formulario');
  };

  const handleClienteChange = (e) => setFormCliente({ ...formCliente, [e.target.name]: e.target.value });

  const handleSubmitCliente = async (e) => {
    e.preventDefault();
    setMsgCliente({ tipo: '', texto: '' });
    try {
      const { error } = await supabase.from('clientes').insert([formCliente]);
      if (error) throw error;
      setMsgCliente({ tipo: 'exito', texto: '¡Cliente registrado!' });
      setFormCliente({ nombre: '', direccion: '', telefono: '' });
      cargarClientes();
    } catch (error) { setMsgCliente({ tipo: 'error', texto: error.message }); }
  };

  const handleSubmitEquipo = async (e) => {
    e.preventDefault();
    setMsgEquipo({ tipo: '', texto: '' });
    try {
      const { error } = await supabase.from('instalaciones').insert([formEquipo]);
      if (error) throw error;
      await supabase.from('historial_locaciones').insert([{ instalacion_id: formEquipo.id_codigo, cliente_anterior: 'Fábrica / Compra', cliente_nuevo: formEquipo.cliente_asociado, tecnico_movio: 'Admin (Alta Sistema)' }]);
      setMsgEquipo({ tipo: 'exito', texto: `¡Equipo ${formEquipo.id_codigo} incorporado!` });
      setFormEquipo({ id_codigo: '', marca: '', modelo: '', cliente_asociado: 'En Base Principal', estado: 'disponible' });
    } catch (error) { setMsgEquipo({ tipo: 'error', texto: error.message }); }
  };

  const equiposFiltrados = listaInstalaciones.filter(eq => {
    const coincide = eq.id_codigo?.toLowerCase().includes(searchEquipo.toLowerCase()) || eq.cliente_asociado?.toLowerCase().includes(searchEquipo.toLowerCase());
    const operativo = eq.estado?.toLowerCase() !== 'de_baja' && eq.estado?.toLowerCase() !== 'de baja';
    return coincide && operativo;
  });

  const equiposEnTaller = listaInstalaciones.filter(eq => eq.estado?.toLowerCase() === 'en_reparacion' || eq.estado?.toLowerCase() === 'en reparacion');
  const clientesFiltrados = listaClientes.filter(cli => cli.nombre?.toLowerCase().includes(searchCliente.toLowerCase()) || cli.direccion?.toLowerCase().includes(searchCliente.toLowerCase()));

  const imprimirQR = () => {
    const contenidoQR = document.getElementById('qr-to-print').innerHTML;
    const ventana = window.open('', '', 'width=400,height=400');
    ventana.document.write(`<html><head><title>QR - ${equipoSeleccionado}</title></head><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:90vh;font-family:sans-serif;margin:0;">${contenidoQR}<h2 style="margin-top:15px;font-size:24px;">ID: ${equipoSeleccionado}</h2><script>window.print();window.close();</script></body></html>`);
    ventana.document.close();
  };

  const getBadgeStyle = (estado) => {
    const est = estado?.toLowerCase();
    let bg = '#f1f3f4', color = '#334155';
    if (est === 'disponible') { bg = '#e6f4ea'; color = '#137333'; }
    else if (est === 'en_reparacion' || est === 'en reparacion') { bg = '#fce8e6'; color = '#c5221f'; }
    else if (est === 'en_cliente' || est === 'en cliente') { bg = '#e8f0fe'; color = '#1a73e8'; }
    else if (est === 'de_baja' || est === 'de baja') { bg = '#3c4043'; color = '#ffffff'; }
    return { padding: '4px 8px', borderRadius: '4px', backgroundColor: bg, color, fontWeight: 'bold', fontSize: '12px', display: 'inline-block' };
  };

  return (
    <div style={styles.container}>

      {/* BARRA SUPERIOR */}
      <div style={styles.roleBar}>
        <h1 style={{ color: '#1e293b', margin: 0, fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>⚙️ Taller Tracker</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* USUARIO LOGUEADO */}
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>👤 {session.user.email}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}
          >
            Cerrar Sesión
          </button>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>|</span>
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            style={{ ...styles.selectInput, width: 'auto', padding: '6px 12px', fontSize: '13px', backgroundColor: userRole === 'admin' ? '#e0f2fe' : '#fef3c7', color: userRole === 'admin' ? '#0369a1' : '#b45309', borderColor: userRole === 'admin' ? '#bae6fd' : '#fde68a' }}
          >
            <option value="admin">😎 Administrador</option>
            <option value="tecnico">🔧 Técnico</option>
          </select>
        </div>
      </div>

      {/* MODAL ESCÁNER */}
      {showScanner && (
        <div style={styles.scannerModalOverlay}>
          <div style={styles.scannerModalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>🎥 Escanear QR con Cámara</h3>
              <button onClick={() => setShowScanner(false)} style={{ ...styles.secondaryButton, backgroundColor: '#fee2e2', color: '#991b1b', border: 'none' }}>Cerrar</button>
            </div>
            <div id="reader" style={{ width: '100%', borderRadius: '8px', overflow: 'hidden' }}></div>
          </div>
        </div>
      )}

      {/* PESTAÑAS */}
      <div style={styles.tabsContainer}>
        {userRole === 'admin' && <button style={{ ...styles.tabButton, ...(activeTab === 'dashboard' ? styles.activeTabButton : {}) }} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</button>}
        <button style={{ ...styles.tabButton, ...(activeTab === 'instalaciones' ? styles.activeTabButton : {}) }} onClick={() => setActiveTab('instalaciones')}>🏢 Instalaciones</button>
        {userRole === 'admin' && <button style={{ ...styles.tabButton, ...(activeTab === 'clientes' ? styles.activeTabButton : {}) }} onClick={() => setActiveTab('clientes')}>👥 Clientes</button>}
        <button style={{ ...styles.tabButton, ...(activeTab === 'service' ? styles.activeTabButton : {}) }} onClick={() => { setActiveTab('service'); setVistaServiceMode('formulario'); }}>🔧 Registrar Service</button>
        {userRole === 'admin' && <button style={{ ...styles.tabButton, ...(activeTab === 'alta' ? styles.activeTabButton : {}) }} onClick={() => setActiveTab('alta')}>➕ Alta Nuevos</button>}
      </div>

      <div style={styles.tabContent}>

        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && userRole === 'admin' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={styles.sectionTitle}>Resumen del Estado General</h2>
                <p style={styles.sectionSubtitle}>Métricas calculadas en tiempo real desde Supabase.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={cargarDatosDashboard} style={styles.secondaryButton}>🔄 Actualizar</button>
                <button onClick={descargarRespaldo} style={{ ...styles.secondaryButton, backgroundColor: '#0f172a', color: '#ffffff' }}>💾 Backup</button>
              </div>
            </div>
            {loadingDashboard ? <p style={styles.loadingText}>Consultando base de datos...</p> : (
              <>
                <div style={styles.gridDashboard}>
                  <div style={{ ...styles.cardMetrica, backgroundColor: '#f0fdf4', borderLeft: '6px solid #16a34a' }}>
                    <h3 style={{ ...styles.cardMetricaTitle, color: '#16a34a' }}>🟢 Disponibles</h3>
                    <span style={{ ...styles.cardMetricaValue, color: '#15803d' }}>{metricas.disponibles}</span>
                  </div>
                  <div style={{ ...styles.cardMetrica, backgroundColor: '#fef2f2', borderLeft: '6px solid #dc2626' }}>
                    <h3 style={{ ...styles.cardMetricaTitle, color: '#dc2626' }}>🔴 En Reparación</h3>
                    <span style={{ ...styles.cardMetricaValue, color: '#b91c1c' }}>{metricas.enReparacion}</span>
                  </div>
                  <div style={{ ...styles.cardMetrica, backgroundColor: '#eff6ff', borderLeft: '6px solid #2563eb' }}>
                    <h3 style={{ ...styles.cardMetricaTitle, color: '#2563eb' }}>🔵 En Clientes</h3>
                    <span style={{ ...styles.cardMetricaValue, color: '#1d4ed8' }}>{metricas.enClientes}</span>
                  </div>
                  <div style={{ ...styles.cardMetrica, backgroundColor: '#f8fafc', borderLeft: '6px solid #64748b' }}>
                    <h3 style={{ ...styles.cardMetricaTitle, color: '#64748b' }}>⚫ Chatarra / Bajas</h3>
                    <span style={{ ...styles.cardMetricaValue, color: '#475569' }}>{metricas.deBaja}</span>
                  </div>
                </div>
                <h3 style={{ ...styles.sectionTitle, marginTop: '40px', fontSize: '18px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>📋 Distribución por Tipo de Equipo</h3>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.tableHeaderCell}>Categoría</th>
                      <th style={styles.tableHeaderCell}>Disponibles</th>
                      <th style={styles.tableHeaderCell}>En Reparación</th>
                      <th style={styles.tableHeaderCell}>En Clientes</th>
                      <th style={styles.tableHeaderCell}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(porCategoria).map((cat) => (
                      <tr key={cat} style={styles.tableBodyRow}>
                        <td style={{ ...styles.tableBodyCell, fontWeight: '700', color: '#1e293b' }}>{cat}</td>
                        <td style={{ ...styles.tableBodyCell, color: '#16a34a', fontWeight: '600' }}>{porCategoria[cat].disponibles}</td>
                        <td style={{ ...styles.tableBodyCell, color: '#dc2626', fontWeight: '600' }}>{porCategoria[cat].enReparacion}</td>
                        <td style={{ ...styles.tableBodyCell, color: '#2563eb', fontWeight: '600' }}>{porCategoria[cat].enClientes}</td>
                        <td style={{ ...styles.tableBodyCell, fontWeight: '800', color: '#1e293b' }}>{porCategoria[cat].total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ── INSTALACIONES ── */}
        {activeTab === 'instalaciones' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <h2 style={styles.sectionTitle}>Control de Instalaciones Físicas</h2>
                <p style={styles.sectionSubtitle}>Gestioná la ubicación de tus activos y realizá seguimientos de traslados.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => setShowScanner(true)} style={{ ...styles.primaryButton, backgroundColor: '#6366f1', width: 'auto' }}>📷 Escanear QR</button>
                <input type="text" placeholder="🔍 Buscar por ID o Cliente..." value={searchEquipo} onChange={(e) => setSearchEquipo(e.target.value)} style={{ ...styles.textInput, width: '220px', margin: 0 }} />
              </div>
            </div>
            <div style={styles.columnsLayout}>
              <div style={{ flex: 1.1 }}>
                <h3 style={{ color: '#334155', fontSize: '15px', fontWeight: '700', marginBottom: '10px' }}>📦 Listado de Activos</h3>
                <div style={styles.tableScrollWrapper}>
                  <table style={styles.table}>
                    <thead style={styles.stickyHeader}>
                      <tr style={styles.tableHeaderRow}>
                        <th style={styles.tableHeaderCell}>Código ID</th>
                        <th style={styles.tableHeaderCell}>Ubicación / Cliente</th>
                        <th style={styles.tableHeaderCell}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equiposFiltrados.map((equipo) => (
                        <tr key={equipo.id_codigo} onClick={() => cargarHistorialEquipo(equipo.id_codigo)}
                          style={{ ...styles.tableBodyRow, backgroundColor: equipoSeleccionado === equipo.id_codigo ? '#f0fdf4' : (hoveredRow === equipo.id_codigo ? '#f8fafc' : 'transparent'), borderLeft: equipoSeleccionado === equipo.id_codigo ? '4px solid #16a34a' : '4px solid transparent' }}
                          onMouseEnter={() => setHoveredRow(equipo.id_codigo)} onMouseLeave={() => setHoveredRow(null)}>
                          <td style={{ ...styles.tableBodyCell, fontWeight: '700', color: '#0284c7' }}>{equipo.id_codigo}</td>
                          <td style={{ ...styles.tableBodyCell, color: '#1e293b', fontWeight: '600' }}>{equipo.cliente_asociado || 'En Base Principal'}</td>
                          <td style={styles.tableBodyCell}><span style={getBadgeStyle(equipo.estado)}>{equipo.estado || 'disponible'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={styles.rightDetailPanel}>
                <h3 style={{ color: '#334155', fontSize: '15px', fontWeight: '700', marginBottom: '15px' }}>🩺 Historia Clínica y Locaciones</h3>
                {!equipoSeleccionado ? (
                  <div style={styles.emptyStateContainer}>Hacé clic en un equipo o usá la cámara para ver su historial y QR.</div>
                ) : loadingHistorial ? (
                  <p style={styles.loadingText}>Buscando historial de {equipoSeleccionado}...</p>
                ) : (
                  <div>
                    <div style={{ backgroundColor: '#e0f2fe', padding: '14px', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', gap: '15px' }}>
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1', display: 'block', marginBottom: '2px' }}>MARCA</span>
                          <span style={{ color: '#0f172a', fontWeight: '800', fontSize: '15px' }}>{infoEquipoSeleccionado?.marca || 'No especificada'}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1', display: 'block', marginBottom: '2px' }}>MODELO</span>
                          <span style={{ color: '#0f172a', fontWeight: '800', fontSize: '15px' }}>{infoEquipoSeleccionado?.modelo || 'No especificado'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={styles.qrPrintCard}>
                      <div id="qr-to-print" style={styles.qrContainerBox}>
                        <QRCodeSVG value={`${window.location.origin}/?eq=${equipoSeleccionado}`} size={110} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '15px', fontWeight: '700' }}>Sticker QR Identificador</h4>
                        <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#475569', fontWeight: '600' }}>ID: {equipoSeleccionado}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button onClick={imprimirQR} style={styles.primaryButton}>🖨️ Imprimir Sticker QR</button>
                          {userRole === 'admin' && <button onClick={() => darDeBajaEquipo(equipoSeleccionado)} style={{ ...styles.primaryButton, backgroundColor: '#dc2626' }}>🗑️ Dar de Baja Activo</button>}
                        </div>
                      </div>
                    </div>

                    <div style={{ ...styles.embeddedFormCard, backgroundColor: '#f5f3ff', borderColor: '#ddd6fe', marginBottom: '20px' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#6d28d9', fontSize: '14px', fontWeight: '700' }}>🚚 Registrar Traslado / Flete</h4>
                      <form onSubmit={handleTrasladarEquipo} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <select value={nuevoDestinoTraslado} onChange={e => setNuevoDestinoTraslado(e.target.value)} style={{ ...styles.selectInput, padding: '8px 12px' }}>
                            <option value="En Base Principal">🏠 Traer a Base Principal</option>
                            {listaClientes.map(cli => <option key={cli.id} value={cli.nombre}>🏢 {cli.nombre}</option>)}
                          </select>
                        </div>
                        <button type="submit" disabled={loadingTraslado} style={{ ...styles.primaryButton, backgroundColor: '#7c3aed', width: 'auto', padding: '10px 16px' }}>
                          {loadingTraslado ? 'Procesando...' : 'Confirmar Ruta'}
                        </button>
                      </form>
                    </div>

                    <h4 style={{ color: '#1e293b', fontSize: '13px', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>📋 Log de Reparaciones</h4>
                    {historialReparaciones.length === 0 ? (
                      <p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>Sin reparaciones registradas.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {historialReparaciones.map(rep => (
                          <div key={rep.id} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '600' }}>📅 {new Date(rep.fecha).toLocaleDateString()}</span>
                              <span style={{ fontWeight: 'bold', color: '#0f172a' }}>💰 ${rep.costo}</span>
                            </div>
                            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#1e293b' }}><strong>Falla:</strong> {rep.descripcion_falla}</p>
                            <p style={{ margin: 0, fontSize: '13px', color: '#16a34a' }}><strong>Solución:</strong> {rep.solucion || 'Pendiente en taller'}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <h4 style={{ color: '#1e293b', fontSize: '13px', fontWeight: '700', marginTop: '20px', marginBottom: '8px', textTransform: 'uppercase' }}>🚚 Trazabilidad de Locaciones</h4>
                    {historialLocaciones.length === 0 ? (
                      <p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>Sin movimientos registrados.</p>
                    ) : (
                      <div style={{ borderLeft: '2px dashed #cbd5e1', paddingLeft: '12px', marginLeft: '6px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {historialLocaciones.map(loc => (
                          <div key={loc.id} style={{ fontSize: '12px' }}>
                            <span style={{ display: 'block', fontWeight: 'bold', color: '#6d28d9' }}>{new Date(loc.fecha).toLocaleDateString()} {new Date(loc.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span style={{ color: '#334155' }}>De: <span style={{ color: '#64748b' }}>{loc.cliente_anterior}</span> ➔ <span style={{ color: '#0f172a', fontWeight: '600' }}>{loc.cliente_nuevo}</span></span>
                            <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>Por: {loc.tecnico_movio}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── CLIENTES ── */}
        {activeTab === 'clientes' && userRole === 'admin' && (
          <div style={styles.columnsLayout}>
            <div style={{ flex: 0.8, backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', height: 'fit-content' }}>
              <h3 style={{ ...styles.sectionTitle, fontSize: '16px', marginBottom: '15px' }}>👥 Registrar Nuevo Cliente</h3>
              <form onSubmit={handleSubmitCliente} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div><label style={styles.formLabel}>Nombre / Razón Social:</label><input type="text" name="nombre" value={formCliente.nombre} onChange={handleClienteChange} required style={styles.textInput} placeholder="Ej: Burger King Centro" /></div>
                <div><label style={styles.formLabel}>Dirección:</label><input type="text" name="direccion" value={formCliente.direccion} onChange={handleClienteChange} required style={styles.textInput} placeholder="Ej: Av. 18 de Julio 1234" /></div>
                <div><label style={styles.formLabel}>Teléfono:</label><input type="text" name="telefono" value={formCliente.telefono} onChange={handleClienteChange} style={styles.textInput} placeholder="Ej: 099123456" /></div>
                <button type="submit" style={styles.submitFormButton}>💾 Guardar en Base</button>
              </form>
              {msgCliente.texto && <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', backgroundColor: msgCliente.tipo === 'exito' ? '#dcfce7' : '#fee2e2', color: msgCliente.tipo === 'exito' ? '#15803d' : '#991b1b' }}>{msgCliente.texto}</div>}
            </div>

            <div style={{ flex: 1.2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#334155', fontSize: '15px', fontWeight: '700' }}>🏢 Directorio de Clientes</h3>
                <input type="text" placeholder="🔍 Filtrar..." value={searchCliente} onChange={(e) => setSearchCliente(e.target.value)} style={{ ...styles.textInput, width: '200px', margin: 0 }} />
              </div>
              <div style={styles.tableScrollWrapper}>
                <table style={styles.table}>
                  <thead><tr style={styles.tableHeaderRow}><th style={styles.tableHeaderCell}>Cliente</th><th style={styles.tableHeaderCell}>Dirección</th><th style={styles.tableHeaderCell}>Acción</th></tr></thead>
                  <tbody>
                    {clientesFiltrados.map(cli => (
                      <tr key={cli.id} style={styles.tableBodyRow}>
                        <td style={{ ...styles.tableBodyCell, fontWeight: '700', color: '#1e293b' }}>{cli.nombre}</td>
                        <td style={{ ...styles.tableBodyCell, color: '#334155' }}>{cli.direccion}</td>
                        <td style={styles.tableBodyCell}><button onClick={() => seleccionarCliente(cli)} style={{ ...styles.primaryButton, padding: '4px 10px', fontSize: '12px', width: 'auto' }}>🔎 Ver Activos</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {clienteSeleccionado && (
                <div style={{ marginTop: '20px', padding: '16px', borderRadius: '10px', border: '1px solid #bae6fd', backgroundColor: '#f0f9ff' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#0369a1', fontWeight: '800' }}>📋 Máquinas en: {clienteSeleccionado.nombre}</h4>
                  {equiposDelCliente.length === 0 ? <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>Sin máquinas asignadas.</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {equiposDelCliente.map(eq => (
                        <div key={eq.id} onClick={() => manejarNavegacionInteligente(eq.id_codigo)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>
                          <div>
                            <span style={{ fontWeight: '800', color: '#0284c7' }}>🆔 {eq.id_codigo}</span>
                            <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '600', marginLeft: '15px' }}>⚡ {eq.marca || 'S/M'} - {eq.modelo || 'S/M'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={getBadgeStyle(eq.estado)}>{eq.estado}</span>
                            <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: 'bold' }}>🔗 Ver Ficha ➔</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SERVICE ── */}
        {activeTab === 'service' && (
          <div>
            <div style={{ display: 'flex', borderBottom: '2px solid #cbd5e1', marginBottom: '20px', gap: '10px' }}>
              <button onClick={() => setVistaServiceMode('formulario')} style={{ padding: '10px 20px', cursor: 'pointer', border: 'none', borderBottom: vistaServiceMode === 'formulario' ? '3px solid #0284c7' : '3px solid transparent', backgroundColor: 'transparent', fontWeight: 'bold', color: vistaServiceMode === 'formulario' ? '#0284c7' : '#475569' }}>📝 Registrar Reparación</button>
              <button onClick={() => setVistaServiceMode('taller')} style={{ padding: '10px 20px', cursor: 'pointer', border: 'none', borderBottom: vistaServiceMode === 'taller' ? '3px solid #0284c7' : '3px solid transparent', backgroundColor: 'transparent', fontWeight: 'bold', color: vistaServiceMode === 'taller' ? '#0284c7' : '#475569' }}>🛠️ Tablero Taller ({equiposEnTaller.length})</button>
            </div>

            {vistaServiceMode === 'formulario' ? (
              <div style={{ maxWidth: '600px', backgroundColor: '#ffffff', padding: '25px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <h2 style={{ ...styles.sectionTitle, fontSize: '18px' }}>🛠️ Orden de Trabajo Técnico</h2>
                <p style={styles.sectionSubtitle}>El código de service se genera automáticamente.</p>
                <form onSubmit={handleSubmitService} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={styles.formLabel}>Equipo (Máquina):</label>
                    <select name="instalacion_id" value={formData.instalacion_id} onChange={handleChange} required style={styles.selectInput}>
                      <option value="">-- Seleccionar Equipo --</option>
                      {listaInstalaciones.map(eq => <option key={eq.id} value={eq.id_codigo}>{eq.id_codigo} ({eq.cliente_asociado || 'Base Principal'})</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={styles.formLabel}>Descripción de la Falla:</label>
                    <textarea name="descripcion_falla" value={formData.descripcion_falla} onChange={handleChange} required style={{ ...styles.textInput, height: '80px', resize: 'none' }} placeholder="¿Qué problema presenta el equipo?" />
                  </div>
                  <div>
                    <label style={styles.formLabel}>Solución Aplicada (vacío = queda en taller):</label>
                    <textarea name="solucion" value={formData.solucion} onChange={handleChange} style={{ ...styles.textInput, height: '80px', resize: 'none' }} placeholder="Trabajo realizado..." />
                  </div>
                  <div>
                    <label style={styles.formLabel}>Costo de Repuestos ($):</label>
                    <input type="number" name="costo" value={formData.costo} onChange={handleChange} required style={styles.textInput} />
                  </div>
                  <button type="submit" disabled={loadingService} style={styles.submitFormButton}>{loadingService ? 'Guardando...' : '💾 Subir Service a la Nube'}</button>
                </form>
                {mensaje.texto && <div style={{ marginTop: '15px', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', backgroundColor: mensaje.tipo === 'exito' ? '#dcfce7' : '#fee2e2', color: mensaje.tipo === 'exito' ? '#15803d' : '#991b1b' }}>{mensaje.texto}</div>}
              </div>
            ) : (
              <div>
                {equiposEnTaller.length === 0 ? <div style={styles.emptyStateContainer}>🟢 No hay equipos en taller actualmente.</div> : (
                  <table style={styles.table}>
                    <thead><tr style={styles.tableHeaderRow}><th style={styles.tableHeaderCell}>Código</th><th style={styles.tableHeaderCell}>Origen</th><th style={styles.tableHeaderCell}>Marca / Modelo</th><th style={styles.tableHeaderCell}>Estado</th><th style={styles.tableHeaderCell}>Acción</th></tr></thead>
                    <tbody>
                      {equiposEnTaller.map(eq => (
                        <tr key={eq.id_codigo} style={styles.tableBodyRow}>
                          <td style={{ ...styles.tableBodyCell, fontWeight: '700', color: '#dc2626' }}>{eq.id_codigo}</td>
                          <td style={{ ...styles.tableBodyCell, fontWeight: '600' }}>{eq.cliente_asociado || 'Taller'}</td>
                          <td style={{ ...styles.tableBodyCell, fontWeight: '600' }}>{eq.marca || 'S/M'} - {eq.modelo || 'S/M'}</td>
                          <td style={styles.tableBodyCell}><span style={getBadgeStyle(eq.estado)}>{eq.estado}</span></td>
                          <td style={styles.tableBodyCell}><button onClick={() => accionarCierreDesdeTaller(eq)} style={{ ...styles.primaryButton, backgroundColor: '#059669', padding: '6px 12px', fontSize: '12px', width: 'auto' }}>🔧 Cerrar Reparación</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ALTA NUEVOS ── */}
        {activeTab === 'alta' && userRole === 'admin' && (
          <div style={{ maxWidth: '600px' }}>
            <h2 style={styles.sectionTitle}>➕ Incorporación de Nuevos Activos</h2>
            <form onSubmit={handleSubmitEquipo} style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <div>
                <label style={styles.formLabel}>Código ID (ID_CÓDIGO):</label>
                <input type="text" value={formEquipo.id_codigo} onChange={e => setFormEquipo({ ...formEquipo, id_codigo: e.target.value.toUpperCase() })} required style={styles.textInput} placeholder="Ej: HRN-9011, FRZ-5022" />
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}><label style={styles.formLabel}>Marca:</label><input type="text" value={formEquipo.marca} onChange={e => setFormEquipo({ ...formEquipo, marca: e.target.value })} style={styles.textInput} placeholder="Ej: Rational" /></div>
                <div style={{ flex: 1 }}><label style={styles.formLabel}>Modelo:</label><input type="text" value={formEquipo.modelo} onChange={e => setFormEquipo({ ...formEquipo, modelo: e.target.value })} style={styles.textInput} placeholder="Ej: SCC 61" /></div>
              </div>
              <div>
                <label style={styles.formLabel}>Ubicación Inicial:</label>
                <select value={formEquipo.cliente_asociado} onChange={e => setFormEquipo({ ...formEquipo, cliente_asociado: e.target.value })} style={styles.selectInput}>
                  <option value="En Base Principal">🏠 Base Principal</option>
                  {listaClientes.map(cli => <option key={cli.id} value={cli.nombre}>🏢 {cli.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.formLabel}>Estado Inicial:</label>
                <select value={formEquipo.estado} onChange={e => setFormEquipo({ ...formEquipo, estado: e.target.value })} style={styles.selectInput}>
                  <option value="disponible">🟢 Disponible</option>
                  <option value="en_reparacion">🔴 En Reparación</option>
                  <option value="en_cliente">🔵 En Cliente</option>
                </select>
              </div>
              <button type="submit" style={{ ...styles.submitFormButton, backgroundColor: '#059669' }}>📥 Insertar en Supabase</button>
            </form>
            {msgEquipo.texto && <div style={{ marginTop: '15px', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', backgroundColor: msgEquipo.tipo === 'exito' ? '#dcfce7' : '#fee2e2', color: msgEquipo.tipo === 'exito' ? '#15803d' : '#991b1b' }}>{msgEquipo.texto}</div>}
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  container: { fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', padding: '0 0 40px 0', color: '#1e293b' },
  roleBar: { backgroundColor: '#ffffff', padding: '14px 24px', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' },
  tabsContainer: { display: 'flex', backgroundColor: '#ffffff', padding: '6px 24px 0 24px', borderBottom: '1px solid #cbd5e1', gap: '4px' },
  tabButton: { padding: '12px 18px', cursor: 'pointer', backgroundColor: 'transparent', border: 'none', borderBottom: '3px solid transparent', color: '#475569', fontWeight: '700', fontSize: '14px', transition: 'all 0.15s ease' },
  activeTabButton: { color: '#0284c7', borderBottom: '3px solid #0284c7' },
  tabContent: { padding: '24px', maxWidth: '1400px', margin: '0 auto' },
  sectionTitle: { fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.5px' },
  sectionSubtitle: { fontSize: '14px', color: '#475569', margin: '0 0 20px 0', fontWeight: '500' },
  loadingText: { fontSize: '14px', color: '#0284c7', fontWeight: 'bold' },
  gridDashboard: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
  cardMetrica: { padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  cardMetricaTitle: { margin: 0, fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' },
  cardMetricaValue: { fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' },
  columnsLayout: { display: 'flex', gap: '24px', flexWrap: 'wrap' },
  tableScrollWrapper: { maxHeight: '550px', overflowY: 'auto', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' },
  tableHeaderRow: { backgroundColor: '#e2e8f0', borderBottom: '2px solid #cbd5e1' },
  tableHeaderCell: { padding: '12px 16px', color: '#0f172a', fontWeight: '800', fontSize: '14px' },
  tableBodyRow: { borderBottom: '1px solid #e2e8f0', cursor: 'pointer', transition: 'background-color 0.1s ease' },
  tableBodyCell: { padding: '14px 16px', color: '#1e293b', fontWeight: '500' },
  rightDetailPanel: { flex: 0.9, minWidth: '320px', backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', position: 'sticky', top: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  emptyStateContainer: { padding: '40px 20px', textAlign: 'center', color: '#475569', backgroundColor: '#f8fafc', borderRadius: '8px', border: '2px dashed #cbd5e1', fontSize: '14px', fontWeight: '500', lineHeight: '1.5' },
  qrPrintCard: { display: 'flex', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px', alignItems: 'center' },
  qrContainerBox: { backgroundColor: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'inline-flex' },
  primaryButton: { padding: '9px 14px', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', width: '100%', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  secondaryButton: { padding: '8px 14px', backgroundColor: '#ffffff', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  embeddedFormCard: { padding: '14px', borderRadius: '8px', border: '1px solid' },
  formLabel: { display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  textInput: { padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', color: '#1e293b', backgroundColor: '#ffffff', width: '100%', boxSizing: 'border-box', outline: 'none', fontFamily: 'sans-serif', fontWeight: '500' },
  selectInput: { padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', color: '#1e293b', width: '100%', boxSizing: 'border-box', backgroundColor: '#ffffff', cursor: 'pointer', fontWeight: '600' },
  submitFormButton: { padding: '12px', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  scannerModalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  scannerModalBox: { backgroundColor: '#ffffff', padding: '25px', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  stickyHeader: { position: 'sticky', top: 0, zIndex: 10 }
};
