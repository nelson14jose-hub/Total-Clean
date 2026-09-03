import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import { supabase } from './supabase';

// ETAPA 1 SUPABASE:
// Servicios, trabajadores, asignaciones y ajustes de pago por servicio
// ya se leen/escriben en Supabase. El resto de módulos se mantiene local
// hasta completar su migración en etapas posteriores.

const CIUDADES = {
  Barranquilla: { color: '#2563eb', fondo: '#eff6ff', icono: '🔵' },
  Cartagena: { color: '#16a34a', fondo: '#f0fdf4', icono: '🟢' },
  'Santa Marta': { color: '#f97316', fondo: '#fff7ed', icono: '🟠' }
};

const ORIGENES = [
  { nombre: 'Business', icono: '💼' },
  { nombre: 'WhatsApp personal', icono: '🟢' },
  { nombre: 'FB Daniel', icono: '🔵' },
  { nombre: 'FB Keysi', icono: '🔵' },
  { nombre: 'FB Patricia', icono: '🔵' },
  { nombre: 'Otros FB', icono: '📘' }
];

const TRABAJADORES_BASE = [
  { id: '22cf1da6-accb-4aa6-a0b7-b6f6d456ba68', nombre: 'Daniel', activo: true, tipo_pago: 'daniel', porcentaje: 50, moto_diaria: 40000, propietario_moto: 'trabajador', gasolina_semanal: 15000 },
  { id: 'd7720ee0-fcf9-4403-8836-63b4c499ba7f', nombre: 'Marry', activo: true, tipo_pago: 'negocio', porcentaje: 50, moto_diaria: 30000, propietario_moto: 'negocio', gasolina_semanal: 15000 },
  { id: '9ce8afac-2fe0-434f-9587-edd01424cca6', nombre: 'Nelson', activo: true, tipo_pago: 'propietario', porcentaje: 100, moto_diaria: 0, propietario_moto: 'negocio', gasolina_semanal: 0 },
  { id: 'local-angel', nombre: 'Ángel', activo: true, tipo_pago: 'individual_50', porcentaje: 50, moto_diaria: 30000, propietario_moto: 'trabajador', gasolina_semanal: 15000 }
];

const money = value => Number(value || 0).toLocaleString('es-CO');
const cleanPhone = value => String(value || '').replace(/\D/g, '');

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function dateLabel(value) {
  if (!value) return '';
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

function datePagoLabel(value) {
  if (!value) return '';
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long'
  });
}

function horaCorta(value) {
  if (!value) return '--:--';

  const texto = String(value).trim();

  // Supabase puede devolver time como HH:mm:ss.
  // El formulario puede entregar HH:mm.
  const match = texto.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*(am|pm))?$/i);

  if (!match) return texto;

  let hora = Number(match[1]);
  const minutos = match[2];
  const periodo = match[3]?.toLowerCase();

  // Si ya viene con AM/PM, conservarlo.
  if (periodo) {
    hora = hora % 12 || 12;
    return `${hora}:${minutos} ${periodo}`;
  }

  // Convertir de 24 horas a 12 horas.
  const ampm = hora >= 12 ? 'pm' : 'am';
  hora = hora % 12 || 12;

  return `${hora}:${minutos} ${ampm}`;
}

