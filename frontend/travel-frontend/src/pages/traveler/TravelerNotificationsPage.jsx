// import { useState, useEffect, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import {
//   FiHome, FiMap, FiPlus, FiSearch, FiStar, FiUsers, FiCalendar,
//   FiHeart, FiBell, FiUser, FiLogOut, FiMenu, FiX,
//   FiCheck, FiCheckCircle, FiXCircle, FiClock, FiMapPin,
//   FiTruck, FiDollarSign, FiEye, FiTrash2, FiRefreshCw,
// } from "react-icons/fi";
// import {
//   getNotifications, markNotificationRead, markAllNotificationsRead,
//   respondToInvite, getRouteById,
// } from "../../api/travelerApi";

// // Получить ID текущего пользователя из JWT токена
// function getCurrentUserId() {
//   try {
//     const token = localStorage.getItem("token");
//     if (!token) return null;
//     // JWT payload — второй сегмент base64
//     const payload = JSON.parse(atob(token.split(".")[1]));
//     // Spring Security кладёт userId в sub или отдельное поле
//     // Пробуем разные варианты
//     return payload.userId || payload.user_id || payload.id || null;
//   } catch {
//     return null;
//   }
// }

// // Получить routeId маршрутов где пользователь PENDING
// async function getPendingRouteIds() {
//   try {
//     const { default: axiosClient } = await import("../../api/axiosClient");
//     const res = await axiosClient.get("/traveler/notifications/pending-invites");
//     return res.data; // [36, 12, ...]
//   } catch {
//     return [];
//   }
// }
// import "../../styles/traveler/TravelerNotificationsPage.css";

// // ─── Sidebar nav ──────────────────────────────────────────────────
// const NAV = [
//   { path: "/traveler",               icon: <FiHome />,     label: "Главная"         },
//   { path: "/traveler/my-routes",     icon: <FiMap />,      label: "Мои маршруты"    },
//   { path: "/traveler/create-route",  icon: <FiPlus />,     label: "Создать маршрут" },
//   { path: "/traveler/search",        icon: <FiSearch />,   label: "Найти маршруты"  },
//   { path: "/traveler/recommended",   icon: <FiStar />,     label: "Рекомендации"    },
//   { path: "/traveler/calendar",      icon: <FiCalendar />, label: "Календарь"       },
//   { path: "/traveler/favorites",     icon: <FiHeart />,    label: "Избранное"       },
//   { path: "/traveler/notifications", icon: <FiBell />,     label: "Уведомления"     },
//   { path: "/traveler/profile",       icon: <FiUser />,     label: "Профиль"         },
// ];

// const TRANSPORT = {
//   WALK: "🚶 Пешком", BIKE: "🚴 Велосипед", CAR: "🚗 Авто",
//   TRANSIT: "🚌 Транспорт", PLANE: "✈️ Самолёт",
// };

// // Определяем тип уведомления по тексту сообщения.
// // ВАЖНО: проверяем "принял/отклонил приглашение" ДО проверки на "приглашение",
// // иначе "принял приглашение" будет распознано как invite, а не accepted.
// function detectType(msg = "") {
//   const m = msg.toLowerCase();
//   // "Иван принял приглашение" — уведомление организатору (кнопок нет)
//   if (m.includes("принял") && m.includes("приглашение")) return "accepted";
//   // "Иван отклонил приглашение" — уведомление организатору (кнопок нет)
//   if (m.includes("отклонил") && m.includes("приглашение")) return "rejected";
//   // "Вас пригласили" — уведомление участнику (показываем кнопки)
//   if (m.includes("пригласили") || m.includes("вас приглашают")) return "invite";
//   // Маршрут изменён
//   if (m.includes("изменён") || m.includes("обновл")) return "changed";
//   return "info";
// }

// // Извлекаем routeId из текста сообщения (если бэкенд его не передаёт отдельно)
// function extractRouteId(msg = "") {
//   const m = msg.match(/маршрут[еу]?\s+[«"].*?[»"]\s*\(id:\s*(\d+)\)/i);
//   return m ? Number(m[1]) : null;
// }

// function fmtDate(d) {
//   if (!d) return "";
//   const val = Array.isArray(d)
//     ? new Date(d[0], d[1] - 1, d[2], d[3] ?? 0, d[4] ?? 0)
//     : new Date(d);
//   const now  = new Date();
//   const diff = Math.floor((now - val) / 1000);
//   if (diff < 60)    return "только что";
//   if (diff < 3600)  return `${Math.floor(diff / 60)} мин. назад`;
//   if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
//   return val.toLocaleDateString("ru-RU", { day:"numeric", month:"long" });
// }

// const TYPE_META = {
//   invite:   { icon: <FiUsers />,       color: "#0ea5e9", bg: "#eff6ff", label: "Приглашение"   },
//   accepted: { icon: <FiCheckCircle />, color: "#16a34a", bg: "#f0fdf4", label: "Принято"       },
//   rejected: { icon: <FiXCircle />,     color: "#ef4444", bg: "#fef2f2", label: "Отклонено"     },
//   changed:  { icon: <FiRefreshCw />,   color: "#f59e0b", bg: "#fffbeb", label: "Изменён"       },
//   info:     { icon: <FiBell />,        color: "#8b5cf6", bg: "#f5f3ff", label: "Уведомление"   },
// };

