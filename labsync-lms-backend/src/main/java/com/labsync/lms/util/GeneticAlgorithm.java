package com.labsync.lms.util;

import com.labsync.lms.model.*;
import java.time.LocalTime;
import java.util.*;

/**
 * GeneticAlgorithm — generates optimised lab timetables using an evolutionary approach.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * ALGORITHM OVERVIEW
 * ───────────────────────────────────────────────────────────────────────────────
 * 1. INITIALISATION  — create N random chromosomes (candidate timetables)
 * 2. EVALUATION      — score each chromosome via the fitness function
 * 3. SELECTION       — pick parents using tournament selection
 * 4. CROSSOVER       — combine two parent chromosomes at a random split point
 * 5. MUTATION        — randomly alter a gene's lab/day/slot assignment
 * 6. ELITISM         — always carry the best chromosome to the next generation
 * 7. REPEAT 2-6 for maxGenerations iterations
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * FITNESS FUNCTION (maximise):
 *   Start at 1.0, subtract penalty per hard constraint violation:
 *    -0.20 per lab double-booking        (hard)
 *    -0.20 per staff double-booking      (hard)
 *    -0.20 per batch double-booking      (hard)
 *    -0.10 per lab capacity violation    (hard)
 *    -0.05 per staff teaching subjects outside their specialisation  (soft)
 *   Final score clamped to [0.0, 1.0].
 *
 * A perfect timetable has fitness = 1.0.
 */
