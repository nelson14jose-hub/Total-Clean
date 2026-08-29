import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import { supabase } from './supabase';

const CIUDADES = {
  Barranquilla: {
    color: '#2563eb',
    fondo: '#eff6ff',
    icono: '🔵'
  },
  Cartagena: {
    color: '#16a34a',
    fondo: '#f0fdf4',
    icono: '🟢'
  },
  'Santa Marta': {
    color: '#f97316',
    fondo: '#fff7ed',
    icono: '🟠'
  }
};

const ORIGENES = [
  { nombre: 'Business', icono: '💼' },
  { nombre: 'WhatsApp personal', icono: '🟢' },
  { nombre: 'FB Daniel', icono: '🔵' },
  { nombre: 'FB Keysi', icono: '🔵' },
  { nombre: 'FB Patricia', icono: '🔵' },
  { nombre: 'Otros FB', icono: '📘' }
];

function App() {
  const obtenerFechaHoy = () => {
    const hoy = new Date();

    return `${hoy.getFullYear()}-${String(
      hoy.getMonth() + 1
    ).padStart(2, '0')}-${String(
      hoy.getDate()
    ).padStart(2, '0')}`;
  };

  const [fechaSeleccionada, setFechaSeleccionada] =
    useState(obtenerFechaHoy());

  const [ciudadSeleccionada, setCiudadSeleccionada] =
    useState('Todas');

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [imagenAmpliada, setImagenAmpliada] =
    useState(null);

  const [mostrarCalendario, setMostrarCalendario] =
    useState(false);

  const [servicios, setServicios] = useState(() => {
    try {
      const guardados = localStorage.getItem(
        'serviciosTotalClean'
      );

      return guardados ? JSON.parse(guardados) : [];
    } catch {
      return [];
    }
  });

  // Cargar los servicios desde Supabase al abrir la aplicación.
  useEffect(() => {
    const cargarServiciosDesdeSupabase = async () => {
      const { data, error } = await supabase
        .from('servicios')
        .select('*')
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true });

      if (error) {
        console.error(
          'Error cargando servicios desde Supabase:',
          error.message
        );
        return;
      }

      if (data) {
        setServicios(data);
        localStorage.setItem(
          'serviciosTotalClean',
          JSON.stringify(data)
        );
      }
    };

    cargarServiciosDesdeSupabase();
  }, []);

  const [servicioEditando, setServicioEditando] =
    useState(null);

  const [busquedaTelefono, setBusquedaTelefono] =
    useState('');

  const [mostrarResultadosBusqueda, setMostrarResultadosBusqueda] =
    useState(false);

  const [formulario, setFormulario] = useState({
    cliente: '',
    telefono: '',
    direccion: '',
    articulo: '',
    fecha: '',
    hora: '',
    ciudad: 'Barranquilla',
    origen: 'Business',
    precio: '',
    observaciones: '',
    imagen: ''
  });

  const guardarLocalmente = (lista) => {
    setServicios(lista);

    localStorage.setItem(
      'serviciosTotalClean',
      JSON.stringify(lista)
    );
  };

  const formatearPrecio = (valor) => {
    if (
      valor === undefined ||
      valor === null ||
      valor === ''
    ) {
      return '0';
    }

    const numero = String(valor).replace(/\D/g, '');

    if (!numero) return '0';

    return Number(numero).toLocaleString('es-CO');
  };

  const manejarPrecio = (e) => {
    const numero = e.target.value.replace(/\D/g, '');

    setFormulario({
      ...formulario,
      precio: numero
    });
  };

  const limpiarTelefono = (telefono) => {
    return String(telefono || '').replace(/\D/g, '');
  };

  const abrirWhatsApp = (servicio) => {
    let telefono = limpiarTelefono(
      servicio.telefono
    );

    if (!telefono) {
      alert(
        'Este servicio no tiene número telefónico.'
      );
      return;
    }

    if (!telefono.startsWith('57')) {
      telefono = `57${telefono}`;
    }

    const fecha = new Date(
      `${servicio.fecha}T12:00:00`
    );

    const fechaTexto = fecha.toLocaleDateString(
      'es-CO',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }
    );

    const mensaje =
      `Hola ${servicio.cliente} 👋\n\n` +
      `Somos Total Clean 🧼.\n\n` +
      `Le confirmamos su servicio para el día ` +
      `${fechaTexto} a las ${servicio.hora}.\n\n` +
      `🛋️ Servicio: ${servicio.articulo}\n\n` +
      `💰 Valor: $${formatearPrecio(
        servicio.precio
      )}\n\n` +
      `📍 Dirección: ${servicio.direccion}\n\n` +
      `¡Muchas gracias! 😊`;

    const url =
      `https://web.whatsapp.com/send?phone=${telefono}` +
      `&text=${encodeURIComponent(mensaje)}`;

    window.open(url, '_blank');
  };

  const cambiarDia = (cantidad) => {
    const fecha = new Date(
      `${fechaSeleccionada}T12:00:00`
    );

    fecha.setDate(
      fecha.getDate() + cantidad
    );

    const año = fecha.getFullYear();
    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, '0');

    const dia = String(
      fecha.getDate()
    ).padStart(2, '0');

    setFechaSeleccionada(
      `${año}-${mes}-${dia}`
    );

    setMostrarResultadosBusqueda(false);
  };

  const formatearFecha = (fecha) => {
    const fechaObjeto = new Date(
      `${fecha}T12:00:00`
    );

    return fechaObjeto.toLocaleDateString(
      'es-CO',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }
    );
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setFormulario({
      ...formulario,
      [name]: value
    });
  };

  const manejarImagen = (e) => {
    const archivo = e.target.files[0];

    if (!archivo) return;

    const lector = new FileReader();

    lector.onload = () => {
      setFormulario({
        ...formulario,
        imagen: lector.result
      });
    };

    lector.readAsDataURL(archivo);
  };

  const limpiarFormulario = () => {
    setFormulario({
      cliente: '',
      telefono: '',
      direccion: '',
      articulo: '',
      fecha: '',
      hora: '',
      ciudad: 'Barranquilla',
      origen: 'Business',
      precio: '',
      observaciones: '',
      imagen: ''
    });

    setServicioEditando(null);
    setMostrarFormulario(false);
  };

  const agendarServicio = async (e) => {
    e.preventDefault();

    const nuevoServicio = {
      id: Date.now(),
      estado: 'pendiente',
      ...formulario
    };

    // Guardado local para conservar la Alpha.
    guardarLocalmente([
      ...servicios,
      nuevoServicio
    ]);

    setFechaSeleccionada(
      formulario.fecha
    );

    limpiarFormulario();

    // Guardado real en Supabase.
    const { error } = await supabase
      .from('servicios')
      .insert([{
        cliente: nuevoServicio.cliente,
        telefono: nuevoServicio.telefono,
        direccion: nuevoServicio.direccion,
        articulo: nuevoServicio.articulo,
        fecha: nuevoServicio.fecha,
        hora: nuevoServicio.hora,
        ciudad: nuevoServicio.ciudad,
        origen: nuevoServicio.origen,
        precio: Number(nuevoServicio.precio || 0),
        observaciones: nuevoServicio.observaciones,
        imagen: nuevoServicio.imagen,
        estado: nuevoServicio.estado
      }]);

    if (error) {
      console.error(
        'Error guardando en Supabase:',
        error.message
      );

      alert(
        '⚠️ Se guardó en la agenda, pero no en la nube.\n\n' +
        error.message
      );
    } else {
      console.log('☁️ Servicio guardado correctamente en Supabase.');
    }
  };

  const editarServicio = (servicio) => {
    setServicioEditando(servicio.id);

    setFormulario({
      cliente: servicio.cliente || '',
      telefono: servicio.telefono || '',
      direccion: servicio.direccion || '',
      articulo: servicio.articulo || '',
      fecha: servicio.fecha || '',
      hora: servicio.hora || '',
      ciudad:
        servicio.ciudad || 'Barranquilla',
      origen:
        servicio.origen || 'Business',
      precio: servicio.precio || '',
      observaciones:
        servicio.observaciones || '',
      imagen: servicio.imagen || ''
    });

    setMostrarFormulario(true);
    setMostrarResultadosBusqueda(false);
    setMostrarCalendario(false);
  };

  const guardarCambios = async (e) => {
    e.preventDefault();

    const actualizados = servicios.map(
      (servicio) =>
        servicio.id === servicioEditando
          ? {
              ...servicio,
              ...formulario
            }
          : servicio
    );

    // Mantenemos la Alpha actualizada localmente.
    guardarLocalmente(actualizados);

    // Actualizamos también el registro en Supabase.
    const { error } = await supabase
      .from('servicios')
      .update({
        cliente: formulario.cliente,
        telefono: formulario.telefono,
        direccion: formulario.direccion,
        articulo: formulario.articulo,
        fecha: formulario.fecha,
        hora: formulario.hora,
        ciudad: formulario.ciudad,
        origen: formulario.origen,
        precio: Number(formulario.precio || 0),
        observaciones: formulario.observaciones,
        imagen: formulario.imagen
      })
      .eq('id', servicioEditando);

    if (error) {
      console.error(
        'Error actualizando en Supabase:',
        error.message
      );

      alert(
        '⚠️ El cambio se hizo en la agenda, pero no en la nube.\n\n' +
        error.message
      );
    } else {
      console.log('☁️ Servicio actualizado correctamente en Supabase.');
    }

    setFechaSeleccionada(
      formulario.fecha
    );

    limpiarFormulario();
  };

  const eliminarServicio = async (id) => {
    const confirmar = window.confirm(
      '¿Estás seguro de que quieres eliminar este servicio?'
    );

    if (!confirmar) return;

    // Eliminamos primero de la vista local.
    guardarLocalmente(
      servicios.filter(
        (servicio) => servicio.id !== id
      )
    );

    // Eliminamos también de Supabase.
    const { error } = await supabase
      .from('servicios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(
        'Error eliminando en Supabase:',
        error.message
      );

      alert(
        '⚠️ Se eliminó de la agenda, pero no de la nube.\n\n' +
        error.message
      );
    } else {
      console.log('☁️ Servicio eliminado correctamente de Supabase.');
    }
  };

  const cambiarEstado = async (id) => {
    const servicioActual = servicios.find(
      (servicio) => servicio.id === id
    );

    if (!servicioActual) return;

    const nuevoEstado =
      servicioActual.estado === 'realizado'
        ? 'pendiente'
        : 'realizado';

    const actualizados = servicios.map(
      (servicio) =>
        servicio.id === id
          ? {
              ...servicio,
              estado: nuevoEstado
            }
          : servicio
    );

    // Actualizamos la vista local.
    guardarLocalmente(actualizados);

    // Actualizamos también Supabase.
    const { error } = await supabase
      .from('servicios')
      .update({
        estado: nuevoEstado
      })
      .eq('id', id);

    if (error) {
      console.error(
        'Error cambiando estado en Supabase:',
        error.message
      );

      alert(
        '⚠️ El estado cambió en la agenda, pero no en la nube.\n\n' +
        error.message
      );
    } else {
      console.log('☁️ Estado actualizado correctamente en Supabase.');
    }
  };

  const resultadosBusqueda = useMemo(() => {
    const numeroBuscado =
      limpiarTelefono(busquedaTelefono);

    if (!numeroBuscado) return [];

    return servicios.filter((servicio) =>
      limpiarTelefono(
        servicio.telefono
      ).includes(numeroBuscado)
    );
  }, [busquedaTelefono, servicios]);

  const serviciosDelDia = servicios
    .filter(
      (servicio) =>
        servicio.fecha === fechaSeleccionada
    )
    .filter(
      (servicio) =>
        ciudadSeleccionada === 'Todas' ||
        servicio.ciudad === ciudadSeleccionada
    )
    .sort((a, b) =>
      a.hora.localeCompare(b.hora)
    );

  const resumen = useMemo(() => {
    const totalServicios =
      serviciosDelDia.length;

    const totalIngresos =
      serviciosDelDia.reduce(
        (total, servicio) =>
          total +
          Number(servicio.precio || 0),
        0
      );

    const pendientes =
      serviciosDelDia.filter(
        (servicio) =>
          servicio.estado !== 'realizado'
      ).length;

    const realizados =
      serviciosDelDia.filter(
        (servicio) =>
          servicio.estado === 'realizado'
      ).length;

    return {
      totalServicios,
      totalIngresos,
      pendientes,
      realizados,
      porCiudad: {
        Barranquilla:
          serviciosDelDia.filter(
            (s) =>
              s.ciudad === 'Barranquilla'
          ).length,

        Cartagena:
          serviciosDelDia.filter(
            (s) =>
              s.ciudad === 'Cartagena'
          ).length,

        'Santa Marta':
          serviciosDelDia.filter(
            (s) =>
              s.ciudad === 'Santa Marta'
          ).length
      }
    };
  }, [serviciosDelDia]);

  // ================================
  // CALENDARIO
  // ================================

  const fechaCalendario = new Date(
    `${fechaSeleccionada}T12:00:00`
  );

  const [mesCalendario, setMesCalendario] =
    useState(fechaCalendario.getMonth());

  const [añoCalendario, setAñoCalendario] =
    useState(fechaCalendario.getFullYear());

  const cambiarMes = (cantidad) => {
    let nuevoMes =
      mesCalendario + cantidad;

    let nuevoAño =
      añoCalendario;

    if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAño--;
    }

    if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAño++;
    }

    setMesCalendario(nuevoMes);
    setAñoCalendario(nuevoAño);
  };

  const irAHoy = () => {
    const hoy = new Date();

    const año = hoy.getFullYear();
    const mes = hoy.getMonth();

    const dia = String(
      hoy.getDate()
    ).padStart(2, '0');

    const mesTexto = String(
      mes + 1
    ).padStart(2, '0');

    setAñoCalendario(año);
    setMesCalendario(mes);

    setFechaSeleccionada(
      `${año}-${mesTexto}-${dia}`
    );

    setCiudadSeleccionada('Todas');
    setMostrarCalendario(true);
  };

  const obtenerDiasCalendario = () => {
    const primerDia = new Date(
      añoCalendario,
      mesCalendario,
      1
    );

    const ultimoDia = new Date(
      añoCalendario,
      mesCalendario + 1,
      0
    );

    let inicio =
      primerDia.getDay();

    inicio =
      inicio === 0
        ? 6
        : inicio - 1;

    const dias = [];

    for (let i = 0; i < inicio; i++) {
      dias.push(null);
    }

    for (
      let dia = 1;
      dia <= ultimoDia.getDate();
      dia++
    ) {
      dias.push(dia);
    }

    while (dias.length % 7 !== 0) {
      dias.push(null);
    }

    return dias;
  };

  const obtenerServiciosFecha = (dia) => {
    if (!dia) return [];

    const mes = String(
      mesCalendario + 1
    ).padStart(2, '0');

    const diaTexto = String(
      dia
    ).padStart(2, '0');

    const fecha =
      `${añoCalendario}-${mes}-${diaTexto}`;

    return servicios.filter(
      (servicio) =>
        servicio.fecha === fecha
    );
  };

  const seleccionarDiaCalendario = (dia) => {
    if (!dia) return;

    const mes = String(
      mesCalendario + 1
    ).padStart(2, '0');

    const diaTexto = String(
      dia
    ).padStart(2, '0');

    setFechaSeleccionada(
      `${añoCalendario}-${mes}-${diaTexto}`
    );

    setCiudadSeleccionada('Todas');
    setMostrarCalendario(false);
    setMostrarResultadosBusqueda(false);
  };

  const nombreMes = new Date(
    añoCalendario,
    mesCalendario,
    1
  ).toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric'
  });

  const diasCalendario =
    obtenerDiasCalendario();

  return (
    <div>
      <header>
        <h1>🧼 TOTAL CLEAN</h1>

        <button
          onClick={() => {
            setServicioEditando(null);

            setFormulario({
              cliente: '',
              telefono: '',
              direccion: '',
              articulo: '',
              fecha: fechaSeleccionada,
              hora: '',
              ciudad:
                ciudadSeleccionada === 'Todas'
                  ? 'Barranquilla'
                  : ciudadSeleccionada,
              origen: 'Business',
              precio: '',
              observaciones: '',
              imagen: ''
            });

            setMostrarFormulario(true);
            setMostrarCalendario(false);
            setMostrarResultadosBusqueda(false);
          }}
        >
          ➕ Nuevo servicio
        </button>
      </header>

      <main>
        {/* BUSCADOR */}

        <section>
          <h2>🔎 Buscar cliente</h2>

          <input
            type="tel"
            inputMode="numeric"
            value={busquedaTelefono}
            onChange={(e) => {
              setBusquedaTelefono(
                e.target.value
              );

              setMostrarResultadosBusqueda(
                true
              );

              setMostrarCalendario(false);
            }}
            placeholder="Escribe el número telefónico"
          />

          {busquedaTelefono && (
            <button
              onClick={() => {
                setBusquedaTelefono('');
                setMostrarResultadosBusqueda(
                  false
                );
              }}
            >
              ✕ Limpiar
            </button>
          )}

          {mostrarResultadosBusqueda &&
            busquedaTelefono && (
              <div>
                <h3>
                  Resultados encontrados:
                </h3>

                {resultadosBusqueda.length ===
                  0 && (
                  <p>
                    ❌ No encontramos
                    servicios con ese
                    número.
                  </p>
                )}

                {resultadosBusqueda.map(
                  (servicio) => {
                    const ciudad =
                      CIUDADES[
                        servicio.ciudad
                      ];

                    const origen =
                      ORIGENES.find(
                        (item) =>
                          item.nombre ===
                          servicio.origen
                      );

                    return (
                      <section
                        key={servicio.id}
                        style={{
                          borderLeft:
                            `6px solid ${
                              ciudad?.color ||
                              '#6b7280'
                            }`,
                          background:
                            ciudad?.fondo ||
                            '#ffffff',
                          padding: '15px',
                          marginTop: '10px',
                          borderRadius: '10px'
                        }}
                      >
                        <h3>
                          📅{' '}
                          {formatearFecha(
                            servicio.fecha
                          )}
                        </h3>

                        <p>
                          ⏰ {servicio.hora}
                        </p>

                        <p>
                          {ciudad?.icono}{' '}
                          <strong>
                            {servicio.ciudad}
                          </strong>
                        </p>

                        <p>
                          {origen?.icono}{' '}
                          {servicio.origen}
                        </p>

                        <p>
                          👤 {servicio.cliente}
                        </p>

                        <p>
                          📞 {servicio.telefono}
                        </p>

                        <p>
                          🛋️ {servicio.articulo}
                        </p>

                        <p>
                          💰 $
                          {formatearPrecio(
                            servicio.precio
                          )}
                        </p>

                        <button
                          onClick={() => {
                            setFechaSeleccionada(
                              servicio.fecha
                            );
                            setMostrarResultadosBusqueda(
                              false
                            );
                          }}
                        >
                          📅 Ir a la fecha
                        </button>

                        <button
                          onClick={() =>
                            editarServicio(
                              servicio
                            )
                          }
                        >
                          ✏️ Editar
                        </button>

                        <button
                          onClick={() =>
                            abrirWhatsApp(
                              servicio
                            )
                          }
                        >
                          💬 WhatsApp
                        </button>
                      </section>
                    );
                  }
                )}
              </div>
            )}
        </section>

        {/* CALENDARIO */}

        {!mostrarFormulario &&
          !mostrarResultadosBusqueda && (
            <section>
              <button
                onClick={() => {
                  setMostrarCalendario(
                    !mostrarCalendario
                  );

                  if (!mostrarCalendario) {
                    const fecha =
                      new Date(
                        `${fechaSeleccionada}T12:00:00`
                      );

                    setMesCalendario(
                      fecha.getMonth()
                    );

                    setAñoCalendario(
                      fecha.getFullYear()
                    );
                  }
                }}
              >
                {mostrarCalendario
                  ? '📅 Ocultar calendario'
                  : '📅 Calendario mensual'}
              </button>

              {mostrarCalendario && (
                <section>
                  <div>
                    <button
                      onClick={() =>
                        cambiarMes(-1)
                      }
                    >
                      ←
                    </button>

                    <strong>
                      {nombreMes}
                    </strong>

                    <button
                      onClick={() =>
                        cambiarMes(1)
                      }
                    >
                      →
                    </button>

                    <button
                      onClick={irAHoy}
                    >
                      📅 Hoy
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(7, 1fr)',
                      gap: '5px',
                      marginTop: '15px'
                    }}
                  >
                    {[
                      'L',
                      'M',
                      'X',
                      'J',
                      'V',
                      'S',
                      'D'
                    ].map((dia) => (
                      <strong
                        key={dia}
                        style={{
                          textAlign: 'center'
                        }}
                      >
                        {dia}
                      </strong>
                    ))}

                    {diasCalendario.map(
                      (dia, indice) => {
                        const servicios =
                          obtenerServiciosFecha(
                            dia
                          );

                        const ciudades = [
                          ...new Set(
                            servicios.map(
                              (servicio) =>
                                servicio.ciudad
                            )
                          )
                        ];

                        const fechaDia =
                          dia
                            ? `${añoCalendario}-${String(
                                mesCalendario +
                                  1
                              ).padStart(
                                2,
                                '0'
                              )}-${String(
                                dia
                              ).padStart(
                                2,
                                '0'
                              )}`
                            : null;

                        const esSeleccionado =
                          fechaDia ===
                          fechaSeleccionada;

                        return (
                          <button
                            key={indice}
                            onClick={() =>
                              seleccionarDiaCalendario(
                                dia
                              )
                            }
                            disabled={!dia}
                            style={{
                              minHeight: '70px',
                              padding: '5px',
                              borderRadius: '8px',
                              border:
                                esSeleccionado
                                  ? '3px solid #111827'
                                  : '1px solid #d1d5db',
                              background:
                                esSeleccionado
                                  ? '#e5e7eb'
                                  : '#ffffff'
                            }}
                          >
                            {dia && (
                              <>
                                <strong>
                                  {dia}
                                </strong>

                                {servicios.length >
                                  0 && (
                                  <div>
                                    <small>
                                      {
                                        servicios.length
                                      }{' '}
                                      servicio
                                      {servicios.length !==
                                      1
                                        ? 's'
                                        : ''}
                                    </small>

                                    <div>
                                      {ciudades.map(
                                        (
                                          ciudad
                                        ) => (
                                          <span
                                            key={
                                              ciudad
                                            }
                                          >
                                            {
                                              CIUDADES[
                                                ciudad
                                              ]
                                                ?.icono
                                            }
                                          </span>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <p>
                    🔵 Barranquilla
                    &nbsp;&nbsp;
                    🟢 Cartagena
                    &nbsp;&nbsp;
                    🟠 Santa Marta
                  </p>
                </section>
              )}
            </section>
          )}

        {/* AGENDA */}

        {!mostrarCalendario &&
          !mostrarResultadosBusqueda && (
            <>
              <h2>MI AGENDA</h2>

              <div>
                <button
                  onClick={() =>
                    cambiarDia(-1)
                  }
                >
                  ←
                </button>

                <strong>
                  {formatearFecha(
                    fechaSeleccionada
                  )}
                </strong>

                <button
                  onClick={() =>
                    cambiarDia(1)
                  }
                >
                  →
                </button>
              </div>

              <div>
                <button
                  onClick={() =>
                    setCiudadSeleccionada(
                      'Todas'
                    )
                  }
                >
                  🌎 Todas
                </button>

                <button
                  onClick={() =>
                    setCiudadSeleccionada(
                      'Barranquilla'
                    )
                  }
                >
                  🔵 Barranquilla
                </button>

                <button
                  onClick={() =>
                    setCiudadSeleccionada(
                      'Cartagena'
                    )
                  }
                >
                  🟢 Cartagena
                </button>

                <button
                  onClick={() =>
                    setCiudadSeleccionada(
                      'Santa Marta'
                    )
                  }
                >
                  🟠 Santa Marta
                </button>
              </div>

              {/* RESUMEN */}

              <section
                style={{
                  padding: '15px',
                  marginTop: '15px',
                  borderRadius: '10px',
                  background: '#f8fafc'
                }}
              >
                <h3>
                  📊 Resumen del día
                </h3>

                <p>
                  🧾 Servicios:{' '}
                  <strong>
                    {
                      resumen.totalServicios
                    }
                  </strong>
                </p>

                <p>
                  ⏳ Pendientes:{' '}
                  <strong>
                    {resumen.pendientes}
                  </strong>
                </p>

                <p>
                  ✅ Realizados:{' '}
                  <strong>
                    {resumen.realizados}
                  </strong>
                </p>

                <p>
                  💰 Total:{' '}
                  <strong>
                    $
                    {formatearPrecio(
                      resumen.totalIngresos
                    )}
                  </strong>
                </p>

                <hr />

                <p>
                  🔵 Barranquilla:{' '}
                  <strong>
                    {
                      resumen.porCiudad
                        .Barranquilla
                    }
                  </strong>
                </p>

                <p>
                  🟢 Cartagena:{' '}
                  <strong>
                    {
                      resumen.porCiudad
                        .Cartagena
                    }
                  </strong>
                </p>

                <p>
                  🟠 Santa Marta:{' '}
                  <strong>
                    {
                      resumen.porCiudad[
                        'Santa Marta'
                      ]
                    }
                  </strong>
                </p>
              </section>

              {serviciosDelDia.length ===
                0 && (
                <section>
                  <h3>
                    📅 No tienes servicios
                    agendados
                  </h3>

                  <p>
                    No hay servicios para
                    este día.
                  </p>
                </section>
              )}

              {serviciosDelDia.map(
                (servicio) => {
                  const ciudad =
                    CIUDADES[
                      servicio.ciudad
                    ];

                  const origen =
                    ORIGENES.find(
                      (item) =>
                        item.nombre ===
                        servicio.origen
                    );

                  const realizado =
                    servicio.estado ===
                    'realizado';

                  return (
                    <section
                      key={servicio.id}
                      style={{
                        borderLeft:
                          `6px solid ${
                            ciudad?.color ||
                            '#6b7280'
                          }`,
                        background:
                          realizado
                            ? '#f3f4f6'
                            : ciudad?.fondo ||
                              '#ffffff',
                        opacity:
                          realizado
                            ? 0.7
                            : 1,
                        padding: '15px',
                        marginTop: '15px',
                        borderRadius: '10px'
                      }}
                    >
                      <h3>
                        ⏰ {servicio.hora}
                      </h3>

                      <p>
                        {ciudad?.icono}{' '}
                        <strong>
                          {servicio.ciudad}
                        </strong>
                      </p>

                      <p>
                        {origen?.icono}{' '}
                        <strong>
                          {servicio.origen}
                        </strong>
                      </p>

                      {realizado && (
                        <p>
                          🟢{' '}
                          <strong>
                            REALIZADO
                          </strong>
                        </p>
                      )}

                      <p>
                        👤 {servicio.cliente}
                      </p>

                      <p>
                        📞 {servicio.telefono}
                      </p>

                      <p>
                        📍 {servicio.direccion}
                      </p>

                      <p>
                        🛋️ {servicio.articulo}
                      </p>

                      <p>
                        💰 $
                        {formatearPrecio(
                          servicio.precio
                        )}
                      </p>

                      {servicio.imagen && (
                        <div>
                          <img
                            src={
                              servicio.imagen
                            }
                            alt="Artículo"
                            onClick={() =>
                              setImagenAmpliada(
                                servicio.imagen
                              )
                            }
                            style={{
                              width: '120px',
                              height: '90px',
                              objectFit: 'cover',
                              borderRadius: '10px',
                              cursor: 'pointer'
                            }}
                          />

                          <p>
                            👆 Haz clic para
                            ampliar
                          </p>
                        </div>
                      )}

                      {servicio.observaciones && (
                        <p>
                          📝{' '}
                          {
                            servicio.observaciones
                          }
                        </p>
                      )}

                      <button
                        onClick={() => {
                          const texto =
                            `${servicio.hora}
Dirección: ${servicio.direccion}
Teléfono: ${servicio.telefono}
Artículo: ${servicio.articulo}
Valor: $${formatearPrecio(
                              servicio.precio
                            )}
Origen: ${
                              servicio.origen
                            }`;

                          navigator.clipboard.writeText(
                            texto
                          );
                        }}
                      >
                        📋 Copiar
                      </button>

                      <button
                        onClick={() =>
                          abrirWhatsApp(
                            servicio
                          )
                        }
                      >
                        💬 WhatsApp
                      </button>

                      <button
                        onClick={() =>
                          editarServicio(
                            servicio
                          )
                        }
                      >
                        ✏️ Editar
                      </button>

                      <button
                        onClick={() =>
                          eliminarServicio(
                            servicio.id
                          )
                        }
                      >
                        🗑️ Eliminar
                      </button>

                      <button
                        onClick={() =>
                          cambiarEstado(
                            servicio.id
                          )
                        }
                      >
                        {realizado
                          ? '↩️ Pendiente'
                          : '✅ Realizado'}
                      </button>
                    </section>
                  );
                }
              )}
            </>
          )}

        {/* FORMULARIO */}

        {mostrarFormulario && (
          <section>
            <h3>
              {servicioEditando
                ? '✏️ Editar servicio'
                : '➕ Nuevo servicio'}
            </h3>

            <form
              onSubmit={
                servicioEditando
                  ? guardarCambios
                  : agendarServicio
              }
            >
              <label>
                👤 Cliente
                <input
                  type="text"
                  name="cliente"
                  value={
                    formulario.cliente
                  }
                  onChange={manejarCambio}
                  required
                />
              </label>

              <br />

              <label>
                📞 Teléfono
                <input
                  type="tel"
                  name="telefono"
                  value={
                    formulario.telefono
                  }
                  onChange={manejarCambio}
                  required
                />
              </label>

              <br />

              <label>
                📍 Dirección
                <input
                  type="text"
                  name="direccion"
                  value={
                    formulario.direccion
                  }
                  onChange={manejarCambio}
                  required
                />
              </label>

              <br />

              <label>
                🛋️ Artículo / Servicio
                <input
                  type="text"
                  name="articulo"
                  value={
                    formulario.articulo
                  }
                  onChange={manejarCambio}
                  placeholder="Ej: Juego de muebles"
                  required
                />
              </label>

              <br />

              <label>
                🏙️ Ciudad
                <select
                  name="ciudad"
                  value={
                    formulario.ciudad
                  }
                  onChange={manejarCambio}
                >
                  <option value="Barranquilla">
                    🔵 Barranquilla
                  </option>

                  <option value="Cartagena">
                    🟢 Cartagena
                  </option>

                  <option value="Santa Marta">
                    🟠 Santa Marta
                  </option>
                </select>
              </label>

              <br />

              <label>
                📲 Origen
                <select
                  name="origen"
                  value={
                    formulario.origen
                  }
                  onChange={manejarCambio}
                >
                  {ORIGENES.map(
                    (origen) => (
                      <option
                        key={
                          origen.nombre
                        }
                        value={
                          origen.nombre
                        }
                      >
                        {
                          origen.icono
                        }{' '}
                        {
                          origen.nombre
                        }
                      </option>
                    )
                  )}
                </select>
              </label>

              <br />

              <label>
                📅 Fecha
                <input
                  type="date"
                  name="fecha"
                  value={
                    formulario.fecha
                  }
                  onChange={manejarCambio}
                  required
                />
              </label>

              <br />

              <label>
                ⏰ Hora
                <input
                  type="time"
                  name="hora"
                  value={
                    formulario.hora
                  }
                  onChange={manejarCambio}
                  required
                />
              </label>

              <br />

              <label>
                💰 Precio
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatearPrecio(
                    formulario.precio
                  )}
                  onChange={manejarPrecio}
                  placeholder="Ej: 80.000"
                  required
                />
              </label>

              <br />

              <label>
                📸 Foto del artículo
                <input
                  type="file"
                  accept="image/*"
                  onChange={manejarImagen}
                />
              </label>

              {formulario.imagen && (
                <div>
                  <p>
                    Vista previa:
                  </p>

                  <img
                    src={
                      formulario.imagen
                    }
                    alt="Vista previa"
                    style={{
                      width: '100%',
                      maxWidth: '300px',
                      borderRadius: '10px'
                    }}
                  />
                </div>
              )}

              <br />

              <label>
                📝 Observaciones
                <textarea
                  name="observaciones"
                  value={
                    formulario.observaciones
                  }
                  onChange={manejarCambio}
                  placeholder="Información adicional"
                />
              </label>

              <br />

              <button type="submit">
                {servicioEditando
                  ? '💾 Guardar cambios'
                  : '💾 Agendar servicio'}
              </button>

              <button
                type="button"
                onClick={
                  limpiarFormulario
                }
              >
                Cancelar
              </button>
            </form>
          </section>
        )}

        {/* VISOR DE IMAGEN */}

        {imagenAmpliada && (
          <div
            onClick={() =>
              setImagenAmpliada(null)
            }
            style={{
              position: 'fixed',
              inset: 0,
              background:
                'rgba(0, 0, 0, 0.75)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              padding: '20px'
            }}
          >
            <div
              onClick={(e) =>
                e.stopPropagation()
              }
              style={{
                position: 'relative',
                maxWidth: '90%',
                maxHeight: '90%'
              }}
            >
              <button
                onClick={() =>
                  setImagenAmpliada(null)
                }
                style={{
                  position: 'absolute',
                  top: '-15px',
                  right: '-15px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'white',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>

              <img
                src={
                  imagenAmpliada
                }
                alt="Artículo ampliado"
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  borderRadius: '12px'
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

ReactDOM.createRoot(
  document.getElementById('root')
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);