// // MOCK данных (для работы без бэкенда)
// const MOCK = [
//   {
//     id: 1, message: 'Вас пригласили в маршрут «Тур по Европе» (организатор: Алексей Иванов)',
//     read: false, createdAt: new Date(Date.now() - 600000).toISOString(),
//     routeId: 1, inviterName: "Алексей Иванов", inviterEmail: "alex@example.com",
//     route: {
//       id: 1, title: "Тур по Европе", startLocation: "Берлин", endLocation: "Лиссабон",
//       startDate: "2026-04-10", endDate: "2026-04-20", durationDays: 11,
//       transportType: "CAR", totalPrice: 1200,
//     },
//   },
//   {
//     id: 2, message: 'Вас пригласили в маршрут «Байкал» (организатор: Мария Петрова)',
//     read: false, createdAt: new Date(Date.now() - 7200000).toISOString(),
//     routeId: 2, inviterName: "Мария Петрова", inviterEmail: "maria@example.com",
//     route: {
//       id: 2, title: "Байкал зимой", startLocation: "Иркутск", endLocation: "Листвянка",
//       startDate: "2026-05-01", endDate: "2026-05-07", durationDays: 7,
//       transportType: "CAR", totalPrice: 320,
//     },
//   },
//   {
//     id: 3, message: 'Дмитрий Сидоров принял приглашение в маршрут «Золотое кольцо»',
//     read: true, createdAt: new Date(Date.now() - 86400000).toISOString(),
//     routeId: 3, inviterName: null,
//     route: null,
//   },
//   {
//     id: 4, message: 'Маршрут «Прага–Вена» был изменён организатором.',
//     read: true, createdAt: new Date(Date.now() - 172800000).toISOString(),
//     routeId: 4, inviterName: null, route: null,
//   },
// ];

// export default function TravelerNotificationsPage() {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [items,    setItems]    = useState([]);
//   const [loading,  setLoading]  = useState(true);
//   const [sidebar,  setSidebar]  = useState(false);
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [filter,   setFilter]   = useState("all"); // all | unread | invite
//   const [preview,  setPreview]  = useState(null);  // { notif, route }
//   const [responding, setResponding] = useState({}); // { [notifId]: "accepting"|"rejecting" }
//   const clickTimer = useRef(null);

//   // ── Load currentUserId on mount ─────────────────────────────
//   useEffect(() => {
//     // Получаем ID текущего пользователя из JWT или из API
//     const uid = getCurrentUserId();
//     if (uid) {
//       setCurrentUserId(uid);
//     } else {
//       // Фолбэк: запросить профиль
//       import("../../api/travelerApi").then(({ getTravelerProfile }) =>
//         getTravelerProfile()
//           .then(p => setCurrentUserId(p.id))
//           .catch(() => {})
//       );
//     }
//   }, []);

//   // ── Load notifications ───────────────────────────────────────
//   const load = async () => {
//     setLoading(true);
//     try {
//       const data = await getNotifications();
//       // Для каждого invite-уведомления пытаемся подгрузить данные маршрута
//       // Загружаем routeId для PENDING приглашений (для старых уведомлений где routeId=null)
//       const pendingRouteIds = await getPendingRouteIds();

//       const enriched = await Promise.all(
//         (Array.isArray(data) ? data : []).map(async (n) => {
//           const type = detectType(n.message);
//           const isInvite = type === "invite";

//           // routeId: сначала из поля, потом из pending списка (для старых записей)
//           let routeId = n.routeId;
//           if (!routeId && isInvite && pendingRouteIds.length > 0) {
//             // Берём первый pending routeId — если одно приглашение, это оно
//             routeId = pendingRouteIds[0];
//           }

//           const withRouteId = { ...n, routeId };

//           // Загружаем данные маршрута для invite-уведомлений
//           if (isInvite && routeId && !withRouteId.route) {
//             try {
//               const route = await getRouteById(routeId);
//               return { ...withRouteId, route };
//             } catch {
//               return withRouteId;
//             }
//           }
//           return withRouteId;
//         })
//       );
//       setItems(enriched);
//     } catch {
//       setItems(MOCK);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { load(); }, []);

//   // ── Unread count ─────────────────────────────────────────────
//   const unreadCount = items.filter(n => !n.read).length;
//   const inviteCount = items.filter(n => !n.read && detectType(n.message) === "invite").length;

//   // ── Filter ───────────────────────────────────────────────────
//   const filtered = items.filter(n => {
//     if (filter === "unread") return !n.read;
//     if (filter === "invite") return detectType(n.message) === "invite";
//     return true;
//   });

//   // ── Mark read ────────────────────────────────────────────────
//   const markRead = async (id) => {
//     setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
//     try { await markNotificationRead(id); } catch {}
//   };

//   const markAllRead = async () => {
//     setItems(prev => prev.map(n => ({ ...n, read: true })));
//     try { await markAllNotificationsRead(); } catch {}
//   };

//   // ── Row click (single=mark read, double=preview) ─────────────
//   const handleRowClick = (notif) => {
//     if (clickTimer.current) {
//       clearTimeout(clickTimer.current);
//       clickTimer.current = null;
//       // Double click → show preview or navigate
//       if (notif.routeId) {
//         if (notif.route) {
//           setPreview(notif);
//         } else {
//           navigate(`/traveler/routes/${notif.routeId}`);
//         }
//       }
//     } else {
//       if (!notif.read) markRead(notif.id);
//       clickTimer.current = setTimeout(() => { clickTimer.current = null; }, 280);
//     }
//   };

//   // ── Accept / Reject invite ───────────────────────────────────
//   const handleRespond = async (notif, status) => {
//     const routeId = notif.routeId;
//     if (!routeId) {
//       console.error("routeId is missing in notification", notif);
//       // Пробуем найти routeId из route объекта (если он загружен)
//       const fallbackId = notif.route?.id;
//       if (!fallbackId) {
//         alert("Не удалось определить маршрут. Пожалуйста, обновите страницу и попробуйте снова.");
//         return;
//       }
//       // Используем fallback routeId из route
//       return handleRespondWithId(notif, fallbackId, status);
//     }
//     return handleRespondWithId(notif, routeId, status);
//   };

//   const handleRespondWithId = async (notif, routeId, status) => {

//     setResponding(prev => ({ ...prev, [notif.id]: status === "ACCEPTED" ? "accepting" : "rejecting" }));

//     try {
//       await respondToInvite(routeId, status);

//       // ИСПРАВЛЕНИЕ: явно ставим responded + _inviteHandled чтобы
//       // isInvite стало false независимо от текста сообщения
//       setItems(prev => prev.map(n =>
//         n.id === notif.id
//           ? {
//               ...n,
//               read: true,
//               responded: status,         // "ACCEPTED" | "REJECTED"
//               _inviteHandled: true,      // флаг — кнопки скрыть
//             }
//           : n
//       ));

