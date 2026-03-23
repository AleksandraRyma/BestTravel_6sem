package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.repository.*;
import com.delivry.backend.response.GuideStatsResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.*;
import java.util.*;
import java.util.stream.*;

@Service
@Transactional(readOnly = true)
public class GuideStatsService {

    private static final long GUIDE_ROLE_ID = 2L;

    private final UserRepository             userRepository;
    private final RouteRepository            routeRepository;
    private final RouteParticipantRepository participantRepository;
    private final FavoriteRouteRepository    favoriteRepository;
    private final RoutePointRepository       routePointRepository;

    public GuideStatsService(
            UserRepository userRepository,
            RouteRepository routeRepository,
            RouteParticipantRepository participantRepository,
            FavoriteRouteRepository favoriteRepository,
            RoutePointRepository routePointRepository
    ) {
        this.userRepository        = userRepository;
        this.routeRepository       = routeRepository;
        this.participantRepository = participantRepository;
        this.favoriteRepository    = favoriteRepository;
        this.routePointRepository  = routePointRepository;
    }

    // ─────────────────────────────────────────────────────────
    public GuideStatsResponse getStats(String dateFrom, String dateTo) {

        LocalDate from = parseDate(dateFrom);
        LocalDate to   = parseDate(dateTo);

        List<User>  allUsers  = userRepository.findAll();
        List<Route> allRoutes = routeRepository.findAll();

        // Фильтрация по периоду
        List<Route> routes = filterRoutes(allRoutes, from, to);
        List<User>  users  = filterUsers(allUsers,  from, to);

        GuideStatsResponse res = new GuideStatsResponse();

        // ── KPIs ──────────────────────────────────────────────
        res.setTotalUsers((long) users.size());
        res.setTotalRoutes((long) routes.size());
        res.setTotalParticipants(participantRepository.count());
        res.setTotalFavorites(favoriteRepository.count());
        res.setGuideRoutes(routes.stream()
                .filter(r -> r.getCreator() != null
                        && r.getCreator().getRole() != null
                        && r.getCreator().getRole().getRoleId() == GUIDE_ROLE_ID)
                .count());

        // Средний рейтинг: берём из RoutePointRepository напрямую
        // (у Route нет поля points — используем репозиторий)
        Set<Long> routeIds = routes.stream().map(Route::getRouteId).collect(Collectors.toSet());
        double avgRating = routeIds.stream()
                .flatMap(id -> routePointRepository
                        .findByRoute_RouteIdOrderByVisitOrderAsc(id).stream())
                .map(rp -> rp.getPointOfInterest() != null
                        ? rp.getPointOfInterest().getAverageRating() : null)
                .filter(Objects::nonNull)
                .filter(v -> v > 0)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);
        res.setAverageRating(Math.round(avgRating * 10.0) / 10.0);

        // ── Графики ───────────────────────────────────────────
        res.setUserGrowth(buildMonthlyGrowth(users, routes));
        res.setRoutesByMonth(buildRoutesByMonth(routes));
        res.setTransportStats(buildTransportStats(routes));
        res.setTopDestinations(buildTopDestinations(routes));
        res.setUsersByRole(buildUsersByRole(users));
        res.setActivityByDay(buildActivityByDay(routes));

