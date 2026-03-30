// import { useState, useEffect, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import FullCalendar from "@fullcalendar/react";
// import dayGridPlugin from "@fullcalendar/daygrid";
// import timeGridPlugin from "@fullcalendar/timegrid";
// import listPlugin from "@fullcalendar/list";
// import interactionPlugin from "@fullcalendar/interaction";
// import ruLocale from "@fullcalendar/core/locales/ru";
// import {
//   FiMap, FiPlus, FiSearch, FiStar, FiUsers, FiCalendar,
//   FiBell, FiUser, FiMenu, FiX, FiLogOut, FiHome, FiHeart,
//   FiChevronLeft, FiChevronRight, FiList, FiGrid, FiMapPin,
//   FiClock, FiTruck, FiDollarSign, FiExternalLink,
// } from "react-icons/fi";
// import { getMyRoutes } from "../../api/travelerApi";
// import "../../styles/traveler/TravelerCalendarPage.css";

// // ─── Sidebar nav ──────────────────────────────────────────────────
// const NAV = [
//   { path: "/traveler",               icon: <FiHome />,     label: "Главная" },
//   { path: "/traveler/my-routes",     icon: <FiMap />,      label: "Мои маршруты" },
//   { path: "/traveler/create-route",  icon: <FiPlus />,     label: "Создать маршрут" },
//   { path: "/traveler/search",        icon: <FiSearch />,   label: "Найти маршруты" },
//   { path: "/traveler/recommended",   icon: <FiStar />,     label: "Рекомендации" },
//   { path: "/traveler/calendar",      icon: <FiCalendar />, label: "Календарь" },
//   { path: "/traveler/favorites",     icon: <FiHeart />,    label: "Избранное" },
//   { path: "/traveler/notifications", icon: <FiBell />,     label: "Уведомления" },
//   { path: "/traveler/profile",       icon: <FiUser />,     label: "Профиль" },
// ];

// // ─── Цвета по типу транспорта ─────────────────────────────────────
// const TRANSPORT_COLORS = {
//   WALK:    { bg: "#dcfce7", border: "#16a34a", text: "#14532d", icon: "🚶" },
//   BIKE:    { bg: "#fef9c3", border: "#ca8a04", text: "#713f12", icon: "🚴" },
//   CAR:     { bg: "#eff6ff", border: "#2563eb", text: "#1e3a8a", icon: "🚗" },
//   TRANSIT: { bg: "#fdf4ff", border: "#9333ea", text: "#581c87", icon: "🚌" },
//   PLANE:   { bg: "#fff7ed", border: "#ea580c", text: "#7c2d12", icon: "✈️" },
//   DEFAULT: { bg: "#f1f5f9", border: "#64748b", text: "#1e293b", icon: "📍" },
// };

// function getColor(transportType) {
//   return TRANSPORT_COLORS[transportType] || TRANSPORT_COLORS.DEFAULT;
// }

// function statusOf(startDate, endDate) {
//   const now = new Date();
//   const s   = new Date(startDate);
//   const e   = new Date(endDate);
//   if (now < s) return { label: "Предстоит", cls: "upcoming" };
//   if (now > e) return { label: "Завершён",  cls: "past" };
//   return       { label: "В пути",    cls: "ongoing" };
// }

// function fmtDate(d) {
//   if (!d) return "—";
//   return new Date(d).toLocaleDateString("ru-RU", {
//     day: "numeric", month: "long", year: "numeric",
//   });
// }

// const MOCK_ROUTES = [
//   { id:1, title:"Тур по Европе",      startLocation:"Москва",  endLocation:"Париж",     startDate:"2026-04-10", endDate:"2026-04-20", durationDays:11, transportType:"PLANE",   totalPrice:1200, participantsCount:3 },
//   { id:2, title:"Золотое кольцо",     startLocation:"Москва",  endLocation:"Суздаль",   startDate:"2026-03-25", endDate:"2026-03-28", durationDays:4,  transportType:"CAR",     totalPrice:180,  participantsCount:2 },
//   { id:3, title:"Байкал зимой",       startLocation:"Иркутск", endLocation:"Листвянка", startDate:"2025-12-01", endDate:"2025-12-07", durationDays:7,  transportType:"CAR",     totalPrice:320,  participantsCount:1 },
//   { id:4, title:"Велотур Прага–Вена", startLocation:"Прага",   endLocation:"Вена",      startDate:"2026-05-01", endDate:"2026-05-10", durationDays:10, transportType:"BIKE",    totalPrice:90,   participantsCount:4 },
//   { id:5, title:"Камино де Сантьяго", startLocation:"Сен-Жан", endLocation:"Сантьяго",  startDate:"2026-06-15", endDate:"2026-07-15", durationDays:31, transportType:"WALK",    totalPrice:0,    participantsCount:1 },
//   { id:6, title:"Стамбул за 3 дня",   startLocation:"Москва",  endLocation:"Стамбул",   startDate:"2026-04-22", endDate:"2026-04-24", durationDays:3,  transportType:"PLANE",   totalPrice:450,  participantsCount:2 },
//   { id:7, title:"Транссибирская",     startLocation:"Москва",  endLocation:"Владивосток",startDate:"2026-07-01",endDate:"2026-07-15", durationDays:15, transportType:"TRANSIT", totalPrice:280,  participantsCount:5 },
// ];

// export default function TravelerCalendarPage() {
//   const navigate  = useNavigate();
//   const location  = useLocation();
//   const calRef    = useRef(null);

//   const [routes, setRoutes]       = useState([]);
//   const [loading, setLoading]     = useState(true);
//   const [sidebar, setSidebar]     = useState(false);
//   const [view, setView]           = useState("dayGridMonth");
//   const [popup, setPopup]         = useState(null);   // { route, x, y }
//   const [currentTitle, setTitle]  = useState("");

//   // ─── Load routes ────────────────────────────────────────────────
//   useEffect(() => {
//     (async () => {
//       setLoading(true);
//       try {
//         const data = await getMyRoutes();
//         setRoutes(Array.isArray(data) ? data : []);
//       } catch {
//         setRoutes(MOCK_ROUTES);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   // ─── Convert routes → FullCalendar events ───────────────────────
//   const events = routes.map(r => {
//     const color = getColor(r.transportType);
//     // FullCalendar end для allDay должен быть +1 день (exclusive)
//     const endExclusive = new Date(r.endDate);
//     endExclusive.setDate(endExclusive.getDate() + 1);

//     return {
//       id:              String(r.id),
//       title:           `${getColor(r.transportType).icon} ${r.title}`,
//       start:           r.startDate,
//       end:             endExclusive.toISOString().slice(0, 10),
//       allDay:          true,
//       backgroundColor: color.bg,
//       borderColor:     color.border,
//       textColor:       color.text,
//       extendedProps:   { route: r },
//     };
//   });

//   // ─── Upcoming routes sidebar list ────────────────────────────────
//   const upcoming = [...routes]
//     .filter(r => new Date(r.endDate) >= new Date())
//     .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
//     .slice(0, 8);

