package com.delivry.backend.pattern.strategy;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Стратегия для авиаперелета
 */
public class PlaneCostStrategy implements CostCalculationStrategy {

    private static final BigDecimal COST_PER_100KM = BigDecimal.valueOf(15); // €15 на 100км
    private static final BigDecimal COST_PER_DAY = BigDecimal.valueOf(80); // €80 в день

    @Override
    public BigDecimal calculateCost(BigDecimal distance, int durationDays, int participants) {
        BigDecimal flightCost = distance.divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                .multiply(COST_PER_100KM);
        BigDecimal accommodationCost = COST_PER_DAY.multiply(BigDecimal.valueOf(durationDays));

        return flightCost.add(accommodationCost).multiply(BigDecimal.valueOf(participants));
    }

    @Override
    public String getStrategyName() {
        return "Самолет";
    }
}