//       // Закрываем превью если открыто
//       if (preview?.id === notif.id) setPreview(null);

//       // После принятия — переход на страницу маршрута
//       if (status === "ACCEPTED") {
//         setTimeout(() => navigate(`/traveler/routes/${routeId}`), 1000);
//       }

//     } catch (e) {
//       console.error("Respond error", e);
//     } finally {
//       setResponding(prev => { const c = { ...prev }; delete c[notif.id]; return c; });
//     }
//   };

//   // ─────────────────────────────────────────────────────────────
//   return (
//     <div className="tnp-root">

//       {/* ══ SIDEBAR ══════════════════════════════════════════════ */}
//       <aside className={`tnp-sidebar ${sidebar ? "tnp-sidebar--open" : ""}`}>
//         <div className="tnp-sidebar__brand">
//           <span>✈️</span>
//           <span className="tnp-sidebar__brand-text">Travel</span>
//           <button className="tnp-sidebar__close" onClick={() => setSidebar(false)}>
//             <FiX />
//           </button>
//         </div>

//         <nav className="tnp-sidebar__nav">
//           {NAV.map(item => {
//             const isActive = location.pathname === item.path;
//             const isBell   = item.path === "/traveler/notifications";
//             return (
//               <button
//                 key={item.path}
//                 className={`tnp-nav-item ${isActive ? "tnp-nav-item--active" : ""}`}
//                 onClick={() => { navigate(item.path); setSidebar(false); }}
//               >
//                 <span className="tnp-nav-item__icon">{item.icon}</span>
//                 <span className="tnp-nav-item__label">{item.label}</span>
//                 {/* Бейдж непрочитанных уведомлений */}
//                 {isBell && unreadCount > 0 && (
//                   <span className="tnp-nav-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
//                 )}
//                 {isActive && <span className="tnp-nav-item__bar" />}
//               </button>
//             );
//           })}
//         </nav>

//         <button className="tnp-sidebar__logout"
//           onClick={() => { localStorage.clear(); navigate("/login"); }}>
//           <FiLogOut /> Выйти
//         </button>
//       </aside>

//       {sidebar && <div className="tnp-overlay" onClick={() => setSidebar(false)} />}

//       {/* ══ MAIN ═════════════════════════════════════════════════ */}
//       <main className="tnp-main">

//         {/* ── Topbar ─────────────────────────────────────────── */}
//         <header className="tnp-topbar">
//           <button className="tnp-burger" onClick={() => setSidebar(true)}><FiMenu /></button>
//           <div className="tnp-topbar__title">
//             <FiBell />
//             <h1>Уведомления</h1>
//             {unreadCount > 0 && (
//               <span className="tnp-topbar__badge">{unreadCount} новых</span>
//             )}
//           </div>
//           <div className="tnp-topbar__actions">
//             <button className="tnp-action-btn" onClick={load} title="Обновить">
//               <FiRefreshCw />
//             </button>
//             {unreadCount > 0 && (
//               <button className="tnp-action-btn tnp-action-btn--text" onClick={markAllRead}>
//                 <FiCheckCircle /> Прочитать все
//               </button>
//             )}
//           </div>
//         </header>

//         {/* ── Filter tabs ─────────────────────────────────────── */}
//         <div className="tnp-filters">
//           {[
//             { id: "all",    label: "Все",         count: items.length },
//             { id: "unread", label: "Непрочитанные", count: unreadCount },
//             { id: "invite", label: "Приглашения",  count: inviteCount  },
//           ].map(f => (
//             <button
//               key={f.id}
//               className={`tnp-filter ${filter === f.id ? "active" : ""}`}
//               onClick={() => setFilter(f.id)}
//             >
//               {f.label}
//               {f.count > 0 && (
//                 <span className="tnp-filter__count">{f.count}</span>
//               )}
//             </button>
//           ))}
//         </div>

//         {/* ── Hint ────────────────────────────────────────────── */}
//         <p className="tnp-hint">
//           Одиночный клик — отметить прочитанным &nbsp;·&nbsp; Двойной клик — просмотр маршрута
//         </p>

//         {/* ── List ────────────────────────────────────────────── */}
//         <div className="tnp-list">
//           {loading ? (
//             <div className="tnp-state">
//               <div className="tnp-spinner" />
//               <p>Загружаем уведомления...</p>
//             </div>
//           ) : filtered.length === 0 ? (
//             <div className="tnp-state">
              
//               <p className="tnp-state__title">Нет уведомлений</p>
//               <p className="tnp-state__sub">
//                 {filter === "unread" ? "Все уведомления прочитаны" :
//                  filter === "invite" ? "Нет активных приглашений" : "Пока тихо"}
//               </p>
//             </div>
//           ) : (
//             filtered.map((notif, idx) => {
//               const type    = detectType(notif.message);
//               const meta    = TYPE_META[type];
//               // ── Логика показа кнопок ─────────────────────────────────
//               // Кнопки "Принять/Отклонить" показываем ТОЛЬКО если:
//               //   1. Уведомление типа "invite"
//               //   2. Отправитель (senderId) — НЕ текущий пользователь
//               //      (если senderId == я → я сам организатор, кнопок нет)
//               //   3. Пользователь ещё не ответил
//               //   4. Статус с бэка = PENDING (или неизвестен)
//               const iAmTheSender = currentUserId && notif.senderId &&
//                 String(notif.senderId) === String(currentUserId);

//               const alreadyResponded =
//                 notif._inviteHandled ||
//                 notif.responded ||
//                 (notif.participantStatus && notif.participantStatus !== "PENDING");

//               const isInvite = type === "invite" && !iAmTheSender && !alreadyResponded;
//               const respStatus = responding[notif.id];

