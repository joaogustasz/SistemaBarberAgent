const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
  if (token) localStorage.setItem("barbearia_token", token);
  else localStorage.removeItem("barbearia_token");
}

export function loadStoredToken() {
  authToken = localStorage.getItem("barbearia_token");
  return authToken;
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = null; }
  }

  if (!res.ok) {
    const message = (data && data.error) || `Erro ${res.status} ao comunicar com o servidor.`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // auth
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),
  loginGoogle: (payload) => request("/auth/google", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),

  // barbers
  getBarbers: () => request("/barbers", { auth: false }),
  createBarber: (payload) => request("/barbers", { method: "POST", body: payload }),
  updateBarber: (id, payload) => request(`/barbers/${id}`, { method: "PUT", body: payload }),
  deleteBarber: (id) => request(`/barbers/${id}`, { method: "DELETE" }),

  // services
  getServices: (barberId) => request(`/services${barberId ? `?barberId=${barberId}` : ""}`, { auth: false }),
  createService: (payload) => request("/services", { method: "POST", body: payload }),
  updateService: (id, payload) => request(`/services/${id}`, { method: "PUT", body: payload }),
  deleteService: (id) => request(`/services/${id}`, { method: "DELETE" }),

  // schedule
  getWorkingHours: (barberId) => request(`/schedule/working-hours?barberId=${barberId}`, { auth: false }),
  addWorkingHour: (payload) => request("/schedule/working-hours", { method: "POST", body: payload }),
  deleteWorkingHour: (id) => request(`/schedule/working-hours/${id}`, { method: "DELETE" }),

  getBlockedSlots: (barberId, from, to) =>
    request(`/schedule/blocked-slots?barberId=${barberId}${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`, { auth: false }),
  addBlockedSlot: (payload) => request("/schedule/blocked-slots", { method: "POST", body: payload }),
  deleteBlockedSlot: (id) => request(`/schedule/blocked-slots/${id}`, { method: "DELETE" }),

  // appointments
  getAvailableSlots: (barberId, serviceId, date) =>
    request(`/appointments/available-slots?barberId=${barberId}&serviceId=${serviceId}&date=${date}`, { auth: false }),
  createAppointment: (payload) => request("/appointments", { method: "POST", body: payload }),
  getAppointments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/appointments${qs ? `?${qs}` : ""}`);
  },
  cancelAppointment: (id) => request(`/appointments/${id}/cancel`, { method: "PATCH" }),
  setAppointmentStatus: (id, status) => request(`/appointments/${id}/status`, { method: "PATCH", body: { status } }),

  // reports
  getReports: (from, to) => request(`/reports/summary?from=${from}&to=${to}`),
};
