/*
 * 中国版 Babelio - 三维评分属性测试
 * 
 * Property-Based Tests for Three-Dimensional Rating Validation
 * Requirements: 2.1
 * 
 * **Feature: china-babelio-mvp, Property 1: Three-Dimensional Rating Completeness**
 */

import org.moqui.context.ExecutionContext
import org.moqui.Moqui
import spock.lang.*

/**
 * Property-based tests for three-dimensional rating validation.
 * 
 * These tests verify:
 * - Property 1: Three-Dimensional Rating Completeness (Requirements 2.1)
 * 
 * *For any* book review submission, the system shall reject the submission if any of the three 
 * rating dimensions (thought depth, expression quality, readability) is missing or outside 
 * the valid range (1-5).
 * 
 * Note: These tests require a fully configured Moqui runtime environment.
 * If the environment is not available, tests will be skipped.
 */
@IgnoreIf({ !BabelioRatingPropertyTests.isMoquiRuntimeAvailable() })
class BabelioRatingPropertyTests extends Specification {
    
    /**
     * Check if Moqui runtime environment is properly configured.
     */
    static boolean isMoquiRuntimeAvailable() {
        def runtimePath = System.getProperty("moqui.runtime") ?: 
            (new File("runtime").exists() ? "runtime" : "../runtime")
        def webrootPath = new File(runtimePath, "base-component/webroot")
        return webrootPath.exists()
    }
    
    @Shared
    ExecutionContext ec
    
    @Shared
    Random random = new Random()

    def setupSpec() {
        if (System.getProperty("moqui.runtime") == null) {
            def runtimePath = new File("runtime").exists() ? "runtime" : "../runtime"
            System.setProperty("moqui.runtime", runtimePath)
        }
        if (System.getProperty("moqui.conf") == null) {
            System.setProperty("moqui.conf", "conf/MoquiDevConf.xml")
        }
        if (System.getProperty("moqui.init.static") == null) {
            System.setProperty("moqui.init.static", "true")
        }
        
        ec = Moqui.getExecutionContext()
        ec.artifactExecution.disableAuthz()
    }

    def cleanupSpec() {
        if (ec != null) {
            ec.artifactExecution.enableAuthz()
            ec.destroy()
        }
    }

    // ========================================================================
    // Property 1: Three-Dimensional Rating Completeness
    // ========================================================================
    
    /**
     * **Feature: china-babelio-mvp, Property 1: Three-Dimensional Rating Completeness**
     * 
     * *For any* valid rating values (1-5 for all three dimensions), the validation 
     * service shall accept the submission.
     * 
     * **Validates: Requirements 2.1**
     * 
     * This test generates 100 random valid rating combinations and verifies
     * that all are accepted by the validation service.
     */
    @Unroll
    def "Property 1: Valid ratings (TD=#thoughtDepth, EQ=#expressionQuality, RD=#readability) should be accepted"() {
        when: "Validating a complete rating with all dimensions in valid range"
        def result = ec.service.sync().name("babelio.RatingServices.validate#Rating")
            .parameters([
                thoughtDepth: thoughtDepth,
                expressionQuality: expressionQuality,
                readability: readability
            ])
            .call()
        
        then: "The rating should be valid"
        result.isValid == true
        result.errors.isEmpty()
        result.validatedRating != null
        result.validatedRating.thoughtDepth == thoughtDepth
        result.validatedRating.expressionQuality == expressionQuality
        result.validatedRating.readability == readability
        
        where:
        [thoughtDepth, expressionQuality, readability] << generateValidRatingCombinations(100)
    }
    
    /**
     * **Feature: china-babelio-mvp, Property 1: Three-Dimensional Rating Completeness**
     * 
     * *For any* rating submission with missing thoughtDepth, the system shall reject it.
     * 
     * **Validates: Requirements 2.1**
     */
    @Unroll
    def "Property 1: Missing thoughtDepth (EQ=#expressionQuality, RD=#readability) should be rejected"() {
        when: "Validating a rating with missing thoughtDepth"
        def result = ec.service.sync().name("babelio.RatingServices.validate#Rating")
            .parameters([
                thoughtDepth: null,
                expressionQuality: expressionQuality,
                readability: readability
            ])
            .call()
        
        then: "The rating should be invalid"
        result.isValid == false
        result.errors.size() > 0
        result.errors.any { it.field == 'thoughtDepth' }
        result.validatedRating == null
        
        where:
        [expressionQuality, readability] << generateValidRatingPairs(20)
    }
    
