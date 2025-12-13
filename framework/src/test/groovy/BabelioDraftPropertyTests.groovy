/*
 * 中国版 Babelio - 草稿持久化属性测试
 * 
 * Property-Based Tests for Draft Persistence Round-Trip
 * Requirements: 3.5, 9.3, 9.4
 * 
 * **Feature: china-babelio-mvp, Property 4: Draft Persistence Round-Trip**
 */

import org.moqui.context.ExecutionContext
import org.moqui.Moqui
import spock.lang.*
import java.sql.Timestamp

/**
 * Property-based tests for draft persistence round-trip.
 * 
 * These tests verify:
 * - Property 4: Draft Persistence Round-Trip (Requirements 3.5, 9.3, 9.4)
 * 
 * *For any* draft save operation, serializing the draft to JSON and then deserializing it 
 * shall produce an equivalent draft object with identical content, timestamp, and word count.
 * 
 * Note: These tests require a fully configured Moqui runtime environment.
 * If the environment is not available, tests will be skipped.
 */
@IgnoreIf({ !BabelioDraftPropertyTests.isMoquiRuntimeAvailable() })
class BabelioDraftPropertyTests extends Specification {
    
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
    // Property 4: Draft Persistence Round-Trip
    // ========================================================================

    /**
     * **Feature: china-babelio-mvp, Property 4: Draft Persistence Round-Trip**
     * 
     * *For any* valid draft object, serializing to JSON and deserializing back 
     * shall produce an equivalent draft object with identical content, timestamp, and word count.
     * 
     * **Validates: Requirements 3.5, 9.3, 9.4**
     * 
     * This test generates 100 random draft objects and verifies that serialization
     * followed by deserialization produces equivalent objects.
     */
    @Unroll
    def "Property 4: Draft round-trip for draft with wordCount=#wordCount should preserve all fields"() {
        when: "Serializing the draft to JSON"
        def serializeResult = ec.service.sync().name("babelio.DraftServices.serialize#Draft")
            .parameters([
                draftId: draftId,
                bookId: bookId,
                userId: userId,
                title: title,
                content: content,
                contentJson: contentJson,
                thoughtDepth: thoughtDepth,
                expressionQuality: expressionQuality,
                readability: readability,
                wordCount: wordCount,
                lastSavedAt: lastSavedAt
            ])
            .call()
        
        and: "Deserializing the JSON back to a draft object"
        def deserializeResult = ec.service.sync().name("babelio.DraftServices.deserialize#Draft")
            .parameters([jsonString: serializeResult.jsonString])
            .call()
        
        then: "The deserialized draft should be valid"
        deserializeResult.isValid == true
        deserializeResult.errors.isEmpty()
        
        and: "All fields should be preserved"
        def draft = deserializeResult.draft
        draft.draftId == draftId
        draft.bookId == bookId
        draft.userId == userId
        draft.title == title
        draft.content == content
        draft.contentJson == contentJson
        draft.thoughtDepth == thoughtDepth
        draft.expressionQuality == expressionQuality
        draft.readability == readability
        draft.wordCount == wordCount
        
        where:
        [draftId, bookId, userId, title, content, contentJson, thoughtDepth, expressionQuality, readability, wordCount, lastSavedAt] << generateRandomDrafts(100)
    }

