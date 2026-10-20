import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  BedDouble,
  CalendarCheck2,
  CreditCard,
  DollarSign,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Sun,
  TrendingUp,
  Users
} from 'lucide-react';
import { CardHead, TiltCard } from './components/TiltCard';
import { hotelApi } from './services/api';
import {
  DashboardMetrics,
  Guest,
  Payment,
  PaymentMethod,
  Reservation,
  ReservationStatus,
  Room,
  RoomStatus
} from './types/hotel';

type ActiveTab = 'dashboard' | 'reservations' | 'guests' | 'payments';

const FALLBACK_ROOMS: Room[] = [
  { id: 1, roomNumber: '101', floor: 1, roomTypeName: 'Standard Simple', description: 'Brisa marina individual', basePrice: 150, maxCapacity: 1, status: 'OCCUPIED' },
  { id: 2, roomNumber: '102', floor: 1, roomTypeName: 'Standard Simple', description: 'Brisa marina individual', basePrice: 150, maxCapacity: 1, status: 'AVAILABLE' },
  { id: 4, roomNumber: '201', floor: 2, roomTypeName: 'Doble Superior', description: 'Terraza con vista al mar', basePrice: 240, maxCapacity: 2, status: 'OCCUPIED' },
  { id: 5, roomNumber: '202', floor: 2, roomTypeName: 'Doble Superior', description: 'Terraza con vista al mar', basePrice: 240, maxCapacity: 2, status: 'AVAILABLE' },
  { id: 7, roomNumber: '301', floor: 3, roomTypeName: 'Suite Ejecutiva', description: 'Cama King frente a la playa', basePrice: 380, maxCapacity: 3, status: 'OCCUPIED' },
  { id: 10, roomNumber: '401', floor: 4, roomTypeName: 'Suite Presidencial', description: 'Penthouse panorámico 360°', basePrice: 650, maxCapacity: 4, status: 'AVAILABLE' }
];