//               return (
//                 <div
//                   key={notif.id}
//                   className={`tnp-item ${!notif.read ? "tnp-item--unread" : ""} ${isInvite ? "tnp-item--invite" : ""}`}
//                   style={{ animationDelay: `${idx * 40}ms` }}
//                   onClick={() => handleRowClick(notif)}
//                 >
//                   {/* Unread dot */}
//                   {!notif.read && <span className="tnp-item__dot" />}

//                   {/* Icon */}
//                   <div className="tnp-item__icon" style={{ background: meta.bg, color: meta.color }}>
//                     {meta.icon}
//                   </div>

//                   {/* Content */}
//                   <div className="tnp-item__content">
//                     <div className="tnp-item__header">
//                       <span className="tnp-item__type" style={{ color: meta.color }}>
//                         {meta.label}
//                       </span>
//                       <span className="tnp-item__time">
//                         <FiClock /> {fmtDate(notif.createdAt)}
//                       </span>
//                     </div>

//                     <p className="tnp-item__message">{notif.message}</p>

//                     {/* Invite: route preview card */}
//                     {isInvite && notif.route && (
//                       <div className="tnp-route-card">
//                         <div className="tnp-route-card__title">
//                           🗺️ {notif.route.title}
//                         </div>
//                         <div className="tnp-route-card__meta">
//                           <span><FiMapPin /> {notif.route.startLocation} → {notif.route.endLocation}</span>
//                           <span><FiCalendar />
//                             {notif.route.startDate && typeof notif.route.startDate === "string"
//                               ? notif.route.startDate.slice(0, 10)
//                               : Array.isArray(notif.route.startDate)
//                               ? `${notif.route.startDate[0]}-${String(notif.route.startDate[1]).padStart(2,"0")}-${String(notif.route.startDate[2]).padStart(2,"0")}`
//                               : "—"
//                             }
//                             {" — "}
//                             {notif.route.endDate && typeof notif.route.endDate === "string"
//                               ? notif.route.endDate.slice(0, 10)
//                               : Array.isArray(notif.route.endDate)
//                               ? `${notif.route.endDate[0]}-${String(notif.route.endDate[1]).padStart(2,"0")}-${String(notif.route.endDate[2]).padStart(2,"0")}`
//                               : "—"
//                             }
//                           </span>
//                           {notif.route.durationDays && (
//                             <span><FiClock /> {notif.route.durationDays} дней</span>
//                           )}
//                           {notif.route.transportType && (
//                             <span><FiTruck /> {TRANSPORT[notif.route.transportType] ?? notif.route.transportType}</span>
//                           )}
//                           {notif.route.totalPrice != null && (
//                             <span><FiDollarSign />
//                               {notif.route.totalPrice > 0
//                                 ? `${Number(notif.route.totalPrice).toLocaleString("ru-RU")} €`
//                                 : "Бесплатно"}
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     )}

//                     {/* Invite actions */}
//                     {isInvite && (
//                       <div className="tnp-item__actions" onClick={e => e.stopPropagation()}>
//                         <button
//                           className="tnp-btn tnp-btn--accept"
//                           disabled={!!respStatus}
//                           onClick={() => handleRespond(notif, "ACCEPTED")}
//                         >
//                           {respStatus === "accepting"
//                             ? <><div className="tnp-mini-spinner" /> Принимаем...</>
//                             : <><FiCheck /> Принять</>}
//                         </button>
//                         <button
//                           className="tnp-btn tnp-btn--reject"
//                           disabled={!!respStatus}
//                           onClick={() => handleRespond(notif, "REJECTED")}
//                         >
//                           {respStatus === "rejecting"
//                             ? <><div className="tnp-mini-spinner" /> Отклоняем...</>
//                             : <><FiX /> Отклонить</>}
//                         </button>
//                         {notif.routeId && (
//                           <button
//                             className="tnp-btn tnp-btn--view"
//                             onClick={() => navigate(`/traveler/routes/${notif.routeId}`)}
//                           >
//                             <FiEye /> Маршрут
//                           </button>
//                         )}
//                       </div>
//                     )}

//                     {/* Responded status */}
//                     {/* Показываем статус из бэка (participantStatus) ИЛИ из локального responded */}
//                     {(notif.responded || (notif.participantStatus && notif.participantStatus !== "PENDING")) && (
//                       <div className={`tnp-responded ${
//                         (notif.responded === "ACCEPTED" || notif.participantStatus === "ACCEPTED")
//                           ? "accepted" : "rejected"
//                       }`}>
//                         {(notif.responded === "ACCEPTED" || notif.participantStatus === "ACCEPTED")
//                           ? "✅ Вы приняли приглашение — маршрут добавлен к вашим"
//                           : "❌ Вы отклонили приглашение"}
//                       </div>
//                     )}
//                   </div>

//                   {/* Quick read button */}
//                   {!notif.read && (
//                     <button
//                       className="tnp-item__read-btn"
//                       title="Отметить прочитанным"
//                       onClick={e => { e.stopPropagation(); markRead(notif.id); }}
//                     >
//                       <FiEye />
//                     </button>
//                   )}
//                 </div>
//               );
//             })
//           )}
//         </div>
//       </main>

//       {/* ══ ROUTE PREVIEW MODAL ══════════════════════════════════ */}
//       {preview && (
//         <>
//           <div className="tnp-modal-backdrop" onClick={() => setPreview(null)} />
//           <div className="tnp-modal">
//             <div className="tnp-modal__header">
//               <h3>🗺️ {preview.route?.title ?? "Маршрут"}</h3>
//               <button className="tnp-modal__close" onClick={() => setPreview(null)}>
//                 <FiX />
//               </button>
//             </div>

