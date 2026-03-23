package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.*;

@Service
@Transactional(readOnly = true)
public class GuideReportService {

    private final UserRepository             userRepo;
    private final RouteRepository            routeRepo;
    private final RoutePointRepository       routePointRepo;
    private final FavoriteRouteRepository    favoriteRepo;
    private final RouteParticipantRepository participantRepo;

    public GuideReportService(
            UserRepository userRepo,
            RouteRepository routeRepo,
            RoutePointRepository routePointRepo,
            FavoriteRouteRepository favoriteRepo,
            RouteParticipantRepository participantRepo
    ) {
        this.userRepo        = userRepo;
        this.routeRepo       = routeRepo;
        this.routePointRepo  = routePointRepo;
        this.favoriteRepo    = favoriteRepo;
        this.participantRepo = participantRepo;
    }

    // ─────────────────────────────────────────────────────────
    public byte[] generate(User author, String type, String dateFrom, String dateTo)
            throws Exception {

        LocalDate from = parseDate(dateFrom);
        LocalDate to   = parseDate(dateTo);

        List<Route>      routes    = filterRoutes(routeRepo.findAll(), from, to);
        List<User>       users     = filterUsers(userRepo.findAll(), from, to);
        List<RoutePoint> allPoints = routePointRepo.findAll();

        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Styles s = new Styles(wb);

            switch (type) {
                case "popular_poi"        -> buildPopularPoi(wb, s, routes, allPoints, author, from, to);
                case "transport_analysis" -> buildTransportAnalysis(wb, s, routes, author, from, to);
                case "price_duration"     -> buildPriceDuration(wb, s, routes, author, from, to);
                case "destinations"       -> buildDestinations(wb, s, routes, author, from, to);
                case "favorites_analysis" -> buildFavoritesAnalysis(wb, s, routes, allPoints, author, from, to);
                case "user_activity"      -> buildUserActivity(wb, s, users, routes, author, from, to);
                case "ratings"            -> buildRatings(wb, s, allPoints, author, from, to);
                case "full_report"        -> {
                    buildPopularPoi(wb, s, routes, allPoints, author, from, to);
                    buildTransportAnalysis(wb, s, routes, author, from, to);
                    buildPriceDuration(wb, s, routes, author, from, to);
                    buildDestinations(wb, s, routes, author, from, to);
                    buildFavoritesAnalysis(wb, s, routes, allPoints, author, from, to);
                    buildUserActivity(wb, s, users, routes, author, from, to);
                    buildRatings(wb, s, allPoints, author, from, to);
                }
                default -> throw new IllegalArgumentException("Неизвестный тип отчёта: " + type);
            }

            wb.write(out);
            return out.toByteArray();
        }
    }

    // ═════════════════════════════════════════════════════════
    // 1. ПОПУЛЯРНЫЕ ТОЧКИ ИНТЕРЕСА
    // ═════════════════════════════════════════════════════════
    private void buildPopularPoi(XSSFWorkbook wb, Styles s,
                                 List<Route> routes, List<RoutePoint> allPoints, User author,
                                 LocalDate from, LocalDate to) {

        XSSFSheet sheet = wb.createSheet("Топ точек интереса");
        sheet.setColumnWidth(0, 1200);
        sheet.setColumnWidth(1, 8000);
        sheet.setColumnWidth(2, 5000);
        sheet.setColumnWidth(3, 4000);
        sheet.setColumnWidth(4, 4000);

        int r = 0;
        r = writeReportHeader(sheet, s, r,
                "Популярные точки интереса",
                "Топ мест по количеству включений в маршруты",
                author, from, to);

        // Шапка таблицы
        String[] headers = {"#", "Название точки", "Категория", "Включений в маршруты", "Ср. рейтинг"};
        writeTableHeader(sheet, s, r++, headers);

        // Считаем по pointOfInterestId
        Set<Long> routeIds = routes.stream().map(Route::getRouteId).collect(Collectors.toSet());
        Map<Long, Long> poiCounts = allPoints.stream()
                .filter(rp -> routeIds.contains(rp.getRoute().getRouteId()))
                .filter(rp -> rp.getPointOfInterest() != null)
                .collect(Collectors.groupingBy(
                        rp -> rp.getPointOfInterest().getId(),
                        Collectors.counting()
                ));

        // Берём POI данные
        Map<Long, PointOfInterest> poiMap = allPoints.stream()
                .filter(rp -> rp.getPointOfInterest() != null)
                .collect(Collectors.toMap(
                        rp -> rp.getPointOfInterest().getId(),
                        RoutePoint::getPointOfInterest,
                        (a, b) -> a
                ));

        List<Map.Entry<Long, Long>> sorted = poiCounts.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(30)
                .collect(Collectors.toList());

        int rank = 1;
        for (Map.Entry<Long, Long> e : sorted) {
            PointOfInterest poi = poiMap.get(e.getKey());
            if (poi == null) continue;
            Row row = sheet.createRow(r);
            boolean alt = (r % 2 == 0);
            setCells(row, s, alt,
                    rank++,
                    nvl(poi.getName(), "—"),
                    nvl(poi.getCategory(), "—"),
                    e.getValue(),
                    poi.getAverageRating() != null ? poi.getAverageRating() : 0.0
            );
            r++;
        }

        if (sorted.isEmpty()) {
            writeEmptyRow(sheet, s, r, "Нет данных о точках интереса");
        }
    }

    // ═════════════════════════════════════════════════════════
    // 2. АНАЛИЗ ТРАНСПОРТА
    // ═════════════════════════════════════════════════════════
    private void buildTransportAnalysis(XSSFWorkbook wb, Styles s,
                                        List<Route> routes, User author, LocalDate from, LocalDate to) {

        XSSFSheet sheet = wb.createSheet("Анализ транспорта");
        setColWidths(sheet, 2000, 5000, 4000, 4000, 4000, 4000);

        int r = 0;
        r = writeReportHeader(sheet, s, r,
                "Анализ транспорта",
                "Распределение маршрутов по типу транспорта, средняя цена и длительность",
                author, from, to);

        writeTableHeader(sheet, s, r++,
                "Тип транспорта", "Кол-во маршрутов", "Доля %",
                "Ср. цена (€)", "Ср. длительность (дней)", "Мин. цена (€)");

        Map<String, List<Route>> byTransport = routes.stream()
                .filter(rt -> rt.getTransportType() != null)
                .collect(Collectors.groupingBy(Route::getTransportType));

        long total = routes.size();

        Map<String, String> labels = Map.of(
                "WALK", "🚶 Пешком", "BIKE", "🚴 Велосипед",
                "CAR", "🚗 Авто", "TRANSIT", "🚌 Транспорт", "PLANE", "✈️ Самолёт"
        );

        List<Map.Entry<String, List<Route>>> sortedTransport = byTransport.entrySet().stream()
                .sorted(Map.Entry.<String, List<Route>>comparingByValue(
                        Comparator.comparingInt(List::size)).reversed())
                .collect(Collectors.toList());

        for (int i = 0; i < sortedTransport.size(); i++) {
            Map.Entry<String, List<Route>> e = sortedTransport.get(i);
            String label = labels.getOrDefault(e.getKey(), e.getKey());
            List<Route> g = e.getValue();
            double share = total > 0 ? (g.size() * 100.0 / total) : 0;
            double avgP  = g.stream().map(Route::getTotalPrice).filter(Objects::nonNull)
                    .mapToDouble(p -> p.doubleValue()).average().orElse(0);
            double avgD  = g.stream().map(Route::getDurationDays).filter(Objects::nonNull)
                    .mapToDouble(Integer::doubleValue).average().orElse(0);
            double minP  = g.stream().map(Route::getTotalPrice).filter(Objects::nonNull)
                    .mapToDouble(p -> p.doubleValue()).min().orElse(0);
            Row row = sheet.createRow(r + i);
            setCells(row, s, false,
                    label, (long) g.size(),
                    Math.round(share * 10.0) / 10.0,
                    Math.round(avgP * 100.0) / 100.0,
                    Math.round(avgD * 10.0) / 10.0,
                    Math.round(minP * 100.0) / 100.0
            );
        }
    }

    // ═════════════════════════════════════════════════════════
    // 3. СТОИМОСТЬ И ДЛИТЕЛЬНОСТЬ
    // ═════════════════════════════════════════════════════════
    private void buildPriceDuration(XSSFWorkbook wb, Styles s,
                                    List<Route> routes, User author, LocalDate from, LocalDate to) {

        XSSFSheet sheet = wb.createSheet("Цена и длительность");
        setColWidths(sheet, 7000, 4000, 4000, 4000, 4000);

        int r = 0;
        r = writeReportHeader(sheet, s, r,
                "Стоимость и длительность маршрутов",
                "Средние, минимальные и максимальные значения — ценовые диапазоны",
                author, from, to);

        // Общая статистика
        writeTableHeader(sheet, s, r++, "Показатель", "Среднее", "Минимум", "Максимум", "Медиана");

        DoubleSummaryStatistics priceStats = routes.stream()
                .map(Route::getTotalPrice).filter(Objects::nonNull)
                .mapToDouble(p -> p.doubleValue()).summaryStatistics();
        DoubleSummaryStatistics durStats = routes.stream()
                .map(Route::getDurationDays).filter(Objects::nonNull)
                .mapToDouble(Integer::doubleValue).summaryStatistics();

        double medianPrice    = median(routes.stream().map(Route::getTotalPrice)
                .filter(Objects::nonNull).map(p -> p.doubleValue()).collect(Collectors.toList()));
        double medianDuration = median(routes.stream().map(Route::getDurationDays)
                .filter(Objects::nonNull).map(Integer::doubleValue).collect(Collectors.toList()));

        setCells(sheet.createRow(r++), s, false, "Стоимость (€)",
                round2(priceStats.getAverage()), round2(priceStats.getMin()),
                round2(priceStats.getMax()), round2(medianPrice));
        setCells(sheet.createRow(r++), s, true, "Длительность (дней)",
                round2(durStats.getAverage()), round2(durStats.getMin()),
                round2(durStats.getMax()), round2(medianDuration));

        r++; // пустая строка

        // Ценовые диапазоны
        writeTableHeader(sheet, s, r++, "Ценовой диапазон", "Количество маршрутов", "Доля %", "", "");
        long total = routes.size();
        long free  = routes.stream().filter(rt -> rt.getTotalPrice() == null || rt.getTotalPrice().doubleValue() == 0).count();
        long cheap = routes.stream().filter(rt -> rt.getTotalPrice() != null && rt.getTotalPrice().doubleValue() > 0 && rt.getTotalPrice().doubleValue() <= 200).count();
        long mid   = routes.stream().filter(rt -> rt.getTotalPrice() != null && rt.getTotalPrice().doubleValue() > 200 && rt.getTotalPrice().doubleValue() <= 800).count();
        long prem  = routes.stream().filter(rt -> rt.getTotalPrice() != null && rt.getTotalPrice().doubleValue() > 800).count();

        Object[][] ranges = {
                {"Бесплатно (0€)", free,  total > 0 ? round2(free * 100.0 / total) : 0.0},
                {"Бюджет (1–200€)", cheap, total > 0 ? round2(cheap * 100.0 / total) : 0.0},
                {"Средний (201–800€)", mid, total > 0 ? round2(mid * 100.0 / total) : 0.0},
                {"Премиум (800€+)", prem, total > 0 ? round2(prem * 100.0 / total) : 0.0},
        };
        for (int i = 0; i < ranges.length; i++) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(ranges[i][0].toString());
            row.createCell(1).setCellValue(((Number) ranges[i][1]).doubleValue());
            row.createCell(2).setCellValue(ranges[i][2].toString() + "%");
        }
    }

    // ═════════════════════════════════════════════════════════
    // 4. ПОПУЛЯРНЫЕ НАПРАВЛЕНИЯ
    // ═════════════════════════════════════════════════════════
    private void buildDestinations(XSSFWorkbook wb, Styles s,
                                   List<Route> routes, User author, LocalDate from, LocalDate to) {

        XSSFSheet sheet = wb.createSheet("Направления");
        setColWidths(sheet, 1200, 6000, 4000, 4000, 5000);

        int r = 0;
        r = writeReportHeader(sheet, s, r,
                "Популярные направления",
                "Топ городов назначения — количество маршрутов и средняя стоимость",
                author, from, to);

        writeTableHeader(sheet, s, r++, "#", "Направление", "Маршрутов", "Ср. цена (€)", "Ср. длительность (дней)");

        Map<String, List<Route>> byDest = routes.stream()
                .filter(rt -> rt.getEndLocation() != null && !rt.getEndLocation().isBlank())
                .collect(Collectors.groupingBy(Route::getEndLocation));

        List<Map.Entry<String, List<Route>>> sorted = byDest.entrySet().stream()
                .sorted(Map.Entry.<String, List<Route>>comparingByValue(
                        Comparator.comparingInt(List::size)).reversed())
                .limit(20)
                .collect(Collectors.toList());

        for (int i = 0; i < sorted.size(); i++) {
            Map.Entry<String, List<Route>> e = sorted.get(i);
            List<Route> g = e.getValue();
            double avgP = g.stream().map(Route::getTotalPrice).filter(Objects::nonNull)
                    .mapToDouble(p -> p.doubleValue()).average().orElse(0);
            double avgD = g.stream().map(Route::getDurationDays).filter(Objects::nonNull)
                    .mapToDouble(Integer::doubleValue).average().orElse(0);
            Row row = sheet.createRow(r++);
            setCells(row, s, i % 2 == 1, i + 1, e.getKey(), (long) g.size(), round2(avgP), round2(avgD));
        }

        if (sorted.isEmpty()) writeEmptyRow(sheet, s, r, "Нет данных о направлениях");
    }

    // ═════════════════════════════════════════════════════════
    // 5. АНАЛИЗ ИЗБРАННОГО
    // ═════════════════════════════════════════════════════════
    private void buildFavoritesAnalysis(XSSFWorkbook wb, Styles s,
                                        List<Route> routes, List<RoutePoint> allPoints, User author,
                                        LocalDate from, LocalDate to) {

        XSSFSheet sheet = wb.createSheet("Анализ избранного");
        setColWidths(sheet, 7000, 4000, 4000, 4000);

        int r = 0;
        r = writeReportHeader(sheet, s, r,
                "Анализ избранного",
                "Характеристики маршрутов добавленных в избранное vs обычных",
                author, from, to);

        // Маршруты из избранного
        Set<Long> favRouteIds = favoriteRepo.findAll().stream()
                .map(fav -> fav.getRoute().getRouteId())
                .collect(Collectors.toSet());

        List<Route> favRoutes  = routes.stream().filter(rt -> favRouteIds.contains(rt.getRouteId())).collect(Collectors.toList());
        List<Route> normRoutes = routes.stream().filter(rt -> !favRouteIds.contains(rt.getRouteId())).collect(Collectors.toList());

        writeTableHeader(sheet, s, r++, "Показатель", "В избранном", "Не в избранном", "Разница");

        Object[][] comparison = {
                {"Количество маршрутов",
                        (long) favRoutes.size(), (long) normRoutes.size(),
                        (long) favRoutes.size() - normRoutes.size()},
                {"Средняя цена (€)",
                        round2(avgPrice(favRoutes)), round2(avgPrice(normRoutes)),
                        round2(avgPrice(favRoutes) - avgPrice(normRoutes))},
                {"Средняя длительность (дней)",
                        round2(avgDuration(favRoutes)), round2(avgDuration(normRoutes)),
                        round2(avgDuration(favRoutes) - avgDuration(normRoutes))},
        };

        for (int i = 0; i < comparison.length; i++) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(comparison[i][0].toString());
            row.createCell(1).setCellValue(((Number) comparison[i][1]).doubleValue());
            row.createCell(2).setCellValue(((Number) comparison[i][2]).doubleValue());
            row.createCell(3).setCellValue(((Number) comparison[i][3]).doubleValue());
            if (i % 2 == 1) applyAlt(row, s);
        }

        r++;
        // Транспорт в избранных
        writeTableHeader(sheet, s, r++, "Транспорт", "В избранном", "Всего маршрутов", "% от типа");
        Map<String, Long> favByTransport = favRoutes.stream()
                .filter(rt -> rt.getTransportType() != null)
                .collect(Collectors.groupingBy(Route::getTransportType, Collectors.counting()));
        Map<String, Long> allByTransport = routes.stream()
                .filter(rt -> rt.getTransportType() != null)
                .collect(Collectors.groupingBy(Route::getTransportType, Collectors.counting()));
        List<Map.Entry<String, Long>> sortedFavTransport = favByTransport.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .collect(Collectors.toList());

        for (int i = 0; i < sortedFavTransport.size(); i++) {
            Map.Entry<String, Long> e = sortedFavTransport.get(i);
            long all = allByTransport.getOrDefault(e.getKey(), 1L);
            double pct = all > 0 ? e.getValue() * 100.0 / all : 0;
            Row row = sheet.createRow(r + i);
            row.createCell(0).setCellValue(e.getKey());
            row.createCell(1).setCellValue(e.getValue());
            row.createCell(2).setCellValue(all);
            row.createCell(3).setCellValue(round2(pct) + "%");
        }
    }

    // ═════════════════════════════════════════════════════════
    // 6. АКТИВНОСТЬ ПОЛЬЗОВАТЕЛЕЙ
    // ═════════════════════════════════════════════════════════
    private void buildUserActivity(XSSFWorkbook wb, Styles s,
                                   List<User> users, List<Route> routes, User author,
                                   LocalDate from, LocalDate to) {

        XSSFSheet sheet = wb.createSheet("Активность пользователей");
        setColWidths(sheet, 4000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000);

        int r = 0;
        r = writeReportHeader(sheet, s, r,
                "Активность пользователей",
                "Регистрации по месяцам, роли, количество маршрутов на пользователя",
                author, from, to);

        // Регистрации по месяцам (текущий год)
        writeTableHeader(sheet, s, r++,
                "Месяц", "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
                "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек");

        int year = LocalDate.now().getYear();
        Row regRow = sheet.createRow(r++);
        regRow.createCell(0).setCellValue("Регистрации " + year);
        for (int m = 1; m <= 12; m++) {
            final int month = m;
            long cnt = users.stream()
                    .filter(u -> u.getCreatedAt() != null
                            && u.getCreatedAt().getYear() == year
                            && u.getCreatedAt().getMonthValue() == month)
                    .count();
            regRow.createCell(m).setCellValue(cnt);
        }

        r++;

        // Роли
        writeTableHeader(sheet, s, r++, "Роль", "Пользователей", "% от общего", "", "");
        Map<String, Long> byRole = users.stream()
                .filter(u -> u.getRole() != null)
                .collect(Collectors.groupingBy(u -> u.getRole().getRoleName(), Collectors.counting()));
        long totalUsers = users.size();
        int ri = 0;
        for (Map.Entry<String, Long> e : byRole.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .collect(Collectors.toList())) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(e.getKey());
            row.createCell(1).setCellValue(e.getValue());
            row.createCell(2).setCellValue(totalUsers > 0
                    ? round2(e.getValue() * 100.0 / totalUsers) + "%" : "—");
            if (ri++ % 2 == 1) applyAlt(row, s);
        }

        r++;

        // Топ активных пользователей по количеству маршрутов
        writeTableHeader(sheet, s, r++, "#", "Пользователь (email)", "Роль", "Маршрутов создано", "");
        Map<Long, Long> routesByUser = routes.stream()
                .filter(rt -> rt.getCreator() != null)
                .collect(Collectors.groupingBy(rt -> rt.getCreator().getUserId(), Collectors.counting()));
        Map<Long, User> userMap = users.stream()
                .collect(Collectors.toMap(User::getUserId, u -> u, (a, b) -> a));

        List<Map.Entry<Long, Long>> topUsers = routesByUser.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(15)
                .collect(Collectors.toList());
        for (int i = 0; i < topUsers.size(); i++) {
            User u = userMap.get(topUsers.get(i).getKey());
            if (u == null) continue;
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(i + 1);
            row.createCell(1).setCellValue(u.getEmail());
            row.createCell(2).setCellValue(u.getRole() != null ? u.getRole().getRoleName() : "—");
            row.createCell(3).setCellValue(topUsers.get(i).getValue());
            if (i % 2 == 1) applyAlt(row, s);
        }
    }

    // ═════════════════════════════════════════════════════════
    // 7. РЕЙТИНГИ ПО КАТЕГОРИЯМ
    // ═════════════════════════════════════════════════════════
    private void buildRatings(XSSFWorkbook wb, Styles s,
                              List<RoutePoint> allPoints, User author, LocalDate from, LocalDate to) {

        XSSFSheet sheet = wb.createSheet("Рейтинги по категориям");
        setColWidths(sheet, 7000, 4000, 4000, 4000, 4000);

        int r = 0;
        r = writeReportHeader(sheet, s, r,
                "Рейтинги точек интереса по категориям",
                "Средний рейтинг, количество точек и разброс оценок по каждой категории",
                author, from, to);

        writeTableHeader(sheet, s, r++,
                "Категория", "Точек", "Ср. рейтинг", "Мин. рейтинг", "Макс. рейтинг");

        Map<String, List<PointOfInterest>> byCategory = allPoints.stream()
                .filter(rp -> rp.getPointOfInterest() != null)
                .map(RoutePoint::getPointOfInterest)
                .filter(poi -> poi.getCategory() != null && !poi.getCategory().isBlank())
                .collect(Collectors.toMap(
                        PointOfInterest::getId,
                        p -> p,
                        (a, b) -> a
                ))
                .values().stream()
                .collect(Collectors.groupingBy(PointOfInterest::getCategory));

        List<Map.Entry<String, List<PointOfInterest>>> sortedCats = byCategory.entrySet().stream()
                .sorted((a, b) -> {
                    double avgA = a.getValue().stream().filter(p -> p.getAverageRating() != null)
                            .mapToDouble(PointOfInterest::getAverageRating).average().orElse(0);
                    double avgB = b.getValue().stream().filter(p -> p.getAverageRating() != null)
                            .mapToDouble(PointOfInterest::getAverageRating).average().orElse(0);
                    return Double.compare(avgB, avgA);
                })
                .collect(Collectors.toList());

        for (int i = 0; i < sortedCats.size(); i++) {
            Map.Entry<String, List<PointOfInterest>> e = sortedCats.get(i);
            DoubleSummaryStatistics stat = e.getValue().stream()
                    .filter(p -> p.getAverageRating() != null && p.getAverageRating() > 0)
                    .mapToDouble(PointOfInterest::getAverageRating)
                    .summaryStatistics();
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(e.getKey());
            row.createCell(1).setCellValue(e.getValue().size());
            row.createCell(2).setCellValue(stat.getCount() > 0 ? round2(stat.getAverage()) : 0.0);
            row.createCell(3).setCellValue(stat.getCount() > 0 ? round2(stat.getMin()) : 0.0);
            row.createCell(4).setCellValue(stat.getCount() > 0 ? round2(stat.getMax()) : 0.0);
            if (i % 2 == 1) applyAlt(row, s);
        }

        if (sortedCats.isEmpty()) writeEmptyRow(sheet, s, r, "Нет данных о точках интереса");
    }

    // ═════════════════════════════════════════════════════════
    // Вспомогательные методы
    // ═════════════════════════════════════════════════════════

    private int writeReportHeader(XSSFSheet sheet, Styles s, int startRow,
                                  String title, String subtitle, User author, LocalDate from, LocalDate to) {
        int r = startRow;

        Row titleRow = sheet.createRow(r++);
        Cell tc = titleRow.createCell(0);
        tc.setCellValue(title);
        tc.setCellStyle(s.title);
        titleRow.setHeightInPoints(26);

        Row subRow = sheet.createRow(r++);
        subRow.createCell(0).setCellValue(subtitle);

        Row metaRow = sheet.createRow(r++);
        metaRow.createCell(0).setCellStyle(s.metaKey);
        metaRow.createCell(0).setCellValue("Составил: " + author.getFullName()
                + " | Дата: " + LocalDate.now()
                + " | Период: " + nvl2(from, "начало") + " — " + nvl2(to, "сейчас"));
        r++; // пустая строка
        return r;
    }

    private void writeTableHeader(XSSFSheet sheet, Styles s, int rowIdx, String... headers) {
        Row row = sheet.createRow(rowIdx);
        for (int i = 0; i < headers.length; i++) {
            Cell c = row.createCell(i);
            c.setCellValue(headers[i]);
            c.setCellStyle(s.header);
        }
        row.setHeightInPoints(18);
    }

    private void setCells(Row row, Styles s, boolean alt, Object... values) {
        for (int i = 0; i < values.length; i++) {
            Cell c = row.createCell(i);
            Object v = values[i];
            if (v instanceof Number)      c.setCellValue(((Number) v).doubleValue());
            else if (v instanceof String) c.setCellValue((String) v);
            else if (v != null)           c.setCellValue(v.toString());
            if (alt) c.setCellStyle(s.alt);
        }
    }

    private void applyAlt(Row row, Styles s) {
        for (int i = 0; i < row.getLastCellNum(); i++) {
            Cell c = row.getCell(i);
            if (c != null) c.setCellStyle(s.alt);
        }
    }

    private void writeEmptyRow(XSSFSheet sheet, Styles s, int r, String msg) {
        Row row = sheet.createRow(r);
        row.createCell(0).setCellValue(msg);
    }

    private void setColWidths(XSSFSheet sheet, int... widths) {
        for (int i = 0; i < widths.length; i++) sheet.setColumnWidth(i, widths[i]);
    }

    private List<Route> filterRoutes(List<Route> all, LocalDate from, LocalDate to) {
        return all.stream().filter(r -> {
            if (r.getCreatedAt() == null) return true;
            LocalDate d = r.getCreatedAt().toLocalDate();
            return (from == null || !d.isBefore(from)) && (to == null || !d.isAfter(to));
        }).collect(Collectors.toList());
    }

    private List<User> filterUsers(List<User> all, LocalDate from, LocalDate to) {
        return all.stream().filter(u -> {
            if (u.getCreatedAt() == null) return true;
            LocalDate d = u.getCreatedAt();
            return (from == null || !d.isBefore(from)) && (to == null || !d.isAfter(to));
        }).collect(Collectors.toList());
    }

    private LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        try { return LocalDate.parse(s.substring(0, 10)); } catch (Exception e) { return null; }
    }

    private double avgPrice(List<Route> routes) {
        return routes.stream().map(Route::getTotalPrice).filter(Objects::nonNull)
                .mapToDouble(p -> p.doubleValue()).average().orElse(0);
    }

    private double avgDuration(List<Route> routes) {
        return routes.stream().map(Route::getDurationDays).filter(Objects::nonNull)
                .mapToDouble(Integer::doubleValue).average().orElse(0);
    }

    private double median(List<Double> values) {
        if (values.isEmpty()) return 0;
        List<Double> sorted = values.stream().sorted().collect(Collectors.toList());
        int mid = sorted.size() / 2;
        return sorted.size() % 2 == 0
                ? (sorted.get(mid - 1) + sorted.get(mid)) / 2.0
                : sorted.get(mid);
    }

    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }

    private String nvl(String s, String def)   { return (s != null && !s.isBlank()) ? s : def; }
    private String nvl2(LocalDate d, String def) { return d != null ? d.toString() : def; }

    // ─────────────────────────────────────────────────────────
    // Стили POI
    // ─────────────────────────────────────────────────────────
    private static class Styles {
        final XSSFCellStyle title, header, alt, metaKey;

        Styles(XSSFWorkbook wb) {
            // Title
            XSSFFont titleFont = wb.createFont();
            titleFont.setBold(true); titleFont.setFontHeightInPoints((short)14);
            titleFont.setColor(IndexedColors.WHITE.getIndex());
            title = wb.createCellStyle();
            title.setFont(titleFont);
            title.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            title.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Header
            XSSFFont headerFont = wb.createFont();
            headerFont.setBold(true); headerFont.setFontHeightInPoints((short)11);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            header = wb.createCellStyle();
            header.setFont(headerFont);
            header.setFillForegroundColor(IndexedColors.CORNFLOWER_BLUE.getIndex());
            header.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            header.setAlignment(HorizontalAlignment.CENTER);
            header.setBorderBottom(BorderStyle.THIN);

            // Alternating row
            alt = wb.createCellStyle();
            alt.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            alt.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Meta key (bold)
            XSSFFont metaFont = wb.createFont();
            metaFont.setItalic(true);
            metaKey = wb.createCellStyle();
            metaKey.setFont(metaFont);
        }
    }
}