//   // ─── Calendar navigation helpers ────────────────────────────────
//   const calApi = () => calRef.current?.getApi();
//   const prev   = () => { calApi()?.prev();  syncTitle(); };
//   const next   = () => { calApi()?.next();  syncTitle(); };
//   const today  = () => { calApi()?.today(); syncTitle(); };
//   const syncTitle = () =>
//     setTimeout(() => setTitle(calApi()?.view.title || ""), 0);

//   const switchView = (v) => {
//     setView(v);
//     calApi()?.changeView(v);
//     syncTitle();
//   };

//   // ─── Event click ─────────────────────────────────────────────────
//   const handleEventClick = (info) => {
//     info.jsEvent.preventDefault();
//     const rect = info.el.getBoundingClientRect();
//     setPopup({
//       route: info.event.extendedProps.route,
//       x: Math.min(rect.left, window.innerWidth - 340),
//       y: rect.bottom + window.scrollY + 8,
//     });
//   };

//   // ─── Close popup on outside click ───────────────────────────────
//   useEffect(() => {
//     const handler = (e) => {
//       if (!e.target.closest(".tcp-popup")) setPopup(null);
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, []);

//   // ─── Sync title on mount ─────────────────────────────────────────
//   useEffect(() => { syncTitle(); }, [loading]);

//   return (
//     <div className="tcp-root">

//       {/* ══ SIDEBAR ══════════════════════════════════════════════ */}
//       <aside className={`tcp-sidebar ${sidebar ? "tcp-sidebar--open" : ""}`}>
//         <div className="tcp-sidebar__brand">
//           <span>✈️</span>
//           <span className="tcp-sidebar__brand-text">Travel</span>
//           <button className="tcp-sidebar__close" onClick={() => setSidebar(false)}>
//             <FiX />
//           </button>
//         </div>

//         <nav className="tcp-sidebar__nav">
//           {NAV.map(item => {
//             const isActive = location.pathname === item.path;
//             return (
//               <button
//                 key={item.path}
//                 className={`tcp-nav-item ${isActive ? "tcp-nav-item--active" : ""}`}
//                 onClick={() => { navigate(item.path); setSidebar(false); }}
//               >
//                 <span className="tcp-nav-item__icon">{item.icon}</span>
//                 <span>{item.label}</span>
//                 {isActive && <span className="tcp-nav-item__bar" />}
//               </button>
//             );
//           })}
//         </nav>

//         <button className="tcp-sidebar__logout"
//           onClick={() => { localStorage.clear(); navigate("/login"); }}>
//           <FiLogOut /> Выйти
//         </button>
//       </aside>

//       {sidebar && <div className="tcp-overlay" onClick={() => setSidebar(false)} />}

//       {/* ══ MAIN ═════════════════════════════════════════════════ */}
//       <main className="tcp-main">

//         {/* ── Topbar ─────────────────────────────────────────── */}
//         <header className="tcp-topbar">
//           <button className="tcp-burger" onClick={() => setSidebar(true)}>
//             <FiMenu />
//           </button>

//           {/* Calendar nav controls */}
//           <div className="tcp-cal-nav">
//             <button className="tcp-nav-btn" onClick={prev}><FiChevronLeft /></button>
//             <button className="tcp-today-btn" onClick={today}>Сегодня</button>
//             <button className="tcp-nav-btn" onClick={next}><FiChevronRight /></button>
//             <h1 className="tcp-cal-title">{currentTitle}</h1>
//           </div>

//           {/* View switcher */}
//           <div className="tcp-view-switcher">
//             {[
//               { v: "dayGridMonth", icon: <FiGrid />,     label: "Месяц" },
//               { v: "timeGridWeek", icon: <FiCalendar />, label: "Неделя" },
//               { v: "listMonth",    icon: <FiList />,     label: "Список" },
//             ].map(({ v, icon, label }) => (
//               <button
//                 key={v}
//                 className={`tcp-view-btn ${view === v ? "active" : ""}`}
//                 onClick={() => switchView(v)}
//               >
//                 {icon} <span>{label}</span>
//               </button>
//             ))}
//           </div>

//           <button
//             className="tcp-add-btn"
//             onClick={() => navigate("/traveler/create-route")}
//           >
//             <FiPlus /> Маршрут
//           </button>
//         </header>

//         {/* ── Body ───────────────────────────────────────────── */}
//         <div className="tcp-body">

//           {/* ── Legend ────────────────────────────────────────── */}
//           <div className="tcp-legend">
//             {Object.entries(TRANSPORT_COLORS).filter(([k]) => k !== "DEFAULT").map(([k, v]) => (
//               <span key={k} className="tcp-legend-item">
//                 <span className="tcp-legend-dot" style={{ background: v.border }} />
//                 {v.icon} {k === "WALK" ? "Пешком" : k === "BIKE" ? "Вело" :
//                            k === "CAR"  ? "Авто"   : k === "TRANSIT" ? "Транспорт" : "Самолёт"}
//               </span>
//             ))}
//           </div>

//           <div className="tcp-cal-wrap">

//             {/* ── Upcoming sidebar ──────────────────────────── */}
//             <aside className="tcp-upcoming">
//               <h3 className="tcp-upcoming__title">
//                 <FiCalendar /> Ближайшие
//               </h3>
//               {loading ? (
//                 <div className="tcp-upcoming__loading">
//                   <div className="tcp-spinner" />
//                 </div>
//               ) : upcoming.length === 0 ? (
//                 <div className="tcp-upcoming__empty">Нет предстоящих маршрутов</div>
//               ) : (
//                 <div className="tcp-upcoming__list">
//                   {upcoming.map(r => {
//                     const c  = getColor(r.transportType);
//                     const st = statusOf(r.startDate, r.endDate);
//                     const daysLeft = Math.ceil(
//                       (new Date(r.startDate) - new Date()) / 86400000
//                     );
//                     return (
//                       <div
//                         key={r.id}
//                         className="tcp-upcoming-card"
//                         style={{ borderLeftColor: c.border }}
//                         onClick={() => navigate(`/traveler/routes/${r.id}`)}
//                       >
//                         <div className="tcp-upcoming-card__header">
//                           <span className="tcp-upcoming-card__icon">{c.icon}</span>
//                           <span className="tcp-upcoming-card__title">{r.title}</span>
//                         </div>
//                         <div className="tcp-upcoming-card__route">
//                           {r.startLocation} → {r.endLocation}
//                         </div>
//                         <div className="tcp-upcoming-card__dates">
//                           {fmtDate(r.startDate).replace(" г.", "")}
//                         </div>
//                         <div className="tcp-upcoming-card__footer">
//                           <span className={`tcp-status tcp-status--${st.cls}`}>
//                             {st.label}
//                           </span>
//                           {st.cls === "upcoming" && daysLeft > 0 && (
//                             <span className="tcp-upcoming-card__days">
//                               через {daysLeft} дн.
//                             </span>
//                           )}
//                           {st.cls === "ongoing" && (
//                             <span className="tcp-upcoming-card__days ongoing">
//                               сейчас
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}

