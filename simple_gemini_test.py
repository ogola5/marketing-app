#!/usr/bin/env python3
"""
Simple test to verify Gemini AI integration is working
"""

import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage

async def test_gemini():
    try:
        # Test with the configured API key
        gemini_api_key = "AIzaSyDQ7K3zYEUykBZBpY5JZfhUaMMZFFOUg90"
        session_id = "test_session_123"
        
        chat = LlmChat(
            api_key=gemini_api_key,
            session_id=session_id,
            system_message="You are a helpful marketing assistant."
        ).with_model("gemini", "gemini-1.5-flash").with_max_tokens(200)
        
        # Simple test message
        user_message = UserMessage(text="Generate a short email subject line for a SaaS product launch.")
        response = await chat.send_message(user_message)
        
        print(f"✅ Gemini AI Response: {response}")
        return True
        
    except Exception as e:
        print(f"❌ Gemini AI Error: {str(e)}")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_gemini())
    if result:
        print("🎉 Gemini AI integration is working!")
    else:
        print("🚨 Gemini AI integration failed!")