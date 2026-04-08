package com.delivry.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        long startedAt = System.currentTimeMillis();
        String user = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : "anonymous";
        String query = request.getQueryString();
        String url = query == null ? request.getRequestURI() : request.getRequestURI() + "?" + query;

        log.info("HTTP request started: method={}, url={}, user={}, ip={}",
                request.getMethod(), url, user, request.getRemoteAddr());

        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = System.currentTimeMillis() - startedAt;
            log.info("HTTP request completed: method={}, url={}, status={}, user={}, durationMs={}",
                    request.getMethod(), url, response.getStatus(), user, durationMs);
        }
    }
}
