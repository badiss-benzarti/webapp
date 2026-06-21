package com.project.productservice.listener;

import com.project.productservice.config.RabbitMQConfig;
import com.project.productservice.entity.Product;
import com.project.productservice.event.OrderCreatedEvent;
import com.project.productservice.repository.ProductRepository;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class OrderCreatedListener {

    private final ProductRepository productRepository;

    public OrderCreatedListener(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    // RabbitMQ Scenario 1:
    // Order created -> reduce product stock
    @RabbitListener(queues = RabbitMQConfig.ORDER_CREATED_QUEUE)
    public void handleOrderCreated(OrderCreatedEvent event) {
        productRepository.findById(event.getProductId())
                .ifPresent(product -> {
                    int newQuantity = product.getQuantity() - event.getQuantity();

                    if (newQuantity < 0) {
                        newQuantity = 0;
                    }

                    product.setQuantity(newQuantity);
                    productRepository.save(product);

                    System.out.println("RabbitMQ Scenario 1: Stock decreased for product "
                            + product.getId() + ". New quantity: " + product.getQuantity());
                });
    }

    // RabbitMQ Scenario 2:
    // Order cancelled -> restore product stock
    @RabbitListener(queues = RabbitMQConfig.ORDER_CANCELLED_QUEUE)
    public void handleOrderCancelled(OrderCreatedEvent event) {
        productRepository.findById(event.getProductId())
                .ifPresent(product -> {
                    int newQuantity = product.getQuantity() + event.getQuantity();

                    product.setQuantity(newQuantity);
                    productRepository.save(product);

                    System.out.println("RabbitMQ Scenario 2: Stock restored for product "
                            + product.getId() + ". New quantity: " + product.getQuantity());
                });
    }
}