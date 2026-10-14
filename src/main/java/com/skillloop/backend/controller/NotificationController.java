package com.skillloop.backend.controller;

import com.skillloop.backend.entity.Notification;
import com.skillloop.backend.repository.NotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationRepository repository;

    public NotificationController(NotificationRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Notification> all() { return repository.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Notification> one(@PathVariable Integer id) {
        return repository.findById(id).map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public List<Notification> byUser(@PathVariable Integer userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @PostMapping
    public Notification create(@RequestBody Notification notification) {
        notification.setId(null);
        if (notification.getIsRead() == null) notification.setIsRead(false);
        return repository.save(notification);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Notification> update(@PathVariable Integer id, @RequestBody Notification input) {
        return repository.findById(id).map(notification -> {
            if (input.getUserId() != null) notification.setUserId(input.getUserId());
            if (input.getMessage() != null) notification.setMessage(input.getMessage());
            if (input.getIsRead() != null) notification.setIsRead(input.getIsRead());
            return ResponseEntity.ok(repository.save(notification));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}