    /**
     * **Feature: china-babelio-mvp, Property 1: Three-Dimensional Rating Completeness**
     * 
     * *For any* rating submission with missing expressionQuality, the system shall reject it.
     * 
     * **Validates: Requirements 2.1**
     */
    @Unroll
    def "Property 1: Missing expressionQuality (TD=#thoughtDepth, RD=#readability) should be rejected"() {
        when: "Validating a rating with missing expressionQuality"
        def result = ec.service.sync().name("babelio.RatingServices.validate#Rating")
            .parameters([
                thoughtDepth: thoughtDepth,
                expressionQuality: null,
                readability: readability
            ])
            .call()
        
        then: "The rating should be invalid"
        result.isValid == false
        result.errors.size() > 0
        result.errors.any { it.field == 'expressionQuality' }
        result.validatedRating == null
        
        where:
        [thoughtDepth, readability] << generateValidRatingPairs(20)
    }
    
    /**
     * **Feature: china-babelio-mvp, Property 1: Three-Dimensional Rating Completeness**
     * 
     * *For any* rating submission with missing readability, the system shall reject it.
     * 
     * **Validates: Requirements 2.1**
     */
    @Unroll
    def "Property 1: Missing readability (TD=#thoughtDepth, EQ=#expressionQuality) should be rejected"() {
        when: "Validating a rating with missing readability"
        def result = ec.service.sync().name("babelio.RatingServices.validate#Rating")
            .parameters([
                thoughtDepth: thoughtDepth,
                expressionQuality: expressionQuality,
                readability: null
            ])
            .call()
        
        then: "The rating should be invalid"
        result.isValid == false
        result.errors.size() > 0
        result.errors.any { it.field == 'readability' }
        result.validatedRating == null
        
        where:
        [thoughtDepth, expressionQuality] << generateValidRatingPairs(20)
    }
    
    /**
     * **Feature: china-babelio-mvp, Property 1: Three-Dimensional Rating Completeness**
     * 
     * *For any* rating submission with all dimensions missing, the system shall reject it
     * with errors for all three dimensions.
     * 
     * **Validates: Requirements 2.1**
     */
    def "Property 1: All dimensions missing should be rejected with three errors"() {
        when: "Validating a rating with all dimensions missing"
        def result = ec.service.sync().name("babelio.RatingServices.validate#Rating")
            .parameters([
                thoughtDepth: null,
                expressionQuality: null,
                readability: null
            ])
            .call()
        
        then: "The rating should be invalid with errors for all three dimensions"
        result.isValid == false
        result.errors.size() == 3
        result.errors.any { it.field == 'thoughtDepth' }
        result.errors.any { it.field == 'expressionQuality' }
        result.errors.any { it.field == 'readability' }
        result.validatedRating == null
    }
    
    /**
     * **Feature: china-babelio-mvp, Property 1: Three-Dimensional Rating Completeness**
     * 
     * *For any* rating value below the valid range (< 1), the system shall reject it.
     * 
     * **Validates: Requirements 2.1**
     */
    @Unroll
    def "Property 1: Rating below range (TD=#thoughtDepth, EQ=#expressionQuality, RD=#readability) should be rejected"() {
        when: "Validating a rating with values below valid range"
        def result = ec.service.sync().name("babelio.RatingServices.validate#Rating")
            .parameters([
                thoughtDepth: thoughtDepth,
                expressionQuality: expressionQuality,
                readability: readability
            ])
            .call()
        
        then: "The rating should be invalid"
        result.isValid == false
        result.errors.size() > 0
        result.validatedRating == null
        
        where:
        thoughtDepth | expressionQuality | readability
        0            | 3                 | 3           // thoughtDepth below range
        -1           | 3                 | 3           // thoughtDepth negative
        3            | 0                 | 3           // expressionQuality below range
        3            | -5                | 3           // expressionQuality negative
        3            | 3                 | 0           // readability below range
        3            | 3                 | -10         // readability negative
        0            | 0                 | 0           // all below range
        -1           | -1                | -1          // all negative
    }
    
