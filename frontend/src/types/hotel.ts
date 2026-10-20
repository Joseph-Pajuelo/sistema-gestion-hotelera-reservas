export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'CLEANING';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER' | 'YAPE_PLIN';

export interface Room {
  id: number;
  roomNumber: string;
  floor: number;
  roomTypeName: string;
  description: string;
  basePrice: number;
  maxCapacity: number;
  status: RoomStatus;
}

export interface Guest {
  id: number;
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface GuestRequest {
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Reservation {
  id: number;
  reservationCode: string;
  guestId: number;
  guestFullName: string;
  guestDocument: string;
  roomId: number;
  roomNumber: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  status: ReservationStatus;
  totalAmount: number;
  amountPaid: number;
  pendingBalance: number;
  notes: string;
  createdAt: string;
}

export interface ReservationRequest {
  guestId: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  notes?: string;
}

export interface Payment {
  id: number;
  reservationId: number;
  reservationCode: string;
  guestFullName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  transactionReference: string;
  paidAt: string;
}

export interface PaymentRequest {
  reservationId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
}

export interface CategoryMetric {
  categoryName: string;
  basePrice: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyPct: number;
}

export interface DashboardMetrics {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  unavailableRooms: number;
  occupancyRatePct: number;
  adr: number;
  revPar: number;
  totalCollectedRevenue: number;
  totalPendingBalance: number;
  activeReservationsCount: number;
  categoryBreakdown: CategoryMetric[];
}
