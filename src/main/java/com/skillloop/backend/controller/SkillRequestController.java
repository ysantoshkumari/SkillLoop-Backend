package com.skillloop.backend.controller;

import com.skillloop.backend.entity.SkillRequest;
import com.skillloop.backend.repository.SkillRequestRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/requests")
public class SkillRequestController {
    private final SkillRequestRepository repository;

    public SkillRequestController(SkillRequestRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<SkillRequest> all() { return repository.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<SkillRequest> one(@PathVariable Integer id) {
        return repository.findById(id).map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public List<SkillRequest> byUser(@PathVariable Integer userId) {
        return repository.findByRequesterIdOrReceiverId(userId, userId);
    }

    @PostMapping
    public SkillRequest create(@RequestBody SkillRequest request) {
        request.setId(null);
        request.setStatus(SkillRequest.RequestStatus.pending);
        return repository.save(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SkillRequest> update(@PathVariable Integer id, @RequestBody SkillRequest input) {
        return repository.findById(id).map(request -> {
            if (input.getRequesterId() != null) request.setRequesterId(input.getRequesterId());
            if (input.getReceiverId() != null) request.setReceiverId(input.getReceiverId());
            if (input.getSkillId() != null) request.setSkillId(input.getSkillId());
            request.setMessage(input.getMessage());
            if (input.getStatus() != null) request.setStatus(input.getStatus());
            return ResponseEntity.ok(repository.save(request));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}