    /**
     * **Feature: china-babelio-mvp, Property 1: Three-Dimensional Rating Completeness**
     * 
     * *For any* rating value above the valid range (> 5), the system shall reject it.
     * 
     * **Validates: Requirements 2.1**
     */
    @Unroll
    def "Property 1: Rating above range (TD=#thoughtDepth, EQ=#expressionQuality, RD=#readability) should be rejected"() {
        when: "Validating a rating with values above valid range"
        def result = ec.service.sync().name("babelio.RatingServices.validate#Rating")
            .parameters([
                thoughtDepth: thoughtDepth,
                expressionQuality: expressionQuality,
                readability: readability
            ])
            .call()
        
        then: "The rating should be invalid"
        result.isValid == false
        result.errors.size() > 0
        result.validatedRating == null
        
        where:
        thoughtDepth | expressionQuality | readability
        6            | 3                 | 3           // thoughtDepth above range
        10           | 3                 | 3           // thoughtDepth way above
        3            | 6                 | 3           // expressionQuality above range
        3            | 100               | 3           // expressionQuality way above
        3            | 3                 | 6           // readability above range
        3            | 3                 | 999         // readability way above
        6            | 6                 | 6           // all above range
        10           | 10                | 10          // all way above
    }
    
    /**
     * **Feature: china-babelio-mvp, Property 1: Three-Dimensional Rating Completeness**
     * 
     * *For any* randomly generated invalid rating (outside 1-5 range), the system shall reject it.
     * This test generates random invalid values to ensure comprehensive coverage.
     * 
     * **Validates: Requirements 2.1**
     */
    @Unroll
    def "Property 1: Random invalid rating #testIndex should be rejected"() {
        when: "Validating a randomly generated invalid rating"
        def result = ec.service.sync().name("babelio.RatingServices.validate#Rating")
            .parameters([
                thoughtDepth: invalidRating.thoughtDepth,
                expressionQuality: invalidRating.expressionQuality,
                readability: invalidRating.readability
            ])
            .call()
        
        then: "The rating should be invalid"
        result.isValid == false
        result.errors.size() > 0
        result.validatedRating == null
        
        where:
        testIndex << (1..50)
        invalidRating << generateInvalidRatings(50)
    }
    
    /**
     * **Feature: china-babelio-mvp, Property 1: Three-Dimensional Rating Completeness**
     * 
     * Test boundary values: ratings at exactly 1 and 5 should be valid.
     * 
     * **Validates: Requirements 2.1**
     */
    @Unroll
    def "Property 1: Boundary values (TD=#thoughtDepth, EQ=#expressionQuality, RD=#readability) should be valid"() {
        when: "Validating ratings at boundary values"
        def result = ec.service.sync().name("babelio.RatingServices.validate#Rating")
            .parameters([
                thoughtDepth: thoughtDepth,
                expressionQuality: expressionQuality,
                readability: readability
            ])
            .call()
        
        then: "The rating should be valid"
        result.isValid == true
        result.errors.isEmpty()
        result.validatedRating != null
        
        where:
        thoughtDepth | expressionQuality | readability
        1            | 1                 | 1           // all minimum
        5            | 5                 | 5           // all maximum
        1            | 5                 | 3           // mixed boundaries
        5            | 1                 | 3           // mixed boundaries
        3            | 1                 | 5           // mixed boundaries
        3            | 5                 | 1           // mixed boundaries
        1            | 3                 | 5           // mixed boundaries
        5            | 3                 | 1           // mixed boundaries
    }
    
    // ========================================================================
    // Helper Methods for Generating Test Data
    // ========================================================================
    
    /**
     * Generates random valid rating combinations (all values between 1-5).
     */
    private static List<List<Integer>> generateValidRatingCombinations(int count) {
        def random = new Random()
        def combinations = []
        for (int i = 0; i < count; i++) {
            combinations.add([
                random.nextInt(5) + 1,  // thoughtDepth: 1-5
                random.nextInt(5) + 1,  // expressionQuality: 1-5
                random.nextInt(5) + 1   // readability: 1-5
            ])
        }
        return combinations
    }
    
    /**
     * Generates random valid rating pairs (for testing missing dimension scenarios).
     */
    private static List<List<Integer>> generateValidRatingPairs(int count) {
        def random = new Random()
        def pairs = []
        for (int i = 0; i < count; i++) {
            pairs.add([
                random.nextInt(5) + 1,  // first value: 1-5
                random.nextInt(5) + 1   // second value: 1-5
            ])
        }
        return pairs
    }
    