public class GeneticAlgorithm {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GeneticAlgorithm.class);
    // ── Constraint penalty weights ────────────────────────────────────────────
    private static final double PENALTY_LAB_CLASH = 0.2;
    private static final double PENALTY_STAFF_CLASH = 0.2;
    private static final double PENALTY_BATCH_CLASH = 0.2;
    private static final double PENALTY_CAPACITY = 0.5;
    private static final double PENALTY_WORKING_PCS = 0.5;
    private static final double PENALTY_OS_MISMATCH = 0.15;
    // ── Tournament selection size ─────────────────────────────────────────────
    private static final int TOURNAMENT_SIZE = 5;
    // ── GA parameters (injected) ──────────────────────────────────────────────
    private final int populationSize;
    private final int maxGenerations;
    private final double crossoverRate;
    private final double mutationRate;
    // ── Problem data ──────────────────────────────────────────────────────────
    private final List<Batch> batches;
    private final List<Staff> staffList;
    private final List<Lab> labs;
    private final List<Day> days;
    // ── Internal state ────────────────────────────────────────────────────────
    private final Random random = new Random();
    private Chromosome bestChromosome;
    private final List<Double> fitnessHistory = new ArrayList<>();

    public GeneticAlgorithm(int populationSize, int maxGenerations, double crossoverRate, double mutationRate, List<Batch> batches, List<Staff> staffList, List<Lab> labs, List<Day> days) {
        this.populationSize = populationSize;
        this.maxGenerations = maxGenerations;
        this.crossoverRate = crossoverRate;
        this.mutationRate = mutationRate;
        this.batches = batches;
        this.staffList = staffList;
        this.labs = labs;
        this.days = days;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PUBLIC ENTRY POINT
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Runs the full GA and returns the best chromosome found.
     * Logs progress every 10 generations.
     */
    public Chromosome run() {
        log.info("GA starting — population={}, maxGenerations={}, crossover={}, mutation={}", populationSize, maxGenerations, crossoverRate, mutationRate);
        // Step 1: Initialise population
        List<Chromosome> population = initialisePopulation();
        // Step 2: Evaluate initial fitness
        population.forEach(this::evaluateFitness);
        Collections.sort(population);
        bestChromosome = population.get(0).deepCopy();
        log.info("Initial best fitness: {:.4f}", bestChromosome.getFitnessScore());
        // Main evolutionary loop
        for (int gen = 1; gen <= maxGenerations; gen++) {
            List<Chromosome> nextGeneration = new ArrayList<>();
            // Elitism — carry the best unchanged
            nextGeneration.add(bestChromosome.deepCopy());
            // Fill the rest of the next generation
            while (nextGeneration.size() < populationSize) {
                Chromosome parent1 = tournamentSelect(population);
                Chromosome parent2 = tournamentSelect(population);
                Chromosome offspring = random.nextDouble() < crossoverRate ? crossover(parent1, parent2) : parent1.deepCopy();
                mutate(offspring);
                evaluateFitness(offspring);
                nextGeneration.add(offspring);
            }
            population = nextGeneration;
            Collections.sort(population);
            // Track best
            Chromosome currentBest = population.get(0);
            if (currentBest.getFitnessScore() > bestChromosome.getFitnessScore()) {
                bestChromosome = currentBest.deepCopy();
            }
            fitnessHistory.add(bestChromosome.getFitnessScore());
            if (gen % 10 == 0 || gen == maxGenerations) {
                log.info("Generation {:4d} | Best fitness: {:.4f} | Clashes: {}", gen, bestChromosome.getFitnessScore(), countClashes(bestChromosome));
            }
            // Early termination if perfect solution found
            if (bestChromosome.getFitnessScore() >= 1.0) {
                log.info("Perfect solution found at generation {}!", gen);
                break;
            }
        }
        log.info("GA complete — best fitness: {:.4f} after {} generations", bestChromosome.getFitnessScore(), fitnessHistory.size());
        return bestChromosome;
    }

    public List<Double> getFitnessHistory() {
        return fitnessHistory;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1 — INITIALISATION
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Creates {@code populationSize} random chromosomes.
     * Each chromosome assigns every (batch, subject) pair a random staff/lab/day/slot.
     */
    private List<Chromosome> initialisePopulation() {
        List<Chromosome> population = new ArrayList<>();
        for (int i = 0; i < populationSize; i++) {
            population.add(generateRandomChromosome());
        }
        return population;
    }

    /**
     * Generates one random chromosome.
     * For each batch × subject combination, picks random staff, lab, day, and slot.
     */
    private Chromosome generateRandomChromosome() {
        List<Chromosome.Gene> genes = new ArrayList<>();
        for (Batch batch : batches) {
            // Only schedule subjects explicitly assigned to this batch
            List<Subject> batchSubjects = batch.getSubjects();
            if (batchSubjects == null || batchSubjects.isEmpty()) {
                continue;
            }
            for (Subject subject : batchSubjects) {
                int sessions = batch.getLabsPerWeek() != null ? batch.getLabsPerWeek() : 1;
                for (int i = 0; i < sessions; i++) {
                    List<Lab> chosenLabs = pickLabsForBatch(batch);
                    List<Staff> chosenStaff = pickStaffList(chosenLabs.size());
                    Day day = randomFrom(days);
                    Chromosome.Gene gene = new Chromosome.Gene(batch, subject, chosenStaff, chosenLabs, day, null, null);
                    assignRandomTime(gene);
                    genes.add(gene);
                }
            }
        }
        return new Chromosome(genes);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2 — FITNESS EVALUATION
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Scores a chromosome based on constraint violations.
     * Perfect timetable = 1.0; each violation deducts a penalty.
     */
    void evaluateFitness(Chromosome chromosome) {
        double penalty = 0.0;
        List<Chromosome.Gene> genes = chromosome.getGenes();
        for (int i = 0; i < genes.size(); i++) {
            Chromosome.Gene g1 = genes.get(i);
            for (int j = i + 1; j < genes.size(); j++) {
                Chromosome.Gene g2 = genes.get(j);
                boolean sameDay = g1.getDay().getId().equals(g2.getDay().getId());
                boolean timeOverlap = sameDay && g1.getStartTime().isBefore(g2.getEndTime()) && g1.getEndTime().isAfter(g2.getStartTime());
                if (timeOverlap) {
                    // Hard: lab double-booking
                    boolean labOverlap = false;
                    for (Lab l1 : g1.getLabs()) {
                        for (Lab l2 : g2.getLabs()) {
                            if (l1.getId().equals(l2.getId())) {
                                labOverlap = true;
                                break;
                            }
                        }
                        if (labOverlap) break;
                    }
                    if (labOverlap) {
                        penalty += PENALTY_LAB_CLASH;
                    }
                    // Hard: staff double-booking
                    boolean staffOverlap = false;
                    for (Staff s1 : g1.getStaffList()) {
                        for (Staff s2 : g2.getStaffList()) {
                            if (s1.getId().equals(s2.getId())) {
                                staffOverlap = true;
                                break;
                            }
                        }
                        if (staffOverlap) break;
                    }
                    if (staffOverlap) {
                        penalty += PENALTY_STAFF_CLASH;
                    }
                    // Hard: batch double-booking (same batch in two labs at once)
                    if (g1.getBatch().getId().equals(g2.getBatch().getId())) {
                        penalty += PENALTY_BATCH_CLASH;
                    }
                }
            }
            // Hard: check for duplicate staff within the same gene
            long distinctStaff = g1.getStaffList().stream().map(Staff::getId).distinct().count();
            if (distinctStaff < g1.getStaffList().size()) {
                penalty += PENALTY_STAFF_CLASH * (g1.getStaffList().size() - distinctStaff);
            }
            // Hard: capacity check across combined labs
            int totalCapacity = g1.getLabs().stream().mapToInt(Lab::getCapacity).sum();
            int totalWorking = g1.getLabs().stream().mapToInt(Lab::getWorkingComputers).sum();
            
            if (totalCapacity < g1.getBatch().getStudentCount()) {
                penalty += PENALTY_CAPACITY;
            }
            if (totalWorking < g1.getBatch().getStudentCount()) {
                penalty += PENALTY_WORKING_PCS;
            }
            // Hard: OS requirement mismatch
            String requiredOs = g1.getBatch().getOsRequirement();
            if (requiredOs != null && !requiredOs.trim().isEmpty() && !requiredOs.equalsIgnoreCase("Any")) {
                boolean allMatch = g1.getLabs().stream().allMatch(l -> requiredOs.equalsIgnoreCase(l.getOsType()));
                if (!allMatch) {
                    penalty += PENALTY_OS_MISMATCH;
                }
            }
            // Soft: penalize using multiple labs if unnecessary (encourages condensing to fewer/larger labs)
            if (g1.getLabs().size() > 1) {
                penalty += (g1.getLabs().size() - 1) * 0.05;
            }
        }
        // Clamp fitness to [0.0, 1.0]
        chromosome.setFitnessScore(Math.max(0.0, 1.0 - penalty));
    }

    /**
     * Counts total hard constraint violations (for logging).
     */
    private int countClashes(Chromosome chromosome) {
        int clashes = 0;
        List<Chromosome.Gene> genes = chromosome.getGenes();
        for (int i = 0; i < genes.size(); i++) {
            Chromosome.Gene g1 = genes.get(i);
            for (int j = i + 1; j < genes.size(); j++) {
                Chromosome.Gene g2 = genes.get(j);
                boolean sameDay = g1.getDay().getId().equals(g2.getDay().getId());
                boolean timeOverlap = sameDay && g1.getStartTime().isBefore(g2.getEndTime()) && g1.getEndTime().isAfter(g2.getStartTime());
                if (timeOverlap) {
                    boolean labOverlap = false;
                    for (Lab l1 : g1.getLabs()) {
                        for (Lab l2 : g2.getLabs()) {
                            if (l1.getId().equals(l2.getId())) {
                                labOverlap = true;
                                break;
                            }
                        }
                        if (labOverlap) break;
                    }
                    if (labOverlap) clashes++;
                    boolean staffOverlap = false;
                    for (Staff s1 : g1.getStaffList()) {
                        for (Staff s2 : g2.getStaffList()) {
                            if (s1.getId().equals(s2.getId())) {
                                staffOverlap = true;
                                break;
                            }
                        }
                        if (staffOverlap) break;
                    }
                    if (staffOverlap) clashes++;
                    if (g1.getBatch().getId().equals(g2.getBatch().getId())) clashes++;
                }
            }
        }
        return clashes;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3 — SELECTION (Tournament)
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Tournament selection — picks {@code TOURNAMENT_SIZE} random chromosomes
     * and returns the fittest one. Applies selection pressure without losing diversity.
     */
    private Chromosome tournamentSelect(List<Chromosome> population) {
        Chromosome best = null;
        for (int i = 0; i < TOURNAMENT_SIZE; i++) {
            Chromosome candidate = population.get(random.nextInt(population.size()));
            if (best == null || candidate.getFitnessScore() > best.getFitnessScore()) {
                best = candidate;
            }
        }
        return best;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 4 — CROSSOVER (Single-point)
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Single-point crossover — splits both parents at a random index and
     * combines the head of parent1 with the tail of parent2.
     *
     * parent1: [A, B, C, D, E]
     * parent2: [F, G, H, I, J]
     * point=3 → offspring: [A, B, C, I, J]
     */
    private Chromosome crossover(Chromosome parent1, Chromosome parent2) {
        List<Chromosome.Gene> p1Genes = parent1.getGenes();
        List<Chromosome.Gene> p2Genes = parent2.getGenes();
        // Use shorter parent's size as safe upper bound
        int size = Math.min(p1Genes.size(), p2Genes.size());
        int point = random.nextInt(size);
        List<Chromosome.Gene> childGenes = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            childGenes.add((i <= point ? p1Genes.get(i) : p2Genes.get(i)).copy());
        }
        return new Chromosome(childGenes);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5 — MUTATION
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Mutation — for each gene, with probability {@code mutationRate},
     * randomly reassigns one of: lab, day, or time slot.
     *
     * Targeted mutation: we only mutate the dimension most likely causing a clash,
     * rather than resetting the entire gene (which would discard good partial solutions).
     */
    private void mutate(Chromosome chromosome) {
        for (Chromosome.Gene gene : chromosome.getGenes()) {
            if (random.nextDouble() < mutationRate) {
                int mutationType = random.nextInt(4);
                switch (mutationType) {
                    case 0 -> gene.setLabs(pickLabsForBatch(gene.getBatch()));
                    case 1 -> {
                        gene.setDay(randomFrom(days));
                        assignRandomTime(gene);
                    }
                    case 2 -> assignRandomTime(gene);
                    case 3 -> gene.setStaffList(pickStaffList(gene.getLabs().size()));
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY
    // ═══════════════════════════════════════════════════════════════════════════
    private <T> T randomFrom(List<T> list) {
        if (list.isEmpty()) throw new IllegalStateException("Cannot pick from empty list");
        return list.get(random.nextInt(list.size()));
    }

    private List<Staff> pickStaffList(int count) {
        List<Staff> chosen = new ArrayList<>();
        if (staffList.isEmpty()) throw new IllegalStateException("No staff available");
        List<Staff> pool = new ArrayList<>(staffList);
        Collections.shuffle(pool, random);
        for(int i = 0; i < count; i++) {
            chosen.add(pool.get(i % pool.size()));
        }
        return chosen;
    }

    private List<Lab> pickLabsForBatch(Batch batch) {
        int requiredCapacity = batch.getStudentCount();
        String requiredOs = batch.getOsRequirement();
        
        List<Lab> validLabs = new ArrayList<>();
        boolean checkOs = requiredOs != null && !requiredOs.trim().isEmpty() && !requiredOs.equalsIgnoreCase("Any");
        
        for (Lab l : labs) {
            if ((!checkOs || requiredOs.equalsIgnoreCase(l.getOsType())) && l.isAvailable() && l.getWorkingComputers() > 0) {
                validLabs.add(l);
            }
        }
        
        // 1. Try to find the BEST single lab (workingComputers >= requiredCapacity, minimal wasted space)
        List<Lab> singleLabCandidates = new ArrayList<>();
        for (Lab l : validLabs) {
            if (l.getWorkingComputers() >= requiredCapacity) {
                singleLabCandidates.add(l);
            }
        }
        
        if (!singleLabCandidates.isEmpty()) {
            // Sort to find the one with capacity closest to requiredCapacity
            singleLabCandidates.sort(Comparator.comparingInt(Lab::getWorkingComputers));
            
            // 80% chance to pick the absolute best, 20% to pick from top 3 to maintain some genetic diversity
            if (random.nextDouble() < 0.8) {
                return List.of(singleLabCandidates.get(0));
            } else {
                int limit = Math.min(3, singleLabCandidates.size());
                return List.of(singleLabCandidates.get(random.nextInt(limit)));
            }
        }
        
        // 2. If no single lab fits, combine multiple labs.
        // To use the minimum number of labs, sort by workingComputers descending
        validLabs.sort((l1, l2) -> Integer.compare(l2.getWorkingComputers(), l1.getWorkingComputers()));
        
        List<Lab> chosenLabs = new ArrayList<>();
        int currentCapacity = 0;
        
        for (Lab l : validLabs) {
            chosenLabs.add(l);
            currentCapacity += l.getWorkingComputers();
            if (currentCapacity >= requiredCapacity) {
                break;
            }
        }
        return chosenLabs;
    }

    private void assignRandomTime(Chromosome.Gene gene) {
        int reqHrs = gene.getBatch().getRequiredHours() != null ? gene.getBatch().getRequiredHours() : 2;
        
        LocalTime bStart = gene.getBatch().getStartTime();
        LocalTime bEnd = gene.getBatch().getEndTime();
        
        boolean hasValidBatchTime = bStart != null && bEnd != null 
                                 && !bStart.equals(LocalTime.MIDNIGHT) 
                                 && !bEnd.equals(LocalTime.MIDNIGHT);
        
        LocalTime dayStartTime = gene.getDay().getStartTime();
        LocalTime dayEndTime = gene.getDay().getEndTime();
        
        LocalTime dStart = hasValidBatchTime ? bStart : (dayStartTime != null ? dayStartTime : LocalTime.of(9, 0));
        LocalTime dEnd = hasValidBatchTime ? bEnd : (dayEndTime != null ? dayEndTime : LocalTime.of(17, 0));
        
        if (dEnd == null || dStart == null) {
            dStart = LocalTime.of(9, 0);
            dEnd = LocalTime.of(17, 0);
        }

        // Handle inverted or invalid boundaries safely
        if (dEnd.isBefore(dStart)) {
            dEnd = dStart;
        }

        long maxStartMins = dEnd.toSecondOfDay() / 60 - dStart.toSecondOfDay() / 60 - reqHrs * 60L;
        if (maxStartMins < 0) maxStartMins = 0;
        
        int hrOffset = maxStartMins > 0 ? random.nextInt((int) (maxStartMins / 60) + 1) : 0;
        LocalTime startTime = dStart.plusHours(hrOffset);
        gene.setStartTime(startTime);
        gene.setEndTime(startTime.plusHours(reqHrs));
    }
}
