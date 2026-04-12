package com.delivry.backend.response;

import lombok.Data;
import java.util.List;

@Data
public class GuideStatsResponse {


    private Long    totalUsers;
    private Long    totalRoutes;
    private Long    totalParticipants;
    private Double  averageRating;
    private Long    totalFavorites;
    private Long    guideRoutes;


    private List<MonthlyGrowth> userGrowth;


    private List<MonthCount> routesByMonth;


    private List<TypeCount> transportStats;


    private List<CityCount> topDestinations;


    private List<RoleCount> usersByRole;


    private List<DayCount> activityByDay;


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