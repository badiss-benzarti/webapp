package com.project.productservice.event;

public class OrderCreatedEvent {

    private Long productId;
    private int quantity;

    public OrderCreatedEvent() {
    }

    public Long getProductId() {
        return productId;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}