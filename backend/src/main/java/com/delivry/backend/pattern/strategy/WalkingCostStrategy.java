package com.delivry.backend.pattern.strategy;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Стратегия для пешего маршрута
 */
public class WalkingCostStrategy implements CostCalculationStrategy {

    private static final BigDecimal COST_PER_DAY = BigDecimal.valueOf(10); // €10 в день на питание

    @Override
    public BigDecimal calculateCost(BigDecimal distance, int durationDays, int participants) {
        // Пешком бесплатно, только расходы на питание
        return COST_PER_DAY.multiply(BigDecimal.valueOf(durationDays))
                .multiply(BigDecimal.valueOf(participants));
    }

    @Override
    public String getStrategyName() {
        return "Пешком (только питание)";
    }
}