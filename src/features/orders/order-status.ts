import type { OrderStatus } from './api';

const labels: Record<OrderStatus, string> = {
  QUOTED: 'Draft',
  PAYMENT_PROCESSING: 'Processing',
  PENDING: 'Pending',
  PAIRED: 'Paired',
  PICKUP: 'Pick-up',
  IN_TRANSIT: 'In transit',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLATION_PROCESSING: 'Cancelling',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
};

export function orderStatusLabel(status: OrderStatus) {
  return labels[status] ?? status.replaceAll('_', ' ');
}

export function orderStatusTone(status: OrderStatus) {
  if (['DELIVERED', 'COMPLETED'].includes(status)) return 'text-success';
  if (['PENDING', 'QUOTED'].includes(status)) return 'text-warning';
  if (['PAIRED', 'PICKUP', 'IN_TRANSIT'].includes(status)) return 'text-primary';
  if (status === 'CANCELLED' || status === 'FAILED') return 'text-danger';
  return 'text-muted';
}