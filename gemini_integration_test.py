#!/usr/bin/env python3
"""
Deep Integration Test for Gemini AI Campaign Generation
Tests the actual AI integration with real API calls to verify functionality.
"""

import requests
import json
import time
import uuid
from datetime import datetime
import sys

# Configuration
BASE_URL = "https://11e31789-6f0f-4445-a4b4-f408464f27d3.preview.emergentagent.com/api"

class GeminiIntegrationTester:
    def __init__(self):
        self.session = requests.Session()
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def test_gemini_api_key_validation(self):
        """Test if Gemini API key is properly configured"""
        self.log("Testing Gemini API key configuration...")
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            # Test with the configured API key
            gemini_api_key = "AIzaSyDQ7K3zYEUykBZBpY5JZfhUaMMZFFOUg90"
            session_id = f"test_{str(uuid.uuid4())[:8]}"
            
            chat = LlmChat(
                api_key=gemini_api_key,
                session_id=session_id,
                system_message="You are a helpful assistant."
            ).with_model("gemini", "gemini-2.5-pro-preview-05-06").with_max_tokens(100)
            
            # Simple test message
            user_message = UserMessage(text="Say 'Hello, I am working!' if you can respond.")
            response = chat.send_message(user_message)
            
            if response and "working" in response.lower():
                self.log("✅ Gemini API integration is working correctly")
                return True
            else:
                self.log(f"❌ Gemini API response unexpected: {response}")
                return False
                
        except Exception as e:
            self.log(f"❌ Gemini API integration failed - error: {str(e)}")
            return False
    
    def test_campaign_generation_with_real_data(self):
        """Test campaign generation with realistic business data"""
        self.log("Testing campaign generation with realistic business scenarios...")
        
        # Simulate a real business scenario
        business_scenarios = [
            {
                "business_type": "SaaS Startup",
                "industry": "Technology",
                "product_service": "Project management software for remote teams",
                "target_audience": "Remote team managers and startup founders",
                "campaign_goal": "Increase trial signups and product awareness",
                "campaign_type": "email",
                "style": "persuasive"
            },
            {
                "business_type": "E-commerce Store", 
                "industry": "Fashion",
                "product_service": "Sustainable clothing for young professionals",
                "target_audience": "Environmentally conscious millennials aged 25-35",
                "campaign_goal": "Drive online sales and brand awareness",
                "campaign_type": "social_media",
                "style": "funny"
            }
        ]
        
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            gemini_api_key = "AIzaSyDQ7K3zYEUykBZBpY5JZfhUaMMZFFOUg90"
            success_count = 0
            
            for i, scenario in enumerate(business_scenarios, 1):
                self.log(f"Testing scenario {i}: {scenario['business_type']} - {scenario['campaign_type']}")
                
                session_id = f"campaign_test_{i}_{str(uuid.uuid4())[:8]}"
                
                # Create system message
                system_message = f"""You are an expert marketing campaign generator. Create {scenario['campaign_type']} campaigns that are {scenario['style']} and engaging.

Business Details:
- Business Type: {scenario['business_type']}
- Industry: {scenario['industry']}
- Product/Service: {scenario['product_service']}
- Target Audience: {scenario['target_audience']}
- Campaign Goal: {scenario['campaign_goal']}

Generate content that is professional, compelling, and tailored to this specific business and audience."""

                chat = LlmChat(
                    api_key=gemini_api_key,
                    session_id=session_id,
                    system_message=system_message
                ).with_model("gemini", "gemini-2.5-pro-preview-05-06").with_max_tokens(2000)
                
                # Create campaign-specific prompt
                if scenario['campaign_type'] == "email":
                    prompt = f"""Generate a complete email marketing sequence (3 emails) for {scenario['business_type']} targeting {scenario['target_audience']}.

Style: {scenario['style']}
Goal: {scenario['campaign_goal']}

Include:
1. Subject lines for each email
2. Full email content
3. Clear call-to-actions
4. Personalization suggestions

Format as:
EMAIL 1:
Subject: [subject line]
[email content]

EMAIL 2:
Subject: [subject line]
[email content]

EMAIL 3:
Subject: [subject line]
[email content]"""
                
                elif scenario['campaign_type'] == "social_media":
                    prompt = f"""Generate 5 social media posts for {scenario['business_type']} targeting {scenario['target_audience']}.

Style: {scenario['style']}
Goal: {scenario['campaign_goal']}

Include posts for LinkedIn, Instagram, and Twitter/X. Each post should:
1. Be platform-appropriate
2. Include relevant hashtags
3. Have engaging copy
4. Include call-to-action

Format as:
POST 1 (LinkedIn):
[content]
#hashtags

POST 2 (Instagram):
[content]
#hashtags

[Continue for 5 posts]"""
                
                # Generate campaign content
                user_message = UserMessage(text=prompt)
                response = chat.send_message(user_message)
                
                if response and len(response) > 100:  # Reasonable content length
                    self.log(f"✅ Scenario {i} generated successfully ({len(response)} characters)")
                    self.log(f"Sample content: {response[:200]}...")
                    success_count += 1
                else:
                    self.log(f"❌ Scenario {i} failed - insufficient content generated")
                
                # Small delay between requests
                time.sleep(1)
            
            if success_count == len(business_scenarios):
                self.log("✅ All campaign generation scenarios successful")
                return True
            else:
                self.log(f"❌ Campaign generation partially failed - {success_count}/{len(business_scenarios)} passed")
                return False
                
        except Exception as e:
            self.log(f"❌ Campaign generation with real data failed - error: {str(e)}")
            return False
    
    def test_different_campaign_styles(self):
        """Test different campaign styles to ensure variety"""
        self.log("Testing different campaign styles...")
        
        styles = ["persuasive", "aggressive", "funny", "educational"]
        
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            gemini_api_key = "AIzaSyDQ7K3zYEUykBZBpY5JZfhUaMMZFFOUg90"
            success_count = 0
            
            for style in styles:
                self.log(f"Testing {style} style...")
                
                session_id = f"style_test_{style}_{str(uuid.uuid4())[:8]}"
                
                system_message = f"""You are an expert marketing campaign generator. Create email campaigns that are {style} and engaging.

Business Details:
- Business Type: Digital Marketing Agency
- Industry: Marketing Services
- Product/Service: Social media management for small businesses
- Target Audience: Small business owners
- Campaign Goal: Generate leads for marketing services

Generate content that is professional, compelling, and clearly demonstrates the {style} style."""

                chat = LlmChat(
                    api_key=gemini_api_key,
                    session_id=session_id,
                    system_message=system_message
                ).with_model("gemini", "gemini-2.5-pro-preview-05-06").with_max_tokens(1000)
                
                prompt = f"""Generate a single marketing email that is clearly {style} in tone and approach. 

Include:
1. Subject line
2. Email content
3. Call-to-action

Make sure the {style} style is evident throughout the content."""
                
                user_message = UserMessage(text=prompt)
                response = chat.send_message(user_message)
                
                if response and len(response) > 50:
                    self.log(f"✅ {style.title()} style generated successfully")
                    success_count += 1
                else:
                    self.log(f"❌ {style.title()} style failed")
                
                time.sleep(1)
            
            if success_count >= len(styles) * 0.75:  # 75% success rate
                self.log("✅ Campaign style variety working")
                return True
            else:
                self.log("❌ Campaign style variety failed")
                return False
                
        except Exception as e:
            self.log(f"❌ Campaign style testing failed - error: {str(e)}")
            return False
    
    def run_integration_tests(self):
        """Run all Gemini integration tests"""
        self.log("=" * 80)
        self.log("STARTING GEMINI AI INTEGRATION TESTING")
        self.log("=" * 80)
        
        test_results = {}
        
        # Test API key and basic connectivity
        test_results["api_key_validation"] = self.test_gemini_api_key_validation()
        
        # Test realistic campaign generation
        test_results["real_data_generation"] = self.test_campaign_generation_with_real_data()
        
        # Test style variety
        test_results["style_variety"] = self.test_different_campaign_styles()
        
        # Summary
        self.log("=" * 80)
        self.log("GEMINI INTEGRATION TEST RESULTS")
        self.log("=" * 80)
        
        passed = 0
        failed = 0
        
        for test_name, result in test_results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            self.log(f"{test_name.replace('_', ' ').title()}: {status}")
            if result:
                passed += 1
            else:
                failed += 1
        
        self.log("=" * 80)
        self.log(f"GEMINI INTEGRATION: {passed} PASSED, {failed} FAILED")
        
        if passed == len(test_results):
            self.log("🎉 GEMINI AI INTEGRATION FULLY WORKING!")
        elif passed >= len(test_results) * 0.75:
            self.log("⚠️  GEMINI AI INTEGRATION MOSTLY WORKING")
        else:
            self.log("🚨 GEMINI AI INTEGRATION NEEDS ATTENTION")
        
        self.log("=" * 80)
        
        return test_results

def main():
    """Main testing function"""
    tester = GeminiIntegrationTester()
    results = tester.run_integration_tests()
    
    # Exit with appropriate code
    passed = sum(1 for result in results.values() if result)
    if passed >= len(results) * 0.75:  # 75% threshold for success
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()