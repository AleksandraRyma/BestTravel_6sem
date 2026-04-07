package com.delivry.backend.pattern.strategy;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Фабрика стратегий для выбора нужной стратегии расчета стоимости
 */
@Component
public class CostStrategyFactory {

    private final Map<String, CostCalculationStrategy> strategies = new HashMap<>();

    public CostStrategyFactory() {
        strategies.put("WALK", new WalkingCostStrategy());
        strategies.put("BIKE", new BikeCostStrategy());
        strategies.put("CAR", new CarCostStrategy());
        strategies.put("TRANSIT", new TransitCostStrategy());
        strategies.put("PLANE", new PlaneCostStrategy());
    }

    public CostCalculationStrategy getStrategy(String transportType) {
        CostCalculationStrategy strategy = strategies.get(transportType);
        if (strategy == null) {
            throw new IllegalArgumentException("Неизвестный тип транспорта: " + transportType);
        }
        return strategy;
    }
}