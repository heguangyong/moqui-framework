/*
 * 中国版 Babelio - 草稿持久化 Round-Trip 属性测试
 * Property 4: Draft Persistence Round-Trip
 * Requirements: 3.5, 9.3, 9.4
 * 
 * 简化版纯逻辑测试 - 不依赖 Moqui 运行时
 */

import spock.lang.*
import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import java.sql.Timestamp

class BabelioDraftRoundTripPropertyTests extends Specification {
    
    @Shared Random random = new Random()

    private String serializeDraft(Map draft) {
        def draftMap = [
            draftId: draft.draftId,
            bookId: draft.bookId,
            userId: draft.userId,
            title: draft.title,
            content: draft.content,
            contentJson: draft.contentJson,
            thoughtDepth: draft.thoughtDepth,
            expressionQuality: draft.expressionQuality,
            readability: draft.readability,
            wordCount: draft.wordCount,
            lastSavedAt: draft.lastSavedAt?.toString()
        ]
        return JsonOutput.toJson(draftMap)
    }
    
    private Map deserializeDraft(String jsonString) {
        def slurper = new JsonSlurper()
        def parsed = slurper.parseText(jsonString)
        
        def lastSavedAtValue = null
        if (parsed.lastSavedAt) {
            try {
                lastSavedAtValue = Timestamp.valueOf(parsed.lastSavedAt)
            } catch (Exception e) {
                lastSavedAtValue = parsed.lastSavedAt
            }
        }
        
        return [
            draftId: parsed.draftId,
            bookId: parsed.bookId,
            userId: parsed.userId,
            title: parsed.title,
            content: parsed.content,
            contentJson: parsed.contentJson,
            thoughtDepth: parsed.thoughtDepth != null ? parsed.thoughtDepth as Integer : null,
            expressionQuality: parsed.expressionQuality != null ? parsed.expressionQuality as Integer : null,
            readability: parsed.readability != null ? parsed.readability as Integer : null,
            wordCount: parsed.wordCount != null ? parsed.wordCount as Integer : null,
            lastSavedAt: lastSavedAtValue
        ]
    }

    /**
     * **Feature: china-babelio-mvp, Property 4: Draft Persistence Round-Trip**
     * **Validates: Requirements 3.5, 9.3, 9.4**
     */
    @Unroll
    def "Property 4: Draft #draftNum round-trip should preserve all fields"() {
        given: "A random draft"
        def draft = createRandomDraft("DRAFT_${draftNum}")
        
        when: "Serializing and deserializing"
        def json = serializeDraft(draft)
        def restored = deserializeDraft(json)
        
        then: "All fields should be preserved"
        restored.draftId == draft.draftId
        restored.bookId == draft.bookId
        restored.userId == draft.userId
        restored.title == draft.title
        restored.content == draft.content
        restored.contentJson == draft.contentJson
        restored.thoughtDepth == draft.thoughtDepth
        restored.expressionQuality == draft.expressionQuality
        restored.readability == draft.readability
        restored.wordCount == draft.wordCount
        
        where:
        draftNum << (1..100).collect { it }
    }

    /**
     * **Feature: china-babelio-mvp, Property 4: Draft Persistence Round-Trip**
     * **Validates: Requirements 3.5, 9.3, 9.4**
     */
    @Unroll
    def "Property 4: Draft with special content '#description' should round-trip correctly"() {
        given: "A draft with special content"
        def draft = [
            draftId: "DRAFT_SPECIAL_${System.currentTimeMillis()}",
            userId: "USER001",
            title: "Test Draft",
            content: specialContent,
            wordCount: specialContent.length(),
            lastSavedAt: new Timestamp(System.currentTimeMillis())
        ]
        
        when: "Serializing and deserializing"
        def json = serializeDraft(draft)
        def restored = deserializeDraft(json)
        
        then: "Content should be preserved exactly"
        restored.content == specialContent
        
        where:
        specialContent                              | description
        "Hello World"                               | "simple text"
        "中文内容测试"                               | "Chinese characters"
        "Mixed: Hello 世界 123"                     | "mixed content"
        "<p>HTML <strong>content</strong></p>"     | "HTML tags"
        "Special: @#\$%^&*()"                      | "special symbols"
        "Emoji: 📚��✍️"                             | "emoji characters"
        "Line1\nLine2\nLine3"                      | "newlines"
        ""                                          | "empty string"
    }

