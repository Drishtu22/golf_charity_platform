import api from './api';

// ─── Scores ───────────────────────────────────────────────────────────────────
export const scoreService = {
  getMyScores: () => api.get('/scores').then((r) => r.data.data),
  addScore: (payload) => api.post('/scores', payload).then((r) => r.data.data),
  updateScore: (id, payload) => api.patch(`/scores/${id}`, payload).then((r) => r.data.data),
  deleteScore: (id) => api.delete(`/scores/${id}`).then((r) => r.data),
};

// ─── Charities ────────────────────────────────────────────────────────────────
export const charityService = {
  list: (params) => api.get('/charities', { params }).then((r) => r.data.data),
  get: (id) => api.get(`/charities/${id}`).then((r) => r.data.data),
  setMyCharity: (payload) => api.patch('/charities/me/selection', payload).then((r) => r.data),
  // Admin
  create: (payload) => api.post('/charities', payload).then((r) => r.data.data),
  update: (id, payload) => api.patch(`/charities/${id}`, payload).then((r) => r.data.data),
  delete: (id) => api.delete(`/charities/${id}`).then((r) => r.data),
  getStats: () => api.get('/charities/admin/stats').then((r) => r.data.data),
};

// ─── Draws ────────────────────────────────────────────────────────────────────
export const drawService = {
  getLatest: () => api.get('/draws/latest').then((r) => r.data.data),
  getHistory: (params) => api.get('/draws/history', { params }).then((r) => r.data.data),
  getMyResult: (drawId) => api.get(`/draws/${drawId}/my-result`).then((r) => r.data.data),
  // Admin
  adminList: () => api.get('/draws/admin/all').then((r) => r.data.data),
  create: (payload) => api.post('/draws', payload).then((r) => r.data.data),
  simulate: (drawId) => api.post(`/draws/${drawId}/simulate`).then((r) => r.data.data),
  publish: (drawId) => api.post(`/draws/${drawId}/publish`).then((r) => r.data.data),
};

// ─── Subscriptions ────────────────────────────────────────────────────────────
export const subscriptionService = {
  getStatus: () => api.get('/subscriptions/status').then((r) => r.data.data),
  createCheckout: (plan) => api.post('/subscriptions/checkout', { plan }).then((r) => r.data.data),
  cancel: () => api.post('/subscriptions/cancel').then((r) => r.data),
  openPortal: () => api.post('/subscriptions/portal').then((r) => r.data.data),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const userService = {
  updateProfile: (payload) => api.patch('/users/me', payload).then((r) => r.data.data),
  getWinnings: () => api.get('/users/me/winnings').then((r) => r.data.data),
  submitProof: (winnerId, proof_url) =>
    api.patch(`/users/me/winnings/${winnerId}/proof`, { proof_url }).then((r) => r.data.data),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminService = {
  getStats: () => api.get('/admin/stats').then((r) => r.data.data),
  listUsers: (params) => api.get('/admin/users', { params }).then((r) => r.data.data),
  getUser: (id) => api.get(`/admin/users/${id}`).then((r) => r.data.data),
  updateUser: (id, payload) => api.patch(`/admin/users/${id}`, payload).then((r) => r.data.data),
  listWinners: (params) => api.get('/admin/winners', { params }).then((r) => r.data.data),
  verifyWinner: (id, action) => api.patch(`/admin/winners/${id}/verify`, { action }).then((r) => r.data.data),
  markPaid: (id) => api.patch(`/admin/winners/${id}/paid`).then((r) => r.data.data),
};
