package com.delivry.backend.controller;

import com.delivry.backend.application.service.RouteService;
import com.delivry.backend.application.service.TravelerService;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.repository.UserRepository;
import com.delivry.backend.request.UpdateTravelerProfileRequest;
import com.delivry.backend.response.RouteListResponse;
import com.delivry.backend.response.TravelerProfileResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TravelerControllerMockMvcTest {

    @Mock
    private TravelerService travelerService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RouteService routeService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new TravelerController(travelerService, userRepository, routeService))
                .build();
    }

    @Test
    void getProfileShouldReturnCurrentTravelerProfile() throws Exception {
        TravelerProfileResponse response = new TravelerProfileResponse();
        response.setId(8L);
        response.setFullName("Test Traveler");
        response.setEmail("traveler@test.com");
        response.setCreatedAt(LocalDate.of(2026, 2, 10));

        when(userRepository.findByEmail("traveler@test.com"))
                .thenReturn(Optional.of(User.builder().userId(8L).email("traveler@test.com").build()));
        when(travelerService.getProfile(8L)).thenReturn(response);

        mockMvc.perform(get("/api/traveler/profile")
                        .principal(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("traveler@test.com", "pwd")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(8L))
                .andExpect(jsonPath("$.email").value("traveler@test.com"));
    }

    @Test
    void updateProfileShouldPassResolvedUserIdToService() throws Exception {
        UpdateTravelerProfileRequest request = new UpdateTravelerProfileRequest();
        request.setFullName("Updated User");
        request.setEmail("traveler@test.com");

        TravelerProfileResponse response = new TravelerProfileResponse();
        response.setId(8L);
        response.setFullName("Updated User");
        response.setEmail("traveler@test.com");

        when(userRepository.findByEmail("traveler@test.com"))
                .thenReturn(Optional.of(User.builder().userId(8L).email("traveler@test.com").build()));
        when(travelerService.updateProfile(eq(8L), any(UpdateTravelerProfileRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/traveler/profile")
                        .principal(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("traveler@test.com", "pwd"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Updated User"));

        verify(travelerService).updateProfile(eq(8L), any(UpdateTravelerProfileRequest.class));
    }

    @Test
    void getMyRoutesShouldReturnFilteredRoutes() throws Exception {
        RouteListResponse route = new RouteListResponse();
        route.setId(14L);
        route.setTitle("Weekend Escape");

        when(userRepository.findByEmail("traveler@test.com"))
                .thenReturn(Optional.of(User.builder().userId(8L).email("traveler@test.com").build()));
        when(routeService.getMyRoutesFiltered(8L, "weekend", "CAR", "upcoming",
                "2026-05-01", "2026-05-31", "startDate", "asc"))
                .thenReturn(List.of(route));

        mockMvc.perform(get("/api/traveler/my-routes")
                        .principal(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("traveler@test.com", "pwd"))
                        .param("search", "weekend")
                        .param("transportType", "CAR")
                        .param("status", "upcoming")
                        .param("dateFrom", "2026-05-01")
                        .param("dateTo", "2026-05-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Weekend Escape"));
    }
}