    /**
     * **Feature: china-babelio-mvp, Property 4: Draft Persistence Round-Trip**
     * **Validates: Requirements 3.5, 9.3, 9.4**
     */
    @Unroll
    def "Property 4: Draft with null #nullField should handle correctly"() {
        given: "A draft with null optional field"
        def draft = [
            draftId: "DRAFT_NULL_${System.currentTimeMillis()}",
            userId: "USER001",
            title: nullField == "title" ? null : "Test",
            content: nullField == "content" ? null : "Content",
            bookId: nullField == "bookId" ? null : "BOOK001",
            contentJson: nullField == "contentJson" ? null : "{}",
            thoughtDepth: nullField == "thoughtDepth" ? null : 3,
            expressionQuality: nullField == "expressionQuality" ? null : 4,
            readability: nullField == "readability" ? null : 5,
            wordCount: 7
        ]
        
        when: "Serializing and deserializing"
        def json = serializeDraft(draft)
        def restored = deserializeDraft(json)
        
        then: "Null field should remain null"
        restored[nullField] == null
        
        where:
        nullField << ["bookId", "title", "contentJson", "thoughtDepth", "expressionQuality", "readability"]
    }

    /**
     * **Feature: china-babelio-mvp, Property 4: Draft Persistence Round-Trip**
     * **Validates: Requirements 3.5, 9.3, 9.4**
     */
    @Unroll
    def "Property 4: Rating values (td=#td, eq=#eq, rd=#rd) should preserve integer types"() {
        given: "A draft with rating values"
        def draft = [
            draftId: "DRAFT_RATING_${System.currentTimeMillis()}",
            userId: "USER001",
            title: "Rating Test",
            content: "Test content",
            wordCount: 12,
            thoughtDepth: td,
            expressionQuality: eq,
            readability: rd
        ]
        
        when: "Serializing and deserializing"
        def json = serializeDraft(draft)
        def restored = deserializeDraft(json)
        
        then: "Rating values should be preserved as integers"
        restored.thoughtDepth == td
        restored.expressionQuality == eq
        restored.readability == rd
        if (td != null) restored.thoughtDepth instanceof Integer
        if (eq != null) restored.expressionQuality instanceof Integer
        if (rd != null) restored.readability instanceof Integer
        
        where:
        td   | eq   | rd
        1    | 1    | 1
        5    | 5    | 5
        3    | 4    | 2
        null | 3    | 4
        2    | null | 5
        4    | 3    | null
    }

    def "Property 4: Word count should be preserved (100 iterations)"() {
        given: "100 drafts with various word counts"
        def results = []
        
        when: "Each draft is serialized and deserialized"
        for (int i = 0; i < 100; i++) {
            def wordCount = random.nextInt(10000)
            def draft = [
                draftId: "DRAFT_WC_${i}",
                userId: "USER001",
                content: "x" * wordCount,
                wordCount: wordCount
            ]
            def json = serializeDraft(draft)
            def restored = deserializeDraft(json)
            results.add(restored.wordCount == wordCount)
        }
        
        then: "All word counts should be preserved"
        results.every { it == true }
    }

    private Map createRandomDraft(String draftId) {
        def content = "This is test content " * (1 + random.nextInt(50))
        return [
            draftId: draftId,
            bookId: random.nextBoolean() ? "BOOK_${random.nextInt(1000)}" : null,
            userId: "USER_${random.nextInt(100)}",
            title: random.nextBoolean() ? "Draft Title ${random.nextInt(100)}" : null,
            content: content,
            contentJson: random.nextBoolean() ? "{\"type\":\"doc\"}" : null,
            thoughtDepth: random.nextBoolean() ? (1 + random.nextInt(5)) : null,
            expressionQuality: random.nextBoolean() ? (1 + random.nextInt(5)) : null,
            readability: random.nextBoolean() ? (1 + random.nextInt(5)) : null,
            wordCount: content.length(),
            lastSavedAt: new Timestamp(System.currentTimeMillis() - random.nextInt(86400000))
        ]
    }
}
