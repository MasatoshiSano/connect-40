"""
Simplified E2E Test for debugging
"""
from playwright.sync_api import sync_playwright
import traceback

def test_simple():
    with sync_playwright() as p:
        try:
            print("Launching browser...")
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()

            # Console logging
            page.on('console', lambda msg: print(f'[CONSOLE {msg.type}] {msg.text}'))
            page.on('pageerror', lambda err: print(f'[ERROR] {err}'))

            print("Navigating to http://localhost:3000...")
            response = page.goto('http://localhost:3000', timeout=30000)
            print(f"Response status: {response.status}")
            print(f"Current URL: {page.url}")

            # Wait for page to load
            page.wait_for_load_state('networkidle', timeout=30000)
            print("Page loaded (networkidle)")

            # Get page content
            title = page.title()
            print(f"Page title: {title}")

            body = page.locator('body').text_content()
            print(f"Body text length: {len(body)} chars")
            print(f"Body text preview: {body[:200]}")

            # Take screenshot
            page.screenshot(path='/tmp/simple_test.png', full_page=True)
            print("Screenshot saved to /tmp/simple_test.png")

            browser.close()
            print("✓ Test completed successfully")
            return True

        except Exception as e:
            print(f"\n❌ Error: {e}")
            traceback.print_exc()
            try:
                page.screenshot(path='/tmp/error_simple.png')
                print("Error screenshot saved")
            except:
                pass
            return False

if __name__ == '__main__':
    success = test_simple()
    exit(0 if success else 1)