    /**
     * Generates random invalid ratings where at least one dimension is outside the valid range.
     */
    private static List<Map> generateInvalidRatings(int count) {
        def random = new Random()
        def invalidRatings = []
        
        for (int i = 0; i < count; i++) {
            // Randomly decide which dimension(s) to make invalid
            def invalidType = random.nextInt(7)  // 0-6 for different invalid scenarios
            
            def td, eq, rd
            
            switch (invalidType) {
                case 0: // Invalid thoughtDepth only
                    td = generateInvalidValue(random)
                    eq = random.nextInt(5) + 1
                    rd = random.nextInt(5) + 1
                    break
                case 1: // Invalid expressionQuality only
                    td = random.nextInt(5) + 1
                    eq = generateInvalidValue(random)
                    rd = random.nextInt(5) + 1
                    break
                case 2: // Invalid readability only
                    td = random.nextInt(5) + 1
                    eq = random.nextInt(5) + 1
                    rd = generateInvalidValue(random)
                    break
                case 3: // Two invalid dimensions
                    td = generateInvalidValue(random)
                    eq = generateInvalidValue(random)
                    rd = random.nextInt(5) + 1
                    break
                case 4: // Two invalid dimensions (different combo)
                    td = generateInvalidValue(random)
                    eq = random.nextInt(5) + 1
                    rd = generateInvalidValue(random)
                    break
                case 5: // Two invalid dimensions (different combo)
                    td = random.nextInt(5) + 1
                    eq = generateInvalidValue(random)
                    rd = generateInvalidValue(random)
                    break
                case 6: // All three invalid
                    td = generateInvalidValue(random)
                    eq = generateInvalidValue(random)
                    rd = generateInvalidValue(random)
                    break
            }
            
            invalidRatings.add([
                thoughtDepth: td,
                expressionQuality: eq,
                readability: rd
            ])
        }
        
        return invalidRatings
    }
    
    /**
     * Generates a single invalid rating value (either below 1 or above 5).
     */
    private static Integer generateInvalidValue(Random random) {
        if (random.nextBoolean()) {
            // Below range: 0, -1, -2, ... -100
            return -random.nextInt(101)
        } else {
            // Above range: 6, 7, 8, ... 105
            return 6 + random.nextInt(100)
        }
    }
    
    // ========================================================================
    // Property 2: Rating Aggregation Accuracy
    // ========================================================================
    
    /**
     * **Feature: china-babelio-mvp, Property 2: Rating Aggregation Accuracy**
     * 
     * *For any* book with multiple reviews, the displayed average rating for each dimension 
     * shall equal the mathematical average of all individual ratings.
     * 
     * **Validates: Requirements 2.2, 2.4**
     * 
     * This test generates random review sets and verifies that the aggregation service 
     * calculates the correct simple average (when useWeighting=false or no contribution records).
     */
    @Unroll
    def "Property 2: Simple average calculation for #reviewCount reviews should be mathematically accurate"() {
        given: "A book with multiple reviews"
        def ts = System.currentTimeMillis() % 100000
        def rnd = random.nextInt(1000)
        def bookId = "BK_AGG_${ts}_${rnd}"
        def testReviews = []
        
        // Create test book
        ec.entity.makeValue("babelio.book.Book")
            .setAll([
                bookId: bookId,
                isbn: "978-${random.nextInt(999999999)}",
                title: "Test Book for Aggregation ${bookId}",
                author: "Test Author",
                createdAt: ec.user.nowTimestamp
            ])
            .create()
        
        // Generate random reviews
        def reviewData = generateReviewDataWithEqualWeights(reviewCount)
        
        // Calculate expected simple average
        def expectedAvg = calculateSimpleAverage(reviewData)
        
        // Create reviews (without UserContribution, defaults to weight 1.0)
        reviewData.eachWithIndex { data, idx ->
            def reviewId = "R_A_${ts}_${rnd}_${idx}"
            testReviews.add(reviewId)
            
            ec.entity.makeValue("babelio.review.Review")
                .setAll([
                    reviewId: reviewId,
                    bookId: bookId,
                    userId: null,  // No user - tests pure aggregation logic
                    content: "Test review content for aggregation test",
                    thoughtDepth: data.thoughtDepth,
                    expressionQuality: data.expressionQuality,
                    readability: data.readability,
                    wordCount: 500,
                    statusId: "RvwPublished",
                    createdAt: ec.user.nowTimestamp
                ])
                .create()
        }
        
        when: "Calculating the average rating (without weighting)"
        def result = ec.service.sync().name("babelio.RatingServices.calculate#AverageRating")
            .parameters([bookId: bookId, useWeighting: false])
            .call()
        
        then: "The calculated average should match the expected simple average"
        result.hasRatings == true
        result.reviewCount == reviewCount
        result.averageRating != null
        
        // Verify each dimension with tolerance for floating point precision (0.01)
        Math.abs(result.averageRating.thoughtDepth.doubleValue() - expectedAvg.thoughtDepth) < 0.01
        Math.abs(result.averageRating.expressionQuality.doubleValue() - expectedAvg.expressionQuality) < 0.01
        Math.abs(result.averageRating.readability.doubleValue() - expectedAvg.readability) < 0.01
        
        cleanup: "Remove test data"
        testReviews.each { reviewId ->
            ec.entity.find("babelio.review.Review").condition("reviewId", reviewId).deleteAll()
        }
        ec.entity.find("babelio.book.Book").condition("bookId", bookId).deleteAll()
        
        where:
        reviewCount << [2, 3, 5, 7, 10, 15, 20, 25, 30, 35, 40, 45, 50, 
                        55, 60, 65, 70, 75, 80, 85, 90, 95, 100]
    }
    
