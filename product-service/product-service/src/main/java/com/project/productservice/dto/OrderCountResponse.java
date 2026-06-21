package com.project.productservice.dto;

public class OrderCountResponse {

    private Long productId;
    private Long ordersCount;

    public OrderCountResponse() {
    }

    public Long getProductId() {
        return productId;
    }

    public Long getOrdersCount() {
        return ordersCount;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public void setOrdersCount(Long ordersCount) {
        this.ordersCount = ordersCount;
    }
}