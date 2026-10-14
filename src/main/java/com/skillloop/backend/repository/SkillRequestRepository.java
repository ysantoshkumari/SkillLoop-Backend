package com.skillloop.backend.repository;

import com.skillloop.backend.entity.SkillRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SkillRequestRepository extends JpaRepository<SkillRequest, Integer> {
    List<SkillRequest> findByRequesterIdOrReceiverId(Integer requesterId, Integer receiverId);
}