"""Test the mock chat service"""
import asyncio
import sys
sys.path.insert(0, 'frontend/src')

from frontend.src.services.mockChatService import getMockChatResponse, getGreetingMessage

async def test_chat_responses():
    print("=" * 60)
    print("Testing Mock Chat Service")
    print("=" * 60)

    # Test greeting
    print("\n[TEST 1] Greeting Message:")
    greeting = getGreetingMessage()
    print(greeting)
    assert len(greeting) > 0
    assert "ValueHunt" in greeting
    print("✓ PASSED")

    # Test stock analysis
    print("\n[TEST 2] Stock Analysis (삼성전자):")
    response = await getMockChatResponse("삼성전자 분석해줘")
    print(response[:200] + "...")
    assert "삼성전자" in response
    assert len(response) > 100
    print("✓ PASSED")

    # Test portfolio question
    print("\n[TEST 3] Portfolio Question:")
    response = await getMockChatResponse("포트폴리오 구성 방법 알려줘")
    print(response[:200] + "...")
    assert "포트폴리오" in response
    print("✓ PASSED")

    # Test Value Score question
    print("\n[TEST 4] Value Score Explanation:")
    response = await getMockChatResponse("Value Score란 무엇인가요?")
    print(response[:200] + "...")
    assert "Value Score" in response
    print("✓ PASSED")

    # Test default response
    print("\n[TEST 5] Default Response (unknown question):")
    response = await getMockChatResponse("random question that doesn't match")
    print(response[:200] + "...")
    assert "ValueHunt" in response
    print("✓ PASSED")

    print("\n" + "=" * 60)
    print("All tests PASSED! ✓")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_chat_responses())