//             {preview.route && (
//               <div className="tnp-modal__body">
//                 <div className="tnp-modal__row">
//                   <FiMapPin />
//                   <span>{preview.route.startLocation} → {preview.route.endLocation}</span>
//                 </div>
//                 <div className="tnp-modal__row">
//                   <FiCalendar />
//                   <span>
//                     {typeof preview.route.startDate === "string"
//                       ? preview.route.startDate.slice(0, 10)
//                       : "—"}
//                     {" — "}
//                     {typeof preview.route.endDate === "string"
//                       ? preview.route.endDate.slice(0, 10)
//                       : "—"}
//                   </span>
//                 </div>
//                 {preview.route.durationDays && (
//                   <div className="tnp-modal__row">
//                     <FiClock />
//                     <span>{preview.route.durationDays} дней</span>
//                   </div>
//                 )}
//                 {preview.route.transportType && (
//                   <div className="tnp-modal__row">
//                     <FiTruck />
//                     <span>{TRANSPORT[preview.route.transportType] ?? preview.route.transportType}</span>
//                   </div>
//                 )}
//                 {preview.route.totalPrice != null && (
//                   <div className="tnp-modal__row">
//                     <FiDollarSign />
//                     <span>
//                       {preview.route.totalPrice > 0
//                         ? `${Number(preview.route.totalPrice).toLocaleString("ru-RU")} €`
//                         : "Бесплатно"}
//                     </span>
//                   </div>
//                 )}
//                 {preview.inviterName && (
//                   <div className="tnp-modal__row">
//                     <FiUsers />
//                     <span>Организатор: <strong>{preview.inviterName}</strong></span>
//                   </div>
//                 )}
//               </div>
//             )}

//             <div className="tnp-modal__footer">
//               {detectType(preview.message) === "invite" &&
//                !(currentUserId && preview.senderId && String(preview.senderId) === String(currentUserId)) &&
//                !preview._inviteHandled &&
//                !preview.responded &&
//                (!preview.participantStatus || preview.participantStatus === "PENDING") && (
//                 <>
//                   <button
//                     className="tnp-btn tnp-btn--accept"
//                     onClick={() => handleRespond(preview, "ACCEPTED")}
//                   >
//                     <FiCheck /> Принять и добавить маршрут
//                   </button>
//                   <button
//                     className="tnp-btn tnp-btn--reject"
//                     onClick={() => handleRespond(preview, "REJECTED")}
//                   >
//                     <FiX /> Отклонить
//                   </button>
//                 </>
//               )}
//               <button
//                 className="tnp-btn tnp-btn--view"
//                 onClick={() => { setPreview(null); navigate(`/traveler/routes/${preview.routeId}`); }}
//               >
//                 <FiEye /> Открыть маршрут полностью
//               </button>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }


import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiHome, FiMap, FiPlus, FiSearch, FiStar, FiUsers, FiCalendar,
  FiHeart, FiBell, FiUser, FiLogOut, FiMenu, FiX,
  FiCheck, FiCheckCircle, FiXCircle, FiClock, FiMapPin,
  FiTruck, FiDollarSign, FiEye, FiTrash2, FiRefreshCw,
} from "react-icons/fi";
import {
  getNotifications, markNotificationRead, markAllNotificationsRead,
  respondToInvite, getRouteById,
} from "../../api/travelerApi";

// Получить ID текущего пользователя из JWT токена
function getCurrentUserId() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId || payload.user_id || payload.id || null;
  } catch {
    return null;
  }
}

// Получить routeId маршрутов где пользователь PENDING
async function getPendingRouteIds() {
  try {
    const { default: axiosClient } = await import("../../api/axiosClient");
    const res = await axiosClient.get("/traveler/notifications/pending-invites");
    return res.data;
  } catch {
    return [];
  }
}
import "../../styles/traveler/TravelerNotificationsPage.css";

// ─── Sidebar nav ──────────────────────────────────────────────────
const NAV = [
  { path: "/traveler",               icon: <FiHome />,     label: "Главная"         },
  { path: "/traveler/my-routes",     icon: <FiMap />,      label: "Мои маршруты"    },
  { path: "/traveler/create-route",  icon: <FiPlus />,     label: "Создать маршрут" },
  { path: "/traveler/search",        icon: <FiSearch />,   label: "Найти маршруты"  },
  { path: "/traveler/recommended",   icon: <FiStar />,     label: "Рекомендации"    },
  { path: "/traveler/calendar",      icon: <FiCalendar />, label: "Календарь"       },
  { path: "/traveler/favorites",     icon: <FiHeart />,    label: "Избранное"       },
  { path: "/traveler/notifications", icon: <FiBell />,     label: "Уведомления"     },
  { path: "/traveler/profile",       icon: <FiUser />,     label: "Профиль"         },
];

// ─── Транспорт с картинками ──────────────────────────────────────
const TRANSPORT = {
  WALK:    { label: "Пешком",    icon: "https://img.icons8.com/ios/50/000000/walking.png" },
  BIKE:    { label: "Велосипед", icon: "https://img.icons8.com/ios/50/000000/bicycle.png" },
  CAR:     { label: "Авто",      icon: "https://img.icons8.com/ios/50/000000/car.png" },
  TRANSIT: { label: "Транспорт", icon: "https://img.icons8.com/ios/50/000000/bus.png" },
  PLANE:   { label: "Самолёт",   icon: "https://img.icons8.com/ios/50/000000/airplane-take-off.png" },
};

// Компонент для отображения иконки транспорта
const TransportDisplay = ({ type }) => {
  const transport = TRANSPORT[type];
  if (!transport) return <span>{type}</span>;
  return (
    <span className="tnp-transport-badge">
      <img 
        src={transport.icon} 
        alt={transport.label} 
        className="tnp-transport-icon"
        style={{ width: "18px", height: "18px", verticalAlign: "middle", marginRight: "4px" }}
      />
      {transport.label}
    </span>
  );
};

// Определяем тип уведомления по тексту сообщения.
function detectType(msg = "") {
  const m = msg.toLowerCase();
  if (m.includes("принял") && m.includes("приглашение")) return "accepted";
  if (m.includes("отклонил") && m.includes("приглашение")) return "rejected";
  if (m.includes("пригласили") || m.includes("вас приглашают")) return "invite";
  if (m.includes("изменён") || m.includes("обновл")) return "changed";
  return "info";
}

// Извлекаем routeId из текста сообщения
function extractRouteId(msg = "") {
  const m = msg.match(/маршрут[еу]?\s+[«"].*?[»"]\s*\(id:\s*(\d+)\)/i);
  return m ? Number(m[1]) : null;
}

