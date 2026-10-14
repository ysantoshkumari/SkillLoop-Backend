
package com.skillloop.backend.controller;

import com.skillloop.backend.entity.User;
import com.skillloop.backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository repository;

    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    public UserController(UserRepository repository) {
        this.repository = repository;
    }

    // Return only safe user details. Never expose password hashes.
    private Map<String, Object> userResponse(User user) {
        Map<String, Object> response = new LinkedHashMap<>();

        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("createdAt", user.getCreatedAt());

        return response;
    }

    // Get all users without exposing passwords.
    @GetMapping
    public List<Map<String, Object>> all() {
        List<Map<String, Object>> users = new ArrayList<>();

        for (User user : repository.findAll()) {
            users.add(userResponse(user));
        }

        return users;
    }

    // Get one user without exposing their password.
    @GetMapping("/{id}")
    public ResponseEntity<?> one(@PathVariable Integer id) {
        return repository.findById(id)
                .<ResponseEntity<?>>map(user ->
                        ResponseEntity.ok(userResponse(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    // Register a new user.
    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody Map<String, String> input) {

        String name = input.get("name");
        String email = input.get("email");
        String password = input.get("password");

        if (name == null || name.isBlank()
                || email == null || email.isBlank()
                || password == null || password.length() < 8) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "error",
                            "Name, email and a password of at least 8 characters are required."
                    )
            );
        }

        name = name.trim();
        email = email.trim().toLowerCase(Locale.ROOT);

        if (repository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    Map.of("error", "An account with this email already exists.")
            );
        }

        User user = new User();

        user.setName(name);
        user.setEmail(email);

        // Store a BCrypt hash, never the plain-text password.
        user.setPasswordHash(passwordEncoder.encode(password));

        User savedUser = repository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userResponse(savedUser));
    }

    // Update user details safely.
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> input) {
        String email = input.get("email");
        String password = input.get("password");

        if (email == null || email.isBlank()
                || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Email and password are required.")
            );
        }

        email = email.trim().toLowerCase(Locale.ROOT);

        User user = repository.findByEmail(email).orElse(null);

        if (user == null || !passwordEncoder.matches(
                password, user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("error", "Invalid email or password.")
            );
        }

        return ResponseEntity.ok(userResponse(user));
    }
    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Integer id,
            @RequestBody Map<String, String> input) {

        return repository.findById(id)
                .<ResponseEntity<?>>map(user -> {

                    String name = input.get("name");
                    String email = input.get("email");
                    String password = input.get("password");

                    if (name != null) {
                        if (name.isBlank()) {
                            return ResponseEntity.badRequest().body(
                                    Map.of("error", "Name cannot be empty.")
                            );
                        }

                        user.setName(name.trim());
                    }

                    if (email != null) {
                        if (email.isBlank()) {
                            return ResponseEntity.badRequest().body(
                                    Map.of("error", "Email cannot be empty.")
                            );
                        }

                        email = email.trim().toLowerCase(Locale.ROOT);

                        if (!user.getEmail().equalsIgnoreCase(email)
                                && repository.existsByEmail(email)) {

                            return ResponseEntity.status(HttpStatus.CONFLICT)
                                    .body(Map.of(
                                            "error",
                                            "An account with this email already exists."
                                    ));
                        }

                        user.setEmail(email);
                    }

                    if (password != null) {
                        if (password.length() < 8) {
                            return ResponseEntity.badRequest().body(
                                    Map.of(
                                            "error",
                                            "Password must contain at least 8 characters."
                                    )
                            );
                        }

                        user.setPasswordHash(
                                passwordEncoder.encode(password)
                        );
                    }

                    User updatedUser = repository.save(user);

                    return ResponseEntity.ok(userResponse(updatedUser));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete a user.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {

        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        repository.deleteById(id);

        return ResponseEntity.noContent().build();
    }
}
