package com.project.productservice.client;

import com.project.productservice.dto.OrderCountResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "ORDER-SERVICE")
public interface OrderClient {

    @GetMapping("/orders/count/product/{productId}")
    OrderCountResponse getOrdersCountByProduct(@PathVariable("productId") Long productId);
}