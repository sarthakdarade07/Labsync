package com.labsync.lms.repository;

import com.labsync.lms.model.Lab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * LabRepository — data access for Lab entity.
 */
@Repository
public interface LabRepository extends JpaRepository<Lab, Long> {

    Optional<Lab> findByLabName(String labName);

    List<Lab> findByAvailableTrue();

    List<Lab> findByOsType(String osType);

    /** Find labs with enough working computers to accommodate a batch */
    @Query("SELECT l FROM Lab l WHERE l.workingComputers >= :requiredComputers AND l.available = true")
    List<Lab> findAvailableLabsWithCapacity(@Param("requiredComputers") int requiredComputers);

    /** Find labs not scheduled for a given day+time and matching requirements */
    @Query("""
            SELECT l FROM Lab l WHERE l.id NOT IN (
                SELECT s.lab.id FROM Schedule s
                WHERE s.day.id = :dayId AND s.active = true
                  AND (s.startTime < :endTime AND s.endTime > :startTime)
            ) AND l.available = true AND l.workingComputers >= :requiredComputers
              AND (:osType = '' OR l.osType = :osType)
            """)
    List<Lab> findAvailableLabsForSession(
            @Param("dayId") Long dayId,
            @Param("startTime") java.time.LocalTime startTime,
            @Param("endTime") java.time.LocalTime endTime,
            @Param("requiredComputers") int requiredComputers,
            @Param("osType") String osType
    );
}