    /**
     * **Feature: china-babelio-mvp, Property 2: Rating Aggregation Accuracy**
     * 
     * *For any* book with reviews, when all reviewers have equal contribution weights (default 1.0),
     * the weighted average should equal the simple arithmetic mean.
     * 
     * **Validates: Requirements 2.2, 2.4**
     */
    @Unroll
    def "Property 2: Default weights (#reviewCount reviews) should produce simple arithmetic mean"() {
        given: "A book with reviews from users without explicit contribution weights"
        def ts = System.currentTimeMillis() % 100000
        def rnd = random.nextInt(1000)
        def bookId = "BK_EQ_${ts}_${rnd}"
        def testReviews = []
        
        // Create test book
        ec.entity.makeValue("babelio.book.Book")
            .setAll([
                bookId: bookId,
                isbn: "978-${random.nextInt(999999999)}",
                title: "Test Book Equal Weights ${bookId}",
                author: "Test Author",
                createdAt: ec.user.nowTimestamp
            ])
            .create()
        
        // Generate random reviews
        def reviewData = generateReviewDataWithEqualWeights(reviewCount)
        
        // Calculate expected simple average
        def expectedAvg = calculateSimpleAverage(reviewData)
        
        // Create reviews without UserContribution records (defaults to weight 1.0)
        reviewData.eachWithIndex { data, idx ->
            def reviewId = "R_E_${ts}_${rnd}_${idx}"
            testReviews.add(reviewId)
            
            ec.entity.makeValue("babelio.review.Review")
                .setAll([
                    reviewId: reviewId,
                    bookId: bookId,
                    userId: null,  // No user - tests pure aggregation logic
                    content: "Test review content",
                    thoughtDepth: data.thoughtDepth,
                    expressionQuality: data.expressionQuality,
                    readability: data.readability,
                    wordCount: 500,
                    statusId: "RvwPublished",
                    createdAt: ec.user.nowTimestamp
                ])
                .create()
        }
        
        when: "Calculating the average rating (with weighting enabled but no contribution records)"
        def result = ec.service.sync().name("babelio.RatingServices.calculate#AverageRating")
            .parameters([bookId: bookId, useWeighting: true])
            .call()
        
        then: "The average should equal the simple arithmetic mean (default weight 1.0)"
        result.hasRatings == true
        result.reviewCount == reviewCount
        Math.abs(result.averageRating.thoughtDepth.doubleValue() - expectedAvg.thoughtDepth) < 0.01
        Math.abs(result.averageRating.expressionQuality.doubleValue() - expectedAvg.expressionQuality) < 0.01
        Math.abs(result.averageRating.readability.doubleValue() - expectedAvg.readability) < 0.01
        
        cleanup:
        testReviews.each { reviewId ->
            ec.entity.find("babelio.review.Review").condition("reviewId", reviewId).deleteAll()
        }
        ec.entity.find("babelio.book.Book").condition("bookId", bookId).deleteAll()
        
        where:
        reviewCount << [2, 5, 10, 20, 30, 40, 50]
    }
    
