import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft, FiDownload, FiMapPin, FiTruck, FiDollarSign,
  FiClock, FiHeart, FiStar, FiTrendingUp, FiUsers, FiFilter,
  FiChevronDown, FiX, FiCheckCircle,
} from "react-icons/fi";
import "../../styles/tour_guide/ReportPage.css";

// ─── Описание доступных отчётов ───────────────────────────────
const REPORT_TYPES = [
  {
    id: "popular_poi",
    icon: <FiMapPin />,
    color: "#0ea5e9",
    bg: "#eff6ff",
    title: "Популярные точки интереса",
    desc: "Топ мест по количеству посещений в маршрутах, средний рейтинг, категории. Поможет понять какие точки привлекают путешественников.",
    hint: "Используй топ-точки как обязательные остановки в своих маршрутах",
  },
  {
    id: "transport_analysis",
    icon: <FiTruck />,
    color: "#16a34a",
    bg: "#f0fdf4",
    title: "Анализ транспорта",
    desc: "Распределение маршрутов по типу транспорта, средняя стоимость и длительность для каждого вида.",
    hint: "Выбирай тип транспорта который пользуется наибольшим спросом",
  },
  {
    id: "price_duration",
    icon: <FiDollarSign />,
    color: "#f59e0b",
    bg: "#fffbeb",
    title: "Стоимость и длительность",
    desc: "Средние, минимальные и максимальные значения цены и продолжительности маршрутов. Ценовые диапазоны по популярности.",
    hint: "Маршруты в среднем ценовом диапазоне выбирают чаще всего",
  },
  {
    id: "destinations",
    icon: <FiTrendingUp />,
    color: "#8b5cf6",
    bg: "#f5f3ff",
    title: "Популярные направления",
    desc: "Топ городов назначения, количество маршрутов в каждое направление, средняя стоимость.",
    hint: "Создай маршрут в топовое направление — спрос уже есть",
  },
  {
    id: "favorites_analysis",
    icon: <FiHeart />,
    color: "#ef4444",
    bg: "#fef2f2",
    title: "Анализ избранного",
    desc: "Какие маршруты чаще всего добавляют в избранное, корреляция между избранным и транспортом/ценой.",
    hint: "Маршруты в избранном — эталон того, что нравится пользователям",
  },
  {
    id: "user_activity",
    icon: <FiUsers />,
    color: "#f97316",
    bg: "#fff7ed",
    title: "Активность пользователей",
    desc: "Рост регистраций по месяцам, распределение по ролям, количество созданных маршрутов на пользователя.",
    hint: "Понимание аудитории помогает подстраивать маршруты под запросы",
  },
  {
    id: "ratings",
    icon: <FiStar />,
    color: "#0d9488",
    bg: "#f0fdfa",
    title: "Рейтинги и отзывы",
    desc: "Средние рейтинги точек по категориям, топ категорий по оценкам путешественников.",
    hint: "Добавляй точки из высокорейтинговых категорий для лучшего опыта",
  },
  {
    id: "full_report",
    icon: <FiCheckCircle />,
    color: "#0f172a",
    bg: "#f8fafc",
    title: "Полный отчёт",
    desc: "Все вышеперечисленные отчёты в одном файле Excel — несколько листов с полной аналитикой.",
    hint: "Идеально для глубокого изучения аналитики перед созданием нового маршрута",
    featured: true,
  },
];

