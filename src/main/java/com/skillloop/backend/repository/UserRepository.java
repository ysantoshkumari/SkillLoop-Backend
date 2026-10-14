package com.skillloop.backend.repository;

import com.skillloop.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Integer> {
    boolean existsByEmail(String email);

    java.util.Optional<User> findByEmail(String email);
}