//               {/* Stats */}
//               {!loading && (
//                 <div className="tcp-stats">
//                   <div className="tcp-stat">
//                     <strong>{routes.length}</strong>
//                     <span>Всего</span>
//                   </div>
//                   <div className="tcp-stat">
//                     <strong style={{ color: "#0ea5e9" }}>
//                       {routes.filter(r => statusOf(r.startDate, r.endDate).cls === "upcoming").length}
//                     </strong>
//                     <span>Предстоит</span>
//                   </div>
//                   <div className="tcp-stat">
//                     <strong style={{ color: "#16a34a" }}>
//                       {routes.filter(r => statusOf(r.startDate, r.endDate).cls === "ongoing").length}
//                     </strong>
//                     <span>В пути</span>
//                   </div>
//                 </div>
//               )}
//             </aside>

//             {/* ── FullCalendar ──────────────────────────────── */}
//             <div className="tcp-calendar">
//               {loading ? (
//                 <div className="tcp-loading">
//                   <div className="tcp-spinner tcp-spinner--lg" />
//                   <p>Загружаем маршруты...</p>
//                 </div>
//               ) : (
//                 <FullCalendar
//                   ref={calRef}
//                   plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
//                   initialView="dayGridMonth"
//                   locale={ruLocale}
//                   headerToolbar={false}
//                   events={events}
//                   eventClick={handleEventClick}
//                   datesSet={() => syncTitle()}
//                   height="100%"
//                   eventDisplay="block"
//                   dayMaxEvents={3}
//                   moreLinkText={n => `+${n} ещё`}
//                   nowIndicator={true}
//                   weekNumbers={false}
//                   firstDay={1}
//                   eventContent={(arg) => (
//                     <div className="tcp-fc-event">
//                       <span className="tcp-fc-event__dot"
//                         style={{ background: arg.event.borderColor }} />
//                       <span className="tcp-fc-event__title">{arg.event.title}</span>
//                     </div>
//                   )}
//                 />
//               )}
//             </div>
//           </div>
//         </div>
//       </main>

//       {/* ══ POPUP (клик по событию) ═══════════════════════════════ */}
//       {popup && (
//         <div
//           className="tcp-popup"
//           style={{
//             top:  popup.y,
//             left: Math.max(8, popup.x),
//           }}
//         >
//           {(() => {
//             const r  = popup.route;
//             const c  = getColor(r.transportType);
//             const st = statusOf(r.startDate, r.endDate);
//             return (
//               <>
//                 <div className="tcp-popup__header" style={{ borderTopColor: c.border }}>
//                   <span className="tcp-popup__icon">{c.icon}</span>
//                   <div className="tcp-popup__title-wrap">
//                     <h3 className="tcp-popup__title">{r.title}</h3>
//                     <span className={`tcp-status tcp-status--${st.cls}`}>{st.label}</span>
//                   </div>
//                   <button className="tcp-popup__close" onClick={() => setPopup(null)}>
//                     <FiX />
//                   </button>
//                 </div>

//                 <div className="tcp-popup__body">
//                   <div className="tcp-popup__row">
//                     <FiMapPin />
//                     <span>{r.startLocation} → {r.endLocation}</span>
//                   </div>
//                   <div className="tcp-popup__row">
//                     <FiCalendar />
//                     <span>{fmtDate(r.startDate)} — {fmtDate(r.endDate)}</span>
//                   </div>
//                   <div className="tcp-popup__row">
//                     <FiClock />
//                     <span>{r.durationDays} {r.durationDays === 1 ? "день" :
//                       r.durationDays < 5 ? "дня" : "дней"}</span>
//                   </div>
//                   {r.transportType && (
//                     <div className="tcp-popup__row">
//                       <FiTruck />
//                       <span>{{ WALK:"Пешком", BIKE:"Велосипед", CAR:"Авто",
//                                  TRANSIT:"Транспорт", PLANE:"Самолёт" }[r.transportType] ?? r.transportType}</span>
//                     </div>
//                   )}
//                   {r.totalPrice != null && (
//                     <div className="tcp-popup__row">
//                       <FiDollarSign />
//                       <span>{r.totalPrice > 0
//                         ? `${Number(r.totalPrice).toLocaleString("ru-RU")} €`
//                         : "Бесплатно"}
//                       </span>
//                     </div>
//                   )}
//                   {r.participantsCount > 1 && (
//                     <div className="tcp-popup__row">
//                       <FiUsers />
//                       <span>{r.participantsCount} участника(-ов)</span>
//                     </div>
//                   )}
//                 </div>

//                 <div className="tcp-popup__footer">
//                   <button
//                     className="tcp-popup__open-btn"
//                     onClick={() => { setPopup(null); navigate(`/traveler/routes/${r.id}`); }}
//                   >
//                     <FiExternalLink /> Открыть маршрут
//                   </button>
//                 </div>
//               </>
//             );
//           })()}
//         </div>
//       )}
//     </div>
//   );
// }






// import { useState, useEffect, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import FullCalendar from "@fullcalendar/react";
// import dayGridPlugin from "@fullcalendar/daygrid";
// import timeGridPlugin from "@fullcalendar/timegrid";
// import listPlugin from "@fullcalendar/list";
// import interactionPlugin from "@fullcalendar/interaction";
// import ruLocale from "@fullcalendar/core/locales/ru";
// import {
//   FiMap, FiPlus, FiSearch, FiStar, FiUsers, FiCalendar,
//   FiBell, FiUser, FiMenu, FiX, FiLogOut, FiHome, FiHeart,
//   FiChevronLeft, FiChevronRight, FiList, FiGrid, FiMapPin,
//   FiClock, FiTruck, FiDollarSign, FiExternalLink,
// } from "react-icons/fi";
// import { getMyRoutes } from "../../api/travelerApi";
// import "../../styles/traveler/TravelerCalendarPage.css";

// // ─── Sidebar nav ──────────────────────────────────────────────────
// const NAV = [
//   { path: "/traveler",               icon: <FiHome />,     label: "Главная" },
//   { path: "/traveler/my-routes",     icon: <FiMap />,      label: "Мои маршруты" },
//   { path: "/traveler/create-route",  icon: <FiPlus />,     label: "Создать маршрут" },
//   { path: "/traveler/search",        icon: <FiSearch />,   label: "Найти маршруты" },
//   { path: "/traveler/recommended",   icon: <FiStar />,     label: "Рекомендации" },
//   { path: "/traveler/calendar",      icon: <FiCalendar />, label: "Календарь" },
//   { path: "/traveler/favorites",     icon: <FiHeart />,    label: "Избранное" },
//   { path: "/traveler/notifications", icon: <FiBell />,     label: "Уведомления" },
//   { path: "/traveler/profile",       icon: <FiUser />,     label: "Профиль" },
// ];