    /**
     * **Feature: china-babelio-mvp, Property 2: Rating Aggregation Accuracy**
     * 
     * *For any* book with a single review, the average should equal that review's ratings.
     * 
     * **Validates: Requirements 2.2, 2.4**
     */
    @Unroll
    def "Property 2: Single review (TD=#thoughtDepth, EQ=#expressionQuality, RD=#readability) should be the average"() {
        given: "A book with a single review"
        def ts = System.currentTimeMillis() % 100000
        def rnd = random.nextInt(1000)
        def bookId = "BK_S_${ts}_${rnd}"
        def reviewId = "R_S_${ts}_${rnd}"
        
        ec.entity.makeValue("babelio.book.Book")
            .setAll([
                bookId: bookId,
                isbn: "978-${random.nextInt(999999999)}",
                title: "Test Book Single Review ${bookId}",
                author: "Test Author",
                createdAt: ec.user.nowTimestamp
            ])
            .create()
        
        ec.entity.makeValue("babelio.review.Review")
            .setAll([
                reviewId: reviewId,
                bookId: bookId,
                userId: null,  // No user - tests pure aggregation logic
                content: "Single review content",
                thoughtDepth: thoughtDepth,
                expressionQuality: expressionQuality,
                readability: readability,
                wordCount: 500,
                statusId: "RvwPublished",
                createdAt: ec.user.nowTimestamp
            ])
            .create()
        
        when: "Calculating the average rating"
        def result = ec.service.sync().name("babelio.RatingServices.calculate#AverageRating")
            .parameters([bookId: bookId, useWeighting: false])
            .call()
        
        then: "The average should equal the single review's ratings"
        result.hasRatings == true
        result.reviewCount == 1
        result.averageRating.thoughtDepth.doubleValue() == thoughtDepth.doubleValue()
        result.averageRating.expressionQuality.doubleValue() == expressionQuality.doubleValue()
        result.averageRating.readability.doubleValue() == readability.doubleValue()
        
        cleanup:
        ec.entity.find("babelio.review.Review").condition("reviewId", reviewId).deleteAll()
        ec.entity.find("babelio.book.Book").condition("bookId", bookId).deleteAll()
        
        where:
        [thoughtDepth, expressionQuality, readability] << generateValidRatingCombinations(50)
    }
    
    /**
     * **Feature: china-babelio-mvp, Property 2: Rating Aggregation Accuracy**
     * 
     * *For any* book with no reviews, the average should be null/empty.
     * 
     * **Validates: Requirements 2.2**
     */
    def "Property 2: Book with no reviews should have null average ratings"() {
        given: "A book with no reviews"
        def ts = System.currentTimeMillis() % 100000
        def rnd = random.nextInt(1000)
        def bookId = "BK_MT_${ts}_${rnd}"
        
        ec.entity.makeValue("babelio.book.Book")
            .setAll([
                bookId: bookId,
                isbn: "978-${random.nextInt(999999999)}",
                title: "Test Book No Reviews ${bookId}",
                author: "Test Author",
                createdAt: ec.user.nowTimestamp
            ])
            .create()
        
        when: "Calculating the average rating"
        def result = ec.service.sync().name("babelio.RatingServices.calculate#AverageRating")
            .parameters([bookId: bookId, useWeighting: false])
            .call()
        
        then: "The result should indicate no ratings"
        result.hasRatings == false
        result.reviewCount == 0
        result.averageRating.thoughtDepth == null
        result.averageRating.expressionQuality == null
        result.averageRating.readability == null
        
        cleanup:
        ec.entity.find("babelio.book.Book").condition("bookId", bookId).deleteAll()
    }
    
    /**
     * **Feature: china-babelio-mvp, Property 2: Rating Aggregation Accuracy**
     * 
     * *For any* book, only published reviews (statusId = 'RvwPublished') should be included
     * in the average calculation.
     * 
     * **Validates: Requirements 2.2**
     */
    @Unroll
    def "Property 2: Only published reviews should be included in average (published=#publishedCount, draft=#draftCount)"() {
        given: "A book with both published and draft reviews"
        def ts = System.currentTimeMillis() % 100000
        def rnd = random.nextInt(1000)
        def bookId = "BK_ST_${ts}_${rnd}"
        def testReviews = []
        
        ec.entity.makeValue("babelio.book.Book")
            .setAll([
                bookId: bookId,
                isbn: "978-${random.nextInt(999999999)}",
                title: "Test Book Status Filter ${bookId}",
                author: "Test Author",
                createdAt: ec.user.nowTimestamp
            ])
            .create()
        
        // Generate published reviews
        def publishedData = generateReviewDataWithEqualWeights(publishedCount)
        def expectedAvg = calculateSimpleAverage(publishedData)
        
        publishedData.eachWithIndex { data, idx ->
            def reviewId = "R_P_${ts}_${rnd}_${idx}"
            testReviews.add(reviewId)
            
            ec.entity.makeValue("babelio.review.Review")
                .setAll([
                    reviewId: reviewId,
                    bookId: bookId,
                    userId: null,  // No user - tests pure aggregation logic
                    content: "Published review",
                    thoughtDepth: data.thoughtDepth,
                    expressionQuality: data.expressionQuality,
                    readability: data.readability,
                    wordCount: 500,
                    statusId: "RvwPublished",
                    createdAt: ec.user.nowTimestamp
                ])
                .create()
        }
        
        // Generate draft reviews (should be excluded)
        def draftData = generateReviewDataWithEqualWeights(draftCount)
        draftData.eachWithIndex { data, idx ->
            def reviewId = "R_D_${ts}_${rnd}_${idx}"
            testReviews.add(reviewId)
            
            ec.entity.makeValue("babelio.review.Review")
                .setAll([
                    reviewId: reviewId,
                    bookId: bookId,
                    userId: null,  // No user - tests pure aggregation logic
                    content: "Draft review",
                    thoughtDepth: data.thoughtDepth,
                    expressionQuality: data.expressionQuality,
                    readability: data.readability,
                    wordCount: 500,
                    statusId: "RvwDraft",
                    createdAt: ec.user.nowTimestamp
                ])
                .create()
        }
        
        when: "Calculating the average rating"
        def result = ec.service.sync().name("babelio.RatingServices.calculate#AverageRating")
            .parameters([bookId: bookId, useWeighting: false])
            .call()
        
        then: "Only published reviews should be counted"
        result.hasRatings == (publishedCount > 0)
        result.reviewCount == publishedCount
        if (publishedCount > 0) {
            Math.abs(result.averageRating.thoughtDepth.doubleValue() - expectedAvg.thoughtDepth) < 0.01
            Math.abs(result.averageRating.expressionQuality.doubleValue() - expectedAvg.expressionQuality) < 0.01
            Math.abs(result.averageRating.readability.doubleValue() - expectedAvg.readability) < 0.01
        }
        
        cleanup:
        testReviews.each { reviewId ->
            ec.entity.find("babelio.review.Review").condition("reviewId", reviewId).deleteAll()
        }
        ec.entity.find("babelio.book.Book").condition("bookId", bookId).deleteAll()
        
        where:
        publishedCount | draftCount
        5              | 3
        10             | 5
        3              | 10
        1              | 5
        20             | 10
    }
    
