import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MapContainer, TileLayer, Marker, Polyline, Popup,
  useMapEvents, useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FiArrowLeft, FiTrash2, FiMapPin, FiUsers, FiSend,
  FiClock, FiDollarSign, FiTruck, FiCalendar, FiSearch,
  FiLoader, FiCheck, FiX, FiChevronUp, FiChevronDown, FiInfo,
} from "react-icons/fi";
import {
  createRoute, updateRoute, getRouteById,
  geocodeAddress, calculateOsrmRoute, inviteParticipant, getWeatherPreview,
} from "../../api/travelerApi";
import "../../styles/traveler/TravelerCreateRoutePage.css";


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const makeNumberedIcon = (num, color = "#0ea5e9") =>
  L.divIcon({
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;
      border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:700;font-size:12px;">${num}</div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });



const TRANSPORT_OPTIONS = [
  { value: "WALK",    label: "Пешком",    icon: "https://img.icons8.com/ios/50/000000/walking.png", costPer100km: 0 },
  { value: "BIKE",    label: "Велосипед", icon: "https://img.icons8.com/ios/50/000000/bicycle.png", costPer100km: 0 },
  { value: "CAR",     label: "Авто",      icon: "https://img.icons8.com/ios/50/000000/car.png", costPer100km: 8 },
  { value: "TRANSIT", label: "Транспорт", icon: "https://img.icons8.com/ios/50/000000/bus.png", costPer100km: 3 },
  { value: "PLANE",   label: "Самолёт",   icon: "https://img.icons8.com/ios/50/000000/airplane-take-off.png", costPer100km: 15 },
];

const OSRM_PROFILE = {
  WALK: "foot", BIKE: "cycling", CAR: "driving", TRANSIT: "driving", PLANE: "driving",
};


function toDateStr(val) {
  if (!val) return "";

  
  if (Array.isArray(val)) {
    const [y, m, d] = val;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }


  if (typeof val === "string") {
    return val.slice(0, 10);
  }

  return "";
}


function toDateTimeLocal(val) {
  if (!val) return "";

  if (Array.isArray(val)) {
    const [y, mo, d, h = 0, mi = 0] = val;
    return `${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}T${String(h).padStart(2,"0")}:${String(mi).padStart(2,"0")}`;
  }

  if (typeof val === "string") {
    return val.slice(0, 16);
  }

  return "";
}


function extractErrorMessage(e) {
 
  if (e?.response?.data) {
    const d = e.response.data;

    if (typeof d === "object" && d !== null) {
      return d.message || d.error || `Ошибка сервера (${d.status || e.response.status})`;
    }
    if (typeof d === "string") return d;
  }
  
  if (e?.message) return e.message;
  return "Неизвестная ошибка";
}


function weatherCodeMeta(code) {
  if ([0].includes(code)) return { icon: "☀", label: "Ясно" };
  if ([1, 2].includes(code)) return { icon: "⛅", label: "Переменная облачность" };
  if ([3].includes(code)) return { icon: "☁", label: "Пасмурно" };
  if ([45, 48].includes(code)) return { icon: "🌫", label: "Туман" };
  if ([51, 53, 55, 56, 57].includes(code)) return { icon: "🌦", label: "Морось" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { icon: "🌧", label: "Дождь" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: "🌨", label: "Снег" };
  if ([95, 96, 99].includes(code)) return { icon: "⛈", label: "Гроза" };
  return { icon: "🌤", label: "Погода" };
}

function normalizeWeatherDate(value) {
  if (!value || typeof value !== "string") return "";
  return value.slice(0, 10);
}

function getPointWeatherDate(point, routeStartDate) {
  return normalizeWeatherDate(point?.plannedTime) || normalizeWeatherDate(routeStartDate);
}

function isForecastDateAvailable(dateStr) {
  if (!dateStr) return false;

  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((target - today) / 86400000);
  return diffDays >= 0 && diffDays <= 15;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

function MapFitter({ points }) {
  const map    = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current || !points || points.length < 1) return;

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lon], 12);
    } else {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lon]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
    fitted.current = true;
  }, [points, map]);

  return null;
}