// // ─── Транспорт с картинками ──────────────────────────────────────
// const TRANSPORT_OPTIONS = [
//   { value: "WALK",    label: "Пешком",    icon: "https://img.icons8.com/ios/50/000000/walking.png" },
//   { value: "BIKE",    label: "Велосипед", icon: "https://img.icons8.com/ios/50/000000/bicycle.png" },
//   { value: "CAR",     label: "Авто",      icon: "https://img.icons8.com/ios/50/000000/car.png" },
//   { value: "TRANSIT", label: "Транспорт", icon: "https://img.icons8.com/ios/50/000000/bus.png" },
//   { value: "PLANE",   label: "Самолёт",   icon: "https://img.icons8.com/ios/50/000000/airplane-take-off.png" },
// ];

// const getTransportOption = (type) =>
//   TRANSPORT_OPTIONS.find(t => t.value === type);

// // ─── Цвета оставляем ─────────────────────────────────────────────
// const TRANSPORT_COLORS = {
//   WALK:    { bg: "#dcfce7", border: "#16a34a", text: "#14532d" },
//   BIKE:    { bg: "#fef9c3", border: "#ca8a04", text: "#713f12" },
//   CAR:     { bg: "#eff6ff", border: "#2563eb", text: "#1e3a8a" },
//   TRANSIT: { bg: "#fdf4ff", border: "#9333ea", text: "#581c87" },
//   PLANE:   { bg: "#fff7ed", border: "#ea580c", text: "#7c2d12" },
//   DEFAULT: { bg: "#f1f5f9", border: "#64748b", text: "#1e293b" },
// };

// function getColor(type) {
//   return TRANSPORT_COLORS[type] || TRANSPORT_COLORS.DEFAULT;
// }


// function statusOf(startDate, endDate) {
//   const now = new Date();
//   const s   = new Date(startDate);
//   const e   = new Date(endDate);
//   if (now < s) return { label: "Предстоит", cls: "upcoming" };
//   if (now > e) return { label: "Завершён",  cls: "past" };
//   return       { label: "В пути",    cls: "ongoing" };
// }

// function fmtDate(d) {
//   if (!d) return "—";
//   return new Date(d).toLocaleDateString("ru-RU", {
//     day: "numeric", month: "long", year: "numeric",
//   });
// }

// const MOCK_ROUTES = [
//   { id:1, title:"Тур по Европе",      startLocation:"Москва",  endLocation:"Париж",     startDate:"2026-04-10", endDate:"2026-04-20", durationDays:11, transportType:"PLANE",   totalPrice:1200, participantsCount:3 },
//   { id:2, title:"Золотое кольцо",     startLocation:"Москва",  endLocation:"Суздаль",   startDate:"2026-03-25", endDate:"2026-03-28", durationDays:4,  transportType:"CAR",     totalPrice:180,  participantsCount:2 },
//   { id:3, title:"Байкал зимой",       startLocation:"Иркутск", endLocation:"Листвянка", startDate:"2025-12-01", endDate:"2025-12-07", durationDays:7,  transportType:"CAR",     totalPrice:320,  participantsCount:1 },
//   { id:4, title:"Велотур Прага–Вена", startLocation:"Прага",   endLocation:"Вена",      startDate:"2026-05-01", endDate:"2026-05-10", durationDays:10, transportType:"BIKE",    totalPrice:90,   participantsCount:4 },
//   { id:5, title:"Камино де Сантьяго", startLocation:"Сен-Жан", endLocation:"Сантьяго",  startDate:"2026-06-15", endDate:"2026-07-15", durationDays:31, transportType:"WALK",    totalPrice:0,    participantsCount:1 },
//   { id:6, title:"Стамбул за 3 дня",   startLocation:"Москва",  endLocation:"Стамбул",   startDate:"2026-04-22", endDate:"2026-04-24", durationDays:3,  transportType:"PLANE",   totalPrice:450,  participantsCount:2 },
//   { id:7, title:"Транссибирская",     startLocation:"Москва",  endLocation:"Владивосток",startDate:"2026-07-01",endDate:"2026-07-15", durationDays:15, transportType:"TRANSIT", totalPrice:280,  participantsCount:5 },
// ];

// export default function TravelerCalendarPage() {
//   const navigate  = useNavigate();
//   const location  = useLocation();
//   const calRef    = useRef(null);

//   const [routes, setRoutes]       = useState([]);
//   const [loading, setLoading]     = useState(true);
//   const [sidebar, setSidebar]     = useState(false);
//   const [view, setView]           = useState("dayGridMonth");
//   const [popup, setPopup]         = useState(null);   // { route, x, y }
//   const [currentTitle, setTitle]  = useState("");

//   // ─── Load routes ────────────────────────────────────────────────
//   useEffect(() => {
//     (async () => {
//       setLoading(true);
//       try {
//         const data = await getMyRoutes();
//         setRoutes(Array.isArray(data) ? data : []);
//       } catch {
//         setRoutes(MOCK_ROUTES);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   // ─── Convert routes → FullCalendar events ───────────────────────
//   const events = routes.map(r => {
//     const color = getColor(r.transportType);
//     // FullCalendar end для allDay должен быть +1 день (exclusive)
//     const endExclusive = new Date(r.endDate);
//     endExclusive.setDate(endExclusive.getDate() + 1);
//     const t = getTransportOption(r.transportType);
//     return {
//       id:              String(r.id),
//       title: r.title,
//       start:           r.startDate,
//       end:             endExclusive.toISOString().slice(0, 10),
//       allDay:          true,
//       backgroundColor: color.bg,
//       borderColor:     color.border,
//       textColor:       color.text,
//       extendedProps: {
//       route: r,
//       icon: t?.icon
//     },
//     };
//   });

//   // ─── Upcoming routes sidebar list ────────────────────────────────
//   const upcoming = [...routes]
//     .filter(r => new Date(r.endDate) >= new Date())
//     .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
//     .slice(0, 8);

//   // ─── Calendar navigation helpers ────────────────────────────────
//   const calApi = () => calRef.current?.getApi();
//   const prev   = () => { calApi()?.prev();  syncTitle(); };
//   const next   = () => { calApi()?.next();  syncTitle(); };
//   const today  = () => { calApi()?.today(); syncTitle(); };
//   const syncTitle = () =>
//     setTimeout(() => setTitle(calApi()?.view.title || ""), 0);

//   const switchView = (v) => {
//     setView(v);
//     calApi()?.changeView(v);
//     syncTitle();
//   };

//   // ─── Event click ─────────────────────────────────────────────────
//   const handleEventClick = (info) => {
//     info.jsEvent.preventDefault();
//     const rect = info.el.getBoundingClientRect();
//     setPopup({
//       route: info.event.extendedProps.route,
//       x: Math.min(rect.left, window.innerWidth - 340),
//       y: rect.bottom + window.scrollY + 8,
//     });
//   };

//   // ─── Close popup on outside click ───────────────────────────────
//   useEffect(() => {
//     const handler = (e) => {
//       if (!e.target.closest(".tcp-popup")) setPopup(null);
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, []);

//   // ─── Sync title on mount ─────────────────────────────────────────
//   useEffect(() => { syncTitle(); }, [loading]);

//   return (
//     <div className="tcp-root">

