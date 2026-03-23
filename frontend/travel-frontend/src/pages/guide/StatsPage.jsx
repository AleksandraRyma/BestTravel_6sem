import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft, FiDownload, FiRefreshCw, FiFilter, FiX,
  FiUsers, FiMap, FiStar, FiTrendingUp, FiSliders,
} from "react-icons/fi";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import "../../styles/tour_guide/StatsPage.css";

const PALETTE = ["#0ea5e9","#16a34a","#f59e0b","#ef4444","#8b5cf6","#f97316","#ec4899","#0d9488"];

const TRANSPORT_LABELS = {
  WALK:"Пешком", BIKE:"Велосипед", CAR:"Авто", TRANSIT:"Транспорт", PLANE:"Самолёт",
};

function fmt(v) {
  if (v == null) return "—";
  return typeof v === "number" ? v.toLocaleString("ru-RU") : v;
}

export default function StatsPage() {
  const navigate = useNavigate();

  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error,     setError]     = useState("");
  const [panelOpen, setPanelOpen] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [active,   setActive]   = useState({ from: "", to: "" });

  // ── Load ──────────────────────────────────────────────────
  const load = async (from = "", to = "") => {
    setLoading(true); setError("");
    try {
      const { default: api } = await import("../../api/axiosClient");
      const p = new URLSearchParams();
      if (from) p.append("dateFrom", from);
      if (to)   p.append("dateTo",   to);
      const res = await api.get(`/guide/stats?${p}`);
      setStats(res.data);
    } catch {
      setError("Не удалось загрузить статистику. Проверьте что бэкенд запущен.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const apply = () => {
    setActive({ from: dateFrom, to: dateTo });
    setPanelOpen(false);
    load(dateFrom, dateTo);
  };

  const reset = () => {
    setDateFrom(""); setDateTo("");
    setActive({ from: "", to: "" });
    setPanelOpen(false);
    load("", "");
  };

  // ── Export Excel ─────────────────────────────────────────
  const exportExcel = async () => {
    setExporting(true);
    try {
      const { default: api } = await import("../../api/axiosClient");
      const p = new URLSearchParams();
      if (active.from) p.append("dateFrom", active.from);
      if (active.to)   p.append("dateTo",   active.to);
      const res = await api.get(`/guide/stats/export?${p}`, { responseType: "blob" });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `BestTravel_Отчёт_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a);
      a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert("Не удалось сформировать отчёт"); }
    finally  { setExporting(false); }
  };

  const hasFilter = active.from || active.to;

  const kpis = [
    { icon: <FiUsers />,      color: "#0ea5e9", label: "Пользователей",   val: stats?.totalUsers        },
    { icon: <FiMap />,        color: "#16a34a", label: "Маршрутов",       val: stats?.totalRoutes       },
    { icon: <FiUsers />,      color: "#f59e0b", label: "Участников",      val: stats?.totalParticipants },
    { icon: <FiStar />,       color: "#8b5cf6", label: "Ср. рейтинг",     val: stats?.averageRating?.toFixed(1) },
    { icon: <FiTrendingUp />, color: "#ef4444", label: "В избранном",     val: stats?.totalFavorites    },
    { icon: <FiMap />,        color: "#0d9488", label: "Маршрутов гидов", val: stats?.guideRoutes       },
  ];

  return (
    <div className="sp-root">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sp-header">
        <div className="sp-header__left">
          <button className="sp-back" onClick={() => navigate("/guide")}><FiArrowLeft /></button>
          <div>
            <h1>📊 Статистика</h1>
            <p>BestTravel — аналитика платформы</p>
          </div>
        </div>
        <div className="sp-header__right">
          <button className="sp-icon-btn" title="Обновить"
            onClick={() => load(active.from, active.to)}>
            <FiRefreshCw />
          </button>
          <button
            className={`sp-filter-btn ${panelOpen ? "active" : ""} ${hasFilter ? "has-filter" : ""}`}
            onClick={() => setPanelOpen(v => !v)}
          >
            <FiSliders /> Фильтры {hasFilter && <span className="sp-dot" />}
          </button>
          <button className="sp-export-btn" onClick={exportExcel} disabled={exporting}>
            <FiDownload /> {exporting ? "Формируем..." : "Скачать Excel"}
          </button>
        </div>
      </header>

      {/* ── Filter panel ───────────────────────────────────── */}
      {panelOpen && (
        <div className="sp-panel">
          <div className="sp-panel__title"><FiFilter /> Период</div>
          <div className="sp-panel__fields">
            <div className="sp-panel__field">
              <label>С</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="sp-panel__field">
              <label>По</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
          <div className="sp-panel__btns">
            <button className="sp-btn sp-btn--ghost" onClick={reset}><FiX /> Сбросить</button>
            <button className="sp-btn sp-btn--primary" onClick={apply}>Применить</button>
          </div>
        </div>
      )}

      {hasFilter && (
        <div className="sp-chips">
          <span>Период:</span>
          {active.from && <span className="sp-chip">{active.from}</span>}
          {active.from && active.to && <span>—</span>}
          {active.to   && <span className="sp-chip">{active.to}</span>}
          <button onClick={reset} className="sp-chip-x"><FiX /></button>
        </div>
      )}

      {/* ── States ─────────────────────────────────────────── */}
      {error ? (
        <div className="sp-error">
          <span>⚠️</span>
          <div><strong>Ошибка</strong><p>{error}</p></div>
          <button onClick={() => load(active.from, active.to)}>Повторить</button>
        </div>
      ) : loading ? (
        <div className="sp-loading">
          <div className="sp-dots"><span/><span/><span/></div>
          <p>Загружаем статистику...</p>
        </div>
      ) : (
        <div className="sp-body">

          {/* KPIs */}
          <div className="sp-kpis">
            {kpis.map((k, i) => (
              <div key={i} className="sp-kpi" style={{"--c": k.color}}>
                <div className="sp-kpi__icon">{k.icon}</div>
                <span className="sp-kpi__num">{fmt(k.val)}</span>
                <span className="sp-kpi__label">{k.label}</span>
              </div>
            ))}
          </div>

          {/* Row 1: user growth + transport */}
          <div className="sp-row">
            <div className="sp-card sp-card--wide">
              <h3>👥 Рост пользователей и маршрутов</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={stats?.userGrowth ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{fontSize:12, fill:"#64748b"}} />
                  <YAxis tick={{fontSize:12, fill:"#64748b"}} />
                  <Tooltip contentStyle={{borderRadius:10, fontSize:13}} />
                  <Legend wrapperStyle={{fontSize:13}} />
                  <Line type="monotone" dataKey="users"  name="Пользователи" stroke="#0ea5e9" strokeWidth={2.5} dot={{r:4}} />
                  <Line type="monotone" dataKey="routes" name="Маршруты"     stroke="#16a34a" strokeWidth={2.5} dot={{r:4}} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="sp-card">
              <h3>🚌 Транспорт</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={stats?.transportStats ?? []} dataKey="count" nameKey="type"
                    cx="50%" cy="50%" outerRadius={90}
                    label={({name, percent}) => `${TRANSPORT_LABELS[name]||name} ${(percent*100).toFixed(0)}%`}
                    labelLine={false}>
                    {(stats?.transportStats ?? []).map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, TRANSPORT_LABELS[n] || n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: routes by month + top destinations */}
          <div className="sp-row">
            <div className="sp-card">
              <h3>🗺️ Маршруты по месяцам</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats?.routesByMonth ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{fontSize:11, fill:"#64748b"}} />
                  <YAxis tick={{fontSize:11, fill:"#64748b"}} />
                  <Tooltip contentStyle={{borderRadius:10, fontSize:13}} />
                  <Bar dataKey="count" name="Маршрутов" fill="#0ea5e9" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="sp-card">
              <h3>📍 Топ направлений</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats?.topDestinations ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{fontSize:11, fill:"#64748b"}} />
                  <YAxis dataKey="city" type="category" width={90} tick={{fontSize:11, fill:"#64748b"}} />
                  <Tooltip contentStyle={{borderRadius:10, fontSize:13}} />
                  <Bar dataKey="count" name="Маршрутов" fill="#16a34a" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 3: users by role + activity by day */}
          <div className="sp-row">
            <div className="sp-card">
              <h3>🎭 Пользователи по ролям</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats?.usersByRole ?? []} dataKey="count" nameKey="role"
                    cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    label={({name, value}) => `${name}: ${value}`}>
                    {(stats?.usersByRole ?? []).map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{fontSize:12}} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="sp-card">
              <h3>📅 Маршруты по дням недели</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats?.activityByDay ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{fontSize:11, fill:"#64748b"}} />
                  <YAxis tick={{fontSize:11, fill:"#64748b"}} />
                  <Tooltip contentStyle={{borderRadius:10, fontSize:13}} />
                  <Bar dataKey="count" name="Маршрутов" fill="#f59e0b" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Export CTA */}
          <div className="sp-cta">
            <div className="sp-cta__text">
              <h3>📥 Сформировать Excel-отчёт</h3>
              <p>Включает все данные, дату формирования, имя составителя и выбранный период</p>
            </div>
            <button className="sp-export-btn sp-export-btn--lg" onClick={exportExcel} disabled={exporting}>
              <FiDownload /> {exporting ? "Формируем..." : "Скачать отчёт"}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}