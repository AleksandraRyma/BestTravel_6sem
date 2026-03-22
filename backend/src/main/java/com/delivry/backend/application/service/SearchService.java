package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.repository.*;
import com.delivry.backend.response.SearchRouteResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class SearchService {

    // role_id = 2 — GUIDE согласно схеме БД
    private static final long GUIDE_ROLE_ID = 2L;

    private final RouteRepository      routeRepository;
    private final RoutePointRepository routePointRepository;

    public SearchService(
            RouteRepository routeRepository,
            RoutePointRepository routePointRepository
    ) {
        this.routeRepository      = routeRepository;
        this.routePointRepository = routePointRepository;
    }

    // ─────────────────────────────────────────────────────────────
    public List<SearchRouteResponse> searchGuideRoutes(
            String search,
            List<String> transports,
            List<String> categories,
            Double priceMin, Double priceMax,
            Integer durMin,  Integer durMax,
            String dateFrom, String dateTo,
            String sortBy,   String sortDir
    ) {
        // 1. Загружаем все маршруты созданные гидами (role_id = 2)
        List<Route> guideRoutes = routeRepository.findByCreator_Role_RoleId(GUIDE_ROLE_ID);

        // 2. Парсим даты фильтра
        LocalDate parsedFrom = parseDate(dateFrom);
        LocalDate parsedTo   = parseDate(dateTo);

        // 3. Фильтрация
        List<SearchRouteResponse> result = guideRoutes.stream()
                .map(r -> toResponse(r))
                .filter(r -> filterMatches(r, search, transports, categories,
                        priceMin, priceMax, durMin, durMax, parsedFrom, parsedTo))
                .collect(Collectors.toList());

        // 4. Сортировка
        result.sort(buildComparator(sortBy, sortDir));

        return result;
    }

    // ─────────────────────────────────────────────────────────────
    private boolean filterMatches(
            SearchRouteResponse r,
            String search, List<String> transports, List<String> categories,
            Double priceMin, Double priceMax,
            Integer durMin, Integer durMax,
            LocalDate parsedFrom, LocalDate parsedTo
    ) {
        // Текстовый поиск
        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            boolean match = safeContains(r.getTitle(), q)
                    || safeContains(r.getStartLocation(), q)
                    || safeContains(r.getEndLocation(), q)
                    || safeContains(r.getDescription(), q);
            if (!match) return false;
        }

        // Транспорт (несколько значений — OR логика)
        if (transports != null && !transports.isEmpty()) {
            if (r.getTransportType() == null ||
                    !transports.contains(r.getTransportType())) return false;
        }

        // Категории (несколько значений — маршрут должен иметь ХОТЯ БЫ одну из выбранных)
        if (categories != null && !categories.isEmpty()) {
            List<String> routeCats = r.getCategories() != null ? r.getCategories() : List.of();
            boolean hasAny = categories.stream().anyMatch(routeCats::contains);
            if (!hasAny) return false;
        }

        // Цена
        double price = r.getTotalPrice() != null ? r.getTotalPrice().doubleValue() : 0;
        if (priceMin != null && price < priceMin) return false;
        if (priceMax != null && price > priceMax) return false;

        // Длительность
        int dur = r.getDurationDays() != null ? r.getDurationDays() : 0;
        if (durMin != null && dur < durMin) return false;
        if (durMax != null && dur > durMax) return false;

        // Даты
        LocalDate routeStart = parseDate(r.getStartDate());
        if (routeStart != null) {
            if (parsedFrom != null && routeStart.isBefore(parsedFrom)) return false;
            if (parsedTo   != null && routeStart.isAfter(parsedTo))    return false;
        }

        return true;
    }

    // ─────────────────────────────────────────────────────────────
    private SearchRouteResponse toResponse(Route r) {
        SearchRouteResponse res = new SearchRouteResponse();
        res.setId(r.getRouteId());
        res.setTitle(r.getTitle());
        res.setDescription(r.getDescription());
        res.setStartLocation(r.getStartLocation());
        res.setEndLocation(r.getEndLocation());
        res.setStartDate(r.getStartDate() != null ? r.getStartDate().toString() : null);
        res.setEndDate(r.getEndDate()     != null ? r.getEndDate().toString()   : null);
        res.setDurationDays(r.getDurationDays());
        res.setTransportType(r.getTransportType());
        res.setTotalPrice(r.getTotalPrice());

        // Данные гида
        if (r.getCreator() != null) {
            res.setGuideId(r.getCreator().getUserId());
            res.setGuideFullName(r.getCreator().getFullName());
            res.setGuideEmail(r.getCreator().getEmail());
        }

        // Категории точек маршрута (уникальные)
        List<String> cats = routePointRepository
                .findByRoute_RouteIdOrderByVisitOrderAsc(r.getRouteId())
                .stream()
                .map(rp -> rp.getPointOfInterest().getCategory())
                .filter(Objects::nonNull)
                .filter(c -> !c.isBlank())
                .distinct()
                .collect(Collectors.toList());
        res.setCategories(cats);

        return res;
    }

    // ─────────────────────────────────────────────────────────────
    private Comparator<SearchRouteResponse> buildComparator(String sortBy, String sortDir) {
        Comparator<SearchRouteResponse> cmp = switch (sortBy == null ? "startDate" : sortBy) {
            case "price"    -> Comparator.comparing(r ->
                    r.getTotalPrice() != null ? r.getTotalPrice() : java.math.BigDecimal.ZERO);
            case "duration" -> Comparator.comparingInt(r ->
                    r.getDurationDays() != null ? r.getDurationDays() : 0);
            case "title"    -> Comparator.comparing(r ->
                    r.getTitle() != null ? r.getTitle() : "");
            default         -> Comparator.comparing(r ->
                    r.getStartDate() != null ? r.getStartDate() : "9999");
        };
        return "desc".equalsIgnoreCase(sortDir) ? cmp.reversed() : cmp;
    }

    private LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        try { return LocalDate.parse(s.substring(0, 10)); }
        catch (Exception e) { return null; }
    }

    private boolean safeContains(String val, String q) {
        return val != null && val.toLowerCase().contains(q);
    }
}