export default function TravelerCreateRoutePage() {
  const navigate        = useNavigate();
  const { id: routeId } = useParams();
  const isEdit          = Boolean(routeId);

  const [initLoading, setInitLoading] = useState(isEdit);
  const [initError,   setInitError]   = useState("");

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [startDate,   setStartDate]   = useState("");
  const [endDate,     setEndDate]     = useState("");
  const [transport,   setTransport]   = useState("CAR");
  const [budgetLimit, setBudgetLimit] = useState("");


  const [points,        setPoints]        = useState([]);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeSearch,  setActiveSearch]  = useState(false);
  const [weatherByPoint, setWeatherByPoint] = useState({});

  const [routeGeometry, setRouteGeometry] = useState(null);
  const [routeStats,    setRouteStats]    = useState(null);
  const [calcLoading,   setCalcLoading]   = useState(false);

  const [existingParticipants, setExistingParticipants] = useState([]);
  const [inviteEmail,   setInviteEmail]   = useState("");
  const [inviteError,   setInviteError]   = useState("");
  const [pendingInvites, setPendingInvites] = useState([]);

  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState("");   // всегда строка!
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedId,     setSavedId]     = useState(null);
  const [activeTab,   setActiveTab]   = useState("map");


  useEffect(() => {
    if (!isEdit) return;

    setInitLoading(true);
    setInitError("");

    getRouteById(routeId)
      .then(data => {

        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setTransport(data.transportType ?? "CAR");
        setBudgetLimit(data.budgetLimit != null ? String(data.budgetLimit) : "");

        setStartDate(toDateStr(data.startDate));
        setEndDate(toDateStr(data.endDate));

        if (Array.isArray(data.points) && data.points.length > 0) {
          const sorted = [...data.points].sort((a, b) => (a.visitOrder ?? 0) - (b.visitOrder ?? 0));
          setPoints(sorted.map((p, i) => ({
            id:          p.id ?? Date.now() + i,
            name:        p.name        ?? "",
            description: p.description ?? "",
            lat:         Number(p.latitude),
            lon:         Number(p.longitude),
            category:    p.category    ?? "",
            plannedTime: toDateTimeLocal(p.plannedTime),
          })));
        }

        if (Array.isArray(data.participants) && data.participants.length > 0) {
          setExistingParticipants(data.participants);
        }
      })
      .catch(e => {
        setInitError(extractErrorMessage(e));
      })
      .finally(() => setInitLoading(false));
  }, [routeId, isEdit]);

  useEffect(() => {
    if (points.length < 2) {
      setRouteGeometry(null);
      setRouteStats(null);
      return;
    }
    const timer = setTimeout(async () => {
      setCalcLoading(true);
      try {
        const profile = OSRM_PROFILE[transport] || "driving";
        const data    = await calculateOsrmRoute(points, profile);
        if (data.routes?.[0]) {
          const r      = data.routes[0];
          const coords = r.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
          setRouteGeometry(coords);

          const distKm = r.distance / 1000;
          const durH   = r.duration / 3600;
          const opt    = TRANSPORT_OPTIONS.find(t => t.value === transport) ?? TRANSPORT_OPTIONS[2];
          const cost   = distKm * (opt.costPer100km / 100);

          setRouteStats({
            distanceKm: distKm.toFixed(1),
            durationH:  durH.toFixed(1),
            costEur:    cost.toFixed(2),
          });
        }
      } catch {
        setRouteGeometry(null);
      } finally {
        setCalcLoading(false);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [points, transport]);

  useEffect(() => {
    points.forEach((point) => {
      if (!Number.isFinite(point.lat) || !Number.isFinite(point.lon)) return;

      const weatherDate = getPointWeatherDate(point, startDate);
      const requestKey = `${point.lat}:${point.lon}:${weatherDate || "no-date"}`;
      const currentState = weatherByPoint[point.id];

      if (currentState?.requestKey === requestKey &&
          (currentState.loaded || currentState.loading || currentState.noForecast)) {
        return;
      }

      if (!weatherDate) {
        setWeatherByPoint((prev) => ({
          ...prev,
          [point.id]: {
            loading: false,
            loaded: false,
            error: false,
            noForecast: true,
            reason: "Выберите дату маршрута или время посещения точки",
            requestKey,
          },
        }));
        return;
      }

      if (!isForecastDateAvailable(weatherDate)) {
        setWeatherByPoint((prev) => ({
          ...prev,
          [point.id]: {
            loading: false,
            loaded: false,
            error: false,
            noForecast: true,
            reason: "Прогноз доступен примерно на 16 дней вперёд",
            targetDate: weatherDate,
            requestKey,
          },
        }));
        return;
      }

      setWeatherByPoint((prev) => ({
        ...prev,
        [point.id]: {
          ...prev[point.id],
          loading: true,
          loaded: false,
          error: false,
          noForecast: false,
          targetDate: weatherDate,
          requestKey,
        },
      }));

      getWeatherPreview(point.lat, point.lon, weatherDate)
        .then((data) => {
          const current = data?.current ?? {};
          const daily = data?.daily ?? {};
          const weatherCode = daily.weather_code?.[0] ?? current.weather_code;
          const meta = weatherCodeMeta(weatherCode);

          setWeatherByPoint((prev) => ({
            ...prev,
            [point.id]: {
              loading: false,
              loaded: true,
              error: false,
              noForecast: false,
              targetDate: weatherDate,
              requestKey,
              icon: meta.icon,
              label: meta.label,
              temp: current.temperature_2m,
              apparent: current.apparent_temperature,
              wind: daily.wind_speed_10m_max?.[0] ?? current.wind_speed_10m,
              isDay: Boolean(current.is_day),
              min: daily.temperature_2m_min?.[0],
              max: daily.temperature_2m_max?.[0],
            },
          }));
        })
        .catch(() => {
          setWeatherByPoint((prev) => ({
            ...prev,
            [point.id]: {
              loading: false,
              loaded: false,
              error: true,
              noForecast: false,
              targetDate: weatherDate,
              requestKey,
            },
          }));
        });
    });
  }, [points, weatherByPoint, startDate]);


  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setActiveSearch(true);
    try {
      setSearchResults(await geocodeAddress(searchQuery));
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  const addPointFromSearch = (result) => {
    setPoints(prev => [...prev, {
      id:          Date.now(),
      name:        result.display_name.split(",")[0],
      description: "",
      lat:         parseFloat(result.lat),
      lon:         parseFloat(result.lon),
      category:    result.type ?? "",
      plannedTime: "",
    }]);
    setSearchQuery("");
    setSearchResults([]);
    setActiveSearch(false);
  };

  const addPointFromMap = (latlng) => {
    setPoints(prev => [...prev, {
      id:          Date.now(),
      name:        `Точка ${prev.length + 1}`,
      description: "",
      lat:         latlng.lat,
      lon:         latlng.lng,
      category:    "",
      plannedTime: "",
    }]);
  };

  const removePoint  = (id)            => setPoints(prev => prev.filter(p => p.id !== id));
  const updatePoint  = (id, field, val) =>
    setPoints(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  const movePoint = (idx, dir) => {
    const next = [...points], swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setPoints(next);
  };

 
  const addInvite = () => {
    const email = inviteEmail.trim();
    if (!email) return;
    if (pendingInvites.includes(email)) { setInviteError("Уже добавлен"); return; }
    setPendingInvites(prev => [...prev, email]);
    setInviteEmail("");
    setInviteError("");
  };

 
  const durationDays = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000) + 1)
    : null;
  const estimatedCost = routeStats ? parseFloat(routeStats.costEur) : 0;
  const overBudget    = budgetLimit && estimatedCost > parseFloat(budgetLimit);


  const handleSave = async () => {
    if (!title.trim())          { setSaveError("Введите название маршрута"); return; }
    if (!startDate || !endDate) { setSaveError("Выберите даты"); return; }
    if (points.length < 1)      { setSaveError("Добавьте хотя бы одну точку"); return; }

    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        title,
        description,
        startLocation: points[0]?.name ?? "",
        endLocation:   points[points.length - 1]?.name ?? "",
        startDate,
        endDate,
        transportType: transport,
        budgetLimit:   budgetLimit ? parseFloat(budgetLimit) : null,
        totalPrice:    routeStats  ? parseFloat(routeStats.costEur) : null,
        points: points.map((p, i) => ({
          name:        p.name,
          description: p.description,
          latitude:    p.lat,
          longitude:   p.lon,
          category:    p.category,
          visitOrder:  i + 1,
          plannedTime: p.plannedTime || null,
        })),
      };

      let savedRoute;
      if (isEdit) {
        savedRoute = await updateRoute(routeId, payload);
      } else {
        savedRoute = await createRoute(payload);
      }

      const finalId = savedRoute?.id ?? routeId;
      setSavedId(finalId);

      for (const email of pendingInvites) {
        try { await inviteParticipant(finalId, email); } catch {}
      }

      setSaveSuccess(true);
    } catch (e) {
    
      setSaveError(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };


  if (initLoading) return (
    <div className="crc-root" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", color:"#64748b" }}>
        <FiLoader style={{ fontSize:32, animation:"spin 1s linear infinite" }} />
        <p style={{ marginTop:12, fontFamily:"sans-serif" }}>Загружаем маршрут...</p>
      </div>
    </div>
  );

  if (initError) return (
    <div className="crc-root" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <p style={{ color:"#ef4444", marginBottom:16 }}>{initError}</p>
        <button className="crc-btn crc-btn--primary" onClick={() => navigate(-1)}>← Назад</button>
      </div>
    </div>
  );

  if (saveSuccess) return (
    <div className="crc-success">
      <div className="crc-success__card">
        <div className="crc-success__icon">{isEdit ? "✅" : "🎉"}</div>
        <h2>{isEdit ? "Маршрут обновлён!" : "Маршрут создан!"}</h2>
        <p>«{title}» успешно сохранён</p>
        {pendingInvites.length > 0 && (
          <p className="crc-success__invites">
            Приглашения отправлены: {pendingInvites.join(", ")}
          </p>
        )}
        <div className="crc-success__actions">
          <button className="crc-btn crc-btn--primary"
            onClick={() => navigate(`/traveler/routes/${savedId}`)}>
            Открыть маршрут
          </button>
          <button className="crc-btn crc-btn--ghost"
            onClick={() => navigate("/traveler/my-routes")}>
            Мои маршруты
          </button>
        </div>
      </div>
    </div>
  );

  const mapCenter = points.length > 0 ? [points[0].lat, points[0].lon] : [55.75, 37.61];

  
  return (
    <div className="crc-root">

      {}
      <header className="crc-header">
        <button className="crc-back" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <div className="crc-header__title">
          <h1>{isEdit ? "Редактировать маршрут" : "Создать маршрут"}</h1>
          {durationDays && (
            <span className="crc-header__badge">
              {durationDays} {durationDays === 1 ? "день" : durationDays < 5 ? "дня" : "дней"}
            </span>
          )}
        </div>
        <button
          className={`crc-btn crc-btn--save ${saving ? "crc-btn--loading" : ""}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <FiLoader className="spin" /> : <FiCheck />}
          {saving ? "Сохранение..." : isEdit ? "Обновить" : "Сохранить"}
        </button>
      </header>

      {}
      {saveError && (
        <div className="crc-error-bar">
          <FiInfo /> {saveError}
          <button onClick={() => setSaveError("")}><FiX /></button>
        </div>
      )}

      <div className="crc-body">

        {}
        <aside className="crc-panel">
          <div className="crc-tabs">
            {[
              { id: "map",          icon: <FiMapPin />, label: "Точки" },
              { id: "settings",     icon: <FiTruck />,  label: "Настройки" },
              { id: "participants", icon: <FiUsers />,  label: "Участники" },
            ].map(tab => (
              <button
                key={tab.id}
                className={`crc-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {}
          {activeTab === "map" && (
            <div className="crc-tab-content">
              <div className="crc-search-box">
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="Поиск места..."
                />
                <button onClick={handleSearch} disabled={searchLoading}>
                  {searchLoading ? <FiLoader className="spin" /> : <FiSearch />}
                </button>
              </div>

              {activeSearch && searchResults.length > 0 && (
                <div className="crc-search-results">
                  {searchResults.map((r, i) => (
                    <button key={i} className="crc-search-result"
                      onClick={() => addPointFromSearch(r)}>
                      <FiMapPin />
                      <span>{r.display_name}</span>
                    </button>
                  ))}
                </div>
              )}

              <p className="crc-hint">
                <FiMapPin /> Нажмите на карту для добавления точки
              </p>

              <div className="crc-points">
                {points.length === 0 && (
                  <div className="crc-points__empty">
                    Добавьте точки через поиск или нажатие на карту
                  </div>
                )}
                {points.map((pt, idx) => (
                  <div key={pt.id} className="crc-point-card">
                    <div className="crc-point-card__num"
                      style={{
                        background: idx === 0 ? "#22c55e"
                          : idx === points.length - 1 ? "#ef4444"
                          : "#0ea5e9"
                      }}>
                      {idx + 1}
                    </div>
                    <div className="crc-point-card__body">
                      <input
                        className="crc-point-card__name"
                        value={pt.name}
                        onChange={e => updatePoint(pt.id, "name", e.target.value)}
                        placeholder="Название точки"
                      />
                      <input
                        className="crc-point-card__desc"
                        value={pt.description}
                        onChange={e => updatePoint(pt.id, "description", e.target.value)}
                        placeholder="Описание"
                      />
                      <div className="crc-point-card__row">
                        <select
                          value={pt.category}
                          onChange={e => updatePoint(pt.id, "category", e.target.value)}
                        >
                          <option value="">Категория</option>
                          <option value="Музеи">🏛 Музеи</option>
                          <option value="Природа">🌿 Природа</option>
                          <option value="Гастрономия">🍽 Гастрономия</option>
                          <option value="История">🏰 История</option>
                          <option value="Шопинг">🛍 Шопинг</option>
                          <option value="Архитектура">🏛 Архитектура</option>
                          <option value="Пляж">🏖 Пляж</option>
                        </select>
                        <input
                          type="datetime-local"
                          value={pt.plannedTime}
                          onChange={e => updatePoint(pt.id, "plannedTime", e.target.value)}
                          className="crc-point-card__time"
                        />
                      </div>
                      {weatherByPoint[pt.id]?.loading && (
                        <div className="crc-weather-card crc-weather-card--loading">
                          <FiLoader className="spin" />
                          <span>Загружаем погоду...</span>
                        </div>
                      )}
                      {weatherByPoint[pt.id]?.loaded && (
                        <div className={`crc-weather-card ${weatherByPoint[pt.id].isDay ? "" : "night"}`}>
                          <div className="crc-weather-card__main">
                            <span className="crc-weather-card__icon">{weatherByPoint[pt.id].icon}</span>
                            <div>
                              <strong>
                                {Number.isFinite(weatherByPoint[pt.id].temp)
                                  ? `${Math.round(weatherByPoint[pt.id].temp)}°C`
                                  : `${Math.round(weatherByPoint[pt.id].min)}° / ${Math.round(weatherByPoint[pt.id].max)}°`}
                              </strong>
                              <p>{weatherByPoint[pt.id].label}</p>
                            </div>
                          </div>
                          <div className="crc-weather-card__meta">
                            <span>Дата: {weatherByPoint[pt.id].targetDate}</span>
                            {Number.isFinite(weatherByPoint[pt.id].apparent) && (
                              <span>Ощущается {Math.round(weatherByPoint[pt.id].apparent)}°</span>
                            )}
                            <span>{Math.round(weatherByPoint[pt.id].min)}° / {Math.round(weatherByPoint[pt.id].max)}°</span>
                            <span>Ветер {Math.round(weatherByPoint[pt.id].wind)} км/ч</span>
                          </div>
                        </div>
                      )}
                      {weatherByPoint[pt.id]?.noForecast && (
                        <div className="crc-weather-card crc-weather-card--error">
                          {weatherByPoint[pt.id].targetDate
                            ? `${weatherByPoint[pt.id].targetDate}: ${weatherByPoint[pt.id].reason}`
                            : weatherByPoint[pt.id].reason}
                        </div>
                      )}
                      {weatherByPoint[pt.id]?.error && (
                        <div className="crc-weather-card crc-weather-card--error">
                          Не удалось получить погоду для этой точки
                        </div>
                      )}
                    </div>
                    <div className="crc-point-card__actions">
                      <button onClick={() => movePoint(idx, -1)} disabled={idx === 0}>
                        <FiChevronUp />
                      </button>
                      <button onClick={() => movePoint(idx, 1)}
                        disabled={idx === points.length - 1}>
                        <FiChevronDown />
                      </button>
                      <button className="crc-point-card__del"
                        onClick={() => removePoint(pt.id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {}
          {activeTab === "settings" && (
            <div className="crc-tab-content">
              <div className="crc-form-group">
                <label>Название маршрута *</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Например: Тур по Европе" />
              </div>
              <div className="crc-form-group">
                <label>Описание</label>
                <textarea value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Расскажите о маршруте..." rows={3} />
              </div>
              <div className="crc-form-row">
                <div className="crc-form-group">
                  <label><FiCalendar /> Дата начала</label>
                  <input type="date" value={startDate}
                    onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="crc-form-group">
                  <label><FiCalendar /> Дата окончания</label>
                  <input type="date" value={endDate}
                    onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>

              <div className="crc-form-group">
                <label><FiTruck /> Тип транспорта</label>
                {
                
                <div className="crc-transport-grid">
  {TRANSPORT_OPTIONS.map(t => (
    <button 
      key={t.value}
      className={`crc-transport-btn ${transport === t.value ? "active" : ""}`}
      onClick={() => setTransport(t.value)}
    >
      <span className="crc-transport-btn__icon">
        <img 
          src={t.icon} 
          alt={t.label} 
          style={{ width: "20px", height: "20px", objectFit: "contain" }}
        />
      </span>
      <span>{t.label}</span>
    </button>
  ))}
</div>}
              </div>

              <div className="crc-form-group">
                <label><FiDollarSign /> Лимит бюджета (€)</label>
                <input type="number" value={budgetLimit}
                  onChange={e => setBudgetLimit(e.target.value)}
                  placeholder="Например: 500" min="0" />
              </div>

              {routeStats && (
                <div className={`crc-stats-card ${overBudget ? "over-budget" : ""}`}>
                  <h4>
  <img
    src="https://img.icons8.com/?size=100&id=7885&format=png&color=000000"
    alt="иконка"
    style={{ width: "20px", height: "20px", verticalAlign: "middle", marginRight: "5px" }}
  />
  Расчёт маршрута
</h4>

                  <div className="crc-stats-grid">
                    <div className="crc-stat">
                      <span>📍 Расстояние</span>
                      <strong>{routeStats.distanceKm} км</strong>
                    </div>
                    <div className="crc-stat">
                      <span><FiClock /> Время</span>
                      <strong>{routeStats.durationH} ч</strong>
                    </div>
                    <div className="crc-stat">
                      <span><FiDollarSign /> Стоимость</span>
                      <strong className={overBudget ? "text-red" : "text-green"}>
                        {routeStats.costEur} €
                      </strong>
                    </div>
                    {durationDays && (
                      <div className="crc-stat">
                        <span><FiCalendar /> Дней</span>
                        <strong>{durationDays}</strong>
                      </div>
                    )}
                  </div>
                  {overBudget && (
                    <div className="crc-stats-card__warning">
                      ⚠️ Превышает лимит ({budgetLimit} €)
                    </div>
                  )}
                  {calcLoading && (
                    <div className="crc-stats-card__loading">Пересчёт...</div>
                  )}
                </div>
              )}
              {calcLoading && !routeStats && (
                <div className="crc-calculating">
                  <FiLoader className="spin" /> Рассчитываем маршрут...
                </div>
              )}
            </div>
          )}

          {}
          {activeTab === "participants" && (
            <div className="crc-tab-content">
              {isEdit && existingParticipants.length > 0 && (
                <div className="crc-existing-participants">
                  <p className="crc-hint" style={{ marginBottom: 8 }}>
                    Текущие участники:
                  </p>
                  {existingParticipants.map(p => (
                    <div key={p.userId} className="crc-invite-item">
                      <FiUsers />
                      <span style={{ flex: 1 }}>{p.fullName}</span>
                      <span className={`crc-invite-item__badge ${
                        p.status === "ACCEPTED" ? "accepted"
                        : p.status === "REJECTED" ? "rejected"
                        : "pending"
                      }`}>
                        {p.status === "ACCEPTED" ? "Принят"
                         : p.status === "REJECTED" ? "Отклонил"
                         : "Ожидание"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <p className="crc-hint">Пригласить новых участников:</p>
              <div className="crc-invite-row">
                <input value={inviteEmail} type="email"
                  onChange={e => { setInviteEmail(e.target.value); setInviteError(""); }}
                  onKeyDown={e => e.key === "Enter" && addInvite()}
                  placeholder="Email участника" />
                <button className="crc-btn crc-btn--primary" onClick={addInvite}>
                  <FiSend />
                </button>
              </div>
              {inviteError && <p className="crc-field-error">{inviteError}</p>}

              {pendingInvites.length > 0 && (
                <div className="crc-invite-list">
                  <h4>Будут приглашены после сохранения:</h4>
                  {pendingInvites.map((email, i) => (
                    <div key={i} className="crc-invite-item">
                      <FiUsers />
                      <span>{email}</span>
                      <span className="crc-invite-item__badge pending">Ожидание</span>
                      <button onClick={() =>
                        setPendingInvites(prev => prev.filter((_, j) => j !== i))}>
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {pendingInvites.length === 0 && existingParticipants.length === 0 && (
                <div className="crc-points__empty">Участники ещё не добавлены</div>
              )}
            </div>
          )}
        </aside>

        {}
        <div className="crc-map-wrapper">
          <MapContainer
            center={mapCenter}
            zoom={points.length > 0 ? 8 : 5}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {}
            <MapFitter points={points} />

            {}
            <MapClickHandler onMapClick={addPointFromMap} />

            {}
            {routeGeometry && (
              <Polyline
                positions={routeGeometry}
                pathOptions={{ color: "#0ea5e9", weight: 4, opacity: 0.85 }}
              />
            )}

            {}
            {points.map((pt, idx) => (
              <Marker
                key={`${pt.id}-${pt.lat}-${pt.lon}`}
                position={[pt.lat, pt.lon]}
                icon={makeNumberedIcon(
                  idx + 1,
                  idx === 0 ? "#22c55e"
                  : idx === points.length - 1 ? "#ef4444"
                  : "#0ea5e9"
                )}
              >
                <Popup>
                  <strong>{pt.name}</strong>
                  {pt.description && <p style={{ margin: "4px 0 0" }}>{pt.description}</p>}
                  {weatherByPoint[pt.id]?.loaded && (
                    <div className={`crc-popup-weather ${weatherByPoint[pt.id].isDay ? "" : "night"}`}>
                      <div className="crc-popup-weather__top">
                        <span>{weatherByPoint[pt.id].icon}</span>
                        <strong>
                          {Number.isFinite(weatherByPoint[pt.id].temp)
                            ? `${Math.round(weatherByPoint[pt.id].temp)}°C`
                            : `${Math.round(weatherByPoint[pt.id].min)}° / ${Math.round(weatherByPoint[pt.id].max)}°`}
                        </strong>
                      </div>
                      <div className="crc-popup-weather__label">{weatherByPoint[pt.id].label}</div>
                      <div className="crc-popup-weather__meta">
                        {weatherByPoint[pt.id].targetDate} • {Math.round(weatherByPoint[pt.id].min)}° / {Math.round(weatherByPoint[pt.id].max)}° • ветер {Math.round(weatherByPoint[pt.id].wind)} км/ч
                      </div>
                    </div>
                  )}
                  {weatherByPoint[pt.id]?.noForecast && (
                    <div className="crc-popup-weather">
                      <div className="crc-popup-weather__label">
                        {weatherByPoint[pt.id].targetDate
                          ? `${weatherByPoint[pt.id].targetDate}: ${weatherByPoint[pt.id].reason}`
                          : weatherByPoint[pt.id].reason}
                      </div>
                    </div>
                  )}
                  {pt.category    && <p style={{ margin: "4px 0 0", color: "#64748b" }}>📌 {pt.category}</p>}
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {points.length >= 2 && (
            <div className="crc-map-legend">
              <div className="crc-map-legend__item"><span className="dot green" /> Старт</div>
              <div className="crc-map-legend__item"><span className="dot blue" /> Точки</div>
              <div className="crc-map-legend__item"><span className="dot red" /> Финиш</div>
              {calcLoading && (
                <div className="crc-map-legend__item">
                  <FiLoader className="spin" /> Расчёт...
                </div>
              )}
            </div>
          )}

          {
          routeStats && !calcLoading && (
  <div className="crc-map-stats">
    <span>📍 {routeStats.distanceKm} км</span>
    <span><FiClock /> {routeStats.durationH} ч</span>
    <span>💶 {routeStats.costEur} €</span>
    {(() => {
      const opt = TRANSPORT_OPTIONS.find(t => t.value === transport);
      return opt ? (
        <span>
          <img 
            src={opt.icon} 
            alt={opt.label} 
            style={{ width: "14px", height: "14px", verticalAlign: "middle", marginRight: "4px" }}
          />
          {opt.label}
        </span>
      ) : null;
    })()}
  </div>
)
          }

          
        </div>
      </div>
    </div>
  );
}