function weekStart(dateValue) {
  const d = new Date(`${dateValue}T12:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0,10);
}


function Icon({ name, size = 24, stroke = 2.1 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: stroke,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true'
  };

  const paths = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></>,
    calendar: <><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M8 2.5v4M16 2.5v4M3 9h18"/><path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"/></>,
    check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    users: <><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20"/><circle cx="9.5" cy="7.5" r="3"/><path d="M17 11a3 3 0 1 0-1-5.8M21 20v-1.5a4 4 0 0 0-3-3.9"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    back: <path d="m15 18-6-6 6-6"/>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    couch: <><path d="M5 14V9a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5"/><path d="M4 14h16a1 1 0 0 1 1 1v3H3v-3a1 1 0 0 1 1-1Z"/><path d="M6 18v2M18 18v2"/></>,
    bed: <><path d="M3 18v-8"/><path d="M3 14h18v6"/><path d="M6 14V9a2 2 0 0 1 2-2h3a3 3 0 0 1 3 3v4"/><path d="M21 14v-2a2 2 0 0 0-2-2h-5"/></>,
    mattress: <><path d="M4 8.5c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2V17H4Z"/><path d="M4 11h16"/><path d="M7 8.5c0 1.4 1.2 2.5 2.7 2.5S12.4 9.9 12.4 8.5"/><path d="M12.4 8.5c0 1.4 1.2 2.5 2.7 2.5S17.8 9.9 17.8 8.5"/><path d="M6 17v2M18 17v2"/></>,
    chair: <><path d="M7 11V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5"/><path d="M5 11h14a2 2 0 0 1 2 2v2H3v-2a2 2 0 0 1 2-2Z"/><path d="M6 15v5M18 15v5"/></>,
    rug: <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 7v10M12 7v10M16 7v10"/><path d="M6 9h12M6 15h12"/></>,
    dining: <><path d="M5 4v7M3 8h4M5 11v9M19 4v16M17 4v6a2 2 0 0 0 4 0V4"/></>,
    money: <><circle cx="12" cy="12" r="9"/><path d="M12 7v10M15 9.5c-.7-.7-1.6-1-3-1-1.7 0-3 .7-3 2s1.2 2 3 2 3 .7 3 2-1.3 2-3 2c-1.4 0-2.4-.4-3.2-1.2"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></>,
    filter: <path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z"/>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    wallet: <><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5Z"/><path d="M4 7h15"/><path d="M15 13h5v4h-5a2 2 0 0 1 0-4Z"/></>
  };

  return <svg {...common}>{paths[name] || paths.more}</svg>;
}

function servicioIcono(articulo = '') {
  const a = String(articulo).toLowerCase();
  if (a.includes('colch') || a.includes('cama')) return 'mattress';
  if (a.includes('alfombr') || a.includes('tapet')) return 'rug';
  if (a.includes('comedor')) return 'dining';
  if (a.includes('silla')) return 'chair';
  return 'couch';
}

function servicioColor(articulo = '') {
  const a = String(articulo).toLowerCase();
  if (a.includes('colch') || a.includes('cama')) return 'green';
  if (a.includes('alfombr') || a.includes('tapet')) return 'purple';
  if (a.includes('comedor') || a.includes('silla')) return 'orange';
  return 'blue';
}

function App() {
  const [seccion, setSeccion] = useState('inicio');
  const [menuMas, setMenuMas] = useState(false);
  const [fecha, setFecha] = useState(todayString());
  const [ciudad, setCiudad] = useState('Todas');
  const [servicios, setServicios] = useState([]);
  const [trabajadores, setTrabajadores] = useState(TRABAJADORES_BASE);
  // Las asignaciones ya no se guardan en localStorage: vienen de Supabase.
  const [asignaciones, setAsignaciones] = useState({});
  const [ajustesPago, setAjustesPago] = useState(() => JSON.parse(localStorage.getItem('tc_ajustes_pago') || '{}'));
  const [gastos, setGastos] = useState(() => JSON.parse(localStorage.getItem('tc_gastos') || '[]'));
  const [anticipos, setAnticipos] = useState(() => JSON.parse(localStorage.getItem('tc_anticipos') || '[]'));
  const [gasolina, setGasolina] = useState(() => JSON.parse(localStorage.getItem('tc_gasolina') || '[]'));
  const [motos, setMotos] = useState(() => JSON.parse(localStorage.getItem('tc_motos') || '[]'));
  const [efectivo, setEfectivo] = useState(() => JSON.parse(localStorage.getItem('tc_efectivo') || '{}'));
  const [busqueda, setBusqueda] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [imagen, setImagen] = useState(null);
  const [imagenGrande, setImagenGrande] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [mesFinanzas, setMesFinanzas] = useState(() => new Date().toISOString().slice(0,7));
  // Períodos independientes de Agenda
  const [periodoTrabajadores, setPeriodoTrabajadores] = useState('semana');
  const [fechaTrabajadores, setFechaTrabajadores] = useState(todayString());
  const [periodoFinanzas, setPeriodoFinanzas] = useState('mes');
  const [fechaFinanzas, setFechaFinanzas] = useState(todayString());
  const [vistaPagosTrabajadores, setVistaPagosTrabajadores] = useState('diario');
  const [gastosSemanaManual, setGastosSemanaManual] = useState(() => JSON.parse(localStorage.getItem('tc_gastos_semana_manual') || '{}'));

  const [publicidadManual, setPublicidadManual] = useState(() =>
    JSON.parse(localStorage.getItem('tc_publicidad_manual') || '{}')
  );
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');


  const blankForm = {
    cliente:'', telefono:'', direccion:'', articulo:'', fecha:fecha, hora:'',
    ciudad: ciudad === 'Todas' ? 'Barranquilla' : ciudad, origen:'Business',
    precio:'', observaciones:'', imagen:'', forma_pago:'efectivo'
  };
  const [formulario, setFormulario] = useState(blankForm);

  const persist = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  useEffect(() => {
    let mounted = true;

    const cargarDatos = async () => {
      try {
        // Comprobar nuevamente la sesión justo antes de consultar las tablas.
        // Así evitamos hacer consultas con el rol anon durante la restauración.
        const { data: authData, error: authError } = await supabase.auth.getSession();

        if (authError) {
          console.error('TOTAL CLEAN AUTH ERROR:', authError);
          if (mounted) setLoginError('No se pudo comprobar la sesión.');
          return;
        }

        const currentSession = authData?.session || null;

        if (!mounted) return;

        if (!currentSession) {
          setSession(null);
          setAuthLoading(false);
          return;
        }

        setSession(currentSession);

        const serviciosResult = await supabase
          .from('servicios')
          .select('*')
          .order('fecha', { ascending:true })
          .order('hora', { ascending:true });

        if (!mounted) return;

        if (serviciosResult.error) {
          console.error('TOTAL CLEAN SERVICIOS ERROR:', serviciosResult.error);
          alert(`No se pudieron cargar los servicios: ${serviciosResult.error.message}`);
        } else {
          setServicios(serviciosResult.data || []);
        }

        const trabajadoresResult = await supabase
          .from('trabajadores')
          .select('*')
          .eq('activo', true)
          .order('nombre');

        if (!mounted) return;

        if (trabajadoresResult.error) {
          console.error('TOTAL CLEAN TRABAJADORES ERROR:', trabajadoresResult.error);
        } else if (trabajadoresResult.data?.length) {
          const basePorNombre = Object.fromEntries(
            TRABAJADORES_BASE.map(t => [
              String(t.nombre).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''),
              t
            ])
          );

          setTrabajadores(trabajadoresResult.data.map(t => {
            const key = String(t.nombre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
            const base = basePorNombre[key] || {};
            return {
              ...base,
              ...t,
              id: normalizeWorkerId(t.id),
              nombre: t.nombre,
              activo: t.activo !== false
            };
          }));
        }

        const asignacionesResult = await supabase
          .from('servicio_trabajadores')
          .select('servicio_id, trabajador_id, modo_pago, pago_manual, motivo_ajuste');

        if (!mounted) return;

        if (asignacionesResult.error) {
          console.error('TOTAL CLEAN ASIGNACIONES ERROR:', asignacionesResult.error);
        } else {
          const mapa = {};
          const ajustesCargados = {};

          (asignacionesResult.data || []).forEach(row => {
            const sid = String(row.servicio_id);
            if (!mapa[sid]) mapa[sid] = [];
            mapa[sid].push(normalizeWorkerId(row.trabajador_id));

            if (row.pago_manual !== null && row.pago_manual !== undefined) {
              ajustesCargados[`${sid}_${row.trabajador_id}`] = Number(row.pago_manual);
            }
          });

          setAsignaciones(mapa);
          setAjustesPago(prev => ({ ...prev, ...ajustesCargados }));
        }

        // Cargar gastos manuales y publicidad desde Supabase.
        // Si existen datos antiguos solo en este dispositivo, se migran una sola vez
        // creando el registro en la nube únicamente cuando todavía no existe allí.
        const finanzasManualesResult = await supabase
          .from('finanzas_manuales')
          .select('*');

        if (!mounted) return;

        if (finanzasManualesResult.error) {
          console.error('TOTAL CLEAN FINANZAS MANUALES ERROR:', finanzasManualesResult.error);
        } else {
          const cloudRows = finanzasManualesResult.data || [];
          const cloudKeys = new Set(cloudRows.map(row => String(row.clave)));

          const localSemana = JSON.parse(localStorage.getItem('tc_gastos_semana_manual') || '{}');
          const localPublicidad = JSON.parse(localStorage.getItem('tc_publicidad_manual') || '{}');
          const migraciones = [];

          Object.entries(localSemana).forEach(([key, values]) => {
            if (cloudKeys.has(key)) return;
            const [trabajadorId, inicio] = key.split('_');
            migraciones.push({
              clave: key,
              tipo: 'trabajador_semana',
              trabajador_id: trabajadorId || null,
              periodo_tipo: 'semana',
              fecha_inicio: inicio,
              fecha_fin: addDays(inicio, 6),
              producto: Number(values?.producto || 0),
              gasolina: Number(values?.gasolina || 0),
              base: Number(values?.base || 0),
              publicidad: 0
            });
          });

          Object.entries(localPublicidad).forEach(([key, value]) => {
            if (cloudKeys.has('publicidad_' + key)) return;
            const [periodoTipo, fechaInicio] = key.split('_');
            const rangoLocal = periodoRango(periodoTipo, fechaInicio);
            migraciones.push({
              clave: 'publicidad_' + key,
              tipo: 'publicidad_periodo',
              trabajador_id: null,
              periodo_tipo: periodoTipo,
              fecha_inicio: rangoLocal.inicio,
              fecha_fin: rangoLocal.fin,
              producto: 0,
              gasolina: 0,
              base: 0,
              publicidad: Number(value || 0)
            });
          });

          if (migraciones.length) {
            const { error: migracionError } = await supabase
              .from('finanzas_manuales')
              .upsert(migraciones, { onConflict: 'clave' });

            if (migracionError) {
              console.error('TOTAL CLEAN MIGRACION FINANZAS ERROR:', migracionError);
            } else {
              migraciones.forEach(row => cloudRows.push(row));
            }
          }

          const semanaCloud = {};
          const publicidadCloud = {};

          cloudRows.forEach(row => {
            if (row.tipo === 'trabajador_semana') {
              semanaCloud[String(row.clave)] = {
                producto: Number(row.producto || 0),
                gasolina: Number(row.gasolina || 0),
                base: Number(row.base || 0)
              };
            }

            if (row.tipo === 'publicidad_periodo') {
              publicidadCloud[`${row.periodo_tipo}_${row.fecha_inicio}`] = Number(row.publicidad || 0);
            }
          });

          setGastosSemanaManual(prev => ({ ...prev, ...semanaCloud }));
          setPublicidadManual(prev => ({ ...prev, ...publicidadCloud }));
        }
      } catch (error) {
        console.error('TOTAL CLEAN ERROR CARGANDO DATOS:', error);
        if (mounted) {
          alert(`Error cargando los datos: ${error.message || error}`);
        }
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    const inicializarAuth = async () => {
      try {
        const { data: { session: currentSession }, error } =
          await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('TOTAL CLEAN AUTH ERROR:', error);
          setSession(null);
          setAuthLoading(false);
          return;
        }

        setSession(currentSession || null);

        if (currentSession) {
          await cargarDatos();
        } else {
          setAuthLoading(false);
        }
      } catch (error) {
        console.error('TOTAL CLEAN AUTH INIT ERROR:', error);
        if (mounted) {
          setSession(null);
          setAuthLoading(false);
        }
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;

        setSession(newSession || null);

        if (newSession) {
          // La sesión ya está disponible; cargar los datos con ella.
          await cargarDatos();
        } else {
          setAuthLoading(false);
        }
      }
    );

    inicializarAuth();

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const serviciosDia = useMemo(() => {
    const convertirHora = valor => {
      const texto = String(valor || '').trim();
      const match = texto.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*(am|pm))?$/i);

      if (!match) return Number.POSITIVE_INFINITY;

      let hora = Number(match[1]);
      const minutos = Number(match[2]);
      const periodo = match[3]?.toLowerCase();

      if (periodo === 'pm' && hora !== 12) hora += 12;
      if (periodo === 'am' && hora === 12) hora = 0;

      return hora * 60 + minutos;
    };

    return servicios
      .filter(s => s.fecha === fecha)
      .filter(s => ciudad === 'Todas' || s.ciudad === ciudad)
      .sort((a, b) => {
        const horaA = convertirHora(a.hora);
        const horaB = convertirHora(b.hora);

        if (horaA !== horaB) return horaA - horaB;

        // Si dos servicios tienen la misma hora, mantenemos
        // un orden estable usando el ID como desempate.
        return String(a.id || '').localeCompare(String(b.id || ''));
      });
  }, [servicios, fecha, ciudad]);

  const resultados = useMemo(() => {
    const q = cleanPhone(busqueda);
    if (!q) return [];
    return servicios.filter(s => cleanPhone(s.telefono).includes(q));
  }, [servicios,busqueda]);

  const resumenDia = useMemo(() => ({
    cantidad: serviciosDia.length,
    ingresos: serviciosDia.reduce((a,s)=>a+Number(s.precio||0),0),
    realizados: serviciosDia.filter(s=>s.estado==='realizado').length,
    pendientes: serviciosDia.filter(s=>s.estado!=='realizado').length
  }), [serviciosDia]);

  const SUPABASE_WORKER_IDS = {
  angel: '59dfa523-aec6-42f4-a3a8-52a2664df883',
  daniel: '22cf1da6-accb-4aa6-a0b7-b6f6d456ba68',
  marry: 'd7720ee0-fcf9-4403-8836-63b4c499ba7f',
  nelson: '9ce8afac-2fe0-434f-9587-edd01424cca6'
};

const normalizeWorkerId = (id) => {
  const key = String(id || '').toLowerCase();
  return {
    'local-angel': SUPABASE_WORKER_IDS.angel,
    'local-daniel': SUPABASE_WORKER_IDS.daniel,
    'local-marry': SUPABASE_WORKER_IDS.marry,
    'local-nelson': SUPABASE_WORKER_IDS.nelson
  }[key] || id;
};

const normalizeWorkerIds = (ids = []) =>
  [...new Set(ids.map(normalizeWorkerId).filter(Boolean))];


  const getAsignados = id => normalizeWorkerIds(asignaciones[String(id)] || []);

const setAsignados = (id, ids) => {
    const next = {...asignaciones, [String(id)]: ids};
    if (ids.length === 0) delete next[String(id)];
    setAsignaciones(next);
  };

  const guardarAsignacionesSupabase = async (servicioId, ids) => {
    ids = normalizeWorkerIds(ids);
    const { error: delError } = await supabase
      .from('servicio_trabajadores')
      .delete()
      .eq('servicio_id', servicioId);

    if (delError) throw delError;

    if (!ids.length) return;

    const rows = ids.map(trabajadorId => ({
      servicio_id: servicioId,
      trabajador_id: trabajadorId,
      modo_pago: 'automatico',
      pago_manual: null,
      motivo_ajuste: null
    }));

    const { error: insError } = await supabase
      .from('servicio_trabajadores')
      .insert(rows);

    if (insError) throw insError;
  };

  // =========================================================
  // REGLAS DEFINITIVAS DE PAGO
  //
  // UN TRABAJADOR:
  //   total del día - $30.000 de moto = neto
  //   neto × 50% = parte del trabajador
  //
  // DOS TRABAJADORES JUNTOS:
  //   total del día - UNA moto = neto
  //   cada trabajador recibe 25% del neto
  //
  // DANIEL:
  //   después de calcular su parte, se descuentan $10.000
  //   adicionales de SU parte. Esto es independiente de la moto.
  //
  // ÁNGEL:
  //   misma operación normal: moto $30.000 + 50%.
  //
  // MARRY:
  //   misma operación normal: moto $30.000 + 50%.
  //   La diferencia es el DESTINO de los $30.000:
  //   en Marry quedan para el negocio; no se le deben a él.
  //
  // NELSON:
  //   sus servicios corresponden 100% al negocio.
  //
  // IMPORTANTE:
  //   La moto jamás se resta dentro de cada servicio.
  //   Se aplica UNA SOLA VEZ sobre el total del día.
  // =========================================================

  const serviciosDeTrabajadorDia = (trabajador, fechaConsulta) => {
    const trabajadorId = normalizeWorkerId(trabajador?.id);
    return servicios.filter(s =>
      s.fecha === fechaConsulta &&
      getAsignados(s.id).includes(trabajadorId)
    );
  };

  // Solo los servicios realizados generan movimientos contables.
  // Los pendientes siguen visibles en Agenda, pero no entran en pagos,
  // efectivo, transferencia, moto ni facturación.
  const serviciosContablesDeTrabajadorDia = (trabajador, fechaConsulta) =>
    serviciosDeTrabajadorDia(trabajador, fechaConsulta)
      .filter(s => String(s.estado || 'pendiente').toLowerCase() === 'realizado');

  const motoDelDia = (trabajador, fechaConsulta) => {
    if (!trabajador || trabajador.tipo_pago === 'propietario') return 0;

    const tieneServicio = serviciosContablesDeTrabajadorDia(trabajador, fechaConsulta).length > 0;

    // Los tres trabajadores normales usan $30.000 como regla diaria.
    // Daniel tiene $40.000 de moto total, pero $10.000 salen de su parte
    // como ajuste independiente; por eso aquí descontamos $30.000.
    return tieneServicio ? 30000 : 0;
  };

  const calcularPagoDiaBase = (trabajador, fechaConsulta) => {
    if (!trabajador || trabajador.tipo_pago === 'propietario') return 0;

    const serviciosT = serviciosContablesDeTrabajadorDia(trabajador, fechaConsulta);
    if (!serviciosT.length) return 0;

    const totalDia = serviciosT.reduce(
      (sum, s) => sum + Number(s.precio || 0),
      0
    );

    // Si hay al menos un servicio en el que participan dos trabajadores,
    // cada trabajador recibe el 25% después de descontar UNA sola moto.
    const trabajoConjunto = serviciosT.some(
      s => getAsignados(s.id).length >= 2
    );

    const moto = motoDelDia(trabajador, fechaConsulta);
    const netoDia = Math.max(0, totalDia - moto);

    const porcentaje = trabajoConjunto ? 25 : 50;

    let parte = netoDia * (porcentaje / 100);

    // Los $10.000 de Daniel son un descuento adicional de su parte.
    if (String(trabajador.nombre).toLowerCase() === 'daniel') {
      parte -= 10000;
    }

    return Math.max(0, Math.round(parte));
  };

  // Pago mostrado por servicio: solo sirve como referencia.
  // NO descuenta moto ni los $10.000 de Daniel por servicio.
  const pagoAutomatico = (servicio, trabajador, cantidad) => {
    const precio = Number(servicio.precio || 0);

    if (trabajador.tipo_pago === 'propietario') return 0;

    if (cantidad >= 2) {
      return Math.round(precio * 0.25);
    }

    return Math.round(
      precio * (Number(trabajador.porcentaje || 50) / 100)
    );
  };

  const pagoTrabajadorDia = (trabajador, fechaConsulta) => {
    const serviciosT = serviciosDeTrabajadorDia(trabajador, fechaConsulta);
    if (!serviciosT.length) return 0;

    const ajustes = serviciosT.filter(
      s => ajustesPago[`${s.id}_${trabajador.id}`] !== undefined
    );

    // Si no hay ajustes manuales, aplicamos exactamente la regla diaria.
    if (!ajustes.length) {
      return calcularPagoDiaBase(trabajador, fechaConsulta);
    }

    // Cuando existen ajustes, los respetamos, pero la moto continúa siendo
    // una deducción diaria y no una deducción por servicio.
    const totalDia = serviciosT.reduce(
      (sum, s) => sum + Number(s.precio || 0),
      0
    );

    const trabajoConjunto = serviciosT.some(
      s => getAsignados(s.id).length >= 2
    );

    const moto = motoDelDia(trabajador, fechaConsulta);

    let pago = serviciosT.reduce((sum, s) => {
      const key = `${s.id}_${trabajador.id}`;

      if (ajustesPago[key] !== undefined) {
        return sum + Number(ajustesPago[key] || 0);
      }

      const porcentaje = trabajoConjunto ? 25 : 50;
      return sum + Number(s.precio || 0) * (porcentaje / 100);
    }, 0);

    // Moto una sola vez por día.
    pago -= moto;

    // Daniel: $10.000 adicionales, aparte de la moto.
    if (String(trabajador.nombre).toLowerCase() === 'daniel') {
      pago -= 10000;
    }

    return Math.max(0, Math.round(pago));
  };

  const pagoSemanalCopiable = (
    trabajador,
    rango,
    pagoDias,
    motoSemana,
    producto,
    gasolinaSemanal,
    ajustesSemana,
    efectivoEsperado,
    totalSemanal
  ) => {
    const esMarry = String(trabajador.nombre).toLowerCase() === 'marry';

    return `*LIQUIDACIÓN SEMANAL ${trabajador.nombre.toUpperCase()}*
*${etiquetaRango('semana',rango)}*

Pagos diarios: $${money(pagoDias)}
Moto semana: $${money(motoSemana)}
Producto: -$${money(producto)}
Gasolina: +$${money(gasolinaSemanal)}
Ajustes: $${money(ajustesSemana)}

*TOTAL A PAGAR DOMINGO: $${money(totalSemanal)}*

*EFECTIVO ESPERADO: $${money(efectivoEsperado)}*${base > 0 ? `
(Incluye base entregada: +$${money(base)})` : ''}${esMarry ? `
(Gasolina real y producto que exceda la base se descuentan del efectivo)` : ''}`;
  };

  const cobrosDiarios = (trabajador, fechaConsulta) => {
    const serviciosT = serviciosContablesDeTrabajadorDia(trabajador, fechaConsulta);

    return serviciosT.reduce(
      (totales, servicio) => {
        const valor = Number(servicio.precio || 0);
        const forma = String(servicio.forma_pago || 'efectivo').toLowerCase();

        if (forma === 'transferencia' || forma === 'transferencia bancaria') {
          totales.transferencia += valor;
        } else {
          totales.efectivo += valor;
        }

        totales.total += valor;
        return totales;
      },
      { efectivo: 0, transferencia: 0, total: 0 }
    );
  };

  const pagoCopiable = (trabajador, fechaConsulta=fecha) => {
  const serviciosT = serviciosContablesDeTrabajadorDia(trabajador, fechaConsulta);

  const facturacion = serviciosT.reduce(
    (sum, s) => sum + Number(s.precio || 0),
    0
  );

  const moto = motoDelDia(trabajador, fechaConsulta);
  const nombre = String(trabajador.nombre || '').toLowerCase();

  const motoMostrada =
    nombre === 'daniel' && moto > 0
      ? 40000
      : (nombre === 'marry' || nombre === 'ángel' || nombre === 'angel')
        ? 30000
        : moto;

  const pago = pagoTrabajadorDia(trabajador, fechaConsulta);

  const cobros = cobrosDiarios(trabajador, fechaConsulta);

  return `*Pago ${datePagoLabel(fechaConsulta)}*

*Facturacion:* $${money(facturacion)}
*Efectivo:* $${money(cobros.efectivo)}
*Transferencia:* $${money(cobros.transferencia)}
*Moto:* $${money(motoMostrada)}
*Pago:* $${money(pago)}`;
};

  const copiar = async text => {
    try { await navigator.clipboard.writeText(text); setMensaje('📋 Copiado'); setTimeout(()=>setMensaje(''),1800); }
    catch { alert('No se pudo copiar automáticamente.'); }
  };

  const copiarServicio = servicio => {
    const text =
      `*HORA:* ${horaCorta(servicio.hora)}\n` +
      `*DIRECCIÓN:* ${servicio.direccion || ''}\n` +
      `*TELÉFONO:* ${servicio.telefono || ''}\n` +
      `*SERVICIO:* ${servicio.articulo || ''}\n` +
      `*VALOR:* $${money(servicio.precio)}`;
    copiar(text);
  };

  const abrirWhatsApp = servicio => {
    let tel = cleanPhone(servicio.telefono);
    if (!tel) return alert('Este servicio no tiene número telefónico.');
    if (!tel.startsWith('57')) tel = `57${tel}`;
    const text = `Hola ${servicio.cliente} 👋\n\nSomos Total Clean 🧼.\n\nLe confirmamos su servicio para el día ${dateLabel(servicio.fecha)} a las ${horaCorta(servicio.hora)}.\n\n🛋️ Servicio: ${servicio.articulo}\n💰 Valor: $${money(servicio.precio)}\n📍 Dirección: ${servicio.direccion}\n\n¡Muchas gracias! 😊`;
    window.open(`https://web.whatsapp.com/send?phone=${tel}&text=${encodeURIComponent(text)}`,'_blank');
  };

  const abrirNuevo = () => {
    setEditId(null); setImagen(null);
    setFormulario({...blankForm, fecha});
    setFormOpen(true); setSeccion('agenda');
  };

  const editar = servicio => {
    setEditId(servicio.id); setImagen(servicio.imagen || null);
    setFormulario({
      cliente:servicio.cliente||'', telefono:servicio.telefono||'', direccion:servicio.direccion||'',
      articulo:servicio.articulo||'', fecha:servicio.fecha||fecha, hora:servicio.hora||'',
      ciudad:servicio.ciudad||'Barranquilla', origen:servicio.origen||'Business',
      precio:servicio.precio||'', observaciones:servicio.observaciones||'', imagen:servicio.imagen||'',
      forma_pago:servicio.forma_pago||'efectivo'
    });
    setFormOpen(true);
  };

  const iniciarSesion = async e => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Escribe el correo y la contraseña.');
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword
    });

    if (error) {
      setLoginError('Correo o contraseña incorrectos.');
      return;
    }

    setSession(data.session);
    setLoginPassword('');
  };

  const guardarServicio = async e => {
    e.preventDefault();
    const payload = {
      cliente:formulario.cliente, telefono:formulario.telefono, direccion:formulario.direccion,
      articulo:formulario.articulo, fecha:formulario.fecha, hora:formulario.hora,
      ciudad:formulario.ciudad, origen:formulario.origen, precio:Number(formulario.precio||0),
      observaciones:formulario.observaciones, imagen:formulario.imagen||imagen||null,
      estado: editId ? (servicios.find(s=>s.id===editId)?.estado || 'pendiente') : 'pendiente',
      forma_pago: formulario.forma_pago || 'efectivo'
    };
    let servicioGuardado = null;

    if (editId) {
      const {data,error} = await supabase
        .from('servicios')
        .update(payload)
        .eq('id',editId)
        .select()
        .single();

      if (error) return alert(`No se pudo actualizar: ${error.message}`);

      servicioGuardado = data;
      setServicios(prev=>prev.map(s=>s.id===editId?data:s));
    } else {
      const {data,error} = await supabase
        .from('servicios')
        .insert([payload])
        .select()
        .single();

      if (error) return alert(`No se pudo guardar: ${error.message}`);

      servicioGuardado = data;
      setServicios(prev=>[...prev,data]);
    }

    // Revalidar inmediatamente contra Supabase. Así la Agenda no depende
    // de cerrar/reabrir la app para mostrar el servicio recién guardado.
    try {
      const { data: serviciosActualizados, error: refreshError } = await supabase
        .from('servicios')
        .select('*')
        .order('fecha', { ascending:true })
        .order('hora', { ascending:true });

      if (!refreshError && serviciosActualizados) {
        setServicios(serviciosActualizados);
      }
    } catch (refreshError) {
      console.warn('No se pudo refrescar servicios después de guardar:', refreshError);
    }

    setFecha(payload.fecha);
    setFormOpen(false);
    setFormulario({...blankForm, fecha:payload.fecha});
    setImagen(null);
    setMensaje(editId ? '✅ Servicio actualizado' : '✅ Servicio guardado');
    setTimeout(()=>setMensaje(''),1600);
  };

  const eliminar = async id => {
    if (!confirm('¿Eliminar este servicio?')) return;
    const {error}=await supabase.from('servicios').delete().eq('id',id);
    if (error) return alert(error.message);
    setServicios(prev=>prev.filter(s=>s.id!==id));
  };

  const cambiarEstado = async servicio => {
    const nuevo = servicio.estado === 'realizado' ? 'pendiente' : 'realizado';
    const {error}=await supabase.from('servicios').update({estado:nuevo}).eq('id',servicio.id);
    if (error) return alert(error.message);
    setServicios(prev=>prev.map(s=>s.id===servicio.id?{...s,estado:nuevo}:s));
  };

  // Sincroniza los cambios de servicios entre PC y teléfonos.
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('total-clean-servicios')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'servicios' },
        payload => {
          if (payload.eventType === 'INSERT') {
            setServicios(prev => {
              if (prev.some(s => String(s.id) === String(payload.new.id))) return prev;
              return [...prev, payload.new];
            });
            return;
          }

          if (payload.eventType === 'UPDATE') {
            setServicios(prev =>
              prev.map(s =>
                String(s.id) === String(payload.new.id) ? payload.new : s
              )
            );
            return;
          }

          if (payload.eventType === 'DELETE') {
            setServicios(prev =>
              prev.filter(s => String(s.id) !== String(payload.old.id))
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'finanzas_manuales' },
        payload => {
          const row = payload.new || payload.old;
          if (!row) return;

          if (payload.eventType === 'DELETE') {
            if (row.tipo === 'trabajador_semana') {
              setGastosSemanaManual(prev => {
                const next = { ...prev };
                delete next[String(row.clave)];
                return next;
              });
            }
            if (row.tipo === 'publicidad_periodo') {
              const key = `${row.periodo_tipo}_${row.fecha_inicio}`;
              setPublicidadManual(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
              });
            }
            return;
          }

          if (row.tipo === 'trabajador_semana') {
            setGastosSemanaManual(prev => ({
              ...prev,
              [String(row.clave)]: {
                producto: Number(row.producto || 0),
                gasolina: Number(row.gasolina || 0),
                base: Number(row.base || 0)
              }
            }));
          }

          if (row.tipo === 'publicidad_periodo') {
            const key = `${row.periodo_tipo}_${row.fecha_inicio}`;
            setPublicidadManual(prev => ({
              ...prev,
              [key]: Number(row.publicidad || 0)
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const cambiarDia = n => {
    const d = new Date(`${fecha}T12:00:00`); d.setDate(d.getDate()+n);
    setFecha(d.toISOString().slice(0,10)); setFormOpen(false);
  };

  const seleccionarImagen = e => {
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>{setImagen(reader.result); setFormulario(f=>({...f,imagen:reader.result}));};
    reader.readAsDataURL(file);
  };

  const actualizarAsignacion = async (servicio, trabajadorId, checked) => {
    trabajadorId = normalizeWorkerId(trabajadorId);
    let ids=getAsignados(servicio.id);
    if (checked) ids=[...new Set([...ids,trabajadorId])];
    else ids=ids.filter(id=>id!==trabajadorId);

    if (ids.length>2) {
      alert('Un servicio puede tener máximo 2 trabajadores.');
      return;
    }

    const anterior = getAsignados(servicio.id);
    setAsignados(servicio.id, ids);

    try {
      await guardarAsignacionesSupabase(servicio.id, ids);
      setMensaje('✅ Trabajador guardado');
      setTimeout(()=>setMensaje(''),1400);
    } catch (error) {
      setAsignados(servicio.id, anterior);
      alert(`No se pudo guardar el trabajador: ${error.message}`);
    }
  };

  const modificarPago = async (servicio, trabajador) => {
    const trabajadorId = normalizeWorkerId(trabajador.id);
    const key=`${servicio.id}_${trabajadorId}`;
    const actual=ajustesPago[key] !== undefined
      ? ajustesPago[key]
      : pagoAutomatico(servicio,trabajador,getAsignados(servicio.id).length);

    const value=prompt(`Pago de ${trabajador.nombre} para este servicio:`,String(actual));
    if (value===null) return;

    const n=Number(String(value).replace(/\D/g,''));
    if (!Number.isFinite(n)) return;

    const next={...ajustesPago,[key]:n};
    setAjustesPago(next);

    const { error } = await supabase
      .from('servicio_trabajadores')
      .update({ pago_manual:n, modo_pago:'manual' })
      .eq('servicio_id',servicio.id)
      .eq('trabajador_id',trabajadorId);

    if (error) {
      setAjustesPago(prev => {
        const copy={...prev};
        delete copy[key];
        return copy;
      });
      alert(`No se pudo guardar el ajuste: ${error.message}`);
      return;
    }

    setMensaje('✅ Pago ajustado y guardado');
    setTimeout(()=>setMensaje(''),1600);
  };

  const agregarGasto = e => {
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const item={id:crypto.randomUUID(),fecha:f.get('fecha'),categoria:f.get('categoria'),descripcion:f.get('descripcion'),monto:Number(f.get('monto')||0)};
    const next=[...gastos,item]; setGastos(next); persist('tc_gastos',next); e.currentTarget.reset();
  };

  const agregarAnticipo = e => {
    e.preventDefault(); const f=new FormData(e.currentTarget);
    const anticipo=Number(f.get('anticipo')||0), factura=Number(f.get('factura')||0);
    const item={id:crypto.randomUUID(),trabajador_id:f.get('trabajador_id'),fecha:f.get('fecha'),monto_anticipo:anticipo,monto_facturas:factura,monto_devuelto:Math.max(0,anticipo-factura),monto_adicional:Math.max(0,factura-anticipo)};
    const next=[...anticipos,item];setAnticipos(next);persist('tc_anticipos',next);e.currentTarget.reset();
  };

  const agregarGasolina = e => {
    e.preventDefault(); const f=new FormData(e.currentTarget);
    const item={id:crypto.randomUUID(),trabajador_id:f.get('trabajador_id'),fecha:f.get('fecha'),monto:Number(f.get('monto')||0),pagado_por:f.get('pagado_por')};
    const next=[...gasolina,item];setGasolina(next);persist('tc_gasolina',next);e.currentTarget.reset();
  };

  const cerrarEfectivo = (trabajador) => {
    const serviciosEfectivo=servicios.filter(s=>s.fecha===fecha && s.estado==='realizado' && s.forma_pago==='efectivo' && getAsignados(s.id).includes(trabajador.id));
    const esperado=serviciosEfectivo.reduce((a,s)=>a+Number(s.precio||0),0);
    const entregado=Number(prompt(`Efectivo entregado por ${trabajador.nombre}:`,String(esperado))||0);
    const next={...efectivo,[`${fecha}_${trabajador.id}`]:{esperado,entregado,diferencia:entregado-esperado}};
    setEfectivo(next);persist('tc_efectivo',next);
  };

  const semana = weekStart(fecha);
  const semanaFin = (()=>{const d=new Date(`${semana}T12:00:00`);d.setDate(d.getDate()+6);return d.toISOString().slice(0,10)})();

  const addDays = (dateValue, days) => {
    const d = new Date(`${dateValue}T12:00:00`);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0,10);
  };

  const periodoRango = (tipo, fechaBase) => {
    if (tipo === 'semana') {
      const inicio = weekStart(fechaBase);
      return { inicio, fin: addDays(inicio, 6) };
    }

    const inicio = `${fechaBase.slice(0,7)}-01`;
    const d = new Date(`${inicio}T12:00:00`);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return { inicio, fin: d.toISOString().slice(0,10) };
  };

  const rangoTrabajadores = periodoRango(periodoTrabajadores, fechaTrabajadores);
  const serviciosPeriodoTrabajadores = servicios.filter(
    s => s.fecha >= rangoTrabajadores.inicio && s.fecha <= rangoTrabajadores.fin
  );

  const pagoTrabajadorPeriodo = (trabajador) => {
    let total = 0;

    for (
      let d = new Date(`${rangoTrabajadores.inicio}T12:00:00`);
      d <= new Date(`${rangoTrabajadores.fin}T12:00:00`);
      d.setDate(d.getDate() + 1)
    ) {
      const fechaDia = d.toISOString().slice(0,10);
      total += pagoTrabajadorDia(trabajador, fechaDia);
    }

    return Math.round(total);
  };

  const motoPeriodoTrabajador = (trabajador) => {
    if (trabajador.tipo_pago === 'propietario') return 0;

    let total = 0;

    for (
      let d = new Date(`${rangoTrabajadores.inicio}T12:00:00`);
      d <= new Date(`${rangoTrabajadores.fin}T12:00:00`);
      d.setDate(d.getDate() + 1)
    ) {
      const fechaDia = d.toISOString().slice(0,10);
      total += motoDelDia(trabajador, fechaDia);
    }

    return total;
  };

  const rangoFinanzas = periodoRango(periodoFinanzas, fechaFinanzas);
  const serviciosPeriodoFinanzas = servicios.filter(
    s =>
      s.estado === 'realizado' &&
      s.fecha >= rangoFinanzas.inicio &&
      s.fecha <= rangoFinanzas.fin
  );
  const ingresosPeriodo = serviciosPeriodoFinanzas.reduce(
    (a,s)=>a+Number(s.precio||0),0
  );

  const gastosPeriodo = gastos
    .filter(g=>g.fecha >= rangoFinanzas.inicio && g.fecha <= rangoFinanzas.fin)
    .reduce((a,g)=>a+Number(g.monto||0),0);

  // Acumulado real de moto: $30.000 por trabajador por día trabajado.
  // Daniel conserva su $10.000 adicional como ajuste de su parte, no como
  // un segundo cobro de moto en Finanzas.
  const motoTrabajadoresPeriodo = trabajadores
    .filter(t => t.tipo_pago !== 'propietario')
    .map(t => ({
      trabajador: t,
      total: (() => {
        let total = 0;
        for (
          let d = new Date(`${rangoFinanzas.inicio}T12:00:00`);
          d <= new Date(`${rangoFinanzas.fin}T12:00:00`);
          d.setDate(d.getDate() + 1)
        ) {
          total += motoDelDia(t, d.toISOString().slice(0,10));
        }
        return total;
      })()
    }));

  const motoPeriodo = motoTrabajadoresPeriodo
    .reduce((a,x)=>a+x.total,0);

  // Costo real de mano de obra del período.
  // Se calcula con el mismo pago diario que ya usa la sección Trabajadores,
  // evitando que Finanzas muestre la utilidad como si no hubiera empleados.
  const pagosTrabajadoresPeriodo = trabajadores
    .filter(t => t.tipo_pago !== 'propietario')
    .map(t => ({
      trabajador: t,
      total: (() => {
        let total = 0;
        for (
          let d = new Date(`${rangoFinanzas.inicio}T12:00:00`);
          d <= new Date(`${rangoFinanzas.fin}T12:00:00`);
          d.setDate(d.getDate() + 1)
        ) {
          total += pagoTrabajadorDia(t, d.toISOString().slice(0,10));
        }
        return total;
      })()
    }));

  const pagosTrabajadoresPeriodoTotal =
    pagosTrabajadoresPeriodo.reduce((a,x)=>a+x.total,0);

  const gasolinaPeriodo = gasolina
    .filter(g=>g.fecha >= rangoFinanzas.inicio && g.fecha <= rangoFinanzas.fin && g.pagado_por==='negocio')
    .reduce((a,g)=>a+Number(g.monto||0),0);

  const publicidadPeriodo =
    Number(publicidadManual[periodoFinanzas+'_'+fechaFinanzas] || 0);

  const resultadoPeriodo =
    ingresosPeriodo -
    gastosPeriodo -
    pagosTrabajadoresPeriodoTotal -
    gasolinaPeriodo -
    publicidadPeriodo;

  // Distribución visual de los ingresos del período.
  // El resultado representa lo que queda después de los gastos que
  // actualmente descuenta Finanzas.
  const datosGraficoFinanzas = useMemo(() => {
    const valores = [
      { nombre: 'Trabajadores', valor: Math.max(0, pagosTrabajadoresPeriodoTotal) },
      { nombre: 'Gastos extra', valor: Math.max(0, gastosPeriodo) },
      { nombre: 'Gasolina', valor: Math.max(0, gasolinaPeriodo) },
      { nombre: 'Publicidad', valor: Math.max(0, publicidadPeriodo) },
      { nombre: 'Ganancia', valor: Math.max(0, resultadoPeriodo) }
    ];

    const total = valores.reduce((a, x) => a + x.valor, 0);

    if (total <= 0) return [];

    const colores = ['#2563eb', '#f59e0b', '#8b5cf6', '#ef4444', '#16a34a'];
    let acumulado = 0;

    return valores
      .filter(x => x.valor > 0)
      .map((x, i, arr) => {
        const porcentaje = (x.valor / total) * 100;
        const inicio = acumulado;
        acumulado += porcentaje;
        return {
          ...x,
          porcentaje,
          inicio,
          fin: i === arr.length - 1 ? 100 : acumulado,
          color: colores[i]
        };
      });
  }, [
    pagosTrabajadoresPeriodoTotal,
    gastosPeriodo,
    gasolinaPeriodo,
    publicidadPeriodo,
    resultadoPeriodo
  ]);

  const gradienteGraficoFinanzas = datosGraficoFinanzas.length
    ? `conic-gradient(${datosGraficoFinanzas.map(x => `${x.color} ${x.inicio}% ${x.fin}%`).join(', ')})`
    : 'conic-gradient(#e5e7eb 0% 100%)';

  const etiquetaRango = (tipo, rango) =>
    tipo === 'semana'
      ? `${dateLabel(rango.inicio)} — ${dateLabel(rango.fin)}`
      : new Date(`${rango.inicio}T12:00:00`).toLocaleDateString('es-CO', {
          month:'long',
          year:'numeric'
        });

  const moverPeriodo = (tipo, fechaBase, direccion) => {
    if (tipo === 'semana') return addDays(fechaBase, direccion * 7);

    const d = new Date(`${fechaBase.slice(0,7)}-01T12:00:00`);
    d.setMonth(d.getMonth() + direccion);
    return d.toISOString().slice(0,10);
  };

  const serviciosSemanaEfectivo = (trabajadorId, inicio, fin) =>
    servicios
      .filter(s =>
        s.estado === 'realizado' &&
        s.forma_pago === 'efectivo' &&
        s.fecha >= inicio &&
        s.fecha <= fin &&
        getAsignados(s.id).includes(trabajadorId)
      )
      .reduce((sum,s)=>sum+Number(s.precio||0),0);


  const claveGastoSemana = (trabajadorId, inicio) =>
    `${trabajadorId}_${inicio}`;

  const gastoSemanaTrabajador = (trabajadorId, inicio, campo) =>
    Number(gastosSemanaManual[claveGastoSemana(trabajadorId, inicio)]?.[campo] || 0);

  const eliminarGastoExtra = (id) => {
    if (!window.confirm('¿Eliminar este gasto extra?')) return;

    setGastos(prev => {
      const nuevos = prev.filter(g => String(g.id) !== String(id));
      localStorage.setItem('tc_gastos', JSON.stringify(nuevos));
      return nuevos;
    });
    setMensaje('🗑️ Gasto eliminado');
    setTimeout(()=>setMensaje(''),1800);
  };

  const guardarGastoSemana = (trabajadorId, inicio, campo, valor) => {
    const key = claveGastoSemana(trabajadorId, inicio);
    setGastosSemanaManual(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [campo]: Number(valor || 0)
      }
    }));
  };

  // Guarda los tres valores semanales en Supabase.
  // El mismo trabajador + misma semana reemplaza los valores anteriores.
  const guardarGastosSemanaTrabajador = async (trabajadorId, inicio) => {
    const key = claveGastoSemana(trabajadorId, inicio);
    const actual = gastosSemanaManual[key] || {};
    const valores = {
      producto: Number(actual.producto || 0),
      gasolina: Number(actual.gasolina || 0),
      base: Number(actual.base || 0)
    };

    const { error } = await supabase
      .from('finanzas_manuales')
      .upsert({
        clave: key,
        tipo: 'trabajador_semana',
        trabajador_id: normalizeWorkerId(trabajadorId),
        periodo_tipo: 'semana',
        fecha_inicio: inicio,
        fecha_fin: addDays(inicio, 6),
        ...valores,
        publicidad: 0
      }, { onConflict: 'clave' });

    if (error) {
      alert(`No se pudieron guardar los gastos en la nube: ${error.message}`);
      return;
    }

    setGastosSemanaManual(prev => ({ ...prev, [key]: valores }));
    setMensaje('☁️ Gastos semanales guardados en la nube');
    setTimeout(() => setMensaje(''), 1800);
  };

  const guardarPublicidadPeriodo = async () => {
    const key = periodoFinanzas + '_' + fechaFinanzas;
    const valor = Number(publicidadManual[key] || 0);
    const rango = rangoFinanzas;

    const { error } = await supabase
      .from('finanzas_manuales')
      .upsert({
        clave: 'publicidad_' + key,
        tipo: 'publicidad_periodo',
        trabajador_id: null,
        periodo_tipo: periodoFinanzas,
        fecha_inicio: rango.inicio,
        fecha_fin: rango.fin,
        producto: 0,
        gasolina: 0,
        base: 0,
        publicidad: valor
      }, { onConflict: 'clave' });

    if (error) {
      alert(`No se pudo guardar la publicidad en la nube: ${error.message}`);
      return;
    }

    setPublicidadManual(prev => ({ ...prev, [key]: valor }));
    setMensaje('☁️ Publicidad guardada en la nube');
    setTimeout(() => setMensaje(''), 1800);
  };

  const copiarLiquidacionSemanal = (
    trabajador,
    rango,
    pagoDias,
    motoSemana,
    producto,
    gasolina,
    ajustesSemana,
    base,
    efectivoEsperado,
    totalSemanal
  ) => {
    const esMarry = String(trabajador.nombre).toLowerCase() === 'marry';

    return `*LIQUIDACIÓN SEMANAL ${trabajador.nombre.toUpperCase()}*
*${etiquetaRango('semana',rango)}*

Pagos diarios: $${money(pagoDias)}
Moto semana: $${money(motoSemana)}
Producto (50%): -$${money(producto * 0.5)}
Gasolina: +$${money(gasolina)}
Base en efectivo: +$${money(base)}
Ajustes: $${money(ajustesSemana)}

*TOTAL A PAGAR DOMINGO: $${money(totalSemanal)}*

*EFECTIVO ESPERADO: $${money(efectivoEsperado)}*${esMarry ? `
(Gasolina y producto se manejan desde su efectivo)` : ''}`;
  };

  const clientesInicio = useMemo(() => {
    const mapa = new Map();
    servicios.forEach(s => {
      const key = `${s.telefono || ''}|${s.cliente || ''}`.toLowerCase();
      if (!mapa.has(key)) mapa.set(key, s);
    });
    return Array.from(mapa.values());
  }, [servicios]);

  if (authLoading) {
    return (
      <div className="tc-app" style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{textAlign:'center',padding:30}}>
          <div className="tc-brand-mark tc-real-logo" style={{margin:'0 auto 16px'}}>
            <img src="/logo-total-clean.png" alt="Total Clean"/>
          </div>
          <strong>Total Clean</strong>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="tc-app" style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <form
          onSubmit={iniciarSesion}
          style={{
            width:'100%',
            maxWidth:380,
            background:'#fff',
            borderRadius:22,
            padding:28,
            boxShadow:'0 12px 35px rgba(0,0,0,.12)',
            boxSizing:'border-box'
          }}
        >
          <div style={{textAlign:'center',marginBottom:24}}>
            <div className="tc-brand-mark tc-real-logo" style={{margin:'0 auto 14px'}}>
              <img src="/logo-total-clean.png" alt="Total Clean"/>
            </div>
            <h1 style={{margin:'0 0 6px'}}>Total Clean</h1>
            <p style={{margin:0,opacity:.65}}>Ingresa para continuar</p>
          </div>

          <label style={{display:'block',marginBottom:14}}>
            <span style={{display:'block',marginBottom:6,fontWeight:600}}>Correo</span>
            <input
              type="email"
              value={loginEmail}
              onChange={e=>setLoginEmail(e.target.value)}
              autoComplete="username"
              placeholder="Correo"
              required
              style={{width:'100%',boxSizing:'border-box'}}
            />
          </label>

          <label style={{display:'block',marginBottom:14}}>
            <span style={{display:'block',marginBottom:6,fontWeight:600}}>Contraseña</span>
            <input
              type="password"
              value={loginPassword}
              onChange={e=>setLoginPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Contraseña"
              required
              style={{width:'100%',boxSizing:'border-box'}}
            />
          </label>

          {loginError && (
            <div style={{marginBottom:14,color:'#b91c1c',fontSize:14}}>
              {loginError}
            </div>
          )}

          <button type="submit" style={{width:'100%'}}>
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="tc-app">
      <header className="tc-header tc-home-header">
        <div className="tc-brand-wrap">
          <div className="tc-brand-mark tc-real-logo">
            <img src="/logo-total-clean.png" alt="Total Clean"/>
          </div>
        </div>
        <button className="tc-icon-button" aria-label="Notificaciones">
          <Icon name="bell" size={23}/>
          {resumenDia.pendientes > 0 && <b>{Math.min(resumenDia.pendientes,9)}</b>}
        </button>
      </header>

      {mensaje && <div className="tc-toast">{mensaje}</div>}

      {seccion==='inicio' && (
        <main className="tc-main tc-home">
          <section className="tc-welcome">
            <div>
              <p className="tc-eyebrow">HOY · {dateLabel(fecha).split(',').slice(0,2).join(',')}</p>
              <h1>¡Buenos días! <span>👋</span></h1>
              <p>Vamos a tener un día productivo.</p>
            </div>
          </section>

          <section className="tc-home-stats">
            <div className="tc-stat-card blue">
              <div className="tc-stat-icon"><Icon name="calendar" size={22}/></div>
              <strong>{resumenDia.cantidad}</strong>
              <span>Servicios hoy</span>
              <em>Programados</em>
            </div>
            <div className="tc-stat-card green">
              <div className="tc-stat-icon"><Icon name="check" size={22}/></div>
              <strong>{resumenDia.realizados}</strong>
              <span>Completados</span>
              <em>Hoy</em>
            </div>
            <div className="tc-stat-card orange">
              <div className="tc-stat-icon"><Icon name="clock" size={22}/></div>
              <strong>{resumenDia.pendientes}</strong>
              <span>Pendientes</span>
              <em>Hoy</em>
            </div>
            <div className="tc-stat-card purple">
              <div className="tc-stat-icon"><Icon name="users" size={22}/></div>
              <strong>{clientesInicio.length}</strong>
              <span>Clientes</span>
              <em>Registrados</em>
            </div>
          </section>

          <section className="tc-hero-clean">
            <div className="tc-hero-bubbles">
              <i></i><i></i><i></i><i></i>
            </div>
            <div className="tc-hero-copy">
              <span>✨</span>
              <h2>Hacemos brillar<br/>tu hogar</h2>
              <p>Limpieza profesional<br/>en cada detalle.</p>
            </div>
            <div className="tc-hero-illustration">
              <div className="tc-plant" aria-hidden="true">🌿</div>
              <div className="tc-sofa"><Icon name="couch" size={82}/></div>
            </div>
          </section>

          <section className="tc-home-agenda">
            <div className="tc-section-heading">
              <div>
                <div className="tc-heading-icon"><Icon name="calendar" size={20}/></div>
                <div>
                  <h2>Agenda de hoy</h2>
                  <p>{dateLabel(fecha)}</p>
                </div>
              </div>
              <button onClick={()=>setSeccion('agenda')} className="tc-outline-button">
                <Icon name="more" size={19}/>
                Lista
              </button>
            </div>

            <div className="tc-home-services">
              {serviciosDia.slice(0,4).map(s=>{
                const color=servicioColor(s.articulo);
                return (
                  <article className="tc-home-service" key={s.id}>
                    <div className="tc-home-time">{horaCorta(s.hora)}</div>
                    <div className={`tc-service-icon ${color}`}><Icon name={servicioIcono(s.articulo)} size={24}/></div>
                    <div className="tc-home-service-info">
                      <h3>{s.articulo || 'Servicio de limpieza'}</h3>
                      <p>{s.cliente}</p>
                      <small><span>⌖</span> {s.direccion || s.ciudad}</small>
                    </div>
                    <div className="tc-home-service-right">
                      <span className={`tc-status ${s.estado==='realizado'?'completed':'pending'}`}>
                        {s.estado==='realizado'?'Completado':'Pendiente'}
                      </span>
                      <strong>${money(s.precio)}</strong>
                    </div>
                  </article>
                )
              })}

              {serviciosDia.length===0 && (
                <div className="tc-empty-home">
                  <div><Icon name="calendar" size={28}/></div>
                  <strong>No hay servicios programados</strong>
                  <span>Disfruta el día o agrega uno desde Agenda.</span>
                </div>
              )}
            </div>

            {serviciosDia.length>4 && (
              <button className="tc-view-all" onClick={()=>setSeccion('agenda')}>
                Ver todos los servicios <Icon name="chevron" size={17}/>
              </button>
            )}
          </section>

          <section className="tc-income-card">
            <div className="tc-income-icon"><Icon name="money" size={25}/></div>
            <div>
              <span>Ingresos de hoy</span>
              <strong>${money(resumenDia.ingresos)}</strong>
              <small>Total del día</small>
            </div>
            <div className="tc-income-arrow"><Icon name="chevron" size={19}/></div>
          </section>
        </main>
      )}

      {seccion==='agenda' && (
        <main className="tc-main">
          <section className="tc-card">
            <h2>🔎 Buscar cliente</h2>
            <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Número telefónico"/>
            {busqueda && <div className="tc-search-results">
              {resultados.length===0 ? <p>❌ No encontramos servicios.</p> : resultados.map(s=><div className="tc-mini-card" key={s.id}>
                <strong>{s.cliente}</strong><span>{dateLabel(s.fecha)}</span><span>📞 {s.telefono}</span><span>🛋️ {s.articulo}</span>
                <button onClick={()=>{setFecha(s.fecha);setBusqueda('')}}>📅 Ir a fecha</button>
              </div>)}
            </div>}
          </section>

          <section className="tc-card">
            <div className="tc-date-row"><button onClick={()=>cambiarDia(-1)}>←</button><strong>{dateLabel(fecha)}</strong><button onClick={()=>cambiarDia(1)}>→</button></div>
            <div className="tc-pills">
              {['Todas','Barranquilla','Cartagena','Santa Marta'].map(c=><button className={ciudad===c?'active':''} key={c} onClick={()=>setCiudad(c)}>{c==='Todas'?'🌎':CIUDADES[c].icono} {c}</button>)}
            </div>
          </section>

          <section className="tc-stats">
            <div><span>🧾 Servicios</span><strong>{resumenDia.cantidad}</strong></div>
            <div><span>💰 Ingresos</span><strong>${money(resumenDia.ingresos)}</strong></div>
            <div><span>⏳ Pendientes</span><strong>{resumenDia.pendientes}</strong></div>
            <div><span>✅ Realizados</span><strong>{resumenDia.realizados}</strong></div>
          </section>

          {serviciosDia.length===0 && <section className="tc-card"><h3>📅 No tienes servicios</h3><p>No hay servicios para este día.</p></section>}

          {serviciosDia.map(s=>{
            const asignados=getAsignados(s.id);
            return <section className={`tc-service ${s.estado==='realizado'?'done':''}`} key={s.id}>
              <div className="tc-service-top"><strong>⏰ {horaCorta(s.hora)}</strong><span>{CIUDADES[s.ciudad]?.icono} {s.ciudad}</span><span>{s.estado==='realizado'?'🟢 REALIZADO':'🟡 PENDIENTE'}</span></div>
              <h3>{s.cliente}</h3>
              <p>📞 {s.telefono}</p><p>📍 {s.direccion}</p><p>🛋️ {s.articulo}</p><p>💰 <strong>${money(s.precio)}</strong></p>
              <p>💳 {s.forma_pago==='transferencia'?'Transferencia':'Efectivo'} {s.forma_pago==='efectivo'&&<span className="tc-badge">Efectivo pendiente</span>}</p>
              {s.imagen && <img className="tc-thumb" src={s.imagen} alt="Artículo" onClick={()=>setImagenGrande(s.imagen)}/>}
              {s.observaciones && <p>📝 {s.observaciones}</p>}

              <div className="tc-workers">
                <strong>👷 Trabajadores</strong>
                <div className="tc-worker-checks">
                  {trabajadores.filter(t=>t.activo).map(t=><label key={t.id}><input type="checkbox" checked={asignados.includes(normalizeWorkerId(t.id))} onChange={e=>actualizarAsignacion(s,normalizeWorkerId(t.id),e.target.checked)}/>{t.nombre}</label>)}
                </div>
                {asignados.map(id=>{const t=trabajadores.find(x=>x.id===id); if(!t)return null; const key=`${s.id}_${t.id}`; const p=ajustesPago[key]!==undefined?Number(ajustesPago[key]):pagoAutomatico(s,t,asignados.length); return <div className="tc-pay-row" key={id}><span>{t.nombre}: <strong>${money(p)}</strong></span><button onClick={()=>modificarPago(s,t)}>✏️ Ajustar</button></div>})}
              </div>

              <div className="tc-actions">
                <button onClick={()=>copiarServicio(s)}>📋 Copiar</button>
                <button onClick={()=>abrirWhatsApp(s)}>💬 WhatsApp</button>
                <button onClick={()=>editar(s)}>✏️ Editar</button>
                <button onClick={()=>cambiarEstado(s)}>{s.estado==='realizado'?'↩️ Pendiente':'✅ Servicio realizado'}</button>
                <button className="danger" onClick={()=>eliminar(s.id)}>🗑️</button>
              </div>
            </section>
          })}
        </main>
      )}

      {seccion==='clientes' && (
        <main className="tc-main tc-clients">
          <section className="tc-card">
            <h2>👥 Clientes</h2>
            <div className="tc-client-search">
              <Icon name="search" size={19}/>
              <input
                value={busqueda}
                onChange={e=>setBusqueda(e.target.value)}
                placeholder="Buscar cliente o teléfono"
              />
            </div>
          </section>

          <section className="tc-client-list">
            {clientesInicio
              .filter(c=>{
                const q=busqueda.toLowerCase();
                return !q || String(c.cliente||'').toLowerCase().includes(q) || String(c.telefono||'').includes(q);
              })
              .map(c=>(
                <article className="tc-client-card" key={`${c.telefono}|${c.cliente}`}>
                  <div className="tc-client-avatar">{String(c.cliente||'?').trim().charAt(0).toUpperCase()}</div>
                  <div>
                    <strong>{c.cliente}</strong>
                    <span>📞 {c.telefono || 'Sin teléfono'}</span>
                    <small>Último servicio: {dateLabel(c.fecha)}</small>
                  </div>
                  <Icon name="chevron" size={19}/>
                </article>
              ))}
          </section>
        </main>
      )}

      {seccion==='trabajadores' && (
        <main className="tc-main">
          <section className="tc-card">
            <h2>👷 Trabajadores</h2>

            <div className="tc-period-tabs">
              <button
                className={vistaPagosTrabajadores==='diario'?'active':''}
                onClick={()=>setVistaPagosTrabajadores('diario')}
              >Pago diario</button>
              <button
                className={vistaPagosTrabajadores==='semanal'?'active':''}
                onClick={()=>setVistaPagosTrabajadores('semanal')}
              >Pago semanal</button>
            </div>
          </section>

          {vistaPagosTrabajadores==='diario' && (
            <>
              <section className="tc-card">
                <div className="tc-period-nav">
                  <button onClick={()=>setFechaTrabajadores(addDays(fechaTrabajadores,-1))}>←</button>
                  <strong>{dateLabel(fechaTrabajadores)}</strong>
                  <button onClick={()=>setFechaTrabajadores(addDays(fechaTrabajadores,1))}>→</button>
                </div>
              </section>

              {trabajadores.map(t=>{
                const serviciosDia=serviciosDeTrabajadorDia(t,fechaTrabajadores);
                const total=pagoTrabajadorDia(t,fechaTrabajadores);
                const moto=motoDelDia(t,fechaTrabajadores);
                const generado=serviciosDia.reduce((sum,s)=>sum+Number(s.precio||0),0);

                if (!serviciosDia.length) return null;

                return <section className="tc-card tc-worker-card" key={t.id}>
                  <div>
                    <h3>{t.nombre}</h3>
                    <p>Servicios del día: ${money(generado)}</p>
                    {moto>0 && <small>Moto del día: -${money(moto)}</small>}
                    {String(t.nombre).toLowerCase()==='daniel' && (
                      <small>Ajuste Daniel: -$10.000</small>
                    )}
                  </div>

                  <div className="tc-worker-money">${money(total)}</div>

                  {(() => {
                    const cobros = cobrosDiarios(t, fechaTrabajadores);
                    return (
                      <div style={{marginTop:8, fontSize:13, lineHeight:1.6}}>
                        <div><strong>Efectivo:</strong> ${money(cobros.efectivo)}</div>
                        <div><strong>Transferencia:</strong> ${money(cobros.transferencia)}</div>
                        <div><strong>Recibido:</strong> ${money(cobros.total)}</div>
                      </div>
                    );
                  })()}

                  <button onClick={()=>copiar(pagoCopiable(t,fechaTrabajadores))}>
                    📋 Copiar pago
                  </button>
                </section>
              })}

              {!trabajadores.some(t=>serviciosDeTrabajadorDia(t,fechaTrabajadores).length>0) && (
                <section className="tc-card">
                  <p>No hay servicios asignados a trabajadores en este día.</p>
                </section>
              )}
            </>
          )}

          {vistaPagosTrabajadores==='semanal' && (
            <>
              <section className="tc-card">
                <div className="tc-period-nav">
                  <button onClick={()=>setFechaTrabajadores(addDays(fechaTrabajadores,-7))}>←</button>
                  <strong>{etiquetaRango('semana',periodoRango('semana',fechaTrabajadores))}</strong>
                  <button onClick={()=>setFechaTrabajadores(addDays(fechaTrabajadores,7))}>→</button>
                </div>
              </section>

              {trabajadores.map(t=>{
                const rango=periodoRango('semana',fechaTrabajadores);
                const dias=[];
                let d=new Date(`${rango.inicio}T12:00:00`);

                while(d<=new Date(`${rango.fin}T12:00:00`)){
                  const fechaDia=d.toISOString().slice(0,10);
                  const serviciosDia=serviciosDeTrabajadorDia(t,fechaDia);
                  if(serviciosDia.length){
                    dias.push({
                      fecha:fechaDia,
                      total:pagoTrabajadorDia(t,fechaDia),
                      servicios:serviciosDia
                    });
                  }
                  d.setDate(d.getDate()+1);
                }

                const pagoDias=dias.reduce((sum,x)=>sum+x.total,0);
                const motoSemana=motoPeriodoTrabajador(t);

                const anticiposSemana=anticipos.filter(a =>
                  normalizeWorkerId(a.trabajador_id)===normalizeWorkerId(t.id) &&
                  a.fecha >= rango.inicio &&
                  a.fecha <= rango.fin
                );

                const productoBaseRegistrado = anticiposSemana.reduce(
                  (sum,a)=>sum+Number(a.monto_facturas||0),0
                );

                const nombre=String(t.nombre)
                  .trim()
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\\u0300-\\u036f]/g,'');

                // Valores semanales editables directamente desde Trabajadores.
                const productoManual = gastoSemanaTrabajador(t.id,rango.inicio,'producto');
                const gasolinaSemanaManual = gastoSemanaTrabajador(t.id,rango.inicio,'gasolina');
                const baseManual = gastoSemanaTrabajador(t.id,rango.inicio,'base');

                const producto = productoManual > 0
                  ? productoManual
                  : productoBaseRegistrado;

                const gasolinaRealRegistrada=gasolina.filter(g =>
                  normalizeWorkerId(g.trabajador_id)===normalizeWorkerId(t.id) &&
                  g.fecha >= rango.inicio &&
                  g.fecha <= rango.fin
                ).reduce((sum,g)=>sum+Number(g.monto||0),0);

                const esDanielOAngel =
                  nombre === 'daniel' || nombre === 'angel';

                const gasolinaSemana =
                  gasolinaSemanaManual > 0
                    ? gasolinaSemanaManual
                    : (esDanielOAngel ? 15000 : gasolinaRealRegistrada);

                const base = baseManual;

                const ajustesSemana=serviciosPeriodoTrabajadores
                  .filter(s =>
                    s.fecha >= rango.inicio &&
                    s.fecha <= rango.fin &&
                    getAsignados(s.id).includes(normalizeWorkerId(t.id)) &&
                    ajustesPago[`${s.id}_${t.id}`] !== undefined
                  )
                  .reduce((sum,s)=>
                    sum + (
                      Number(ajustesPago[`${s.id}_${t.id}`] || 0) -
                      pagoAutomatico(s,t,getAsignados(s.id).length)
                    ),0);

                const efectivoBruto=serviciosSemanaEfectivo(
                  t.id,
                  rango.inicio,
                  rango.fin
                );

                // Marry: sus gastos de gasolinaSemana y producto excedente salen
                // del efectivo que tiene, no del pago que se le liquida.
                const productoExcedenteMarry =
                  nombre === 'marry'
                    ? Math.max(0, producto - 100000)
                    : 0;

                // La BASE también forma parte del efectivo que tiene el
                // trabajador: es dinero que tú le dejaste, por lo que se suma
                // al efectivo esperado.
                //
                // En Marry, de ese efectivo se descuentan sus gastos reales
                // de gasolina y el producto que exceda la base de $100.000.
                // La BASE es dinero que ya está en manos del trabajador:
                // solo se suma al EFECTIVO esperado.
                // NO se suma a sus ganancias ni al pago del domingo.
                const efectivoEsperado =
  Math.max(
    0,
    efectivoBruto +
    base -
    producto -
    (nombre === 'marry' ? gasolinaSemana : 0)
  );

const descuentoProductoTrabajador =
                  Number(producto || 0) * 0.50;

                const totalSemanal=Math.max(
                  0,
                  pagoDias -
                  descuentoProductoTrabajador +
                  gasolinaSemana +
                  ajustesSemana
                );

                return <section className="tc-card tc-week-worker-card" key={t.id}>
                  <div className="tc-worker-card">
                    <div>
                      <h3>{t.nombre}</h3>
                      <p>{dias.length} día(s) trabajado(s)</p>
                    </div>
                    <div className="tc-worker-money">${money(totalSemanal)}</div>
                    <button onClick={()=>copiar(
                      copiarLiquidacionSemanal(
                        t,
                        rango,
                        pagoDias,
                        motoSemana,
                        producto,
                        gasolinaSemana,
                        ajustesSemana,
                        base,
                        efectivoEsperado,
                        totalSemanal
                      )
                    )}>
                      📋 Copiar liquidación
                    </button>
                  </div>

                  <div className="tc-weekly-inputs">
                    <label>
                      <span>🧴 Producto</span>
                      <input
                        type="number"
                        min="0"
                        value={productoManual || ''}
                        placeholder={productoBaseRegistrado ? money(productoBaseRegistrado) : '0'}
                        onChange={e=>guardarGastoSemana(t.id,rango.inicio,'producto',e.target.value)}
                      />
                    </label>

                    <label>
                      <span>⛽ Gasolina</span>
                      <input
                        type="number"
                        min="0"
                        value={gasolinaSemanaManual || ''}
                        placeholder={nombre==='marry'
                          ? 'Gasto real'
                          : '15.000 automático'}
                        onChange={e=>guardarGastoSemana(t.id,rango.inicio,'gasolina',e.target.value)}
                      />
                    </label>

                    <label>
                      <span>💵 Base</span>
                      <input
                        type="number"
                        min="0"
                        value={baseManual || ''}
                        placeholder="0"
                        onChange={e=>guardarGastoSemana(t.id,rango.inicio,'base',e.target.value)}
                      />
                    </label>
                  </div>

                  <div className="tc-manual-save-row">
                    <button
                      type="button"
                      className="tc-save-manual"
                      onClick={()=>guardarGastosSemanaTrabajador(t.id,rango.inicio)}
                    >
                      💾 Guardar gastos
                    </button>
                  </div>

                  <div className="tc-finance-grid">
                    <div>
                      <span>Pagos diarios</span>
                      <strong>${money(pagoDias)}</strong>
                    </div>
                    <div>
                      <span>Moto semana</span>
                      <strong>${money(motoSemana)}</strong>
                    </div>
                    <div>
                      <span>Producto (50%)</span>
                      <strong>-${money(descuentoProductoTrabajador)}</strong>
                    </div>
                    <div>
                      <span>Gasolina</span>
                      <strong>+${money(gasolinaSemana)}</strong>
                    </div>
                    <div>
                      <span>Ajustes</span>
                      <strong>${money(ajustesSemana)}</strong>
                    </div>
                    <div className="total">
                      <span>Total a pagar domingo</span>
                      <strong>${money(totalSemanal)}</strong>
                    </div>
                  </div>

                  <div className="tc-card" style={{marginTop:'10px', marginBottom:0}}>
                    <h3>💵 Efectivo esperado</h3>
                    <p>Debe tener: <strong>${money(efectivoEsperado)}</strong></p>
                    {base > 0 && (
                      <small>Incluye la base entregada: +${money(base)}</small>
                    )}

                    {nombre === 'marry' && (
                      <small>
                        Efectivo bruto: ${money(efectivoBruto)}
                        {gasolinaSemana > 0 ? ` · Gasolina: -$${money(gasolinaSemana)}` : ''}
                        {productoExcedenteMarry > 0
                          ? ` · Producto excedente: -$${money(productoExcedenteMarry)}`
                          : ''}
                      </small>
                    )}
                  </div>

                  {dias.length>0 && (
                    <div className="tc-card" style={{marginTop:'10px', marginBottom:0}}>
                      <h3>📅 Días trabajados</h3>
                      {dias.map(x=>
                        <p key={x.fecha}>
                          <strong>{dateLabel(x.fecha)}</strong> · ${money(x.total)}
                        </p>
                      )}
                    </div>
                  )}
                </section>
              })}

              {trabajadores.length===0 && (
                <section className="tc-card">
                  <p>No hay trabajadores registrados.</p>
                </section>
              )}
            </>
          )}

        </main>
      )}

      {seccion==='finanzas' && (
        <main className="tc-main">
          <section className="tc-card">
            <h2>📊 Finanzas</h2>

            <div className="tc-finance-sections">
              <button
                className={periodoFinanzas==='semana'?'active':''}
                onClick={()=>setPeriodoFinanzas('semana')}
              >📅 Finanzas semanales</button>
              <button
                className={periodoFinanzas==='mes'?'active':''}
                onClick={()=>setPeriodoFinanzas('mes')}
              >🗓️ Finanzas mensuales</button>
            </div>

            <div className="tc-period-nav">
              <button onClick={()=>setFechaFinanzas(moverPeriodo(periodoFinanzas,fechaFinanzas,-1))}>←</button>
              <strong>
                {periodoFinanzas==='semana' ? 'Semana · ' : 'Mes · '}
                {etiquetaRango(periodoFinanzas,rangoFinanzas)}
              </strong>
              <button onClick={()=>setFechaFinanzas(moverPeriodo(periodoFinanzas,fechaFinanzas,1))}>→</button>
            </div>

            <div className="tc-finance-manual">
              <label>
                <span>📣 Publicidad del período</span>
                <input
                  type="number"
                  min="0"
                  value={publicidadManual[periodoFinanzas+'_'+fechaFinanzas] || ''}
                  placeholder="0"
                  onChange={e=>setPublicidadManual(prev=>({
                    ...prev,
                    [periodoFinanzas+'_'+fechaFinanzas]: Number(e.target.value||0)
                  }))}
                />
                <button
                  type="button"
                  className="tc-save-manual"
                  onClick={guardarPublicidadPeriodo}
                >
                  💾 Guardar
                </button>
              </label>
            </div>

            <p className="tc-helper-text">
              Aquí puedes registrar cualquier gasto que salga del bolsillo del negocio.
            </p>

            <div className="tc-finance-grid">
              <div><span>Ingresos</span><strong>${money(ingresosPeriodo)}</strong></div>
              <div><span>Gastos extra</span><strong>-${money(gastosPeriodo)}</strong></div>
              <div><span>Pagos trabajadores</span><strong>-${money(pagosTrabajadoresPeriodoTotal)}</strong></div>
              <div><span>Moto del período</span><strong>-${money(motoPeriodo)}</strong></div>
              <div><span>Gasolina negocio</span><strong>-${money(gasolinaPeriodo)}</strong></div>
              <div><span>Publicidad</span><strong>-${money(publicidadPeriodo)}</strong></div>
              <div className="total"><span>Resultado</span><strong>${money(resultadoPeriodo)}</strong></div>
            </div>
          </section>

          <section className="tc-card">
            <h3>🍕 {periodoFinanzas==='semana' ? 'Distribución semanal' : 'Distribución mensual'}</h3>
            <p className="tc-helper-text">Cómo se distribuyeron los ingresos del período.</p>

            {datosGraficoFinanzas.length > 0 ? (
              <div style={{display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'center', gap:'24px', padding:'12px 0 4px'}}>
                <div
                  aria-label="Gráfico de distribución financiera"
                  style={{
                    width:'220px',
                    height:'220px',
                    borderRadius:'50%',
                    background:gradienteGraficoFinanzas,
                    position:'relative',
                    flex:'0 0 auto',
                    boxShadow:'0 4px 14px rgba(0,0,0,.12)'
                  }}
                >
                  <div style={{
                    position:'absolute',
                    inset:'28%',
                    borderRadius:'50%',
                    background:'var(--tc-card-bg, #fff)',
                    display:'flex',
                    flexDirection:'column',
                    alignItems:'center',
                    justifyContent:'center',
                    textAlign:'center',
                    padding:'6px'
                  }}>
                    <small style={{opacity:.7}}>Ingresos</small>
                    <strong style={{fontSize:'17px'}}>${money(ingresosPeriodo)}</strong>
                  </div>
                </div>

                <div style={{minWidth:'220px', flex:'1 1 240px', maxWidth:'360px'}}>
                  {datosGraficoFinanzas.map(x => (
                    <div key={x.nombre} style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', padding:'7px 0', borderBottom:'1px solid rgba(127,127,127,.14)'}}>
                      <span style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <span style={{width:'12px', height:'12px', borderRadius:'50%', background:x.color, display:'inline-block'}}></span>
                        {x.nombre}
                      </span>
                      <strong>${money(x.valor)} · {x.porcentaje.toFixed(1)}%</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="tc-helper-text">No hay movimientos suficientes para mostrar el gráfico.</p>
            )}
          </section>

          <section className="tc-card">
            <h3>{periodoFinanzas==='semana' ? '📅 Resumen semanal' : '🗓️ Resumen mensual'}</h3>
            <p>Servicios realizados: <strong>{serviciosPeriodoFinanzas.filter(s=>s.estado==='realizado').length}</strong></p>
            <p>Servicios registrados: <strong>{serviciosPeriodoFinanzas.length}</strong></p>
            <p>En efectivo: <strong>${money(serviciosPeriodoFinanzas.filter(s=>s.forma_pago==='efectivo').reduce((a,s)=>a+Number(s.precio||0),0))}</strong></p>
            <p>Por transferencia: <strong>${money(serviciosPeriodoFinanzas.filter(s=>s.forma_pago==='transferencia').reduce((a,s)=>a+Number(s.precio||0),0))}</strong></p>
          </section>
          <section className="tc-card tc-gasto-extra-card">
            <h3>💸 Gastos extra</h3>
            <form onSubmit={agregarGasto} className="tc-gasto-extra-form">
              <input name="fecha" type="date" defaultValue={fechaFinanzas} required/>
              <input name="descripcion" placeholder="Ej: gasolina, publicidad, repuesto..." required/>
              <input name="monto" type="number" min="0" placeholder="$ Monto" required/>
              <input type="hidden" name="categoria" value="Otros"/>
              <button type="submit">Agregar</button>
            </form>

            <div className="tc-gasto-extra-list">
              {gastos
                .filter(g=>g.fecha >= rangoFinanzas.inicio && g.fecha <= rangoFinanzas.fin)
                .slice(-8)
                .reverse()
                .map(g=>(
                  <div className="tc-gasto-extra-row" key={g.id}>
                    <span>{g.descripcion}</span>
                    <strong>-${money(g.monto)}</strong>
                    <button
                      type="button"
                      onClick={()=>eliminarGastoExtra(g.id)}
                      title="Eliminar gasto"
                    >✕</button>
                  </div>
                ))}
            </div>
          </section>

          <section className="tc-card">
            <h3>👷 Pagos a trabajadores</h3>
            <div className="tc-finance-grid">
              {pagosTrabajadoresPeriodo.map(x => (
                <div key={x.trabajador.id}>
                  <span>{x.trabajador.nombre}</span>
                  <strong>-${money(x.total)}</strong>
                </div>
              ))}
              <div className="total">
                <span>Total trabajadores</span>
                <strong>-${money(pagosTrabajadoresPeriodoTotal)}</strong>
              </div>
            </div>
          </section>

          <section className="tc-card tc-moto-card">
            <h3>🏍️ Acumulado de moto</h3>
            <p>Período: <strong>{etiquetaRango(periodoFinanzas,rangoFinanzas)}</strong></p>

            <div className="tc-finance-grid">
              <div className="total">
                <span>Moto total del período</span>
                <strong>${money(motoPeriodo)}</strong>
              </div>
              {motoTrabajadoresPeriodo.map(x => (
                <div key={x.trabajador.id}>
                  <span>{x.trabajador.nombre}</span>
                  <strong>${money(x.total)}</strong>
                </div>
              ))}
            </div>
          </section>

        </main>
      )}

      {formOpen && <div className="tc-modal"><div className="tc-modal-box">
        <h2>{editId?'✏️ Editar servicio':'➕ Nuevo servicio'}</h2>
        <form onSubmit={guardarServicio} className="tc-form">
          <input value={formulario.cliente} onChange={e=>setFormulario({...formulario,cliente:e.target.value})} placeholder="Cliente" required/>
          <input value={formulario.telefono} onChange={e=>setFormulario({...formulario,telefono:e.target.value})} placeholder="Teléfono" required/>
          <input value={formulario.direccion} onChange={e=>setFormulario({...formulario,direccion:e.target.value})} placeholder="Dirección" required/>
          <input value={formulario.articulo} onChange={e=>setFormulario({...formulario,articulo:e.target.value})} placeholder="Artículo / Servicio" required/>
          <div className="tc-two"><input type="date" value={formulario.fecha} onChange={e=>setFormulario({...formulario,fecha:e.target.value})} required/><input type="time" value={formulario.hora} onChange={e=>setFormulario({...formulario,hora:e.target.value})} required/></div>
          <div className="tc-two"><select value={formulario.ciudad} onChange={e=>setFormulario({...formulario,ciudad:e.target.value})}><option>Barranquilla</option><option>Cartagena</option><option>Santa Marta</option></select><select value={formulario.forma_pago} onChange={e=>setFormulario({...formulario,forma_pago:e.target.value})}><option value="efectivo">💵 Efectivo</option><option value="transferencia">🏦 Transferencia</option></select></div>
          <select value={formulario.origen} onChange={e=>setFormulario({...formulario,origen:e.target.value})}>{ORIGENES.map(o=><option value={o.nombre} key={o.nombre}>{o.icono} {o.nombre}</option>)}</select>
          <input inputMode="numeric" value={money(formulario.precio)} onChange={e=>setFormulario({...formulario,precio:e.target.value.replace(/\D/g,'')})} placeholder="Precio" required/>
          <textarea value={formulario.observaciones} onChange={e=>setFormulario({...formulario,observaciones:e.target.value})} placeholder="Observaciones"/>
          <input type="file" accept="image/*" onChange={seleccionarImagen}/>
          {imagen && <img className="tc-preview" src={imagen} alt="Vista previa"/>}
          <div className="tc-actions"><button type="submit">💾 Guardar</button><button type="button" onClick={()=>setFormOpen(false)}>Cancelar</button></div>
        </form>
      </div></div>}

      {imagenGrande && <div className="tc-image-modal" onClick={()=>setImagenGrande(null)}><img src={imagenGrande} alt="Artículo ampliado"/></div>}

      {menuMas && (
        <div className="tc-more-backdrop" onClick={()=>setMenuMas(false)}>
          <div className="tc-more-sheet" onClick={e=>e.stopPropagation()}>
            <div className="tc-sheet-handle"></div>
            <h3>Más opciones</h3>
            <button onClick={()=>{setSeccion('clientes');setMenuMas(false)}}><span className="tc-more-icon blue"><Icon name="users" size={21}/></span><span>Clientes</span><Icon name="chevron" size={18}/></button>
            <button onClick={()=>{setSeccion('finanzas');setMenuMas(false)}}><span className="tc-more-icon green"><Icon name="wallet" size={21}/></span><span>Finanzas</span><Icon name="chevron" size={18}/></button>
          </div>
        </div>
      )}

      <nav className="tc-bottom-nav">
        <button className={seccion==='inicio'?'active':''} onClick={()=>setSeccion('inicio')}>
          <Icon name="home" size={22}/><span>Inicio</span>
        </button>
        <button className={seccion==='agenda'?'active':''} onClick={()=>setSeccion('agenda')}>
          <Icon name="calendar" size={22}/><span>Agenda</span>
        </button>
        <button className="tc-new-button" onClick={abrirNuevo} aria-label="Nuevo servicio">
          <span><Icon name="plus" size={29}/></span>
          <small>Nuevo</small>
        </button>
        <button className={seccion==='trabajadores'?'active':''} onClick={()=>setSeccion('trabajadores')}>
          <Icon name="users" size={22}/><span>Trabajadores</span>
        </button>
        <button className={menuMas?'active':''} onClick={()=>setMenuMas(!menuMas)}>
          <Icon name="menu" size={22}/><span>Más</span>
        </button>
      </nav>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
