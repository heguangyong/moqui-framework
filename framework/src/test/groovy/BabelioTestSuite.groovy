/*
 * 中国版 Babelio - 测试套件
 * 
 * Test Suite for Babelio Component
 * This suite runs all Babelio-related property-based tests.
 */

import org.junit.jupiter.api.AfterAll
import org.junit.platform.suite.api.SelectClasses
import org.junit.platform.suite.api.Suite
import org.moqui.Moqui

@Suite
@SelectClasses([ BabelioBookSearchPropertyTests.class, BabelioDraftListPropertyTests.class, BabelioDraftRoundTripPropertyTests.class, BabelioRatingPropertyTests.class, BabelioReviewPropertyTests.class, BabelioVersionHistoryPropertyTests.class ])
class BabelioTestSuite {
    @AfterAll
    static void destroyMoqui() {
        Moqui.destroyActiveExecutionContextFactory()
    }
}
