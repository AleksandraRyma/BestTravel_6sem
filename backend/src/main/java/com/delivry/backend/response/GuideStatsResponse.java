package com.delivry.backend.response;

import lombok.Data;
import java.util.List;

@Data
public class GuideStatsResponse {

    // ── KPI карточки ──────────────────────────────────────────
    private Long    totalUsers;
    private Long    totalRoutes;
    private Long    totalParticipants;
    private Double  averageRating;
    private Long    totalFavorites;
    private Long    guideRoutes;

    // ── Графики ───────────────────────────────────────────────

    // Рост пользователей и маршрутов по месяцам
    // [{ month: "Янв", users: 12, routes: 3 }, ...]
    private List<MonthlyGrowth> userGrowth;

    // Маршруты по месяцам
    // [{ month: "Янв", count: 3 }, ...]
    private List<MonthCount> routesByMonth;

    // Транспорт
    // [{ type: "CAR", count: 15 }, ...]
    private List<TypeCount> transportStats;

    // Топ направлений
    // [{ city: "Париж", count: 8 }, ...]
    private List<CityCount> topDestinations;

    // Пользователи по ролям
    // [{ role: "TRAVELER", count: 45 }, ...]
    private List<RoleCount> usersByRole;

    // Активность по дням недели
    // [{ day: "Пн", count: 5 }, ...]
    private List<DayCount> activityByDay;

    // ── Inner DTOs ────────────────────────────────────────────

    @Data
    public static class MonthlyGrowth {
        private String month;
        private Long   users;
        private Long   routes;
        public MonthlyGrowth(String month, Long users, Long routes) {
            this.month = month; this.users = users; this.routes = routes;
        }
    }

    @Data
    public static class MonthCount {
        private String month;
        private Long   count;
        public MonthCount(String month, Long count) { this.month = month; this.count = count; }
    }

    @Data
    public static class TypeCount {
        private String type;
        private Long   count;
        public TypeCount(String type, Long count) { this.type = type; this.count = count; }
    }

    @Data
    public static class CityCount {
        private String city;
        private Long   count;
        public CityCount(String city, Long count) { this.city = city; this.count = count; }
    }

    @Data
    public static class RoleCount {
        private String role;
        private Long   count;
        public RoleCount(String role, Long count) { this.role = role; this.count = count; }
    }

    @Data
    public static class DayCount {
        private String day;
        private Long   count;
        public DayCount(String day, Long count) { this.day = day; this.count = count; }
    }
}