//       {/* ══ SIDEBAR ══════════════════════════════════════════════ */}
//       <aside className={`tcp-sidebar ${sidebar ? "tcp-sidebar--open" : ""}`}>
//         <div className="tcp-sidebar__brand">
//           <span>✈️</span>
//           <span className="tcp-sidebar__brand-text">Travel</span>
//           <button className="tcp-sidebar__close" onClick={() => setSidebar(false)}>
//             <FiX />
//           </button>
//         </div>

//         <nav className="tcp-sidebar__nav">
//           {NAV.map(item => {
//             const isActive = location.pathname === item.path;
//             return (
//               <button
//                 key={item.path}
//                 className={`tcp-nav-item ${isActive ? "tcp-nav-item--active" : ""}`}
//                 onClick={() => { navigate(item.path); setSidebar(false); }}
//               >
//                 <span className="tcp-nav-item__icon">{item.icon}</span>
//                 <span>{item.label}</span>
//                 {isActive && <span className="tcp-nav-item__bar" />}
//               </button>
//             );
//           })}
//         </nav>

//         <button className="tcp-sidebar__logout"
//           onClick={() => { localStorage.clear(); navigate("/login"); }}>
//           <FiLogOut /> Выйти
//         </button>
//       </aside>

//       {sidebar && <div className="tcp-overlay" onClick={() => setSidebar(false)} />}

//       {/* ══ MAIN ═════════════════════════════════════════════════ */}
//       <main className="tcp-main">

//         {/* ── Topbar ─────────────────────────────────────────── */}
//         <header className="tcp-topbar">
//           <button className="tcp-burger" onClick={() => setSidebar(true)}>
//             <FiMenu />
//           </button>

//           {/* Calendar nav controls */}
//           <div className="tcp-cal-nav">
//             <button className="tcp-nav-btn" onClick={prev}><FiChevronLeft /></button>
//             <button className="tcp-today-btn" onClick={today}>Сегодня</button>
//             <button className="tcp-nav-btn" onClick={next}><FiChevronRight /></button>
//             <h1 className="tcp-cal-title">{currentTitle}</h1>
//           </div>

//           {/* View switcher */}
//           <div className="tcp-view-switcher">
//             {[
//               { v: "dayGridMonth", icon: <FiGrid />,     label: "Месяц" },
//               { v: "timeGridWeek", icon: <FiCalendar />, label: "Неделя" },
//               { v: "listMonth",    icon: <FiList />,     label: "Список" },
//             ].map(({ v, icon, label }) => (
//               <button
//                 key={v}
//                 className={`tcp-view-btn ${view === v ? "active" : ""}`}
//                 onClick={() => switchView(v)}
//               >
//                 {icon} <span>{label}</span>
//               </button>
//             ))}
//           </div>

//           <button
//             className="tcp-add-btn"
//             onClick={() => navigate("/traveler/create-route")}
//           >
//             <FiPlus /> Маршрут
//           </button>
//         </header>

//         {/* ── Body ───────────────────────────────────────────── */}
//         <div className="tcp-body">

//           {/* ── Legend ────────────────────────────────────────── */}
//        <div className="tcp-legend">
//   {TRANSPORT_OPTIONS.map(t => {
//     const c = getColor(t.value);
//     return (
//       <span key={t.value} className="tcp-legend-item">
//         <img src={t.icon} className="tcp-legend-icon" />
//         {t.label}
//       </span>
//     );
//   })}
// </div>


//           <div className="tcp-cal-wrap">

//             {/* ── Upcoming sidebar ──────────────────────────── */}
//             <aside className="tcp-upcoming">
//               <h3 className="tcp-upcoming__title">
//                 <FiCalendar /> Ближайшие
//               </h3>
//               {loading ? (
//                 <div className="tcp-upcoming__loading">
//                   <div className="tcp-spinner" />
//                 </div>
//               ) : upcoming.length === 0 ? (
//                 <div className="tcp-upcoming__empty">Нет предстоящих маршрутов</div>
//               ) : (
//                 <div className="tcp-upcoming__list">
//                   {upcoming.map(r => {
//                     const c  = getColor(r.transportType);
//                     const st = statusOf(r.startDate, r.endDate);
//                     const daysLeft = Math.ceil(
//                       (new Date(r.startDate) - new Date()) / 86400000
//                     );
//                     const t = getTransportOption(r.transportType);
//                     return (
//                       <div
//                         key={r.id}
//                         className="tcp-upcoming-card"
//                         style={{ borderLeftColor: c.border }}
//                         onClick={() => navigate(`/traveler/routes/${r.id}`)}
//                       >
//                         <div className="tcp-upcoming-card__header">
                          

// <span className="tcp-upcoming-card__icon">
//   <img src={t?.icon} />
// </span>

//                           <span className="tcp-upcoming-card__title">{r.title}</span>
//                         </div>
//                         <div className="tcp-upcoming-card__route">
//                           {r.startLocation} → {r.endLocation}
//                         </div>
//                         <div className="tcp-upcoming-card__dates">
//                           {fmtDate(r.startDate).replace(" г.", "")}
//                         </div>
//                         <div className="tcp-upcoming-card__footer">
//                           <span className={`tcp-status tcp-status--${st.cls}`}>
//                             {st.label}
//                           </span>
//                           {st.cls === "upcoming" && daysLeft > 0 && (
//                             <span className="tcp-upcoming-card__days">
//                               через {daysLeft} дн.
//                             </span>
//                           )}
//                           {st.cls === "ongoing" && (
//                             <span className="tcp-upcoming-card__days ongoing">
//                               сейчас
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}

//               {/* Stats */}
//               {!loading && (
//                 <div className="tcp-stats">
//                   <div className="tcp-stat">
//                     <strong>{routes.length}</strong>
//                     <span>Всего</span>
//                   </div>
//                   <div className="tcp-stat">
//                     <strong style={{ color: "#0ea5e9" }}>
//                       {routes.filter(r => statusOf(r.startDate, r.endDate).cls === "upcoming").length}
//                     </strong>
//                     <span>Предстоит</span>
//                   </div>
//                   <div className="tcp-stat">
//                     <strong style={{ color: "#16a34a" }}>
//                       {routes.filter(r => statusOf(r.startDate, r.endDate).cls === "ongoing").length}
//                     </strong>
//                     <span>В пути</span>
//                   </div>
//                 </div>
//               )}
//             </aside>

//             {/* ── FullCalendar ──────────────────────────────── */}
//             <div className="tcp-calendar">
//               {loading ? (
//                 <div className="tcp-loading">
//                   <div className="tcp-spinner tcp-spinner--lg" />
//                   <p>Загружаем маршруты...</p>
//                 </div>
//               ) : (
//                 <FullCalendar
//                   ref={calRef}
//                   plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
//                   initialView="dayGridMonth"
//                   locale={ruLocale}
//                   headerToolbar={false}
//                   events={events}
//                   eventClick={handleEventClick}
//                   datesSet={() => syncTitle()}
//                   height="100%"
//                   eventDisplay="block"
//                   dayMaxEvents={3}
//                   moreLinkText={n => `+${n} ещё`}
//                   nowIndicator={true}
//                   weekNumbers={false}
//                   firstDay={1}
//                  eventContent={(arg) => {
//   const icon = arg.event.extendedProps.icon;

