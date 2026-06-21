package com.project.productservice.controller;

import com.project.productservice.client.OrderClient;
import com.project.productservice.dto.OrderCountResponse;
import com.project.productservice.entity.Product;
import com.project.productservice.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/products")

public class ProductController {

    @Value("${message:No message found}")
    private String message;

    private final ProductRepository productRepository;
    private final OrderClient orderClient;

    public ProductController(ProductRepository productRepository, OrderClient orderClient) {
        this.productRepository = productRepository;
        this.orderClient = orderClient;
    }

    @GetMapping("/config-message")
    public String getConfigMessage() {
        return message;
    }

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(product -> ResponseEntity.ok(product))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/orders-count")
    public ResponseEntity<Map<String, Object>> getProductOrdersCount(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(product -> {
                    OrderCountResponse orderCount = orderClient.getOrdersCountByProduct(id);

                    Map<String, Object> response = new HashMap<>();
                    response.put("productId", product.getId());
                    response.put("productName", product.getName());
                    response.put("ordersCount", orderCount.getOrdersCount());

                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Product createProduct(@RequestBody Product product) {
        return productRepository.save(product);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product updatedProduct) {
        return productRepository.findById(id)
                .map(product -> {
                    product.setName(updatedProduct.getName());
                    product.setPrice(updatedProduct.getPrice());
                    product.setQuantity(updatedProduct.getQuantity());

                    Product savedProduct = productRepository.save(product);
                    return ResponseEntity.ok(savedProduct);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteProduct(@PathVariable Long id) {
        if (!productRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        OrderCountResponse orderCount = orderClient.getOrdersCountByProduct(id);

        Long count = orderCount.getOrdersCount();
        if (count == null) {
            count = 0L;
        }

        if (count > 0) {
            Map<String, Object> response = new HashMap<>();
            response.put("scenario", "Feign - Prevent deleting product with existing orders");
            response.put("message", "Cannot delete product because it has existing orders");
            response.put("productId", id);
            response.put("ordersCount", count);

            return ResponseEntity.badRequest().body(response);
        }

        productRepository.deleteById(id);

        Map<String, Object> response = new HashMap<>();
        response.put("scenario", "Feign - Product deleted after checking orders");
        response.put("message", "Product deleted successfully");
        response.put("productId", id);
        response.put("ordersCount", count);

        return ResponseEntity.ok(response);
    }
}