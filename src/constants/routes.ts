export const routes = {
  login: '/auth/login',
  dashboard: '/app',
  orders: '/app/orders',
  wallet: '/app/wallet',
  business: '/app/business',
  deliveryLinks: '/app/delivery-links',
  publicDeliveryLink: (code = ':code') => `/delivery/${code}`,
} as const