//   return (
//     <div className="tcp-fc-event">
//       <img src={icon} alt="" className="tcp-fc-event__icon" />
//       <span className="tcp-fc-event__title">{arg.event.title}</span>
//     </div>
//   );
// }}

//                 />
//               )}
//             </div>
//           </div>
//         </div>
//       </main>

//       {/* ══ POPUP (клик по событию) ═══════════════════════════════ */}
//       {popup && (
//         <div
//           className="tcp-popup"
//           style={{
//             top:  popup.y,
//             left: Math.max(8, popup.x),
//           }}
//         >
//           {(() => {
//             const r  = popup.route;
//             const c  = getColor(r.transportType);
//             const st = statusOf(r.startDate, r.endDate);
//             const t = getTransportOption(r.transportType);
//             return (
//               <>
//                 <div className="tcp-popup__header" style={{ borderTopColor: c.border }}>
                  

// <span className="tcp-popup__icon">
//   <img src={t?.icon} />
// </span>

//                   <div className="tcp-popup__title-wrap">
//                     <h3 className="tcp-popup__title">{r.title}</h3>
//                     <span className={`tcp-status tcp-status--${st.cls}`}>{st.label}</span>
//                   </div>
//                   <button className="tcp-popup__close" onClick={() => setPopup(null)}>
//                     <FiX />
//                   </button>
//                 </div>

//                 <div className="tcp-popup__body">
//                   <div className="tcp-popup__row">
//                     <FiMapPin />
//                     <span>{r.startLocation} → {r.endLocation}</span>
//                   </div>
//                   <div className="tcp-popup__row">
//                     <FiCalendar />
//                     <span>{fmtDate(r.startDate)} — {fmtDate(r.endDate)}</span>
//                   </div>
//                   <div className="tcp-popup__row">
//                     <FiClock />
//                     <span>{r.durationDays} {r.durationDays === 1 ? "день" :
//                       r.durationDays < 5 ? "дня" : "дней"}</span>
//                   </div>
//                   {r.transportType && (
//                     <div className="tcp-popup__row">
//                       <FiTruck />
//                       <span>{{ WALK:"Пешком", BIKE:"Велосипед", CAR:"Авто",
//                                  TRANSIT:"Транспорт", PLANE:"Самолёт" }[r.transportType] ?? r.transportType}</span>
//                     </div>
//                   )}
//                   {r.totalPrice != null && (
//                     <div className="tcp-popup__row">
//                       <FiDollarSign />
//                       <span>{r.totalPrice > 0
//                         ? `${Number(r.totalPrice).toLocaleString("ru-RU")} €`
//                         : "Бесплатно"}
//                       </span>
//                     </div>
//                   )}
//                   {r.participantsCount > 1 && (
//                     <div className="tcp-popup__row">
//                       <FiUsers />
//                       <span>{r.participantsCount} участника(-ов)</span>
//                     </div>
//                   )}
//                 </div>

//                 <div className="tcp-popup__footer">
//                   <button
//                     className="tcp-popup__open-btn"
//                     onClick={() => { setPopup(null); navigate(`/traveler/routes/${r.id}`); }}
//                   >
//                     <FiExternalLink /> Открыть маршрут
//                   </button>
//                 </div>
//               </>
//             );
//           })()}
//         </div>
//       )}
//     </div>
//   );
// }



import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import ruLocale from "@fullcalendar/core/locales/ru";
import {
  FiMap, FiPlus, FiSearch, FiStar, FiUsers, FiCalendar,
  FiBell, FiUser, FiMenu, FiX, FiLogOut, FiHome, FiHeart,
  FiChevronLeft, FiChevronRight, FiList, FiGrid, FiMapPin,
  FiClock, FiTruck, FiDollarSign, FiExternalLink,
} from "react-icons/fi";
import { getMyRoutes } from "../../api/travelerApi";
import "../../styles/traveler/TravelerCalendarPage.css";

// ─── Sidebar nav ──────────────────────────────────────────────────
const NAV = [
  { path: "/traveler",               icon: <FiHome />,     label: "Главная" },
  { path: "/traveler/my-routes",     icon: <FiMap />,      label: "Мои маршруты" },
  { path: "/traveler/create-route",  icon: <FiPlus />,     label: "Создать маршрут" },
  { path: "/traveler/search",        icon: <FiSearch />,   label: "Найти маршруты" },
  { path: "/traveler/recommended",   icon: <FiStar />,     label: "Рекомендации" },
  { path: "/traveler/calendar",      icon: <FiCalendar />, label: "Календарь" },
  { path: "/traveler/favorites",     icon: <FiHeart />,    label: "Избранное" },
  { path: "/traveler/notifications", icon: <FiBell />,     label: "Уведомления" },
  { path: "/traveler/profile",       icon: <FiUser />,     label: "Профиль" },
];

// ─── Транспорт с картинками ──────────────────────────────────────
const TRANSPORT_OPTIONS = [
  { value: "WALK",    label: "Пешком",    icon: "https://img.icons8.com/ios/50/000000/walking.png" },
  { value: "BIKE",    label: "Велосипед", icon: "https://img.icons8.com/ios/50/000000/bicycle.png" },
  { value: "CAR",     label: "Авто",      icon: "https://img.icons8.com/ios/50/000000/car.png" },
  { value: "TRANSIT", label: "Транспорт", icon: "https://img.icons8.com/ios/50/000000/bus.png" },
  { value: "PLANE",   label: "Самолёт",   icon: "https://img.icons8.com/ios/50/000000/airplane-take-off.png" },
];

const getTransportOption = (type) =>
  TRANSPORT_OPTIONS.find(t => t.value === type);

// ─── Цвета ─────────────────────────────────────────────
const TRANSPORT_COLORS = {
  WALK:    { bg: "#dcfce7", border: "#16a34a", text: "#14532d" },
  BIKE:    { bg: "#fef9c3", border: "#ca8a04", text: "#713f12" },
  CAR:     { bg: "#eff6ff", border: "#2563eb", text: "#1e3a8a" },
  TRANSIT: { bg: "#fdf4ff", border: "#9333ea", text: "#581c87" },
  PLANE:   { bg: "#fff7ed", border: "#ea580c", text: "#7c2d12" },
  DEFAULT: { bg: "#f1f5f9", border: "#64748b", text: "#1e293b" },
};

function getColor(type) {
  return TRANSPORT_COLORS[type] || TRANSPORT_COLORS.DEFAULT;
}

function statusOf(startDate, endDate) {
  const now = new Date();
  const s   = new Date(startDate);
  const e   = new Date(endDate);
  if (now < s) return { label: "Предстоит", cls: "upcoming" };
  if (now > e) return { label: "Завершён",  cls: "past" };
  return       { label: "В пути",    cls: "ongoing" };
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric",
  });
}

