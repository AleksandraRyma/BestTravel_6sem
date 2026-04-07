package com.delivry.backend.pattern.strategy;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Стратегия для велосипедного маршрута
 */
public class BikeCostStrategy implements CostCalculationStrategy {

    private static final BigDecimal COST_PER_DAY = BigDecimal.valueOf(25); // €25 в день

    @Override
    public BigDecimal calculateCost(BigDecimal distance, int durationDays, int participants) {
        // Велосипед бесплатно, только проживание и питание
        return COST_PER_DAY.multiply(BigDecimal.valueOf(durationDays))
                .multiply(BigDecimal.valueOf(participants));
    }

    @Override
    public String getStrategyName() {
        return "Велосипед";
    }
}