import { apiRequest } from '../../api/client';

export type AccountProfile = { id:string; fullName:string; email:string; phone:string; dob:string; gender:'MALE'|'FEMALE'|'OTHER'; emailVerified:boolean; phoneVerified:boolean; accountNumber:string|null; hasNin:boolean; maskedNin:string|null };
const auth = (token:string) => ({ authorization: `Bearer ${token}` });
export const settingsApi = {
  profile: (token:string) => apiRequest<AccountProfile>('/account/profile', { headers: auth(token) }),
  updateProfile: (token:string, fullName:string) => apiRequest<AccountProfile>('/account/profile', { method:'PATCH', headers:auth(token), body:JSON.stringify({fullName}) }),
  changePassword: (token:string, currentPassword:string, newPassword:string) => apiRequest('/account/password/change', { method:'POST', headers:auth(token), body:JSON.stringify({currentPassword,newPassword}) }),
  changePin: (token:string, currentPin:string, newPin:string) => apiRequest('/account/transaction-pin/change', { method:'POST', headers:auth(token), body:JSON.stringify({currentPin,newPin,confirmPin:newPin}) }),
  requestPinReset: (token:string) => apiRequest('/account/transaction-pin/reset/request', { method:'POST', headers:auth(token), body:'{}' }),
  resetPin: (token:string, code:string, newPin:string) => apiRequest('/account/transaction-pin/reset/confirm', { method:'POST', headers:auth(token), body:JSON.stringify({code,newPin,confirmPin:newPin}) }),
  requestDeactivation: (token:string) => apiRequest('/account/deactivation/request', { method:'POST', headers:auth(token), body:'{}' }),
  deactivate: (token:string, code:string) => apiRequest('/account/deactivation/confirm', { method:'POST', headers:auth(token), body:JSON.stringify({code}) }),
};
