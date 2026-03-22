package com.delivry.backend.controller;

import com.delivry.backend.application.service.SearchService;
import com.delivry.backend.response.SearchRouteResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/traveler/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    /**
     * GET /api/traveler/search
     *
     * Параметры (все необязательны):
     *   search      — поиск по названию / откуда / куда
     *   transport   — WALK|BIKE|CAR|TRANSIT|PLANE (можно несколько: ?transport=CAR&transport=PLANE)
     *   category    — название категории (можно несколько)
     *   priceMin    — минимальная цена
     *   priceMax    — максимальная цена
     *   durMin      — минимальное количество дней
     *   durMax      — максимальное количество дней
     *   dateFrom    — дата начала от (yyyy-MM-dd)
     *   dateTo      — дата начала до (yyyy-MM-dd)
     *   sortBy      — startDate|price|duration|title (default: startDate)
     *   sortDir     — asc|desc (default: asc)
     *
     * Возвращает маршруты созданные пользователями с role_id = 2 (GUIDE)
     */
    @GetMapping
    public ResponseEntity<List<SearchRouteResponse>> search(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) List<String> transport,
            @RequestParam(required = false) List<String> category,
            @RequestParam(required = false) Double priceMin,
            @RequestParam(required = false) Double priceMax,
            @RequestParam(required = false) Integer durMin,
            @RequestParam(required = false) Integer durMax,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(defaultValue = "startDate") String sortBy,
            @RequestParam(defaultValue = "asc")       String sortDir
    ) {
        return ResponseEntity.ok(
                searchService.searchGuideRoutes(
                        search, transport, category,
                        priceMin, priceMax,
                        durMin, durMax,
                        dateFrom, dateTo,
                        sortBy, sortDir
                )
        );
    }
}