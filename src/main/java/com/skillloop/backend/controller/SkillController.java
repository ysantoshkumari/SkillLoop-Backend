package com.skillloop.backend.controller;

import com.skillloop.backend.entity.Skill;
import com.skillloop.backend.repository.SkillRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/skills")
public class SkillController {
    private final SkillRepository repository;

    public SkillController(SkillRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Skill> all() { return repository.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Skill> one(@PathVariable Integer id) {
        return repository.findById(id).map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public List<Skill> byUser(@PathVariable Integer userId) {
        return repository.findByUserId(userId);
    }

    @PostMapping
    public Skill create(@RequestBody Skill skill) {
        skill.setId(null);
        return repository.save(skill);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Skill> update(@PathVariable Integer id, @RequestBody Skill input) {
        return repository.findById(id).map(skill -> {
            if (input.getUserId() != null) skill.setUserId(input.getUserId());
            if (input.getTitle() != null) skill.setTitle(input.getTitle());
            skill.setDescription(input.getDescription());
            skill.setCategory(input.getCategory());
            if (input.getSkillType() != null) skill.setSkillType(input.getSkillType());
            return ResponseEntity.ok(repository.save(skill));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}