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

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    let errorMsg = `Error HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      if (errBody.message) {
        errorMsg = `[${errBody.error || response.status}] ${errBody.message}`;
      }
    } catch {
      // Fallback si el body no es JSON
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export const hotelApi = {
  getDashboardMetrics: () => request<DashboardMetrics>('/analytics/dashboard'),

  getRooms: () => request<Room[]>('/rooms'),

  updateRoomStatus: (roomId: number, status: RoomStatus) =>
    request<Room>(`/rooms/${roomId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  getGuests: () => request<Guest[]>('/guests'),

  createGuest: (payload: GuestRequest) =>
    request<Guest>('/guests', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getReservations: () => request<Reservation[]>('/reservations'),

  createReservation: (payload: ReservationRequest) =>
    request<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateReservationStatus: (reservationId: number, status: ReservationStatus) =>
    request<Reservation>(`/reservations/${reservationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  getPayments: () => request<Payment[]>('/payments'),

  registerPayment: (payload: PaymentRequest) =>
    request<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};
