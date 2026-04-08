package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.ParticipantStatus;
import com.delivry.backend.domain.entity.PointOfInterest;
import com.delivry.backend.domain.entity.Review;
import com.delivry.backend.domain.entity.Route;
import com.delivry.backend.domain.entity.RouteParticipant;
import com.delivry.backend.domain.entity.RouteParticipantId;
import com.delivry.backend.domain.entity.RoutePoint;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.repository.FavoriteRouteRepository;
import com.delivry.backend.domain.repository.InterestCategoryRepository;
import com.delivry.backend.domain.repository.PointOfInterestRepository;
import com.delivry.backend.domain.repository.ReviewRepository;
import com.delivry.backend.domain.repository.RouteParticipantRepository;
import com.delivry.backend.domain.repository.RoutePointRepository;
import com.delivry.backend.domain.repository.RouteRepository;
import com.delivry.backend.domain.repository.UserRepository;
import com.delivry.backend.request.SubmitRouteReviewRequest;
import com.delivry.backend.request.UpdateTravelerProfileRequest;
import com.delivry.backend.response.ReviewableRouteResponse;
import com.delivry.backend.response.TravelerProfileResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TravelerServiceTest {

    @Mock
    private RouteRepository routeRepository;
    @Mock
    private InterestCategoryRepository interestCategoryRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private FavoriteRouteRepository favoriteRouteRepository;
    @Mock
    private RouteParticipantRepository routeParticipantRepository;
    @Mock
    private RoutePointRepository routePointRepository;
    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private PointOfInterestRepository pointOfInterestRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private TravelerService travelerService;

    @Test
    void updateProfileShouldUpdateFieldsAndEncodePassword() {
        User user = User.builder()
                .userId(5L)
                .fullName("Old Name")
                .email("old@test.com")
                .passwordHash("old-hash")
                .createdAt(LocalDate.of(2026, 1, 1))
                .build();

        UpdateTravelerProfileRequest request = new UpdateTravelerProfileRequest();
        request.setFullName("New Name");
        request.setEmail("new@test.com");
        request.setPassword("secret");

        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("secret")).thenReturn("encoded-secret");
        when(userRepository.save(user)).thenReturn(user);
        when(routeRepository.countByCreator_UserId(5L)).thenReturn(2L);
        when(favoriteRouteRepository.countByUser_UserId(5L)).thenReturn(3L);
        when(routeParticipantRepository.countByUser_UserId(5L)).thenReturn(4L);

        TravelerProfileResponse response = travelerService.updateProfile(5L, request);

        assertThat(user.getFullName()).isEqualTo("New Name");
        assertThat(user.getEmail()).isEqualTo("new@test.com");
        assertThat(user.getPasswordHash()).isEqualTo("encoded-secret");
        assertThat(response.getFavoritesCount()).isEqualTo(3);
    }

    @Test
    void getReviewableRoutesShouldMergeOwnedAndParticipatingRoutesWithoutDuplicates() {
        User user = User.builder().userId(9L).build();
        Route sharedRoute = completedRoute(1L, "Shared", user);
        Route participantOnlyRoute = completedRoute(2L, "Participant", User.builder().userId(99L).build());
        ParticipantStatus accepted = ParticipantStatus.builder().id(2).name("ACCEPTED").build();

        when(routeRepository.findByCreator_UserId(9L)).thenReturn(List.of(sharedRoute));
        when(routeParticipantRepository.findByUser_UserIdAndParticipantStatus_Name(9L, "ACCEPTED"))
                .thenReturn(List.of(
                        RouteParticipant.builder()
                                .id(new RouteParticipantId(1L, 9L))
                                .route(sharedRoute)
                                .user(user)
                                .participantStatus(accepted)
                                .build(),
                        RouteParticipant.builder()
                                .id(new RouteParticipantId(2L, 9L))
                                .route(participantOnlyRoute)
                                .user(user)
                                .participantStatus(accepted)
                                .build()
                ));
        when(routePointRepository.findByRoute_RouteIdOrderByVisitOrderAsc(1L)).thenReturn(List.of());
        when(routePointRepository.findByRoute_RouteIdOrderByVisitOrderAsc(2L)).thenReturn(List.of());

        List<ReviewableRouteResponse> result = travelerService.getReviewableRoutes(9L);

        assertThat(result).hasSize(2);
        assertThat(result).extracting(ReviewableRouteResponse::getRouteId).containsExactly(1L, 2L);
    }

    @Test
    void saveRouteReviewsShouldUpdateReviewAndRecalculateAverageRating() {
        User user = User.builder().userId(7L).fullName("Traveler").build();
        PointOfInterest poi = PointOfInterest.builder().id(100L).name("Castle").averageRating(2.0).build();
        Route route = completedRoute(10L, "History Tour", user);
        RoutePoint routePoint = RoutePoint.builder()
                .id(200L)
                .route(route)
                .pointOfInterest(poi)
                .visitOrder(1)
                .build();
        Review existingReview = Review.builder()
                .id(300L)
                .user(user)
                .pointOfInterest(poi)
                .rating(2)
                .comment("old")
                .build();

        SubmitRouteReviewRequest.PointReviewRequest pointReview = new SubmitRouteReviewRequest.PointReviewRequest();
        pointReview.setPointOfInterestId(100L);
        pointReview.setRating(5);
        pointReview.setComment("  Excellent place  ");

        SubmitRouteReviewRequest request = new SubmitRouteReviewRequest();
        request.setReviews(List.of(pointReview));

        when(routeRepository.findById(10L)).thenReturn(Optional.of(route));
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(routePointRepository.findByRoute_RouteIdOrderByVisitOrderAsc(10L)).thenReturn(List.of(routePoint));
        when(reviewRepository.findByUser_UserIdAndPointOfInterest_Id(7L, 100L))
                .thenReturn(Optional.of(existingReview), Optional.of(existingReview));
        when(pointOfInterestRepository.findById(100L)).thenReturn(Optional.of(poi));
        when(reviewRepository.findByPointOfInterest_Id(100L)).thenReturn(List.of(
                Review.builder().rating(5).build(),
                Review.builder().rating(4).build()
        ));

        ReviewableRouteResponse response = travelerService.saveRouteReviews(7L, 10L, request);

        ArgumentCaptor<Review> reviewCaptor = ArgumentCaptor.forClass(Review.class);
        verify(reviewRepository).save(reviewCaptor.capture());
        assertThat(reviewCaptor.getValue().getRating()).isEqualTo(5);
        assertThat(reviewCaptor.getValue().getComment()).isEqualTo("Excellent place");

        ArgumentCaptor<PointOfInterest> poiCaptor = ArgumentCaptor.forClass(PointOfInterest.class);
        verify(pointOfInterestRepository).save(poiCaptor.capture());
        assertThat(poiCaptor.getValue().getAverageRating()).isEqualTo(4.5);
        assertThat(response.getReviewedPointsCount()).isEqualTo(1);
        assertThat(response.getReviewStatus()).isEqualTo("DONE");
    }

    @Test
    void saveRouteReviewsShouldRejectUnknownRoute() {
        when(routeRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> travelerService.saveRouteReviews(1L, 404L, new SubmitRouteReviewRequest()))
                .isInstanceOf(EntityNotFoundException.class);
    }

    private Route completedRoute(Long id, String title, User creator) {
        return Route.builder()
                .routeId(id)
                .title(title)
                .creator(creator)
                .startLocation("Minsk")
                .endLocation("Brest")
                .startDate(LocalDate.now().minusDays(5))
                .endDate(LocalDate.now().minusDays(2))
                .durationDays(4)
                .transportType("CAR")
                .createdAt(LocalDateTime.now())
                .build();
    }
}
