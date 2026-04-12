package com.delivry.backend.pattern.strategy;

import java.math.BigDecimal;
import java.math.RoundingMode;


public class TransitCostStrategy implements CostCalculationStrategy {

    private static final BigDecimal COST_PER_100KM = BigDecimal.valueOf(3); // €3 на 100км
    private static final BigDecimal COST_PER_DAY = BigDecimal.valueOf(40); // €40 в день

    @Override
    public BigDecimal calculateCost(BigDecimal distance, int durationDays, int participants) {
        BigDecimal transportCost = distance.divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                .multiply(COST_PER_100KM);
        BigDecimal accommodationCost = COST_PER_DAY.multiply(BigDecimal.valueOf(durationDays));

        return transportCost.add(accommodationCost).multiply(BigDecimal.valueOf(participants));
    }

    @Override
    public String getStrategyName() {
        return "Общественный транспорт";
    }
}