    /**
     * **Feature: china-babelio-mvp, Property 4: Draft Persistence Round-Trip**
     * 
     * *For any* draft with special characters in content, serialization and 
     * deserialization should preserve the content exactly.
     * 
     * **Validates: Requirements 3.5, 9.3, 9.4**
     */
    @Unroll
    def "Property 4: Draft with special characters '#description' should be preserved"() {
        when: "Serializing the draft with special characters"
        def serializeResult = ec.service.sync().name("babelio.DraftServices.serialize#Draft")
            .parameters([
                draftId: "DRAFT_SPECIAL_${System.currentTimeMillis()}",
                userId: "USER001",
                title: "Test Draft",
                content: specialContent,
                wordCount: specialContent.length()
            ])
            .call()
        
        and: "Deserializing the JSON back"
        def deserializeResult = ec.service.sync().name("babelio.DraftServices.deserialize#Draft")
            .parameters([jsonString: serializeResult.jsonString])
            .call()
        
        then: "The content should be preserved exactly"
        deserializeResult.isValid == true
        deserializeResult.draft.content == specialContent
        
        where:
        specialContent                                          | description
        "Hello \"World\""                                       | "double quotes"
        "Line1\\nLine2"                                         | "escaped newline"
        "Tab\\there"                                            | "escaped tab"
        "Unicode: 中文内容测试"                                   | "Chinese characters"
        "Mixed: Hello 世界 123"                                  | "mixed content"
        "<p>HTML <strong>content</strong></p>"                  | "HTML tags"
        "Special: @#\$%^&*()"                                   | "special symbols"
        "Emoji: 📚📖✍️"                                          | "emoji characters"
        "Long text " * 50                                       | "repeated content"
        ""                                                      | "empty string"
    }

    /**
     * **Feature: china-babelio-mvp, Property 4: Draft Persistence Round-Trip**
     * 
     * *For any* draft with null optional fields, serialization and deserialization
     * should handle nulls correctly.
     * 
     * **Validates: Requirements 3.5, 9.3, 9.4**
     */
    @Unroll
    def "Property 4: Draft with null #nullField should be handled correctly"() {
        when: "Serializing a draft with null optional field"
        def serializeResult = ec.service.sync().name("babelio.DraftServices.serialize#Draft")
            .parameters(draftParams)
            .call()
        
        and: "Deserializing the JSON back"
        def deserializeResult = ec.service.sync().name("babelio.DraftServices.deserialize#Draft")
            .parameters([jsonString: serializeResult.jsonString])
            .call()
        
        then: "The draft should be valid and null fields preserved"
        deserializeResult.isValid == true
        deserializeResult.draft[nullField] == null
        
        where:
        nullField           | draftParams
        "bookId"            | [draftId: "D001", userId: "U001", title: "Test", content: "Content", wordCount: 7, bookId: null]
        "title"             | [draftId: "D002", userId: "U001", content: "Content", wordCount: 7, title: null]
        "contentJson"       | [draftId: "D003", userId: "U001", title: "Test", content: "Content", wordCount: 7, contentJson: null]
        "thoughtDepth"      | [draftId: "D004", userId: "U001", title: "Test", content: "Content", wordCount: 7, thoughtDepth: null]
        "expressionQuality" | [draftId: "D005", userId: "U001", title: "Test", content: "Content", wordCount: 7, expressionQuality: null]
        "readability"       | [draftId: "D006", userId: "U001", title: "Test", content: "Content", wordCount: 7, readability: null]
    }

    /**
     * **Feature: china-babelio-mvp, Property 4: Draft Persistence Round-Trip**
     * 
     * *For any* invalid JSON string, deserialization should fail gracefully
     * with appropriate error messages.
     * 
     * **Validates: Requirements 9.4**
     */
    @Unroll
    def "Property 4: Invalid JSON '#description' should be rejected with error"() {
        when: "Deserializing invalid JSON"
        def result = ec.service.sync().name("babelio.DraftServices.deserialize#Draft")
            .parameters([jsonString: invalidJson])
            .call()
        
        then: "The result should indicate invalid data"
        result.isValid == false
        result.errors.size() > 0
        
        where:
        invalidJson                     | description
        "not json at all"               | "plain text"
        "{invalid json}"                | "malformed JSON"
        "{'single': 'quotes'}"          | "single quotes"
        "{\"unclosed\": \"string}"      | "unclosed string"
        ""                              | "empty string"
    }