const MOCK_ROUTES = [
  { id:1, title:"Тур по Европе",      startLocation:"Москва",  endLocation:"Париж",     startDate:"2026-04-10", endDate:"2026-04-20", durationDays:11, transportType:"PLANE",   totalPrice:1200, participantsCount:3 },
  { id:2, title:"Золотое кольцо",     startLocation:"Москва",  endLocation:"Суздаль",   startDate:"2026-03-25", endDate:"2026-03-28", durationDays:4,  transportType:"CAR",     totalPrice:180,  participantsCount:2 },
  { id:3, title:"Байкал зимой",       startLocation:"Иркутск", endLocation:"Листвянка", startDate:"2025-12-01", endDate:"2025-12-07", durationDays:7,  transportType:"CAR",     totalPrice:320,  participantsCount:1 },
  { id:4, title:"Велотур Прага–Вена", startLocation:"Прага",   endLocation:"Вена",      startDate:"2026-05-01", endDate:"2026-05-10", durationDays:10, transportType:"BIKE",    totalPrice:90,   participantsCount:4 },
  { id:5, title:"Камино де Сантьяго", startLocation:"Сен-Жан", endLocation:"Сантьяго",  startDate:"2026-06-15", endDate:"2026-07-15", durationDays:31, transportType:"WALK",    totalPrice:0,    participantsCount:1 },
  { id:6, title:"Стамбул за 3 дня",   startLocation:"Москва",  endLocation:"Стамбул",   startDate:"2026-04-22", endDate:"2026-04-24", durationDays:3,  transportType:"PLANE",   totalPrice:450,  participantsCount:2 },
  { id:7, title:"Транссибирская",     startLocation:"Москва",  endLocation:"Владивосток",startDate:"2026-07-01",endDate:"2026-07-15", durationDays:15, transportType:"TRANSIT", totalPrice:280,  participantsCount:5 },
];

// Компонент для иконки транспорта
const TransportIcon = ({ type, className = "" }) => {
  const option = getTransportOption(type);
  if (!option) return null;
  return <img src={option.icon} alt={option.label} className={className} />;
};