function fmtDate(d) {
  if (!d) return "";
  const val = Array.isArray(d)
    ? new Date(d[0], d[1] - 1, d[2], d[3] ?? 0, d[4] ?? 0)
    : new Date(d);
  const now  = new Date();
  const diff = Math.floor((now - val) / 1000);
  if (diff < 60)    return "только что";
  if (diff < 3600)  return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  return val.toLocaleDateString("ru-RU", { day:"numeric", month:"long" });
}

const TYPE_META = {
  invite:   { icon: <FiUsers />,       color: "#0ea5e9", bg: "#eff6ff", label: "Приглашение"   },
  accepted: { icon: <FiCheckCircle />, color: "#16a34a", bg: "#f0fdf4", label: "Принято"       },
  rejected: { icon: <FiXCircle />,     color: "#ef4444", bg: "#fef2f2", label: "Отклонено"     },
  changed:  { icon: <FiRefreshCw />,   color: "#f59e0b", bg: "#fffbeb", label: "Изменён"       },
  info:     { icon: <FiBell />,        color: "#8b5cf6", bg: "#f5f3ff", label: "Уведомление"   },
};

// MOCK данных
const MOCK = [
  {
    id: 1, message: 'Вас пригласили в маршрут «Тур по Европе» (организатор: Алексей Иванов)',
    read: false, createdAt: new Date(Date.now() - 600000).toISOString(),
    routeId: 1, inviterName: "Алексей Иванов", inviterEmail: "alex@example.com",
    route: {
      id: 1, title: "Тур по Европе", startLocation: "Берлин", endLocation: "Лиссабон",
      startDate: "2026-04-10", endDate: "2026-04-20", durationDays: 11,
      transportType: "CAR", totalPrice: 1200,
    },
  },
  {
    id: 2, message: 'Вас пригласили в маршрут «Байкал» (организатор: Мария Петрова)',
    read: false, createdAt: new Date(Date.now() - 7200000).toISOString(),
    routeId: 2, inviterName: "Мария Петрова", inviterEmail: "maria@example.com",
    route: {
      id: 2, title: "Байкал зимой", startLocation: "Иркутск", endLocation: "Листвянка",
      startDate: "2026-05-01", endDate: "2026-05-07", durationDays: 7,
      transportType: "CAR", totalPrice: 320,
    },
  },
  {
    id: 3, message: 'Дмитрий Сидоров принял приглашение в маршрут «Золотое кольцо»',
    read: true, createdAt: new Date(Date.now() - 86400000).toISOString(),
    routeId: 3, inviterName: null,
    route: null,
  },
  {
    id: 4, message: 'Маршрут «Прага–Вена» был изменён организатором.',
    read: true, createdAt: new Date(Date.now() - 172800000).toISOString(),
    routeId: 4, inviterName: null, route: null,
  },
];