    /**
     * **Feature: china-babelio-mvp, Property 2: Rating Aggregation Accuracy**
     * 
     * *For any* set of reviews with different ratings, the weighted average (when weighting is disabled)
     * should equal the simple arithmetic mean, demonstrating the aggregation formula is correct.
     * 
     * **Validates: Requirements 2.2, 2.4**
     * 
     * Note: This test verifies the aggregation formula by comparing weighted vs unweighted results.
     * When all weights are equal (default 1.0), both should produce the same result.
     */
    def "Property 2: Weighted and unweighted averages should match when no contribution weights exist"() {
        given: "A book with multiple reviews from users without contribution records"
        def ts = System.currentTimeMillis() % 100000
        def rnd = random.nextInt(1000)
        def bookId = "BK_W_${ts}_${rnd}"
        def testReviews = []
        
        ec.entity.makeValue("babelio.book.Book")
            .setAll([
                bookId: bookId,
                isbn: "978-${random.nextInt(999999999)}",
                title: "Test Book Weight Comparison ${bookId}",
                author: "Test Author",
                createdAt: ec.user.nowTimestamp
            ])
            .create()
        
        // Create reviews with varying ratings
        def ratings = [
            [td: 5, eq: 5, rd: 5],
            [td: 1, eq: 1, rd: 1],
            [td: 3, eq: 4, rd: 2],
            [td: 4, eq: 2, rd: 5],
            [td: 2, eq: 3, rd: 3]
        ]
        
        ratings.eachWithIndex { rating, idx ->
            def reviewId = "R_W_${ts}_${rnd}_${idx}"
            testReviews.add(reviewId)
            
            ec.entity.makeValue("babelio.review.Review")
                .setAll([
                    reviewId: reviewId,
                    bookId: bookId,
                    userId: null,  // No user - defaults to weight 1.0
                    content: "Test review ${idx}",
                    thoughtDepth: rating.td,
                    expressionQuality: rating.eq,
                    readability: rating.rd,
                    wordCount: 500,
                    statusId: "RvwPublished",
                    createdAt: ec.user.nowTimestamp
                ])
                .create()
        }
        
        // Calculate expected simple average
        def expectedTD = ratings.sum { it.td } / ratings.size()
        def expectedEQ = ratings.sum { it.eq } / ratings.size()
        def expectedRD = ratings.sum { it.rd } / ratings.size()
        
        when: "Calculating both weighted and unweighted averages"
        def weightedResult = ec.service.sync().name("babelio.RatingServices.calculate#AverageRating")
            .parameters([bookId: bookId, useWeighting: true])
            .call()
        
        def unweightedResult = ec.service.sync().name("babelio.RatingServices.calculate#AverageRating")
            .parameters([bookId: bookId, useWeighting: false])
            .call()
        
        then: "Both results should match the expected simple average"
        weightedResult.hasRatings == true
        unweightedResult.hasRatings == true
        weightedResult.reviewCount == ratings.size()
        unweightedResult.reviewCount == ratings.size()
        
        // Weighted result should match expected
        Math.abs(weightedResult.averageRating.thoughtDepth.doubleValue() - expectedTD) < 0.01
        Math.abs(weightedResult.averageRating.expressionQuality.doubleValue() - expectedEQ) < 0.01
        Math.abs(weightedResult.averageRating.readability.doubleValue() - expectedRD) < 0.01
        
        // Unweighted result should match expected
        Math.abs(unweightedResult.averageRating.thoughtDepth.doubleValue() - expectedTD) < 0.01
        Math.abs(unweightedResult.averageRating.expressionQuality.doubleValue() - expectedEQ) < 0.01
        Math.abs(unweightedResult.averageRating.readability.doubleValue() - expectedRD) < 0.01
        
        // Both results should be equal
        weightedResult.averageRating.thoughtDepth == unweightedResult.averageRating.thoughtDepth
        weightedResult.averageRating.expressionQuality == unweightedResult.averageRating.expressionQuality
        weightedResult.averageRating.readability == unweightedResult.averageRating.readability
        
        cleanup:
        testReviews.each { reviewId ->
            ec.entity.find("babelio.review.Review").condition("reviewId", reviewId).deleteAll()
        }
        ec.entity.find("babelio.book.Book").condition("bookId", bookId).deleteAll()
    }
    