// Probe for discrete display transition support (Firefox bug 1882408 fallback)
let supportsDisplayTransition: boolean | undefined;
function canTransitionDisplay(): boolean {
  if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
  if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
    return false;
  }
  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = 'none';
  supportsDisplayTransition = getComputedStyle(probe).display === 'block';
  probe.remove();
  return supportsDisplayTransition;
}

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [backendConnected, setBackendConnected] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Form states: Reserva
  const [resGuestId, setResGuestId] = useState<number>(1);
  const [resRoomId, setResRoomId] = useState<number>(2);
  const [resCheckIn, setResCheckIn] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [resCheckOut, setResCheckOut] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split('T')[0];
  });
  const [resNotes, setResNotes] = useState<string>('');

  // Form states: Huésped
  const [guestDocType, setGuestDocType] = useState<string>('DNI');
  const [guestDocNum, setGuestDocNum] = useState<string>('');
  const [guestFirstName, setGuestFirstName] = useState<string>('');
  const [guestLastName, setGuestLastName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');

  // Form states: Pago
  const [payReservationId, setPayReservationId] = useState<number>(0);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('YAPE_PLIN');
  const [payRef, setPayRef] = useState<string>('');

  // Sync aria-invalid with native :user-invalid state (Modern Web Guidance)
  useEffect(() => {
    const syncAria = (target: EventTarget | null) => {
      if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) {
        try {
          target.setAttribute('aria-invalid', target.matches(':user-invalid') ? 'true' : 'false');
        } catch {
          // Ignore if selector unsupported
        }
      }
    };

    const onBlur = (e: Event) => syncAria(e.target);
    const onInput = (e: Event) => {
      if (e.target instanceof HTMLElement && e.target.hasAttribute('aria-invalid')) {
        syncAria(e.target);
      }
    };

    document.addEventListener('blur', onBlur, true);
    document.addEventListener('input', onInput);
    return () => {
      document.removeEventListener('blur', onBlur, true);
      document.removeEventListener('input', onInput);
    };
  }, []);

  const dismissAlert = async () => {
    const el = alertRef.current;
    if (el) {
      if (canTransitionDisplay()) {
        el.hidden = true;
      } else {
        el.setAttribute('data-closing', '');
      }
      const animations = el.getAnimations();
      if (animations.length > 0) {
        await Promise.race([
          Promise.allSettled(animations.map((a) => a.finished)),
          new Promise((r) => setTimeout(r, 600))
        ]);
      }
    }
    setFeedback(null);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [m, r, g, res, p] = await Promise.all([
        hotelApi.getDashboardMetrics(),
        hotelApi.getRooms(),
        hotelApi.getGuests(),
        hotelApi.getReservations(),
        hotelApi.getPayments()
      ]);
      setMetrics(m);
      setRooms(r);
      setGuests(g);
      setReservations(res);
      setPayments(p);
      setBackendConnected(true);
      if (g.length > 0 && !resGuestId) setResGuestId(g[0].id);
      const pendingRes = res.find((item) => item.pendingBalance > 0 && item.status !== 'CANCELLED');
      if (pendingRes) {
        setPayReservationId(pendingRes.id);
        setPayAmount(String(pendingRes.pendingBalance));
      }
    } catch {
      setBackendConnected(false);
      setRooms(FALLBACK_ROOMS);
      setMetrics({
        totalRooms: 10,
        occupiedRooms: 3,
        availableRooms: 5,
        unavailableRooms: 2,
        occupancyRatePct: 30.0,
        adr: 310.0,
        revPar: 180.33,
        totalCollectedRevenue: 2280.0,
        totalPendingBalance: 3130.0,
        activeReservationsCount: 4,
        categoryBreakdown: [
          { categoryName: 'Standard Simple', basePrice: 150, totalRooms: 3, occupiedRooms: 1, availableRooms: 2, occupancyPct: 33.33 },
          { categoryName: 'Doble Superior', basePrice: 240, totalRooms: 3, occupiedRooms: 1, availableRooms: 1, occupancyPct: 33.33 },
          { categoryName: 'Suite Ejecutiva', basePrice: 380, totalRooms: 3, occupiedRooms: 1, availableRooms: 1, occupancyPct: 33.33 },
          { categoryName: 'Suite Presidencial', basePrice: 650, totalRooms: 1, occupiedRooms: 0, availableRooms: 1, occupancyPct: 0.0 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAllData();
  }, []);

  const handleRoomStatusChange = async (roomId: number, status: RoomStatus) => {
    try {
      await hotelApi.updateRoomStatus(roomId, status);
      setFeedback({ type: 'success', message: `Estado de habitación actualizado a ${status}.` });
      await loadAllData();
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message });
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const created = await hotelApi.createReservation({
        guestId: Number(resGuestId),
        roomId: Number(resRoomId),
        checkInDate: resCheckIn,
        checkOutDate: resCheckOut,
        notes: resNotes
      });
      setFeedback({
        type: 'success',
        message: `Reserva ${created.reservationCode} confirmada en habitación ${created.roomNumber} por S/ ${created.totalAmount.toFixed(2)}.`
      });
      setResNotes('');
      await loadAllData();
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message });
    }
  };

  const handleSimulateConcurrentOverbooking = async () => {
    setFeedback(null);
    const payload = {
      guestId: Number(resGuestId),
      roomId: Number(resRoomId),
      checkInDate: resCheckIn,
      checkOutDate: resCheckOut,
      notes: 'Simulación de Petición Simultánea (Concurrencia)'
    };

    const results = await Promise.allSettled([
      hotelApi.createReservation(payload),
      hotelApi.createReservation(payload)
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
    const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;

    if (fulfilled === 1 && rejected) {
      setFeedback({
        type: 'success',
        message: `¡Prevención de Overbooking exitosa! De 2 peticiones simultáneas: 1 se registró (201 CREATED) y la duplicada fue bloqueada: ${rejected.reason.message}`
      });
    } else if (fulfilled === 0 && rejected) {
      setFeedback({
        type: 'error',
        message: `Ambas peticiones fueron rechazadas (la habitación ya estaba ocupada en esas fechas): ${rejected.reason.message}`
      });
    }
    await loadAllData();
  };

  const handleReservationStatus = async (id: number, status: ReservationStatus) => {
    try {
      await hotelApi.updateReservationStatus(id, status);
      setFeedback({ type: 'success', message: `Reserva actualizada a estado ${status}.` });
      await loadAllData();
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message });
    }
  };

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const created = await hotelApi.createGuest({
        documentType: guestDocType,
        documentNumber: guestDocNum,
        firstName: guestFirstName,
        lastName: guestLastName,
        email: guestEmail,
        phone: guestPhone
      });
      setFeedback({
        type: 'success',
        message: `Huésped ${created.firstName} ${created.lastName} registrado correctamente.`
      });
      setGuestDocNum('');
      setGuestFirstName('');
      setGuestLastName('');
      setGuestEmail('');
      setGuestPhone('');
      await loadAllData();
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message });
    }
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const created = await hotelApi.registerPayment({
        reservationId: Number(payReservationId),
        amount: Number(payAmount),
        paymentMethod: payMethod,
        transactionReference: payRef
      });
      setFeedback({
        type: 'success',
        message: `Pago de S/ ${created.amount.toFixed(2)} registrado (Ref: ${created.transactionReference}).`
      });
      setPayRef('');
      await loadAllData();
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message });
    }
  };

  const getRoomBadgeClass = (status: RoomStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'badge badge-success';
      case 'OCCUPIED':
        return 'badge badge-info';
      case 'CLEANING':
        return 'badge badge-warning';
      case 'MAINTENANCE':
        return 'badge badge-danger';
    }
  };

  const getReservationBadgeClass = (status: ReservationStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return 'badge badge-info';
      case 'CHECKED_IN':
        return 'badge badge-success';
      case 'CHECKED_OUT':
        return 'badge badge-warning';
      case 'CANCELLED':
        return 'badge badge-danger';
      default:
        return 'badge badge-warning';
    }
  };

  return (
    <>
      {/* Textura cálida de arena suave */}
      <div className="grain" aria-hidden="true" />

      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-icon">
              <Sun size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h1>COSTA SOL &amp; MAR</h1>
              <p>Beach Resort &amp; BI Suite</p>
            </div>
          </div>

          <nav className="nav-menu" aria-label="Navegación Principal">
            <button
              type="button"
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span className="nav-btn-left">
                <BarChart3 size={17} />
                Panorama &amp; KPIs
              </span>
              <span className="nav-btn-tag">01</span>
            </button>
            <button
              type="button"
              className={`nav-btn ${activeTab === 'reservations' ? 'active' : ''}`}
              onClick={() => setActiveTab('reservations')}
            >
              <span className="nav-btn-left">
                <CalendarCheck2 size={17} />
                Reservas &amp; Estadías
              </span>
              <span className="nav-btn-tag">02</span>
            </button>
            <button
              type="button"
              className={`nav-btn ${activeTab === 'guests' ? 'active' : ''}`}
              onClick={() => setActiveTab('guests')}
            >
              <span className="nav-btn-left">
                <Users size={17} />
                Huéspedes
              </span>
              <span className="nav-btn-tag">03</span>
            </button>
            <button
              type="button"
              className={`nav-btn ${activeTab === 'payments' ? 'active' : ''}`}
              onClick={() => setActiveTab('payments')}
            >
              <span className="nav-btn-left">
                <CreditCard size={17} />
                Caja &amp; Facturación
              </span>
              <span className="nav-btn-tag">04</span>
            </button>
          </nav>

          <div className="telemetry-box bg-stripes">
            <div className="telemetry-status">
              <span className="live-dot" />
              <span>{backendConnected ? 'SPRING_BOOT // CONECTADO' : 'VISTA PREVIA // LOCAL'}</span>
            </div>
            <div className="telemetry-meta">
              MOTOR: JAVA 17 + POSTGRES 16
              <br />
              ANTI-OVERBOOKING: ACTIVO
              <br />
              MODELO: 3NF NORMALIZADO
            </div>
          </div>
        </aside>

        <main className="main-area">
          <header className="topbar">
            <div>
              <div className="topbar-eyebrow">TEMPORADA DE VERANO // GESTIÓN HOTELERA EN TIEMPO REAL</div>
              <h2>
                Experiencia de Verano <em>&amp; Gestión de Reservas</em>
              </h2>
              <p>
                Administración cálida e intuitiva de suites frente al mar, control de concurrencia y analítica de ingresos
              </p>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => void loadAllData()} disabled={loading}>
              <RefreshCw size={15} />
              {loading ? 'Actualizando...' : 'Actualizar Panel'}
            </button>
          </header>

          {feedback && (
            <div
              ref={alertRef}
              className={`alert-banner ${feedback.type === 'success' ? 'alert-success' : 'alert-error'}`}
              role="status"
            >
              <span>{feedback.message}</span>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => void dismissAlert()}
              >
                ✕
              </button>
            </div>
          )}

          {/* ===============================================================
              TAB 1: DASHBOARD ANALÍTICO Y MAPA DE HABITACIONES
              =============================================================== */}
          {activeTab === 'dashboard' && metrics && (
            <>
              <section className="kpi-grid" aria-label="Indicadores Clave de Rendimiento">
                <TiltCard delay={0.02} glowColor="ocean">
                  <CardHead index="KPI/01" title="Ocupación del Resort" icon={Activity} />
                  <div className="kpi-value kpi-value-accent">{metrics.occupancyRatePct}%</div>
                  <div className="kpi-meter">
                    <div className="kpi-meter-fill" style={{ width: `${Math.min(100, metrics.occupancyRatePct)}%` }} />
                  </div>
                  <div className="kpi-sub">
                    {metrics.occupiedRooms} OCUPADAS · {metrics.availableRooms} DISPONIBLES DE {metrics.totalRooms}
                  </div>
                </TiltCard>

                <TiltCard delay={0.08} glowColor="sun">
                  <CardHead index="KPI/02" title="ADR (Tarifa Promedio)" icon={TrendingUp} />
                  <div className="kpi-value">S/ {metrics.adr.toFixed(2)}</div>
                  <div className="kpi-meter">
                    <div className="kpi-meter-fill" style={{ width: '72%' }} />
                  </div>
                  <div className="kpi-sub">TARIFA DIARIA PROMEDIO POR NOCHE</div>
                </TiltCard>

                <TiltCard delay={0.14} glowColor="ocean">
                  <CardHead index="KPI/03" title="RevPAR (30 Días)" icon={Sparkles} />
                  <div className="kpi-value">S/ {metrics.revPar.toFixed(2)}</div>
                  <div className="kpi-meter">
                    <div className="kpi-meter-fill" style={{ width: '64%' }} />
                  </div>
                  <div className="kpi-sub">INGRESO POR HABITACIÓN DISPONIBLE</div>
                </TiltCard>

                <TiltCard delay={0.2} glowColor="coral">
                  <CardHead index="KPI/04" title="Ingresos & Por Cobrar" icon={DollarSign} />
                  <div className="kpi-value kpi-value-accent">
                    S/ {metrics.totalCollectedRevenue.toFixed(2)}
                  </div>
                  <div className="kpi-sub">
                    SALDO PENDIENTE:{' '}
                    <strong style={{ color: 'var(--color-sunset-coral)' }}>
                      S/ {metrics.totalPendingBalance.toFixed(2)}
                    </strong>
                  </div>
                </TiltCard>
              </section>

              <TiltCard delay={0.25} max={2.5} glowColor="sun">
                <CardHead
                  index="BI/SQL-3NF"
                  title="Rendimiento Analítico por Categoría de Suite"
                  subtitle="Consulta agregada desde el esquema relacional normalizado (room_types 1:N rooms)"
                  icon={BarChart3}
                />
                <div
                  tabIndex={0}
                  role="region"
                  aria-labelledby="category-analytics-caption"
                  className="table-wrapper"
                >
                  <table
                    style={
                      {
                        '--label-2': '"Tarifa Base"',
                        '--label-3': '"Inventario Total"',
                        '--label-4': '"Ocupadas"',
                        '--label-5': '"Disponibles"',
                        '--label-6': '"% Ocupación"'
                      } as React.CSSProperties
                    }
                  >
                    <caption id="category-analytics-caption">
                      Métricas de ocupación e ingresos base por categoría de habitación
                    </caption>
                    <thead>
                      <tr>
                        <th>Categoría</th>
                        <th>Tarifa Base</th>
                        <th>Inventario Total</th>
                        <th>Ocupadas</th>
                        <th>Disponibles</th>
                        <th>% Ocupación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.categoryBreakdown.map((cat) => (
                        <tr key={cat.categoryName}>
                          <th>{cat.categoryName}</th>
                          <td>S/ {cat.basePrice.toFixed(2)}</td>
                          <td>{cat.totalRooms} suites</td>
                          <td>{cat.occupiedRooms}</td>
                          <td>{cat.availableRooms}</td>
                          <td>
                            <span className={cat.occupancyPct >= 50 ? 'badge badge-success' : 'badge badge-info'}>
                              {cat.occupancyPct}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TiltCard>

              <TiltCard delay={0.32} max={2} glowColor="ocean">
                <CardHead
                  index="INV/SUITES"
                  title="Mapa de Habitaciones y Bungalows Frente al Mar"
                  subtitle="Sincronización automática de disponibilidad con Check-In, Check-Out y Limpieza"
                  icon={BedDouble}
                />
                <div className="rooms-grid">
                  {rooms.map((room) => (
                    <div key={room.id} className="room-tile">
                      <div className="room-tile-header">
                        <span className="room-number">Suite {room.roomNumber}</span>
                        <span className={getRoomBadgeClass(room.status)}>{room.status}</span>
                      </div>
                      <div style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--color-ocean-deep)' }}>
                        {room.roomTypeName}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', color: 'var(--color-text-muted)' }}>
                        NIVEL 0{room.floor} · {room.maxCapacity} HUÉSP. ·{' '}
                        <strong style={{ color: 'var(--color-ocean-lagoon)' }}>S/ {room.basePrice}/NOCHE</strong>
                      </div>
                      <div className="action-group" style={{ marginTop: '0.45rem' }}>
                        {room.status !== 'AVAILABLE' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => void handleRoomStatusChange(room.id, 'AVAILABLE')}
                          >
                            Habilitar
                          </button>
                        )}
                        {room.status !== 'CLEANING' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => void handleRoomStatusChange(room.id, 'CLEANING')}
                          >
                            Limpieza
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TiltCard>
            </>
          )}

          {/* ===============================================================
              TAB 2: RESERVAS Y PREVENCIÓN DE OVERBOOKING
              =============================================================== */}
          {activeTab === 'reservations' && (
            <div className="panel-grid">
              <TiltCard delay={0.04} max={3.5} glowColor="sun">
                <CardHead
                  index="TX/LOCK"
                  title="Nueva Reserva de Verano"
                  subtitle="Protegida con @Lock(PESSIMISTIC_WRITE) y constraint GiST en PostgreSQL"
                  icon={CalendarCheck2}
                />
                <form className="form-stack" onSubmit={(e) => void handleCreateReservation(e)}>
                  <div className="field">
                    <label htmlFor="res-guest">Huésped Titular</label>
                    <select
                      id="res-guest"
                      value={resGuestId}
                      onChange={(e) => setResGuestId(Number(e.target.value))}
                      required
                    >
                      {guests.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.firstName} {g.lastName} ({g.documentType} {g.documentNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="res-room">Suite / Habitación</label>
                    <select
                      id="res-room"
                      value={resRoomId}
                      onChange={(e) => setResRoomId(Number(e.target.value))}
                      required
                    >
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          Suite {r.roomNumber} - {r.roomTypeName} (S/ {r.basePrice}/noche) [{r.status}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="res-checkin">Fecha de Check-In</label>
                    <span id="checkin-hint" className="hint">
                      Ingreso al resort a partir de las 14:00 hrs
                    </span>
                    <input
                      type="date"
                      id="res-checkin"
                      value={resCheckIn}
                      onChange={(e) => setResCheckIn(e.target.value)}
                      required
                      aria-describedby="checkin-hint"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="res-checkout">Fecha de Check-Out</label>
                    <span id="checkout-hint" className="hint">
                      Debe ser al menos 1 día posterior al Check-In
                    </span>
                    <input
                      type="date"
                      id="res-checkout"
                      value={resCheckOut}
                      min={resCheckIn}
                      onChange={(e) => setResCheckOut(e.target.value)}
                      required
                      aria-describedby="checkout-hint"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="res-notes">Solicitudes Especiales</label>
                    <input
                      type="text"
                      id="res-notes"
                      placeholder="Ej. Vista al mar, desayuno en terraza..."
                      value={resNotes}
                      onChange={(e) => setResNotes(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary">
                    Confirmar Reserva (@Transactional)
                  </button>

                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={() => void handleSimulateConcurrentOverbooking()}
                    title="Envía 2 peticiones HTTP idénticas al mismo tiempo para probar el bloqueo pesimista"
                  >
                    <ShieldAlert size={16} />
                    Simular 2 Reservas Simultáneas (Overbooking)
                  </button>
                </form>
              </TiltCard>

              <TiltCard delay={0.1} max={2} glowColor="ocean">
                <CardHead
                  index="RES/LEDGER"
                  title="Control de Reservas y Estadías"
                  subtitle="Seguimiento de huéspedes en casa, saldos y estados operativos"
                  icon={Activity}
                />
                <div
                  tabIndex={0}
                  role="region"
                  aria-labelledby="reservations-table-caption"
                  className="table-wrapper"
                >
                  <table
                    style={
                      {
                        '--label-2': '"Huésped"',
                        '--label-3': '"Habitación"',
                        '--label-4': '"Estadía"',
                        '--label-5': '"Total / Pendiente"',
                        '--label-6': '"Estado / Acciones"'
                      } as React.CSSProperties
                    }
                  >
                    <caption id="reservations-table-caption">
                      Historial de reservas activas, montos abonados y control de estado
                    </caption>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Huésped</th>
                        <th>Suite</th>
                        <th>Estadía</th>
                        <th>Total / Pendiente</th>
                        <th>Estado / Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map((res) => (
                        <tr key={res.id}>
                          <th>{res.reservationCode}</th>
                          <td>
                            <div style={{ fontWeight: 600 }}>{res.guestFullName}</div>
                            <small style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {res.guestDocument}
                            </small>
                          </td>
                          <td>
                            <strong>Suite {res.roomNumber}</strong>
                            <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>{res.roomTypeName}</div>
                          </td>
                          <td>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                              {res.checkInDate} → {res.checkOutDate}
                            </div>
                            <small style={{ color: 'var(--color-text-muted)' }}>{res.nights} noche(s)</small>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>Total: S/ {res.totalAmount.toFixed(2)}</div>
                            <small
                              style={{
                                color: res.pendingBalance > 0 ? 'var(--color-sunset-coral)' : 'var(--color-ocean-lagoon)',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700
                              }}
                            >
                              {res.pendingBalance > 0
                                ? `PENDIENTE: S/ ${res.pendingBalance.toFixed(2)}`
                                : 'PAGADO 100%'}
                            </small>
                          </td>
                          <td>
                            <div style={{ marginBottom: '0.4rem' }}>
                              <span className={getReservationBadgeClass(res.status)}>{res.status}</span>
                            </div>
                            <div className="action-group">
                              {res.status === 'CONFIRMED' && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  onClick={() => void handleReservationStatus(res.id, 'CHECKED_IN')}
                                >
                                  Check-In
                                </button>
                              )}
                              {res.status === 'CHECKED_IN' && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-ghost"
                                  onClick={() => void handleReservationStatus(res.id, 'CHECKED_OUT')}
                                >
                                  Check-Out
                                </button>
                              )}
                              {(res.status === 'CONFIRMED' || res.status === 'PENDING') && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-warning"
                                  onClick={() => void handleReservationStatus(res.id, 'CANCELLED')}
                                >
                                  Cancelar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TiltCard>
            </div>
          )}

          {/* ===============================================================
              TAB 3: GESTIÓN DE HUÉSPEDES (CON VALIDACIÓN :user-invalid)
              =============================================================== */}
          {activeTab === 'guests' && (
            <div className="panel-grid">
              <TiltCard delay={0.04} max={3.5} glowColor="sun">
                <CardHead
                  index="CRM/GUEST"
                  title="Registro de Huésped"
                  subtitle="Validación interactiva (:user-invalid) y control de unicidad documental"
                  icon={Users}
                />
                <form className="form-stack" onSubmit={(e) => void handleCreateGuest(e)}>
                  <div className="field">
                    <label htmlFor="guest-doctype">Tipo de Documento</label>
                    <select
                      id="guest-doctype"
                      value={guestDocType}
                      onChange={(e) => setGuestDocType(e.target.value)}
                    >
                      <option value="DNI">DNI (Documento Nacional de Identidad)</option>
                      <option value="PASSPORT">Pasaporte Internacional</option>
                      <option value="CE">Carné de Extranjería (CE)</option>
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="guest-docnum">Número de Documento</label>
                    <span id="doc-hint" className="hint">
                      Mínimo 8 caracteres alfanuméricos sin espacios
                    </span>
                    <input
                      type="text"
                      id="guest-docnum"
                      required
                      minLength={8}
                      maxLength={20}
                      pattern="[A-Za-z0-9]{8,20}"
                      value={guestDocNum}
                      onChange={(e) => setGuestDocNum(e.target.value)}
                      aria-describedby="doc-hint"
                      aria-errormessage="doc-error"
                    />
                    <div id="doc-error" className="error-msg">
                      <span aria-hidden="true">❌</span> Ingrese un documento válido (8 a 20 caracteres alfanuméricos).
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="guest-firstname">Nombres</label>
                    <span id="fname-hint" className="hint">
                      Nombres completos según documento de identidad
                    </span>
                    <input
                      type="text"
                      id="guest-firstname"
                      required
                      minLength={2}
                      autoComplete="given-name"
                      value={guestFirstName}
                      onChange={(e) => setGuestFirstName(e.target.value)}
                      aria-describedby="fname-hint"
                      aria-errormessage="fname-error"
                    />
                    <div id="fname-error" className="error-msg">
                      <span aria-hidden="true">❌</span> El nombre es obligatorio.
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="guest-lastname">Apellidos</label>
                    <span id="lname-hint" className="hint">
                      Apellido paterno y materno
                    </span>
                    <input
                      type="text"
                      id="guest-lastname"
                      required
                      minLength={2}
                      autoComplete="family-name"
                      value={guestLastName}
                      onChange={(e) => setGuestLastName(e.target.value)}
                      aria-describedby="lname-hint"
                      aria-errormessage="lname-error"
                    />
                    <div id="lname-error" className="error-msg">
                      <span aria-hidden="true">❌</span> Los apellidos son obligatorios.
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="guest-email">Correo Electrónico</label>
                    <span id="email-hint" className="hint">
                      Formato: huesped@dominio.com
                    </span>
                    <input
                      type="email"
                      id="guest-email"
                      required
                      autoComplete="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      aria-describedby="email-hint"
                      aria-errormessage="email-error"
                    />
                    <div id="email-error" className="error-msg">
                      <span aria-hidden="true">❌</span> Ingrese una dirección de correo electrónico válida.
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="guest-phone">Teléfono de Contacto</label>
                    <span id="phone-hint" className="hint">
                      Opcional. Ej: +51 987654321
                    </span>
                    <input
                      type="tel"
                      id="guest-phone"
                      autoComplete="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      aria-describedby="phone-hint"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary">
                    Registrar Huésped
                  </button>
                </form>
              </TiltCard>

              <TiltCard delay={0.1} max={2} glowColor="ocean">
                <CardHead
                  index="CRM/DIRECTORY"
                  title="Directorio de Huéspedes del Resort"
                  subtitle="Clientes registrados y contacto directo"
                  icon={Users}
                />
                <div
                  tabIndex={0}
                  role="region"
                  aria-labelledby="guests-table-caption"
                  className="table-wrapper"
                >
                  <table
                    style={
                      {
                        '--label-2': '"Documento"',
                        '--label-3': '"Correo Electrónico"',
                        '--label-4': '"Teléfono"'
                      } as React.CSSProperties
                    }
                  >
                    <caption id="guests-table-caption">
                      Directorio de clientes registrados en el hotel
                    </caption>
                    <thead>
                      <tr>
                        <th>Huésped</th>
                        <th>Documento</th>
                        <th>Correo Electrónico</th>
                        <th>Teléfono</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guests.map((g) => (
                        <tr key={g.id}>
                          <th>
                            {g.firstName} {g.lastName}
                          </th>
                          <td>
                            <span className="badge badge-info">{g.documentType}</span> {g.documentNumber}
                          </td>
                          <td>{g.email}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{g.phone || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TiltCard>
            </div>
          )}

          {/* ===============================================================
              TAB 4: FACTURACIÓN Y REGISTRO DE PAGOS
              =============================================================== */}
          {activeTab === 'payments' && (
            <div className="panel-grid">
              <TiltCard delay={0.04} max={3.5} glowColor="sun">
                <CardHead
                  index="FIN/PAY"
                  title="Registrar Abono / Liquidación"
                  subtitle="Control de adelantos y liquidación de estadías (1:N)"
                  icon={CreditCard}
                />
                <form className="form-stack" onSubmit={(e) => void handleRegisterPayment(e)}>
                  <div className="field">
                    <label htmlFor="pay-res">Reserva con Saldo Pendiente</label>
                    <select
                      id="pay-res"
                      value={payReservationId}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        setPayReservationId(id);
                        const found = reservations.find((r) => r.id === id);
                        if (found) setPayAmount(String(found.pendingBalance));
                      }}
                      required
                    >
                      <option value={0} disabled>
                        Seleccione una reserva...
                      </option>
                      {reservations
                        .filter((r) => r.status !== 'CANCELLED' && r.pendingBalance > 0)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.reservationCode} - {r.guestFullName} (Pendiente: S/ {r.pendingBalance.toFixed(2)})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="pay-amount">Monto a Abonar (S/)</label>
                    <span id="amount-hint" className="hint">
                      Permite pagos parciales (adelantos) o cancelación total del saldo
                    </span>
                    <input
                      type="number"
                      id="pay-amount"
                      step="0.01"
                      min="1"
                      required
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      aria-describedby="amount-hint"
                      aria-errormessage="amount-error"
                    />
                    <div id="amount-error" className="error-msg">
                      <span aria-hidden="true">❌</span> Ingrese un importe mayor a S/ 0.00.
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="pay-method">Método de Pago</label>
                    <select
                      id="pay-method"
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    >
                      <option value="YAPE_PLIN">Yape / Plin (Billetera Digital)</option>
                      <option value="CREDIT_CARD">Tarjeta de Crédito (Visa / Mastercard / Amex)</option>
                      <option value="DEBIT_CARD">Tarjeta de Débito</option>
                      <option value="TRANSFER">Transferencia Bancaria Corporativa</option>
                      <option value="CASH">Efectivo en Recepción</option>
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="pay-ref">N° Operación / Voucher</label>
                    <span id="ref-hint" className="hint">
                      Opcional. Si se deja en blanco, se autogenera el código de transacción.
                    </span>
                    <input
                      type="text"
                      id="pay-ref"
                      placeholder="Ej. YAPE-883920"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      aria-describedby="ref-hint"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={payReservationId === 0}>
                    Registrar Pago en Recepción
                  </button>
                </form>
              </TiltCard>

              <TiltCard delay={0.1} max={2} glowColor="ocean">
                <CardHead
                  index="FIN/LEDGER"
                  title="Libro Mayor de Transacciones y Pagos"
                  subtitle="Auditoría en tiempo real de recaudación por método de pago"
                  icon={DollarSign}
                />
                <div
                  tabIndex={0}
                  role="region"
                  aria-labelledby="payments-table-caption"
                  className="table-wrapper"
                >
                  <table
                    style={
                      {
                        '--label-2': '"Reserva / Huésped"',
                        '--label-3': '"Método"',
                        '--label-4': '"Monto"',
                        '--label-5': '"Estado"'
                      } as React.CSSProperties
                    }
                  >
                    <caption id="payments-table-caption">
                      Registro auditable de pagos recibidos por reserva
                    </caption>
                    <thead>
                      <tr>
                        <th>Referencia</th>
                        <th>Reserva / Huésped</th>
                        <th>Método</th>
                        <th>Monto</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <th>{p.transactionReference}</th>
                          <td>
                            <strong>{p.reservationCode}</strong> — {p.guestFullName}
                          </td>
                          <td>
                            <span className="badge badge-info">{p.paymentMethod}</span>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--color-ocean-lagoon)', fontFamily: 'var(--font-mono)' }}>
                              S/ {p.amount.toFixed(2)}
                            </strong>
                          </td>
                          <td>
                            <span className="badge badge-success">{p.paymentStatus}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TiltCard>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
