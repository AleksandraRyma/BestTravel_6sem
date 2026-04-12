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