export default function TravelerCalendarPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const calRef    = useRef(null);

  const [routes, setRoutes]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [sidebar, setSidebar]     = useState(false);
  const [view, setView]           = useState("dayGridMonth");
  const [popup, setPopup]         = useState(null);
  const [currentTitle, setTitle]  = useState("");

  // ─── Load routes ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getMyRoutes();
        setRoutes(Array.isArray(data) ? data : []);
      } catch {
        setRoutes(MOCK_ROUTES);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── Convert routes → FullCalendar events ───────────────────────
  const events = routes.map(r => {
    const color = getColor(r.transportType);
    const endExclusive = new Date(r.endDate);
    endExclusive.setDate(endExclusive.getDate() + 1);
    const t = getTransportOption(r.transportType);
    return {
      id:              String(r.id),
      title: r.title,
      start:           r.startDate,
      end:             endExclusive.toISOString().slice(0, 10),
      allDay:          true,
      backgroundColor: color.bg,
      borderColor:     color.border,
      textColor:       color.text,
      extendedProps: {
        route: r,
        icon: t?.icon,
        transportType: r.transportType,
      },
    };
  });

  // ─── Upcoming routes sidebar list ────────────────────────────────
  const upcoming = [...routes]
    .filter(r => new Date(r.endDate) >= new Date())
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 8);

  // ─── Calendar navigation helpers ────────────────────────────────
  const calApi = () => calRef.current?.getApi();
  const prev   = () => { calApi()?.prev();  syncTitle(); };
  const next   = () => { calApi()?.next();  syncTitle(); };
  const today  = () => { calApi()?.today(); syncTitle(); };
  const syncTitle = () =>
    setTimeout(() => setTitle(calApi()?.view.title || ""), 0);

  const switchView = (v) => {
    setView(v);
    calApi()?.changeView(v);
    syncTitle();
  };

  // ─── Event click ─────────────────────────────────────────────────
  const handleEventClick = (info) => {
    info.jsEvent.preventDefault();
    const rect = info.el.getBoundingClientRect();
    setPopup({
      route: info.event.extendedProps.route,
      x: Math.min(rect.left, window.innerWidth - 340),
      y: rect.bottom + window.scrollY + 8,
    });
  };

  // ─── Close popup on outside click ───────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest(".tcp-popup")) setPopup(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Sync title on mount ─────────────────────────────────────────
  useEffect(() => { syncTitle(); }, [loading]);

  return (
    <div className="tcp-root">

      {/* ══ SIDEBAR ══════════════════════════════════════════════ */}
      <aside className={`tcp-sidebar ${sidebar ? "tcp-sidebar--open" : ""}`}>
        <div className="tcp-sidebar__brand">
          <span>✈️</span>
          <span className="tcp-sidebar__brand-text">Travel</span>
          <button className="tcp-sidebar__close" onClick={() => setSidebar(false)}>
            <FiX />
          </button>
        </div>

        <nav className="tcp-sidebar__nav">
          {NAV.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`tcp-nav-item ${isActive ? "tcp-nav-item--active" : ""}`}
                onClick={() => { navigate(item.path); setSidebar(false); }}
              >
                <span className="tcp-nav-item__icon">{item.icon}</span>
                <span>{item.label}</span>
                {isActive && <span className="tcp-nav-item__bar" />}
              </button>
            );
          })}
        </nav>

        <button className="tcp-sidebar__logout"
          onClick={() => { localStorage.clear(); navigate("/login"); }}>
          <FiLogOut /> Выйти
        </button>
      </aside>

      {sidebar && <div className="tcp-overlay" onClick={() => setSidebar(false)} />}

      {/* ══ MAIN ═════════════════════════════════════════════════ */}
      <main className="tcp-main">

        {/* ── Topbar ─────────────────────────────────────────── */}
        <header className="tcp-topbar">
          <button className="tcp-burger" onClick={() => setSidebar(true)}>
            <FiMenu />
          </button>

          {/* Calendar nav controls */}
          <div className="tcp-cal-nav">
            <button className="tcp-nav-btn" onClick={prev}><FiChevronLeft /></button>
            <button className="tcp-today-btn" onClick={today}>Сегодня</button>
            <button className="tcp-nav-btn" onClick={next}><FiChevronRight /></button>
            <h1 className="tcp-cal-title">{currentTitle}</h1>
          </div>

          {/* View switcher */}
          <div className="tcp-view-switcher">
            {[
              { v: "dayGridMonth", icon: <FiGrid />,     label: "Месяц" },
              { v: "timeGridWeek", icon: <FiCalendar />, label: "Неделя" },
              { v: "listMonth",    icon: <FiList />,     label: "Список" },
            ].map(({ v, icon, label }) => (
              <button
                key={v}
                className={`tcp-view-btn ${view === v ? "active" : ""}`}
                onClick={() => switchView(v)}
              >
                {icon} <span>{label}</span>
              </button>
            ))}
          </div>

          <button
            className="tcp-add-btn"
            onClick={() => navigate("/traveler/create-route")}
          >
            <FiPlus /> Маршрут
          </button>
        </header>

        {/* ── Body ───────────────────────────────────────────── */}
        <div className="tcp-body">

          {/* ── Legend с цветными точками и картинками ────────────────────────── */}
          <div className="tcp-legend">
            {TRANSPORT_OPTIONS.map(t => {
              const color = getColor(t.value);
              return (
                <span key={t.value} className="tcp-legend-item">
                  <span 
                    className="tcp-legend-dot" 
                    style={{ backgroundColor: color.border }} 
                  />
                  <TransportIcon type={t.value} className="tcp-legend-icon" />
                  {t.label}
                </span>
              );
            })}
          </div>

          <div className="tcp-cal-wrap">

            {/* ── Upcoming sidebar ──────────────────────────── */}
            <aside className="tcp-upcoming">
              <h3 className="tcp-upcoming__title">
                <FiCalendar /> Ближайшие
              </h3>
              {loading ? (
                <div className="tcp-upcoming__loading">
                  <div className="tcp-spinner" />
                </div>
              ) : upcoming.length === 0 ? (
                <div className="tcp-upcoming__empty">Нет предстоящих маршрутов</div>
              ) : (
                <div className="tcp-upcoming__list">
                  {upcoming.map(r => {
                    const c  = getColor(r.transportType);
                    const st = statusOf(r.startDate, r.endDate);
                    const daysLeft = Math.ceil(
                      (new Date(r.startDate) - new Date()) / 86400000
                    );
                    return (
                      <div
                        key={r.id}
                        className="tcp-upcoming-card"
                        style={{ borderLeftColor: c.border }}
                        onClick={() => navigate(`/traveler/routes/${r.id}`)}
                      >
                        <div className="tcp-upcoming-card__header">
                          <span className="tcp-upcoming-card__icon">
                            <TransportIcon type={r.transportType} />
                          </span>
                          <span className="tcp-upcoming-card__title">{r.title}</span>
                        </div>
                        <div className="tcp-upcoming-card__route">
                          {r.startLocation} → {r.endLocation}
                        </div>
                        <div className="tcp-upcoming-card__dates">
                          {fmtDate(r.startDate).replace(" г.", "")}
                        </div>
                        <div className="tcp-upcoming-card__footer">
                          <span className={`tcp-status tcp-status--${st.cls}`}>
                            {st.label}
                          </span>
                          {st.cls === "upcoming" && daysLeft > 0 && (
                            <span className="tcp-upcoming-card__days">
                              через {daysLeft} дн.
                            </span>
                          )}
                          {st.cls === "ongoing" && (
                            <span className="tcp-upcoming-card__days ongoing">
                              сейчас
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Stats */}
              {!loading && (
                <div className="tcp-stats">
                  <div className="tcp-stat">
                    <strong>{routes.length}</strong>
                    <span>Всего</span>
                  </div>
                  <div className="tcp-stat">
                    <strong style={{ color: "#0ea5e9" }}>
                      {routes.filter(r => statusOf(r.startDate, r.endDate).cls === "upcoming").length}
                    </strong>
                    <span>Предстоит</span>
                  </div>
                  <div className="tcp-stat">
                    <strong style={{ color: "#16a34a" }}>
                      {routes.filter(r => statusOf(r.startDate, r.endDate).cls === "ongoing").length}
                    </strong>
                    <span>В пути</span>
                  </div>
                </div>
              )}
            </aside>

            {/* ── FullCalendar ──────────────────────────────── */}
            <div className="tcp-calendar">
              {loading ? (
                <div className="tcp-loading">
                  <div className="tcp-spinner tcp-spinner--lg" />
                  <p>Загружаем маршруты...</p>
                </div>
              ) : (
                <FullCalendar
                  ref={calRef}
                  plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  locale={ruLocale}
                  headerToolbar={false}
                  events={events}
                  eventClick={handleEventClick}
                  datesSet={() => syncTitle()}
                  height="100%"
                  eventDisplay="block"
                  dayMaxEvents={3}
                  moreLinkText={n => `+${n} ещё`}
                  nowIndicator={true}
                  weekNumbers={false}
                  firstDay={1}
                  eventContent={(arg) => {
                    const icon = arg.event.extendedProps.icon;
                    return (
                      <div className="tcp-fc-event">
                        <span 
                          className="tcp-fc-event__dot"
                          style={{ backgroundColor: arg.event.borderColor }}
                        />
                        <img src={icon} alt="" className="tcp-fc-event__icon" />
                        <span className="tcp-fc-event__title">{arg.event.title}</span>
                      </div>
                    );
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ══ POPUP (клик по событию) ═══════════════════════════════ */}
      {popup && (
        <div
          className="tcp-popup"
          style={{
            top:  popup.y,
            left: Math.max(8, popup.x),
          }}
        >
          {(() => {
            const r  = popup.route;
            const c  = getColor(r.transportType);
            const st = statusOf(r.startDate, r.endDate);
            return (
              <>
                <div className="tcp-popup__header" style={{ borderTopColor: c.border }}>
                  <span className="tcp-popup__icon">
                    <TransportIcon type={r.transportType} />
                  </span>
                  <div className="tcp-popup__title-wrap">
                    <h3 className="tcp-popup__title">{r.title}</h3>
                    <span className={`tcp-status tcp-status--${st.cls}`}>{st.label}</span>
                  </div>
                  <button className="tcp-popup__close" onClick={() => setPopup(null)}>
                    <FiX />
                  </button>
                </div>

                <div className="tcp-popup__body">
                  <div className="tcp-popup__row">
                    <FiMapPin />
                    <span>{r.startLocation} → {r.endLocation}</span>
                  </div>
                  <div className="tcp-popup__row">
                    <FiCalendar />
                    <span>{fmtDate(r.startDate)} — {fmtDate(r.endDate)}</span>
                  </div>
                  <div className="tcp-popup__row">
                    <FiClock />
                    <span>{r.durationDays} {r.durationDays === 1 ? "день" :
                      r.durationDays < 5 ? "дня" : "дней"}</span>
                  </div>
                  {r.transportType && (
                    <div className="tcp-popup__row">
                      <FiTruck />
                      <span>{{ WALK:"Пешком", BIKE:"Велосипед", CAR:"Авто",
                                 TRANSIT:"Транспорт", PLANE:"Самолёт" }[r.transportType] ?? r.transportType}</span>
                    </div>
                  )}
                  {r.totalPrice != null && (
                    <div className="tcp-popup__row">
                      <FiDollarSign />
                      <span>{r.totalPrice > 0
                        ? `${Number(r.totalPrice).toLocaleString("ru-RU")} €`
                        : "Бесплатно"}
                      </span>
                    </div>
                  )}
                  {r.participantsCount > 1 && (
                    <div className="tcp-popup__row">
                      <FiUsers />
                      <span>{r.participantsCount} участника(-ов)</span>
                    </div>
                  )}
                </div>

                <div className="tcp-popup__footer">
                  <button
                    className="tcp-popup__open-btn"
                    onClick={() => { setPopup(null); navigate(`/traveler/routes/${r.id}`); }}
                  >
                    <FiExternalLink /> Открыть маршрут
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}