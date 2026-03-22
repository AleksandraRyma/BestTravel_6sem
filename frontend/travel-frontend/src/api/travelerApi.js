import axiosClient from "./axiosClient";

// ─── Home ──────────────────────────────────────────────────────────
export async function getTravelerHome() {
  const res = await axiosClient.get("/traveler/home");
  return res.data;
}

// ─── Profile ───────────────────────────────────────────────────────
export async function getTravelerProfile() {
  const res = await axiosClient.get("/traveler/profile");
  return res.data;
}

export async function updateTravelerProfile(data) {
  const res = await axiosClient.put("/traveler/profile", data);
  return res.data;
}

// ─── Мои маршруты ─────────────────────────────────────────────────
// params: { search, transportType, status, dateFrom, dateTo, sortBy, sortDir }
// По умолчанию sortBy=startDate&sortDir=asc — ближайшие первыми
export async function getMyRoutes(params = {}) {
  const res = await axiosClient.get("/traveler/my-routes", { params });
  return res.data;
}

// ─── Публичные маршруты ────────────────────────────────────────────
export async function getPublicRoutes(params = {}) {
  const res = await axiosClient.get("/traveler/routes", { params });
  return res.data;
}

// ─── Маршрут по ID ────────────────────────────────────────────────
export async function getRouteById(routeId) {
  const res = await axiosClient.get(`/traveler/routes/${routeId}`);
  return res.data;
}

// ─── CRUD маршрутов ───────────────────────────────────────────────
export async function createRoute(data) {
  const res = await axiosClient.post("/traveler/routes", data);
  return res.data;
}

export async function updateRoute(routeId, data) {
  const res = await axiosClient.put(`/traveler/routes/${routeId}`, data);
  return res.data;
}

export async function deleteRoute(routeId) {
  await axiosClient.delete(`/traveler/routes/${routeId}`);
}

// ─── Участники ────────────────────────────────────────────────────
export async function inviteParticipant(routeId, email) {
  const res = await axiosClient.post(`/traveler/routes/${routeId}/invite`, { email });
  return res.data;
}

export async function respondToInvite(routeId, status) {
  const res = await axiosClient.post(
    `/traveler/routes/${routeId}/respond`,
    null,
    { params: { status } }
  );
  return res.data;
}

// ─── Уведомления ─────────────────────────────────────────────────
export async function getNotifications() {
  const res = await axiosClient.get("/traveler/notifications");
  return res.data;
}

export async function markNotificationRead(id) {
  await axiosClient.put(`/traveler/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await axiosClient.put("/traveler/notifications/read-all");
}

export async function getUnreadCount() {
  const res = await axiosClient.get("/traveler/notifications/unread-count");
  return res.data;
}

// ─── Внешние API (без ключей) ─────────────────────────────────────

// Nominatim — геокодинг (OpenStreetMap)
export async function geocodeAddress(query) {
  const url = `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=ru`;
  const res = await fetch(url, { headers: { "User-Agent": "TravelPlatform/1.0" } });
  return res.json();
}

// OSRM — построение маршрута (бесплатно, без ключа)
// profile: driving | foot | cycling
export async function calculateOsrmRoute(waypoints, profile = "driving") {
  const coords = waypoints.map(w => `${w.lon},${w.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}` +
    `?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(url);
  return res.json();
}


// Получить события календаря
export async function getCalendarEvents() {
  const res = await axiosClient.get("/traveler/calendar/events");
  return res.data;
}

// Добавить маршрут в календарь
export async function addToCalendar(routeId) {
  const res = await axiosClient.post(`/traveler/calendar/routes/${routeId}`);
  return res.data;
}

// Убрать маршрут из календаря
export async function removeFromCalendar(routeId) {
  await axiosClient.delete(`/traveler/calendar/routes/${routeId}`);
}