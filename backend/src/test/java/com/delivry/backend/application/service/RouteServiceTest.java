package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.Notification;
import com.delivry.backend.domain.entity.ParticipantStatus;
import com.delivry.backend.domain.entity.Route;
import com.delivry.backend.domain.entity.RouteParticipant;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.repository.NotificationRepository;
import com.delivry.backend.domain.repository.ParticipantStatusRepository;
import com.delivry.backend.domain.repository.PointOfInterestRepository;
import com.delivry.backend.domain.repository.RouteParticipantRepository;
import com.delivry.backend.domain.repository.RoutePointRepository;
import com.delivry.backend.domain.repository.RouteRepository;
import com.delivry.backend.domain.repository.UserRepository;
import com.delivry.backend.request.CreateRouteRequest;
import com.delivry.backend.response.RouteListResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RouteServiceTest {

    @Mock
    private RouteRepository routeRepository;
    @Mock
    private RoutePointRepository routePointRepository;
    @Mock
    private PointOfInterestRepository poiRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RouteParticipantRepository participantRepository;
    @Mock
    private ParticipantStatusRepository participantStatusRepository;
    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private RouteService routeService;

    @Test
    void createRouteShouldCalculateDurationAndPersistPoints() {
        User creator = User.builder().userId(1L).fullName("Creator").email("creator@test.com").passwordHash("hash").build();
        CreateRouteRequest request = new CreateRouteRequest();
        request.setTitle("Trip");
        request.setDescription("Desc");
        request.setStartLocation("Minsk");
        request.setEndLocation("Vilnius");
        request.setStartDate(LocalDate.of(2026, 5, 1));
        request.setEndDate(LocalDate.of(2026, 5, 3));
        request.setTransportType("CAR");
        request.setBudgetLimit(BigDecimal.valueOf(500));
        request.setTotalPrice(BigDecimal.valueOf(450));
        request.setImageUrl("image");
        request.setPoints(List.of(
                pointRequest("Castle", 1, "2026-05-01T10:00:00"),
                pointRequest("Museum", null, null)
        ));

        when(userRepository.findById(1L)).thenReturn(Optional.of(creator));
        when(routeRepository.save(any(Route.class))).thenAnswer(invocation -> {
            Route route = invocation.getArgument(0);
            route.setRouteId(100L);
            return route;
        });
        when(routePointRepository.findByRoute_RouteIdOrderByVisitOrderAsc(100L)).thenReturn(List.of());
        when(participantRepository.findByRoute_RouteId(100L)).thenReturn(List.of());

        routeService.createRoute(1L, request);

        ArgumentCaptor<Route> routeCaptor = ArgumentCaptor.forClass(Route.class);
        verify(routeRepository).save(routeCaptor.capture());
        Route savedRoute = routeCaptor.getValue();
        assertThat(savedRoute.getDurationDays()).isEqualTo(3);
        assertThat(savedRoute.getCreator()).isEqualTo(creator);

        verify(poiRepository, times(2)).save(any());
        verify(routePointRepository, times(2)).save(any());
    }

    @Test
    void inviteParticipantShouldCreateParticipantAndNotification() {
        User creator = User.builder().userId(1L).fullName("Organizer").email("creator@test.com").passwordHash("hash").build();
        User invitee = User.builder().userId(2L).fullName("Traveler").email("traveler@test.com").passwordHash("hash").build();
        Route route = Route.builder().routeId(50L).title("Weekend").creator(creator).build();
        ParticipantStatus pending = ParticipantStatus.builder().id(1).name("PENDING").build();

        when(routeRepository.findById(50L)).thenReturn(Optional.of(route));
        when(userRepository.findByEmail("traveler@test.com")).thenReturn(Optional.of(invitee));
        when(participantRepository.existsByRouteIdAndUserId(50L, 2L)).thenReturn(false);
        when(participantStatusRepository.findByName("PENDING")).thenReturn(Optional.of(pending));
        when(userRepository.findById(1L)).thenReturn(Optional.of(creator));

        routeService.inviteParticipant(50L, 1L, "traveler@test.com");

        verify(participantRepository).save(any(RouteParticipant.class));
        ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notificationCaptor.capture());
        assertThat(notificationCaptor.getValue().getUser()).isEqualTo(invitee);
        assertThat(notificationCaptor.getValue().getRouteId()).isEqualTo(50L);
        assertThat(notificationCaptor.getValue().getMessage()).contains("Weekend");
    }

    @Test
    void inviteParticipantShouldThrowWhenAlreadyInvited() {
        User creator = User.builder().userId(1L).build();
        Route route = Route.builder().routeId(50L).creator(creator).build();
        User invitee = User.builder().userId(2L).email("traveler@test.com").build();

        when(routeRepository.findById(50L)).thenReturn(Optional.of(route));
        when(userRepository.findByEmail("traveler@test.com")).thenReturn(Optional.of(invitee));
        when(participantRepository.existsByRouteIdAndUserId(50L, 2L)).thenReturn(true);

        assertThatThrownBy(() -> routeService.inviteParticipant(50L, 1L, "traveler@test.com"))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void getMyRoutesFilteredShouldApplyStatusAndSort() {
        LocalDate today = LocalDate.now();
        Route ongoing = route(1L, "Ongoing", today.minusDays(1), today.plusDays(1), "TRAIN", 300);
        Route upcoming = route(2L, "Upcoming", today.plusDays(2), today.plusDays(4), "CAR", 100);
        Route past = route(3L, "Past", today.minusDays(6), today.minusDays(2), "CAR", 200);

        when(routeRepository.findByCreator_UserId(7L)).thenReturn(List.of(ongoing, upcoming, past));
        when(participantRepository.findByRoute_RouteId(any())).thenReturn(List.of());

        List<RouteListResponse> result = routeService.getMyRoutesFiltered(
                7L,
                null,
                "CAR",
                "upcoming",
                null,
                null,
                "totalPrice",
                "asc"
        );

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Upcoming");
    }

    @Test
    void getRouteDetailShouldThrowWhenRouteMissing() {
        when(routeRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> routeService.getRouteDetail(404L, 1L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    private CreateRouteRequest.RoutePointRequest pointRequest(String name, Integer visitOrder, String plannedTime) {
        CreateRouteRequest.RoutePointRequest request = new CreateRouteRequest.RoutePointRequest();
        request.setName(name);
        request.setDescription(name + " description");
        request.setLatitude(53.9);
        request.setLongitude(27.56);
        request.setCategory("culture");
        request.setVisitOrder(visitOrder);
        request.setPlannedTime(plannedTime);
        return request;
    }

    private Route route(Long id, String title, LocalDate startDate, LocalDate endDate, String transportType, int price) {
        return Route.builder()
                .routeId(id)
                .title(title)
                .startLocation("A")
                .endLocation("B")
                .startDate(startDate)
                .endDate(endDate)
                .durationDays(2)
                .transportType(transportType)
                .totalPrice(BigDecimal.valueOf(price))
                .creator(User.builder().userId(7L).build())
                .build();
    }
}