        return res;
    }

    // ─────────────────────────────────────────────────────────
    // Excel export — Apache POI
    // ─────────────────────────────────────────────────────────
    public byte[] exportExcel(User author, String dateFrom, String dateTo) throws Exception {

        GuideStatsResponse stats = getStats(dateFrom, dateTo);

        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // ── Стили ─────────────────────────────────────────
            // Заголовок отчёта (тёмный фон, белый текст)
            XSSFCellStyle titleStyle = wb.createCellStyle();
            XSSFFont titleFont = wb.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 13);
            titleFont.setColor(IndexedColors.WHITE.getIndex());
            titleStyle.setFont(titleFont);
            titleStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            titleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            titleStyle.setAlignment(HorizontalAlignment.LEFT);

            // Шапка таблицы (синий фон, белый текст)
            XSSFCellStyle headerStyle = wb.createCellStyle();
            XSSFFont headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 11);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.CORNFLOWER_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            // Чётные строки (светло-голубой фон)
            XSSFCellStyle altStyle = wb.createCellStyle();
            altStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            altStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Мета-информация (жирный)
            XSSFCellStyle metaKeyStyle = wb.createCellStyle();
            XSSFFont metaFont = wb.createFont();
            metaFont.setBold(true);
            metaKeyStyle.setFont(metaFont);

            // ── Лист 1: Общая статистика ──────────────────────
            XSSFSheet sheet1 = wb.createSheet("Общая статистика");
            sheet1.setColumnWidth(0, 9000);
            sheet1.setColumnWidth(1, 5000);

            int r = 0;

            // Заголовок
            Row titleRow = sheet1.createRow(r++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BestTravel — Отчёт по статистике платформы");
            titleCell.setCellStyle(titleStyle);
            sheet1.addMergedRegion(new CellRangeAddress(0, 0, 0, 1));
            titleRow.setHeightInPoints(26);

            // Мета
            addMetaRow(sheet1, r++, metaKeyStyle, "Дата формирования:", LocalDate.now().toString());
            addMetaRow(sheet1, r++, metaKeyStyle, "Составил:",
                    author.getFullName() + " (" + author.getEmail() + ")");
            String period = nvl(dateFrom, "начало") + " — " + nvl(dateTo, "сейчас");
            addMetaRow(sheet1, r++, metaKeyStyle, "Период:", period);
            r++; // пустая строка

            // Шапка KPI
            Row kpiHead = sheet1.createRow(r++);
            addHeaderCell(kpiHead, 0, "Показатель", headerStyle);
            addHeaderCell(kpiHead, 1, "Значение",   headerStyle);

            // KPI данные
            Object[][] kpis = {
                    {"Всего пользователей",       stats.getTotalUsers()},
                    {"Всего маршрутов",            stats.getTotalRoutes()},
                    {"Всего участников",           stats.getTotalParticipants()},
                    {"Средний рейтинг",            stats.getAverageRating()},
                    {"Добавлено в избранное",      stats.getTotalFavorites()},
                    {"Маршрутов от гидов",         stats.getGuideRoutes()},
            };
            for (int i = 0; i < kpis.length; i++) {
                Row row = sheet1.createRow(r++);
                Cell k = row.createCell(0);
                Cell v = row.createCell(1);
                if (i % 2 == 1) { k.setCellStyle(altStyle); v.setCellStyle(altStyle); }
                k.setCellValue(kpis[i][0].toString());
                Object val = kpis[i][1];
                if (val instanceof Number) v.setCellValue(((Number) val).doubleValue());
                else v.setCellValue(val != null ? val.toString() : "—");
            }

            // ── Лист 2: Рост по месяцам ───────────────────────
            XSSFSheet sheet2 = wb.createSheet("Рост по месяцам");
            setWidths(sheet2, 4000, 4000, 4000);
            Row sh2h = sheet2.createRow(0);
            addHeaderCell(sh2h, 0, "Месяц",         headerStyle);
            addHeaderCell(sh2h, 1, "Пользователи",  headerStyle);
            addHeaderCell(sh2h, 2, "Маршруты",       headerStyle);
            int r2 = 1;
            for (GuideStatsResponse.MonthlyGrowth mg : safe(stats.getUserGrowth())) {
                Row row = sheet2.createRow(r2++);
                row.createCell(0).setCellValue(mg.getMonth());
                row.createCell(1).setCellValue(mg.getUsers()  != null ? mg.getUsers()  : 0L);
                row.createCell(2).setCellValue(mg.getRoutes() != null ? mg.getRoutes() : 0L);
            }

            // ── Лист 3: Транспорт ─────────────────────────────
            XSSFSheet sheet3 = wb.createSheet("Транспорт");
            setWidths(sheet3, 5000, 4000);
            Row sh3h = sheet3.createRow(0);
            addHeaderCell(sh3h, 0, "Тип транспорта", headerStyle);
            addHeaderCell(sh3h, 1, "Маршрутов",      headerStyle);
            int r3 = 1;
            for (GuideStatsResponse.TypeCount tc : safe(stats.getTransportStats())) {
                Row row = sheet3.createRow(r3++);
                row.createCell(0).setCellValue(tc.getType());
                row.createCell(1).setCellValue(tc.getCount() != null ? tc.getCount() : 0L);
            }

            // ── Лист 4: Направления ───────────────────────────
            XSSFSheet sheet4 = wb.createSheet("Направления");
            setWidths(sheet4, 6000, 4000);
            Row sh4h = sheet4.createRow(0);
            addHeaderCell(sh4h, 0, "Направление", headerStyle);
            addHeaderCell(sh4h, 1, "Маршрутов",   headerStyle);
            int r4 = 1;
            for (GuideStatsResponse.CityCount cc : safe(stats.getTopDestinations())) {
                Row row = sheet4.createRow(r4++);
                row.createCell(0).setCellValue(cc.getCity());
                row.createCell(1).setCellValue(cc.getCount() != null ? cc.getCount() : 0L);
            }

            wb.write(out);
            return out.toByteArray();
        }
    }

    // ─────────────────────────────────────────────────────────
    // Вспомогательные методы
    // ─────────────────────────────────────────────────────────

    private List<Route> filterRoutes(List<Route> all, LocalDate from, LocalDate to) {
        return all.stream().filter(r -> {
            if (r.getCreatedAt() == null) return true;
            LocalDate d = r.getCreatedAt().toLocalDate();
            if (from != null && d.isBefore(from)) return false;
            if (to   != null && d.isAfter(to))    return false;
            return true;
        }).collect(Collectors.toList());
    }

    private List<User> filterUsers(List<User> all, LocalDate from, LocalDate to) {
        return all.stream().filter(u -> {
            if (u.getCreatedAt() == null) return true;
            LocalDate d = u.getCreatedAt(); // User.createdAt = LocalDate
            if (from != null && d.isBefore(from)) return false;
            if (to   != null && d.isAfter(to))    return false;
            return true;
        }).collect(Collectors.toList());
    }

    private List<GuideStatsResponse.MonthlyGrowth> buildMonthlyGrowth(
            List<User> users, List<Route> routes) {
        String[] months = {"Янв","Фев","Мар","Апр","Май","Июн",
                "Июл","Авг","Сен","Окт","Ноя","Дек"};
        int year = LocalDate.now().getYear();
        List<GuideStatsResponse.MonthlyGrowth> res = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            final int mm = m;
            long u = users.stream().filter(x -> x.getCreatedAt() != null
                    && x.getCreatedAt().getYear() == year
                    && x.getCreatedAt().getMonthValue() == mm).count();
            long r = routes.stream().filter(x -> x.getCreatedAt() != null
                    && x.getCreatedAt().getYear() == year
                    && x.getCreatedAt().toLocalDate().getMonthValue() == mm).count();
            res.add(new GuideStatsResponse.MonthlyGrowth(months[m-1], u, r));
        }
        return res;
    }

    private List<GuideStatsResponse.MonthCount> buildRoutesByMonth(List<Route> routes) {
        String[] months = {"Янв","Фев","Мар","Апр","Май","Июн",
                "Июл","Авг","Сен","Окт","Ноя","Дек"};
        int year = LocalDate.now().getYear();
        List<GuideStatsResponse.MonthCount> res = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            final int mm = m;
            long cnt = routes.stream().filter(r -> r.getCreatedAt() != null
                    && r.getCreatedAt().getYear() == year
                    && r.getCreatedAt().toLocalDate().getMonthValue() == mm).count();
            res.add(new GuideStatsResponse.MonthCount(months[m-1], cnt));
        }
        return res;
    }

    private List<GuideStatsResponse.TypeCount> buildTransportStats(List<Route> routes) {
        return routes.stream()
                .filter(r -> r.getTransportType() != null && !r.getTransportType().isBlank())
                .collect(Collectors.groupingBy(Route::getTransportType, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> new GuideStatsResponse.TypeCount(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    private List<GuideStatsResponse.CityCount> buildTopDestinations(List<Route> routes) {
        return routes.stream()
                .filter(r -> r.getEndLocation() != null && !r.getEndLocation().isBlank())
                .collect(Collectors.groupingBy(Route::getEndLocation, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(8)
                .map(e -> new GuideStatsResponse.CityCount(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    private List<GuideStatsResponse.RoleCount> buildUsersByRole(List<User> users) {
        return users.stream()
                .filter(u -> u.getRole() != null)
                .collect(Collectors.groupingBy(u -> u.getRole().getRoleName(), Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> new GuideStatsResponse.RoleCount(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    private List<GuideStatsResponse.DayCount> buildActivityByDay(List<Route> routes) {
        String[] days = {"Пн","Вт","Ср","Чт","Пт","Сб","Вс"};
        long[] counts = new long[7];
        for (Route r : routes) {
            if (r.getStartDate() != null) {
                counts[r.getStartDate().getDayOfWeek().getValue() - 1]++;
            }
        }
        List<GuideStatsResponse.DayCount> res = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            res.add(new GuideStatsResponse.DayCount(days[i], counts[i]));
        }
        return res;
    }

    // ── Excel helpers ─────────────────────────────────────────

    private void addMetaRow(Sheet sheet, int rowIdx, CellStyle keyStyle, String key, String val) {
        Row row = sheet.createRow(rowIdx);
        Cell k = row.createCell(0); k.setCellValue(key); k.setCellStyle(keyStyle);
        row.createCell(1).setCellValue(val);
    }

    private void addHeaderCell(Row row, int col, String text, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(text);
        c.setCellStyle(style);
    }

    private void setWidths(Sheet sheet, int... widths) {
        for (int i = 0; i < widths.length; i++) {
            sheet.setColumnWidth(i, widths[i]);
        }
    }

    private <T> List<T> safe(List<T> list) {
        return list != null ? list : List.of();
    }

    private String nvl(String s, String def) {
        return (s != null && !s.isBlank()) ? s : def;
    }

    private LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        try { return LocalDate.parse(s.substring(0, 10)); } catch (Exception e) { return null; }
    }
}