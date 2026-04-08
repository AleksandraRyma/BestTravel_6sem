package com.delivry.backend.controller;

import com.delivry.backend.application.service.FavoritesService;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.repository.UserRepository;
import com.delivry.backend.response.FavoriteRouteResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class FavoritesControllerMockMvcTest {

    @Mock
    private FavoritesService favoritesService;
    @Mock
    private UserRepository userRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new FavoritesController(favoritesService, userRepository))
                .build();
    }

    @Test
    void getFavoritesShouldReturnSerializedList() throws Exception {
        FavoriteRouteResponse response = new FavoriteRouteResponse();
        response.setId(11L);
        response.setTitle("Historic Walk");
        response.setTotalPrice(BigDecimal.valueOf(150));
        response.setAverageRating(4.7);

        when(userRepository.findByEmail("traveler@test.com"))
                .thenReturn(Optional.of(User.builder().userId(5L).email("traveler@test.com").build()));
        when(favoritesService.getFavorites(eq(5L), eq("historic"), eq("WALK"),
                eq(100.0), eq(200.0), eq(1), eq(3), eq(4.0),
                eq("2026-05-01"), eq("2026-05-20"), eq("price"), eq("asc")))
                .thenReturn(List.of(response));

        mockMvc.perform(get("/api/traveler/favorites")
                        .principal(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("traveler@test.com", "pwd"))
                        .param("search", "historic")
                        .param("transportType", "WALK")
                        .param("priceMin", "100")
                        .param("priceMax", "200")
                        .param("durMin", "1")
                        .param("durMax", "3")
                        .param("ratingMin", "4.0")
                        .param("dateFrom", "2026-05-01")
                        .param("dateTo", "2026-05-20")
                        .param("sortBy", "price")
                        .param("sortDir", "asc")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(11L))
                .andExpect(jsonPath("$[0].title").value("Historic Walk"));
    }

    @Test
    void addFavoriteShouldDelegateToService() throws Exception {
        when(userRepository.findByEmail("traveler@test.com"))
                .thenReturn(Optional.of(User.builder().userId(5L).email("traveler@test.com").build()));

        mockMvc.perform(post("/api/traveler/favorites/77")
                        .principal(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("traveler@test.com", "pwd")))
                .andExpect(status().isOk());

        verify(favoritesService).addFavorite(5L, 77L);
    }
}