export default function TravelerNotificationsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [sidebar,  setSidebar]  = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [filter,   setFilter]   = useState("all");
  const [preview,  setPreview]  = useState(null);
  const [responding, setResponding] = useState({});
  const clickTimer = useRef(null);

  // ── Load currentUserId on mount ─────────────────────────────
  useEffect(() => {
    const uid = getCurrentUserId();
    if (uid) {
      setCurrentUserId(uid);
    } else {
      import("../../api/travelerApi").then(({ getTravelerProfile }) =>
        getTravelerProfile()
          .then(p => setCurrentUserId(p.id))
          .catch(() => {})
      );
    }
  }, []);

  // ── Load notifications ───────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      const pendingRouteIds = await getPendingRouteIds();

      const enriched = await Promise.all(
        (Array.isArray(data) ? data : []).map(async (n) => {
          const type = detectType(n.message);
          const isInvite = type === "invite";

          let routeId = n.routeId;
          if (!routeId && isInvite && pendingRouteIds.length > 0) {
            routeId = pendingRouteIds[0];
          }

          const withRouteId = { ...n, routeId };

          if (isInvite && routeId && !withRouteId.route) {
            try {
              const route = await getRouteById(routeId);
              return { ...withRouteId, route };
            } catch {
              return withRouteId;
            }
          }
          return withRouteId;
        })
      );
      setItems(enriched);
    } catch {
      setItems(MOCK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Unread count ─────────────────────────────────────────────
  const unreadCount = items.filter(n => !n.read).length;
  const inviteCount = items.filter(n => !n.read && detectType(n.message) === "invite").length;

  // ── Filter ───────────────────────────────────────────────────
  const filtered = items.filter(n => {
    if (filter === "unread") return !n.read;
    if (filter === "invite") return detectType(n.message) === "invite";
    return true;
  });

  // ── Mark read ────────────────────────────────────────────────
  const markRead = async (id) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try { await markNotificationRead(id); } catch {}
  };

  const markAllRead = async () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    try { await markAllNotificationsRead(); } catch {}
  };

  // ── Row click (single=mark read, double=preview) ─────────────
  const handleRowClick = (notif) => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      if (notif.routeId) {
        if (notif.route) {
          setPreview(notif);
        } else {
          navigate(`/traveler/routes/${notif.routeId}`);
        }
      }
    } else {
      if (!notif.read) markRead(notif.id);
      clickTimer.current = setTimeout(() => { clickTimer.current = null; }, 280);
    }
  };

  // ── Accept / Reject invite ───────────────────────────────────
  const handleRespond = async (notif, status) => {
    const routeId = notif.routeId;
    if (!routeId) {
      const fallbackId = notif.route?.id;
      if (!fallbackId) {
        alert("Не удалось определить маршрут. Пожалуйста, обновите страницу и попробуйте снова.");
        return;
      }
      return handleRespondWithId(notif, fallbackId, status);
    }
    return handleRespondWithId(notif, routeId, status);
  };

  const handleRespondWithId = async (notif, routeId, status) => {
    setResponding(prev => ({ ...prev, [notif.id]: status === "ACCEPTED" ? "accepting" : "rejecting" }));

    try {
      await respondToInvite(routeId, status);

      setItems(prev => prev.map(n =>
        n.id === notif.id
          ? {
              ...n,
              read: true,
              responded: status,
              _inviteHandled: true,
            }
          : n
      ));

      if (preview?.id === notif.id) setPreview(null);

      if (status === "ACCEPTED") {
        setTimeout(() => navigate(`/traveler/routes/${routeId}`), 1000);
      }

    } catch (e) {
      console.error("Respond error", e);
    } finally {
      setResponding(prev => { const c = { ...prev }; delete c[notif.id]; return c; });
    }
  };

  return (
    <div className="tnp-root">

      {/* ══ SIDEBAR ══════════════════════════════════════════════ */}
      <aside className={`tnp-sidebar ${sidebar ? "tnp-sidebar--open" : ""}`}>
        <div className="tnp-sidebar__brand">
          <span>✈️</span>
          <span className="tnp-sidebar__brand-text">Travel</span>
          <button className="tnp-sidebar__close" onClick={() => setSidebar(false)}>
            <FiX />
          </button>
        </div>

        <nav className="tnp-sidebar__nav">
          {NAV.map(item => {
            const isActive = location.pathname === item.path;
            const isBell   = item.path === "/traveler/notifications";
            return (
              <button
                key={item.path}
                className={`tnp-nav-item ${isActive ? "tnp-nav-item--active" : ""}`}
                onClick={() => { navigate(item.path); setSidebar(false); }}
              >
                <span className="tnp-nav-item__icon">{item.icon}</span>
                <span className="tnp-nav-item__label">{item.label}</span>
                {isBell && unreadCount > 0 && (
                  <span className="tnp-nav-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                )}
                {isActive && <span className="tnp-nav-item__bar" />}
              </button>
            );
          })}
        </nav>

        <button className="tnp-sidebar__logout"
          onClick={() => { localStorage.clear(); navigate("/login"); }}>
          <FiLogOut /> Выйти
        </button>
      </aside>

      {sidebar && <div className="tnp-overlay" onClick={() => setSidebar(false)} />}

      {/* ══ MAIN ═════════════════════════════════════════════════ */}
      <main className="tnp-main">

        {/* ── Topbar ─────────────────────────────────────────── */}
        <header className="tnp-topbar">
          <button className="tnp-burger" onClick={() => setSidebar(true)}><FiMenu /></button>
          <div className="tnp-topbar__title">
            <FiBell />
            <h1>Уведомления</h1>
            {unreadCount > 0 && (
              <span className="tnp-topbar__badge">{unreadCount} новых</span>
            )}
          </div>
          <div className="tnp-topbar__actions">
            <button className="tnp-action-btn" onClick={load} title="Обновить">
              <FiRefreshCw />
            </button>
            {unreadCount > 0 && (
              <button className="tnp-action-btn tnp-action-btn--text" onClick={markAllRead}>
                <FiCheckCircle /> Прочитать все
              </button>
            )}
          </div>
        </header>

        {/* ── Filter tabs ─────────────────────────────────────── */}
        <div className="tnp-filters">
          {[
            { id: "all",    label: "Все",         count: items.length },
            { id: "unread", label: "Непрочитанные", count: unreadCount },
            { id: "invite", label: "Приглашения",  count: inviteCount  },
          ].map(f => (
            <button
              key={f.id}
              className={`tnp-filter ${filter === f.id ? "active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              {f.count > 0 && (
                <span className="tnp-filter__count">{f.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Hint ────────────────────────────────────────────── */}
        <p className="tnp-hint">
          Одиночный клик — отметить прочитанным &nbsp;·&nbsp; Двойной клик — просмотр маршрута
        </p>

        {/* ── List ────────────────────────────────────────────── */}
        <div className="tnp-list">
          {loading ? (
            <div className="tnp-state">
              <div className="tnp-spinner" />
              <p>Загружаем уведомления...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="tnp-state">
              <p className="tnp-state__title">Нет уведомлений</p>
              <p className="tnp-state__sub">
                {filter === "unread" ? "Все уведомления прочитаны" :
                 filter === "invite" ? "Нет активных приглашений" : "Пока тихо"}
              </p>
            </div>
          ) : (
            filtered.map((notif, idx) => {
              const type    = detectType(notif.message);
              const meta    = TYPE_META[type];
              const iAmTheSender = currentUserId && notif.senderId &&
                String(notif.senderId) === String(currentUserId);

              const alreadyResponded =
                notif._inviteHandled ||
                notif.responded ||
                (notif.participantStatus && notif.participantStatus !== "PENDING");

              const isInvite = type === "invite" && !iAmTheSender && !alreadyResponded;
              const respStatus = responding[notif.id];

              return (
                <div
                  key={notif.id}
                  className={`tnp-item ${!notif.read ? "tnp-item--unread" : ""} ${isInvite ? "tnp-item--invite" : ""}`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                  onClick={() => handleRowClick(notif)}
                >
                  {!notif.read && <span className="tnp-item__dot" />}

                  <div className="tnp-item__icon" style={{ background: meta.bg, color: meta.color }}>
                    {meta.icon}
                  </div>

                  <div className="tnp-item__content">
                    <div className="tnp-item__header">
                      <span className="tnp-item__type" style={{ color: meta.color }}>
                        {meta.label}
                      </span>
                      <span className="tnp-item__time">
                        <FiClock /> {fmtDate(notif.createdAt)}
                      </span>
                    </div>

                    <p className="tnp-item__message">{notif.message}</p>

                    {/* Invite: route preview card */}
                    {isInvite && notif.route && (
                      <div className="tnp-route-card">
                        <div className="tnp-route-card__title">
                          🗺️ {notif.route.title}
                        </div>
                        <div className="tnp-route-card__meta">
                          <span><FiMapPin /> {notif.route.startLocation} → {notif.route.endLocation}</span>
                          <span><FiCalendar />
                            {notif.route.startDate && typeof notif.route.startDate === "string"
                              ? notif.route.startDate.slice(0, 10)
                              : Array.isArray(notif.route.startDate)
                              ? `${notif.route.startDate[0]}-${String(notif.route.startDate[1]).padStart(2,"0")}-${String(notif.route.startDate[2]).padStart(2,"0")}`
                              : "—"
                            }
                            {" — "}
                            {notif.route.endDate && typeof notif.route.endDate === "string"
                              ? notif.route.endDate.slice(0, 10)
                              : Array.isArray(notif.route.endDate)
                              ? `${notif.route.endDate[0]}-${String(notif.route.endDate[1]).padStart(2,"0")}-${String(notif.route.endDate[2]).padStart(2,"0")}`
                              : "—"
                            }
                          </span>
                          {notif.route.durationDays && (
                            <span><FiClock /> {notif.route.durationDays} дней</span>
                          )}
                          {notif.route.transportType && (
                            <span><FiTruck /> <TransportDisplay type={notif.route.transportType} /></span>
                          )}
                          {notif.route.totalPrice != null && (
                            <span><FiDollarSign />
                              {notif.route.totalPrice > 0
                                ? `${Number(notif.route.totalPrice).toLocaleString("ru-RU")} €`
                                : "Бесплатно"}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Invite actions */}
                    {isInvite && (
                      <div className="tnp-item__actions" onClick={e => e.stopPropagation()}>
                        <button
                          className="tnp-btn tnp-btn--accept"
                          disabled={!!respStatus}
                          onClick={() => handleRespond(notif, "ACCEPTED")}
                        >
                          {respStatus === "accepting"
                            ? <><div className="tnp-mini-spinner" /> Принимаем...</>
                            : <><FiCheck /> Принять</>}
                        </button>
                        <button
                          className="tnp-btn tnp-btn--reject"
                          disabled={!!respStatus}
                          onClick={() => handleRespond(notif, "REJECTED")}
                        >
                          {respStatus === "rejecting"
                            ? <><div className="tnp-mini-spinner" /> Отклоняем...</>
                            : <><FiX /> Отклонить</>}
                        </button>
                        {notif.routeId && (
                          <button
                            className="tnp-btn tnp-btn--view"
                            onClick={() => navigate(`/traveler/routes/${notif.routeId}`)}
                          >
                            <FiEye /> Маршрут
                          </button>
                        )}
                      </div>
                    )}

                    {/* Responded status */}
                    {(notif.responded || (notif.participantStatus && notif.participantStatus !== "PENDING")) && (
                      <div className={`tnp-responded ${
                        (notif.responded === "ACCEPTED" || notif.participantStatus === "ACCEPTED")
                          ? "accepted" : "rejected"
                      }`}>
                        {(notif.responded === "ACCEPTED" || notif.participantStatus === "ACCEPTED")
                          ? "✅ Вы приняли приглашение — маршрут добавлен к вашим"
                          : "❌ Вы отклонили приглашение"}
                      </div>
                    )}
                  </div>

                  {!notif.read && (
                    <button
                      className="tnp-item__read-btn"
                      title="Отметить прочитанным"
                      onClick={e => { e.stopPropagation(); markRead(notif.id); }}
                    >
                      <FiEye />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* ══ ROUTE PREVIEW MODAL ══════════════════════════════════ */}
      {preview && (
        <>
          <div className="tnp-modal-backdrop" onClick={() => setPreview(null)} />
          <div className="tnp-modal">
            <div className="tnp-modal__header">
              <h3>🗺️ {preview.route?.title ?? "Маршрут"}</h3>
              <button className="tnp-modal__close" onClick={() => setPreview(null)}>
                <FiX />
              </button>
            </div>

            {preview.route && (
              <div className="tnp-modal__body">
                <div className="tnp-modal__row">
                  <FiMapPin />
                  <span>{preview.route.startLocation} → {preview.route.endLocation}</span>
                </div>
                <div className="tnp-modal__row">
                  <FiCalendar />
                  <span>
                    {typeof preview.route.startDate === "string"
                      ? preview.route.startDate.slice(0, 10)
                      : "—"}
                    {" — "}
                    {typeof preview.route.endDate === "string"
                      ? preview.route.endDate.slice(0, 10)
                      : "—"}
                  </span>
                </div>
                {preview.route.durationDays && (
                  <div className="tnp-modal__row">
                    <FiClock />
                    <span>{preview.route.durationDays} дней</span>
                  </div>
                )}
                {preview.route.transportType && (
                  <div className="tnp-modal__row">
                    <FiTruck />
                    <span><TransportDisplay type={preview.route.transportType} /></span>
                  </div>
                )}
                {preview.route.totalPrice != null && (
                  <div className="tnp-modal__row">
                    <FiDollarSign />
                    <span>
                      {preview.route.totalPrice > 0
                        ? `${Number(preview.route.totalPrice).toLocaleString("ru-RU")} €`
                        : "Бесплатно"}
                    </span>
                  </div>
                )}
                {preview.inviterName && (
                  <div className="tnp-modal__row">
                    <FiUsers />
                    <span>Организатор: <strong>{preview.inviterName}</strong></span>
                  </div>
                )}
              </div>
            )}

            <div className="tnp-modal__footer">
              {detectType(preview.message) === "invite" &&
               !(currentUserId && preview.senderId && String(preview.senderId) === String(currentUserId)) &&
               !preview._inviteHandled &&
               !preview.responded &&
               (!preview.participantStatus || preview.participantStatus === "PENDING") && (
                <>
                  <button
                    className="tnp-btn tnp-btn--accept"
                    onClick={() => handleRespond(preview, "ACCEPTED")}
                  >
                    <FiCheck /> Принять и добавить маршрут
                  </button>
                  <button
                    className="tnp-btn tnp-btn--reject"
                    onClick={() => handleRespond(preview, "REJECTED")}
                  >
                    <FiX /> Отклонить
                  </button>
                </>
              )}
              <button
                className="tnp-btn tnp-btn--view"
                onClick={() => { setPreview(null); navigate(`/traveler/routes/${preview.routeId}`); }}
              >
                <FiEye /> Открыть маршрут полностью
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}