export default function ReportPage() {
  const navigate = useNavigate();

  const [selected,   setSelected]   = useState(new Set());
  const [panelOpen,  setPanelOpen]  = useState(false);
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");
  const [active,     setActive]     = useState({ from: "", to: "" });
  const [generating, setGenerating] = useState(null); // id отчёта
  const [toast,      setToast]      = useState("");

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (id === "full_report") {
        // Полный отчёт — снимаем все остальные
        if (next.has("full_report")) { next.delete("full_report"); }
        else { next.clear(); next.add("full_report"); }
      } else {
        next.delete("full_report");
        if (next.has(id)) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  };

  const applyFilters = () => {
    setActive({ from: dateFrom, to: dateTo });
    setPanelOpen(false);
    showToast("Фильтры применены");
  };

  const resetFilters = () => {
    setDateFrom(""); setDateTo("");
    setActive({ from: "", to: "" });
    setPanelOpen(false);
  };

  const hasFilter = active.from || active.to;

  const download = async (reportId) => {
    setGenerating(reportId);
    try {
      const { default: api } = await import("../../api/axiosClient");
      const p = new URLSearchParams();
      p.append("type", reportId);
      if (active.from) p.append("dateFrom", active.from);
      if (active.to)   p.append("dateTo",   active.to);

      const res = await api.get(`/guide/reports/export?${p}`, { responseType: "blob" });

      const report = REPORT_TYPES.find(r => r.id === reportId);
      const date   = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const name   = `BestTravel_${report?.title.replace(/\s/g,"_")}_${date}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement("a");
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      showToast(`✅ Отчёт «${report?.title}» скачан`);
    } catch {
      showToast("❌ Не удалось сформировать отчёт");
    } finally {
      setGenerating(null);
    }
  };

  const downloadSelected = async () => {
    if (selected.size === 0) { showToast("Выберите хотя бы один отчёт"); return; }
    // Скачиваем по одному
    for (const id of selected) {
      await download(id);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="rp-root">

      {/* ── HEADER ──────────────────────────────────────────── */}
      <header className="rp-header">
        <div className="rp-header__left">
          <button className="rp-back" onClick={() => navigate("/guide")}><FiArrowLeft /></button>
          <div>
                  <h1>
        <img 
          src="https://img.icons8.com/?size=100&id=sWZInDBCyeeC&format=png&color=000000" 
          alt="Отчёты" 
          style={{ width: "28px", height: "28px", marginRight: "8px", verticalAlign: "middle" }} 
        />
        Отчёты
      </h1>
            <p>Аналитика для создания успешных маршрутов</p>
          </div>
        </div>
        <div className="rp-header__right">
          <button
            className={`rp-filter-btn ${panelOpen ? "active" : ""} ${hasFilter ? "has-filter" : ""}`}
            onClick={() => setPanelOpen(v => !v)}
          >
            <FiFilter /> Период {hasFilter && <span className="rp-dot" />}
            <FiChevronDown className={panelOpen ? "rotated" : ""} />
          </button>
          {selected.size > 0 && (
            <button className="rp-download-selected" onClick={downloadSelected}
              disabled={generating !== null}>
              <FiDownload />
              Скачать выбранные ({selected.size})
            </button>
          )}
        </div>
      </header>

      {/* ── FILTER PANEL ────────────────────────────────────── */}
      {panelOpen && (
        <div className="rp-panel">
          <span className="rp-panel__title">Период данных:</span>
          <div className="rp-panel__fields">
            <div className="rp-panel__field">
              <label>С</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="rp-panel__field">
              <label>По</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
          <div className="rp-panel__btns">
            <button className="rp-btn rp-btn--ghost" onClick={resetFilters}><FiX /> Сбросить</button>
            <button className="rp-btn rp-btn--primary" onClick={applyFilters}>Применить</button>
          </div>
        </div>
      )}

      {hasFilter && (
        <div className="rp-chips">
          <span>Период:</span>
          {active.from && <span className="rp-chip">{active.from}</span>}
          {active.from && active.to && <span>—</span>}
          {active.to   && <span className="rp-chip">{active.to}</span>}
          <button onClick={resetFilters} className="rp-chip-x"><FiX /></button>
        </div>
      )}

      {/* ── INTRO ───────────────────────────────────────────── */}
      <div className="rp-intro">
        <div className="rp-intro__text">
          <h2>Используй данные для создания лучших маршрутов</h2>
          <p>Выбери один или несколько отчётов — каждый поможет понять что нравится путешественникам и как создать маршрут который будут выбирать.</p>
        </div>
        
      </div>

      {/* ── REPORT CARDS ────────────────────────────────────── */}
      <div className="rp-grid">
        {REPORT_TYPES.map(report => {
          const isSelected  = selected.has(report.id);
          const isGenerating = generating === report.id;

          return (
            <div
              key={report.id}
              className={`rp-card ${isSelected ? "rp-card--selected" : ""} ${report.featured ? "rp-card--featured" : ""}`}
              style={{ "--rc": report.color, "--rbg": report.bg }}
              onClick={() => toggle(report.id)}
            >
              {/* Selection checkbox */}
              <div className={`rp-card__check ${isSelected ? "checked" : ""}`}>
                {isSelected && <FiCheckCircle />}
              </div>

              {report.featured && (
                <div className="rp-card__badge">Полный отчёт</div>
              )}

              <div className="rp-card__icon">{report.icon}</div>
              <h3 className="rp-card__title">{report.title}</h3>
              <p className="rp-card__desc">{report.desc}</p>
              <div className="rp-card__hint">{report.hint}</div>

              <button
                className="rp-card__btn"
                onClick={e => { e.stopPropagation(); download(report.id); }}
                disabled={isGenerating || generating !== null}
              >
                {isGenerating ? (
                  <><span className="rp-spinner" /> Формируем...</>
                ) : (
                  <><FiDownload /> Скачать Excel</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Toast */}
      {toast && <div className="rp-toast">{toast}</div>}
    </div>
  );
}