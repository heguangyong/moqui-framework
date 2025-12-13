/*
 * 中国版 Babelio - 书评版本历史属性测试
 * Property 21: Review Version History Preservation
 * Requirements: 9.2
 */

import spock.lang.*
import java.sql.Timestamp

class BabelioVersionHistoryPropertyTests extends Specification {
    
    @Shared Random random = new Random()
    static final int MIN_REVIEW_LENGTH = 500

    private Map updateReviewWithVersionHistory(Map review, String newContent) {
        def version = [
            versionId: "VER_${System.currentTimeMillis()}_${review.versions.size() + 1}",
            reviewId: review.reviewId,
            content: review.content,
            versionNumber: review.versions.size() + 1,
            createdAt: new Timestamp(System.currentTimeMillis())
        ]
        review.versions.add(version)
        review.content = newContent
        review.wordCount = newContent.length()
        review.updatedAt = new Timestamp(System.currentTimeMillis())
        return review
    }
    
    private boolean validateSequentialVersionNumbers(Map review) {
        for (int i = 0; i < review.versions.size(); i++) {
            if (review.versions[i].versionNumber != i + 1) return false
        }
        return true
    }
    
    private boolean validateUniqueVersionIds(Map review) {
        def ids = review.versions.collect { it.versionId }
        return ids.size() == ids.toSet().size()
    }

    /**
     * **Feature: china-babelio-mvp, Property 21: Review Version History Preservation**
     * **Validates: Requirements 9.2**
     */
    @Unroll
    def "Property 21: Update #updateNumber should preserve previous content"() {
        given: "A review with initial content"
        def review = createRandomReview("R_VH_${updateNumber}")
        def initialContent = review.content
        
        when: "The review is updated"
        def newContent = generateValidContent("Updated ${updateNumber}")
        updateReviewWithVersionHistory(review, newContent)
        
        then: "Version history preserves previous content"
        review.versions.size() == 1
        review.versions[0].content == initialContent
        review.versions[0].versionNumber == 1
        review.content == newContent
        
        where:
        updateNumber << (1..100).collect { it }
    }

    /**
     * **Feature: china-babelio-mvp, Property 21: Review Version History Preservation**
     * **Validates: Requirements 9.2**
     */
    @Unroll
    def "Property 21: Sequential updates (#numUpdates) should create correct versions"() {
        given: "A review with initial content"
        def review = createRandomReview("R_VH_SEQ_${numUpdates}")
        def contents = [review.content]
        
        when: "The review is updated multiple times"
        for (int i = 1; i <= numUpdates; i++) {
            def newContent = generateValidContent("Sequential update ${i}")
            updateReviewWithVersionHistory(review, newContent)
            contents.add(newContent)
        }
        
        then: "Version history contains all previous versions"
        review.versions.size() == numUpdates
        review.content == contents[numUpdates]
        
        where:
        numUpdates << [1, 2, 3, 5, 7, 10, 20]
    }

    /**
     * **Feature: china-babelio-mvp, Property 21: Review Version History Preservation**
     * **Validates: Requirements 9.2**
     */
    @Unroll
    def "Property 21: Version history preserves exact content - test #testNum"() {
        given: "A review with specific content"
        def review = createRandomReview("R_VH_EXACT_${testNum}")
        review.content = generateValidContent(specialContent)
        def originalContent = review.content
        
        when: "The review is updated"
        updateReviewWithVersionHistory(review, generateValidContent("New content"))
        
        then: "Original content is preserved exactly"
        review.versions[0].content == originalContent
        
        where:
        testNum | specialContent
        1       | "Content with numbers 12345"
        2       | "Content with unicode 中文字符"
        3       | "Content with punctuation marks"
        4       | "Content with UPPERCASE and lowercase"
        5       | "Content with repeated words words words"
    }

    def "Property 21: Version numbers should be sequential (100 iterations)"() {
        given: "100 reviews updated multiple times"
        def results = []
        
        when: "Each review is updated"
        for (int r = 0; r < 100; r++) {
            def review = createRandomReview("R_VH_SEQNUM_${r}")
            def numUpdates = 1 + random.nextInt(10)
            for (int i = 1; i <= numUpdates; i++) {
                updateReviewWithVersionHistory(review, generateValidContent("Update ${i}"))
            }
            results.add(validateSequentialVersionNumbers(review))
        }
        
        then: "All have sequential version numbers"
        results.every { it == true }
    }

    def "Property 21: Version IDs should be unique (100 iterations)"() {
        given: "100 reviews updated multiple times"
        def results = []
        
        when: "Each review is updated"
        for (int r = 0; r < 100; r++) {
            def review = createRandomReview("R_VH_UNIQ_${r}")
            def numUpdates = 1 + random.nextInt(15)
            for (int i = 1; i <= numUpdates; i++) {
                Thread.sleep(1)
                updateReviewWithVersionHistory(review, generateValidContent("Update ${i}"))
            }
            results.add(validateUniqueVersionIds(review))
        }
        
        then: "All have unique version IDs"
        results.every { it == true }
    }

    def "Property 21: New review should have empty version history"() {
        given: "100 new reviews"
        def reviews = (1..100).collect { createRandomReview("R_VH_NEW_${it}") }
        
        expect: "All have empty version history"
        reviews.every { it.versions.isEmpty() }
    }

    private Map createRandomReview(String reviewId) {
        def content = generateValidContent("Initial content for ${reviewId}")
        return [
            reviewId: reviewId,
            bookId: "BOOK_${random.nextInt(1000)}",
            userId: "USER_${random.nextInt(100)}",
            content: content,
            wordCount: content.length(),
            createdAt: new Timestamp(System.currentTimeMillis()),
            updatedAt: new Timestamp(System.currentTimeMillis()),
            versions: []
        ]
    }
    
    private static String generateValidContent(String prefix) {
        def baseText = " This is a comprehensive book review that explores themes and characters. The author demonstrates skill in weaving storylines while maintaining engagement. The prose is elegant and accessible. Overall, this book represents an important contribution."
        def content = prefix + baseText
        while (content.length() < MIN_REVIEW_LENGTH) {
            content += baseText
        }
        return content
    }
}
