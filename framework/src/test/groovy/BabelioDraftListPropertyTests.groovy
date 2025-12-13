/*
 * 中国版 Babelio - 草稿列表完整性属性测试
 * 
 * Property-Based Tests for Draft List Completeness
 * Requirements: 8.4
 * 
 * **Feature: china-babelio-mvp, Property 19: Draft List Completeness**
 * 
 * 简化版纯逻辑测试 - 不依赖 Moqui 运行时
 */

import spock.lang.*
import java.sql.Timestamp

/**
 * Property 19: Draft List Completeness
 * 
 * *For any* draft box view, each draft entry shall include the last-modified timestamp and word count.
 * 
 * **Validates: Requirements 8.4**
 */
class BabelioDraftListPropertyTests extends Specification {
    
    @Shared
    Random random = new Random()

    // ========================================================================
    // Draft Data Structure for Testing
    // ========================================================================
    
    /**
     * Draft entry structure that must contain lastSavedAt and wordCount
     */
    static class DraftEntry {
        String draftId
        String userId
        String title
        String content
        Integer wordCount
        Timestamp lastSavedAt
        
        boolean isComplete() {
            return lastSavedAt != null && wordCount != null
        }
        
        Map toDisplayMap() {
            return [
                draftId: draftId,
                title: title ?: "(无标题)",
                wordCount: wordCount,
                lastSavedAt: lastSavedAt
            ]
        }
    }
    
    /**
     * Simulates the draft list service that returns drafts for a user
     */
    static class DraftListService {
        
        /**
         * Get all drafts for a user - each entry MUST include lastSavedAt and wordCount
         */
        static List<Map> listDraftsForUser(List<DraftEntry> drafts, String userId) {
            return drafts.findAll { it.userId == userId }
                .collect { draft ->
                    [
                        draftId: draft.draftId,
                        title: draft.title ?: "(无标题)",
                        wordCount: draft.wordCount,
                        lastSavedAt: draft.lastSavedAt
                    ]
                }
        }
        
        /**
         * Validates that a draft list entry has required fields
         */
        static boolean validateDraftListEntry(Map entry) {
            return entry.containsKey('lastSavedAt') && 
                   entry.containsKey('wordCount') &&
                   entry.lastSavedAt != null &&
                   entry.wordCount != null
        }
    }

    // ========================================================================
    // Property 19: Draft List Completeness
    // ========================================================================

    /**
     * **Feature: china-babelio-mvp, Property 19: Draft List Completeness**
     * 
     * *For any* draft box view, each draft entry shall include the last-modified 
     * timestamp and word count.
     * 
     * **Validates: Requirements 8.4**
     */
    @Unroll
    def "Property 19: Draft list with #draftCount drafts should include lastSavedAt and wordCount for each entry"() {
        given: "A list of random drafts for a user"
        def userId = "USER_${random.nextInt(1000)}"
        def drafts = generateRandomDrafts(draftCount, userId)
        
        when: "Listing drafts for the user"
        def draftList = DraftListService.listDraftsForUser(drafts, userId)
        
        then: "Each draft entry should have lastSavedAt and wordCount"
        draftList.every { entry ->
            DraftListService.validateDraftListEntry(entry)
        }
        
        and: "The list should contain all user's drafts"
        draftList.size() == draftCount
        
        where:
        draftCount << [0, 1, 5, 10, 50, 100]
    }

    /**
     * **Feature: china-babelio-mvp, Property 19: Draft List Completeness**
     * 
     * *For any* randomly generated draft, the list entry must preserve 
     * the original wordCount value.
     * 
     * **Validates: Requirements 8.4**
     */
    def "Property 19: Word count should be preserved in draft list entries (100 iterations)"() {
        given: "100 random drafts"
        def userId = "USER_TEST"
        def drafts = generateRandomDrafts(100, userId)
        
        when: "Listing drafts"
        def draftList = DraftListService.listDraftsForUser(drafts, userId)
        
        then: "Each entry's wordCount should match the original draft"
        drafts.eachWithIndex { draft, idx ->
            assert draftList[idx].wordCount == draft.wordCount
        }
    }

