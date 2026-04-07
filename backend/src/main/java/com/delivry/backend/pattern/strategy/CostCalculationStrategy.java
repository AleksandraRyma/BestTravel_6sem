package com.delivry.backend.pattern.strategy;

import java.math.BigDecimal;

/**
 * Интерфейс стратегии расчета стоимости
 */
public interface CostCalculationStrategy {
    BigDecimal calculateCost(BigDecimal distance, int durationDays, int participants);
    String getStrategyName();
}