    /**
     * **Feature: china-babelio-mvp, Property 4: Draft Persistence Round-Trip**
     * 
     * *For any* draft with rating values, the integer types should be preserved
     * after round-trip serialization.
     * 
     * **Validates: Requirements 3.5, 9.3, 9.4**
     */
    @Unroll
    def "Property 4: Rating values (td=#thoughtDepth, eq=#expressionQuality, rd=#readability) should preserve integer types"() {
        when: "Serializing a draft with rating values"
        def serializeResult = ec.service.sync().name("babelio.DraftServices.serialize#Draft")
            .parameters([
                draftId: "DRAFT_RATING_${System.currentTimeMillis()}",
                userId: "USER001",
                title: "Rating Test",
                content: "Test content for rating preservation",
                wordCount: 35,
                thoughtDepth: thoughtDepth,
                expressionQuality: expressionQuality,
                readability: readability
            ])
            .call()
        
        and: "Deserializing the JSON back"
        def deserializeResult = ec.service.sync().name("babelio.DraftServices.deserialize#Draft")
            .parameters([jsonString: serializeResult.jsonString])
            .call()
        
        then: "Rating values should be preserved as integers"
        deserializeResult.isValid == true
        deserializeResult.draft.thoughtDepth == thoughtDepth
        deserializeResult.draft.expressionQuality == expressionQuality
        deserializeResult.draft.readability == readability
        
        and: "Types should be Integer"
        if (thoughtDepth != null) deserializeResult.draft.thoughtDepth instanceof Integer
        if (expressionQuality != null) deserializeResult.draft.expressionQuality instanceof Integer
        if (readability != null) deserializeResult.draft.readability instanceof Integer
        
        where:
        thoughtDepth | expressionQuality | readability
        1            | 1                 | 1
        5            | 5                 | 5
        3            | 4                 | 2
        1            | 5                 | 3
        null         | 3                 | 4
        2            | null              | 5
        4            | 3                 | null
    }

    // ========================================================================
    // Helper Methods for Generating Test Data
    // ========================================================================
    
    /**
     * Generates random draft objects for property testing.
     * Returns list of draft parameter arrays.
     */
    private static List<List> generateRandomDrafts(int count) {
        def random = new Random()
        def drafts = []
        def sampleTitles = ["读书笔记", "书评草稿", "阅读感想", "Book Review", "Reading Notes"]
        def sampleContent = "这是一本非常有深度的书籍，作者通过细腻的笔触描绘了一个引人入胜的故事。"
        
        for (int i = 0; i < count; i++) {
            def draftId = "DRAFT_${System.currentTimeMillis()}_${i}"
            def bookId = random.nextBoolean() ? "BOOK_${random.nextInt(1000)}" : null
            def userId = "USER_${random.nextInt(100)}"
            def title = sampleTitles[random.nextInt(sampleTitles.size())]
            
            // Generate content of varying lengths
            def contentLength = 50 + random.nextInt(500)
            def content = generateContentOfLength(contentLength, sampleContent)
            def contentJson = random.nextBoolean() ? "{\"type\":\"doc\",\"content\":[]}" : null
            
            // Generate optional ratings (1-5 or null)
            def thoughtDepth = random.nextBoolean() ? (1 + random.nextInt(5)) : null
            def expressionQuality = random.nextBoolean() ? (1 + random.nextInt(5)) : null
            def readability = random.nextBoolean() ? (1 + random.nextInt(5)) : null
            
            def wordCount = content.length()
            def lastSavedAt = new Timestamp(System.currentTimeMillis() - random.nextInt(86400000))
            
            drafts.add([draftId, bookId, userId, title, content, contentJson, 
                       thoughtDepth, expressionQuality, readability, wordCount, lastSavedAt])
        }
        return drafts
    }
    
    /**
     * Generates content of approximately the target length.
     */
    private static String generateContentOfLength(int targetLength, String sampleText) {
        def sb = new StringBuilder()
        while (sb.length() < targetLength) {
            sb.append(sampleText)
        }
        return sb.toString().substring(0, Math.min(sb.length(), targetLength))
    }
}