    /**
     * **Feature: china-babelio-mvp, Property 19: Draft List Completeness**
     * 
     * *For any* randomly generated draft, the list entry must preserve 
     * the original lastSavedAt timestamp.
     * 
     * **Validates: Requirements 8.4**
     */
    def "Property 19: LastSavedAt timestamp should be preserved in draft list entries (100 iterations)"() {
        given: "100 random drafts"
        def userId = "USER_TEST"
        def drafts = generateRandomDrafts(100, userId)
        
        when: "Listing drafts"
        def draftList = DraftListService.listDraftsForUser(drafts, userId)
        
        then: "Each entry's lastSavedAt should match the original draft"
        drafts.eachWithIndex { draft, idx ->
            assert draftList[idx].lastSavedAt == draft.lastSavedAt
        }
    }

    /**
     * **Feature: china-babelio-mvp, Property 19: Draft List Completeness**
     * 
     * *For any* draft with zero word count, the list should still include it
     * with wordCount = 0.
     * 
     * **Validates: Requirements 8.4**
     */
    def "Property 19: Drafts with zero word count should be included with wordCount=0"() {
        given: "Drafts including some with zero word count"
        def userId = "USER_ZERO"
        def drafts = (1..50).collect { i ->
            new DraftEntry(
                draftId: "DRAFT_${i}",
                userId: userId,
                title: "Draft ${i}",
                content: i % 5 == 0 ? "" : "Some content",
                wordCount: i % 5 == 0 ? 0 : random.nextInt(1000) + 1,
                lastSavedAt: new Timestamp(System.currentTimeMillis() - random.nextInt(86400000))
            )
        }
        
        when: "Listing drafts"
        def draftList = DraftListService.listDraftsForUser(drafts, userId)
        
        then: "All drafts including zero word count ones should be present"
        draftList.size() == 50
        
        and: "Zero word count drafts should have wordCount = 0, not null"
        def zeroWordCountEntries = draftList.findAll { it.wordCount == 0 }
        zeroWordCountEntries.size() == 10
        zeroWordCountEntries.every { it.wordCount != null }
    }

    /**
     * **Feature: china-babelio-mvp, Property 19: Draft List Completeness**
     * 
     * *For any* draft list, entries should only belong to the requested user.
     * 
     * **Validates: Requirements 8.4**
     */
    def "Property 19: Draft list should only contain drafts for the requested user"() {
        given: "Drafts from multiple users"
        def allDrafts = []
        def userIds = ["USER_A", "USER_B", "USER_C"]
        userIds.each { uid ->
            allDrafts.addAll(generateRandomDrafts(30, uid))
        }
        
        when: "Listing drafts for USER_A"
        def draftList = DraftListService.listDraftsForUser(allDrafts, "USER_A")
        
        then: "Only USER_A's drafts should be returned"
        draftList.size() == 30
        
        and: "Each entry should have required fields"
        draftList.every { DraftListService.validateDraftListEntry(it) }
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================
    
    /**
     * Generates random draft entries for property testing
     */
    private List<DraftEntry> generateRandomDrafts(int count, String userId) {
        if (count <= 0) return []
        
        def sampleTitles = ["读书笔记", "书评草稿", "阅读感想", "Book Review", "Reading Notes", null]
        def sampleContent = "这是一本非常有深度的书籍，作者通过细腻的笔触描绘了一个引人入胜的故事。"
        
        return (1..count).collect { i ->
            def contentLength = random.nextInt(2000) + 1
            def content = (sampleContent * ((contentLength / sampleContent.length()) + 1)).take(contentLength)
            
            new DraftEntry(
                draftId: "DRAFT_${System.currentTimeMillis()}_${i}",
                userId: userId,
                title: sampleTitles[random.nextInt(sampleTitles.size())],
                content: content,
                wordCount: content.length(),
                lastSavedAt: new Timestamp(System.currentTimeMillis() - Math.abs(random.nextInt(86400000)))
            )
        }
    }
}
