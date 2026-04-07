package com.delivry.backend.pattern.strategy;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Стратегия для автомобильного маршрута
 */
public class CarCostStrategy implements CostCalculationStrategy {

    private static final BigDecimal COST_PER_100KM = BigDecimal.valueOf(8); // €8 на 100км
    private static final BigDecimal COST_PER_DAY = BigDecimal.valueOf(50); // €50 в день на проживание

    @Override
    public BigDecimal calculateCost(BigDecimal distance, int durationDays, int participants) {
        // Стоимость топлива + проживание
        BigDecimal fuelCost = distance.divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                .multiply(COST_PER_100KM);
        BigDecimal accommodationCost = COST_PER_DAY.multiply(BigDecimal.valueOf(durationDays));

        return fuelCost.add(accommodationCost).multiply(BigDecimal.valueOf(participants));
    }

    @Override
    public String getStrategyName() {
        return "Автомобиль";
    }
}