    // ========================================================================
    // Helper Methods for Property 2 Test Data Generation
    // ========================================================================
    
    /**
     * Generates review data with random contribution weights.
     */
    private static List<Map> generateReviewDataWithWeights(int count) {
        def random = new Random()
        def data = []
        for (int i = 0; i < count; i++) {
            data.add([
                thoughtDepth: random.nextInt(5) + 1,
                expressionQuality: random.nextInt(5) + 1,
                readability: random.nextInt(5) + 1,
                weight: 0.5 + random.nextDouble() * 4.5  // Weight between 0.5 and 5.0
            ])
        }
        return data
    }
    
    /**
     * Generates review data with equal weights (1.0).
     */
    private static List<Map> generateReviewDataWithEqualWeights(int count) {
        def random = new Random()
        def data = []
        for (int i = 0; i < count; i++) {
            data.add([
                thoughtDepth: random.nextInt(5) + 1,
                expressionQuality: random.nextInt(5) + 1,
                readability: random.nextInt(5) + 1,
                weight: 1.0
            ])
        }
        return data
    }
    
    /**
     * Calculates the expected weighted average from review data.
     */
    private static Map calculateExpectedWeightedAverage(List<Map> reviewData) {
        double totalWeight = 0
        double weightedTD = 0
        double weightedEQ = 0
        double weightedRD = 0
        
        reviewData.each { data ->
            totalWeight += data.weight
            weightedTD += data.thoughtDepth * data.weight
            weightedEQ += data.expressionQuality * data.weight
            weightedRD += data.readability * data.weight
        }
        
        return [
            thoughtDepth: Math.round((weightedTD / totalWeight) * 100) / 100.0,
            expressionQuality: Math.round((weightedEQ / totalWeight) * 100) / 100.0,
            readability: Math.round((weightedRD / totalWeight) * 100) / 100.0
        ]
    }
    
    /**
     * Calculates simple arithmetic average from review data.
     */
    private static Map calculateSimpleAverage(List<Map> reviewData) {
        if (reviewData.isEmpty()) {
            return [thoughtDepth: null, expressionQuality: null, readability: null]
        }
        
        double sumTD = 0
        double sumEQ = 0
        double sumRD = 0
        
        reviewData.each { data ->
            sumTD += data.thoughtDepth
            sumEQ += data.expressionQuality
            sumRD += data.readability
        }
        
        int count = reviewData.size()
        return [
            thoughtDepth: Math.round((sumTD / count) * 100) / 100.0,
            expressionQuality: Math.round((sumEQ / count) * 100) / 100.0,
            readability: Math.round((sumRD / count) * 100) / 100.0
        ]
    }
    
    /**
     * Generates test data for single review tests.
     */
    private static List<List> generateSingleReviewTestData(int count) {
        def random = new Random()
        def data = []
        for (int i = 0; i < count; i++) {
            data.add([
                random.nextInt(5) + 1,  // thoughtDepth
                random.nextInt(5) + 1,  // expressionQuality
                random.nextInt(5) + 1,  // readability
                0.5 + random.nextDouble() * 4.5  // contributionWeight
            ])
        }
        return data
    }
}
