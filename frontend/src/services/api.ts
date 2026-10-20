import {
  DashboardMetrics,
  Guest,
  GuestRequest,
  Payment,
  PaymentRequest,
  Reservation,
  ReservationRequest,
  ReservationStatus,
  Room,
  RoomStatus
} from '../types/hotel';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// =============================================================================
// MOTOR TRANSACCIONAL DE RESPALDO PARA DESPLIEGUE EN VERCEL (SERVERLESS/CLIENT)
// Si el Frontend está desplegado en Vercel sin un contenedor Java activo 24/7,
// replica exactamente las reglas 3NF, el cálculo de KPIs (ADR, RevPAR, Ocupación)
// y el Bloqueo Pesimista contra Overbooking para demostraciones en vivo.
// =============================================================================

const todayStr = (offsetDays = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

let fallbackRooms: Room[] = [
  { id: 1, roomNumber: '101', floor: 1, roomTypeName: 'Standard Simple', description: 'Brisa marina individual', basePrice: 150, maxCapacity: 1, status: 'OCCUPIED' },
  { id: 2, roomNumber: '102', floor: 1, roomTypeName: 'Standard Simple', description: 'Brisa marina individual', basePrice: 150, maxCapacity: 1, status: 'AVAILABLE' },
  { id: 3, roomNumber: '103', floor: 1, roomTypeName: 'Standard Simple', description: 'Brisa marina individual', basePrice: 150, maxCapacity: 1, status: 'AVAILABLE' },
  { id: 4, roomNumber: '201', floor: 2, roomTypeName: 'Doble Superior', description: 'Terraza con vista al mar', basePrice: 240, maxCapacity: 2, status: 'OCCUPIED' },
  { id: 5, roomNumber: '202', floor: 2, roomTypeName: 'Doble Superior', description: 'Terraza con vista al mar', basePrice: 240, maxCapacity: 2, status: 'AVAILABLE' },
  { id: 6, roomNumber: '203', floor: 2, roomTypeName: 'Doble Superior', description: 'Terraza con vista al mar', basePrice: 240, maxCapacity: 2, status: 'CLEANING' },
  { id: 7, roomNumber: '301', floor: 3, roomTypeName: 'Suite Ejecutiva', description: 'Cama King frente a la playa', basePrice: 380, maxCapacity: 3, status: 'OCCUPIED' },
  { id: 8, roomNumber: '302', floor: 3, roomTypeName: 'Suite Ejecutiva', description: 'Cama King frente a la playa', basePrice: 380, maxCapacity: 3, status: 'AVAILABLE' },
  { id: 9, roomNumber: '303', floor: 3, roomTypeName: 'Suite Ejecutiva', description: 'Cama King frente a la playa', basePrice: 380, maxCapacity: 3, status: 'MAINTENANCE' },
  { id: 10, roomNumber: '401', floor: 4, roomTypeName: 'Suite Presidencial', description: 'Penthouse panorámico 360°', basePrice: 650, maxCapacity: 4, status: 'AVAILABLE' }
];

let fallbackGuests: Guest[] = [
  { id: 1, documentType: 'DNI', documentNumber: '74829103', firstName: 'Carlos', lastName: 'Mendoza Ríos', email: 'carlos.mendoza@empresa.pe', phone: '+51 987654321', createdAt: new Date().toISOString() },
  { id: 2, documentType: 'DNI', documentNumber: '46192837', firstName: 'Valeria', lastName: 'Gómez Paredes', email: 'valeria.gomez@correo.com', phone: '+51 912345678', createdAt: new Date().toISOString() },
  { id: 3, documentType: 'PASSPORT', documentNumber: 'US8839201', firstName: 'Michael', lastName: 'Thornton', email: 'm.thornton@globalcorp.com', phone: '+1 4158902341', createdAt: new Date().toISOString() },
  { id: 4, documentType: 'DNI', documentNumber: '71029384', firstName: 'Lucía', lastName: 'Fernández Soto', email: 'lucia.fernandez@utp.edu.pe', phone: '+51 998877665', createdAt: new Date().toISOString() }
];

let fallbackReservations: Reservation[] = [
  {
    id: 1,
    reservationCode: 'RES-2026-0001',
    guestId: 1,
    guestFullName: 'Carlos Mendoza Ríos',
    guestDocument: 'DNI 74829103',
    roomId: 1,
    roomNumber: '101',
    roomTypeName: 'Standard Simple',
    checkInDate: todayStr(-2),
    checkOutDate: todayStr(2),
    nights: 4,
    status: 'CHECKED_IN',
    totalAmount: 600,
    amountPaid: 600,
    pendingBalance: 0,
    notes: 'Viaje corporativo - Cliente frecuente',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    reservationCode: 'RES-2026-0002',
    guestId: 2,
    guestFullName: 'Valeria Gómez Paredes',
    guestDocument: 'DNI 46192837',
    roomId: 4,
    roomNumber: '201',
    roomTypeName: 'Doble Superior',
    checkInDate: todayStr(-1),
    checkOutDate: todayStr(3),
    nights: 4,
    status: 'CHECKED_IN',
    totalAmount: 960,
    amountPaid: 480,
    pendingBalance: 480,
    notes: 'Adelanto del 50% abonado',
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    reservationCode: 'RES-2026-0003',
    guestId: 3,
    guestFullName: 'Michael Thornton',
    guestDocument: 'PASSPORT US8839201',
    roomId: 7,
    roomNumber: '301',
    roomTypeName: 'Suite Ejecutiva',
    checkInDate: todayStr(-1),
    checkOutDate: todayStr(4),
    nights: 5,
    status: 'CHECKED_IN',
    totalAmount: 1900,
    amountPaid: 1200,
    pendingBalance: 700,
    notes: 'Huésped VIP - Traslado aeropuerto',
    createdAt: new Date().toISOString()
  },
  {
    id: 4,
    reservationCode: 'RES-2026-0004',
    guestId: 4,
    guestFullName: 'Lucía Fernández Soto',
    guestDocument: 'DNI 71029384',
    roomId: 10,
    roomNumber: '401',
    roomTypeName: 'Suite Presidencial',
    checkInDate: todayStr(3),
    checkOutDate: todayStr(6),
    nights: 3,
    status: 'CONFIRMED',
    totalAmount: 1950,
    amountPaid: 0,
    pendingBalance: 1950,
    notes: 'Reserva futura confirmada',
    createdAt: new Date().toISOString()
  }
];

let fallbackPayments: Payment[] = [
  { id: 1, reservationId: 1, reservationCode: 'RES-2026-0001', guestFullName: 'Carlos Mendoza Ríos', amount: 600, paymentMethod: 'CREDIT_CARD', paymentStatus: 'COMPLETED', transactionReference: 'VISA-992011', paidAt: new Date().toISOString() },
  { id: 2, reservationId: 2, reservationCode: 'RES-2026-0002', guestFullName: 'Valeria Gómez Paredes', amount: 480, paymentMethod: 'YAPE_PLIN', paymentStatus: 'COMPLETED', transactionReference: 'YAPE-772819', paidAt: new Date().toISOString() },
  { id: 3, reservationId: 3, reservationCode: 'RES-2026-0003', guestFullName: 'Michael Thornton', amount: 1200, paymentMethod: 'TRANSFER', paymentStatus: 'COMPLETED', transactionReference: 'BCP-883920', paidAt: new Date().toISOString() }
];

// Candado de exclusión mutua por habitación (emula SELECT ... FOR UPDATE)
const roomLocks = new Map<number, Promise<void>>();

function computeDashboardMetrics(): DashboardMetrics {
  const totalRooms = fallbackRooms.length;
  const occupiedRooms = fallbackRooms.filter((r) => r.status === 'OCCUPIED').length;
  const availableRooms = fallbackRooms.filter((r) => r.status === 'AVAILABLE').length;
  const unavailableRooms = totalRooms - occupiedRooms - availableRooms;
  const occupancyRatePct = totalRooms > 0 ? Number(((occupiedRooms / totalRooms) * 100).toFixed(2)) : 0;

  const activeRes = fallbackReservations.filter((r) => r.status !== 'CANCELLED');
  const totalReservationValue = activeRes.reduce((acc, r) => acc + r.totalAmount, 0);
  const totalNights = activeRes.reduce((acc, r) => acc + Math.max(1, r.nights), 0);

  const adr = totalNights > 0 ? Number((totalReservationValue / totalNights).toFixed(2)) : 0;
  const revPar = totalRooms > 0 ? Number((totalReservationValue / (totalRooms * 30)).toFixed(2)) : 0;
  const totalCollectedRevenue = fallbackPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalPendingBalance = Math.max(0, totalReservationValue - totalCollectedRevenue);

  const categories = [
    { name: 'Standard Simple', basePrice: 150 },
    { name: 'Doble Superior', basePrice: 240 },
    { name: 'Suite Ejecutiva', basePrice: 380 },
    { name: 'Suite Presidencial', basePrice: 650 }
  ];

  const categoryBreakdown = categories.map((c) => {
    const catRooms = fallbackRooms.filter((r) => r.roomTypeName === c.name);
    const catTotal = catRooms.length;
    const catOccupied = catRooms.filter((r) => r.status === 'OCCUPIED').length;
    const catAvailable = catRooms.filter((r) => r.status === 'AVAILABLE').length;
    const occupancyPct = catTotal > 0 ? Number(((catOccupied / catTotal) * 100).toFixed(2)) : 0;
    return {
      categoryName: c.name,
      basePrice: c.basePrice,
      totalRooms: catTotal,
      occupiedRooms: catOccupied,
      availableRooms: catAvailable,
      occupancyPct
    };
  });

  return {
    totalRooms,
    occupiedRooms,
    availableRooms,
    unavailableRooms,
    occupancyRatePct,
    adr,
    revPar,
    totalCollectedRevenue,
    totalPendingBalance,
    activeReservationsCount: activeRes.filter((r) => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN').length,
    categoryBreakdown
  };
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('BACKEND_UNAVAILABLE');
  }

  if (!response.ok) {
    let errorMsg = `Error HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      if (errBody.message) {
        errorMsg = `[${errBody.error || response.status}] ${errBody.message}`;
      }
    } catch {
      // Fallback
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

function isNetworkOrUnavailableError(err: unknown): boolean {
  if (!(err instanceof Error)) return true;
  return (
    err.message === 'BACKEND_UNAVAILABLE' ||
    err.message.includes('Failed to fetch') ||
    err.message.includes('NetworkError') ||
    err.message.includes('Error HTTP 404') ||
    err.message.includes('Error HTTP 502') ||
    err.message.includes('Error HTTP 503')
  );
}

export const hotelApi = {
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    try {
      return await request<DashboardMetrics>('/analytics/dashboard');
    } catch (err) {
      if (isNetworkOrUnavailableError(err)) return computeDashboardMetrics();
      throw err;
    }
  },

  getRooms: async (): Promise<Room[]> => {
    try {
      return await request<Room[]>('/rooms');
    } catch (err) {
      if (isNetworkOrUnavailableError(err)) return [...fallbackRooms];
      throw err;
    }
  },

  updateRoomStatus: async (roomId: number, status: RoomStatus): Promise<Room> => {
    try {
      return await request<Room>(`/rooms/${roomId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    } catch (err) {
      if (isNetworkOrUnavailableError(err)) {
        const room = fallbackRooms.find((r) => r.id === roomId);
        if (!room) throw new Error('Habitación no encontrada');
        room.status = status;
        return { ...room };
      }
      throw err;
    }
  },

  getGuests: async (): Promise<Guest[]> => {
    try {
      return await request<Guest[]>('/guests');
    } catch (err) {
      if (isNetworkOrUnavailableError(err)) return [...fallbackGuests];
      throw err;
    }
  },

  createGuest: async (payload: GuestRequest): Promise<Guest> => {
    try {
      return await request<Guest>('/guests', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      if (isNetworkOrUnavailableError(err)) {
        if (fallbackGuests.some((g) => g.documentNumber === payload.documentNumber.trim())) {
          throw new Error(`[INVALID_ARGUMENT] Ya existe un huésped registrado con el documento: ${payload.documentNumber}`);
        }
        const created: Guest = {
          id: fallbackGuests.length + 1,
          documentType: payload.documentType.toUpperCase(),
          documentNumber: payload.documentNumber.trim(),
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          email: payload.email.trim().toLowerCase(),
          phone: payload.phone,
          createdAt: new Date().toISOString()
        };
        fallbackGuests = [created, ...fallbackGuests];
        return created;
      }
      throw err;
    }
  },

  getReservations: async (): Promise<Reservation[]> => {
    try {
      return await request<Reservation[]>('/reservations');
    } catch (err) {
      if (isNetworkOrUnavailableError(err)) return [...fallbackReservations];
      throw err;
    }
  },

  createReservation: async (payload: ReservationRequest): Promise<Reservation> => {
    try {
      return await request<Reservation>('/reservations', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      if (isNetworkOrUnavailableError(err)) {
        // Serialización de bloqueo pesimista por roomId (SELECT ... FOR UPDATE)
        const prevLock = roomLocks.get(payload.roomId) || Promise.resolve();
        let releaseLock!: () => void;
        const currentLock = new Promise<void>((resolve) => {
          releaseLock = resolve;
        });
        roomLocks.set(payload.roomId, prevLock.then(() => currentLock));

        await prevLock;
        try {
          const d1 = new Date(payload.checkInDate);
          const d2 = new Date(payload.checkOutDate);
          const nights = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
          if (nights <= 0) {
            throw new Error('[INVALID_ARGUMENT] La fecha de check-out debe ser al menos 1 día posterior al check-in.');
          }

          const room = fallbackRooms.find((r) => r.id === payload.roomId);
          const guest = fallbackGuests.find((g) => g.id === payload.guestId);
          if (!room || !guest) throw new Error('[RESOURCE_NOT_FOUND] Habitación o huésped no encontrado.');

          if (room.status === 'MAINTENANCE') {
            throw new Error(`[OVERBOOKING_CONFLICT] La habitación ${room.roomNumber} se encuentra en mantenimiento.`);
          }

          const hasOverlap = fallbackReservations.some(
            (r) =>
              r.roomId === room.id &&
              r.status !== 'CANCELLED' &&
              r.checkInDate < payload.checkOutDate &&
              r.checkOutDate > payload.checkInDate
          );

          if (hasOverlap) {
            throw new Error(
              `[OVERBOOKING_CONFLICT] Prevención de Overbooking: La habitación ${room.roomNumber} ya cuenta con una reserva activa entre ${payload.checkInDate} y ${payload.checkOutDate}.`
            );
          }

          const totalAmount = room.basePrice * nights;
          const created: Reservation = {
            id: fallbackReservations.length + 1,
            reservationCode: `RES-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            guestId: guest.id,
            guestFullName: `${guest.firstName} ${guest.lastName}`,
            guestDocument: `${guest.documentType} ${guest.documentNumber}`,
            roomId: room.id,
            roomNumber: room.roomNumber,
            roomTypeName: room.roomTypeName,
            checkInDate: payload.checkInDate,
            checkOutDate: payload.checkOutDate,
            nights,
            status: 'CONFIRMED',
            totalAmount,
            amountPaid: 0,
            pendingBalance: totalAmount,
            notes: payload.notes || '',
            createdAt: new Date().toISOString()
          };
          fallbackReservations = [created, ...fallbackReservations];
          return created;
        } finally {
          releaseLock();
        }
      }
      throw err;
    }
  },

  updateReservationStatus: async (reservationId: number, status: ReservationStatus): Promise<Reservation> => {
    try {
      return await request<Reservation>(`/reservations/${reservationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    } catch (err) {
      if (isNetworkOrUnavailableError(err)) {
        const res = fallbackReservations.find((r) => r.id === reservationId);
        if (!res) throw new Error('Reserva no encontrada');
        res.status = status;
        const room = fallbackRooms.find((rm) => rm.id === res.roomId);
        if (room) {
          if (status === 'CHECKED_IN') room.status = 'OCCUPIED';
          else if (status === 'CHECKED_OUT') room.status = 'CLEANING';
          else if (status === 'CANCELLED' && room.status === 'OCCUPIED') room.status = 'AVAILABLE';
        }
        return { ...res };
      }
      throw err;
    }
  },

  getPayments: async (): Promise<Payment[]> => {
    try {
      return await request<Payment[]>('/payments');
    } catch (err) {
      if (isNetworkOrUnavailableError(err)) return [...fallbackPayments];
      throw err;
    }
  },

  registerPayment: async (payload: PaymentRequest): Promise<Payment> => {
    try {
      return await request<Payment>('/payments', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      if (isNetworkOrUnavailableError(err)) {
        const res = fallbackReservations.find((r) => r.id === payload.reservationId);
        if (!res) throw new Error('Reserva no encontrada');
        if (payload.amount > res.pendingBalance) {
          throw new Error(
            `[INVALID_ARGUMENT] El monto ingresado (S/ ${payload.amount}) supera el saldo pendiente de la reserva (S/ ${res.pendingBalance}).`
          );
        }
        res.amountPaid += payload.amount;
        res.pendingBalance = Math.max(0, res.totalAmount - res.amountPaid);

        const created: Payment = {
          id: fallbackPayments.length + 1,
          reservationId: res.id,
          reservationCode: res.reservationCode,
          guestFullName: res.guestFullName,
          amount: payload.amount,
          paymentMethod: payload.paymentMethod,
          paymentStatus: 'COMPLETED',
          transactionReference:
            payload.transactionReference?.trim() ||
            `${payload.paymentMethod}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          paidAt: new Date().toISOString()
        };
        fallbackPayments = [created, ...fallbackPayments];
        return created;
      }
      throw err;
    }
  }
};
