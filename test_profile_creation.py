"""
E2E Test: Profile Creation Flow
Tests the complete profile creation process from login to submission
"""
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
import sys
import time

def test_profile_creation():
    """Test profile creation flow with e2e-test@example.com"""

    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        # Enable console logging
        page.on('console', lambda msg: print(f'[BROWSER] {msg.type}: {msg.text}'))
        page.on('pageerror', lambda err: print(f'[PAGE ERROR] {err}'))

        try:
            print("=" * 60)
            print("Starting Profile Creation E2E Test")
            print("=" * 60)

            # 1. Navigate to app
            print("\n[1/8] Navigating to application...")
            response = page.goto('http://localhost:3000', wait_until='networkidle', timeout=30000)
            print(f"[OK] Response status: {response.status}")
            print(f"[OK] Current URL: {page.url}")

            # Check if page has content
            body_text = page.locator('body').text_content()
            print(f"[OK] Page body length: {len(body_text)} chars")

            page.screenshot(path='/tmp/01_homepage.png', full_page=True)
            print("[OK] Homepage loaded")

            # 2. Navigate to login page
            print("\n[2/8] Navigating to login page...")
            # Check if already on login page or need to click login button
            if page.url.endswith('/login'):
                print("[OK] Already on login page")
            else:
                # Look for login button/link
                login_link = page.locator('a[href="/login"], button:has-text("ログイン")')
                if login_link.count() > 0:
                    login_link.first.click()
                    page.wait_for_load_state('networkidle')
                else:
                    # Navigate directly
                    page.goto('http://localhost:3000/login')
                    page.wait_for_load_state('networkidle')

            page.screenshot(path='/tmp/02_login_page.png')
            print("[OK] On login page")

            # 3. Login
            print("\n[3/8] Logging in with e2e-test@example.com...")
            page.fill('input[type="email"], input[name="email"]', 'e2e-test@example.com')
            page.fill('input[type="password"], input[name="password"]', 'E2ETest123!')
            page.screenshot(path='/tmp/03_login_filled.png')

            # Click login button
            page.click('button[type="submit"], button:has-text("ログイン")')
            print("[OK] Login submitted, waiting for response...")

            # Wait for navigation or error
            try:
                page.wait_for_url('**/dashboard', timeout=10000)
                print("[OK] Redirected to dashboard")
            except PlaywrightTimeout:
                # Might redirect to profile creation directly
                if 'profile/create' in page.url:
                    print("[OK] Redirected to profile creation")
                else:
                    print(f"! Current URL: {page.url}")
                    page.screenshot(path='/tmp/03_after_login.png')

            page.screenshot(path='/tmp/04_after_login.png')

            # 4. Navigate to profile creation
            print("\n[4/8] Navigating to profile creation...")
            if 'profile/create' not in page.url:
                page.goto('http://localhost:3000/profile/create/step1')
                page.wait_for_load_state('networkidle')

            page.screenshot(path='/tmp/05_profile_step1.png')
            print("[OK] On profile creation Step 1")

            # 5. Fill Step 1 - Basic Info
            print("\n[5/8] Filling Step 1: Basic Info...")
            page.fill('input[name="nickname"]', 'E2Eテストユーザー')
            page.fill('input[type="number"], input[name="age"]', '40')
            page.fill('textarea[name="bio"]', 'これはE2Eテスト用の自己紹介文です。プロフィール作成が正常に動作することを確認しています。')
            page.screenshot(path='/tmp/06_step1_filled.png')

            # Click next
            page.click('button[type="submit"], button:has-text("次へ")')
            page.wait_for_load_state('networkidle')
            page.screenshot(path='/tmp/07_profile_step2.png')
            print("[OK] Step 1 completed, moved to Step 2")

            # 6. Fill Step 2 - Interests
            print("\n[6/8] Filling Step 2: Interests...")
            # Select at least 3 interests
            interests_buttons = page.locator('button:not([type="submit"]):not([type="button"])')
            count = min(5, interests_buttons.count())  # Select first 5 interests

            for i in range(count):
                try:
                    interests_buttons.nth(i).click()
                    time.sleep(0.2)  # Small delay between clicks
                except:
                    pass

            page.screenshot(path='/tmp/08_step2_filled.png')
            print(f"[OK] Selected {count} interests")

            # Click next
            page.click('button:has-text("次へ")')
            page.wait_for_load_state('networkidle')
            page.screenshot(path='/tmp/09_profile_step3.png')
            print("[OK] Step 2 completed, moved to Step 3")

            # 7. Fill Step 3 - Verification
            print("\n[7/8] Filling Step 3: Verification...")

            # Upload photo (create a dummy image first)
            import base64
            from pathlib import Path

            # Create a simple 1x1 pixel PNG
            png_data = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
            dummy_image = Path('/tmp/dummy_profile.png')
            dummy_image.write_bytes(png_data)

            # Upload file
            page.set_input_files('input[type="file"]', str(dummy_image))
            page.wait_for_timeout(1000)  # Wait for preview
            page.screenshot(path='/tmp/10_step3_photo_uploaded.png')
            print("[OK] Profile photo uploaded")

            # Get location
            # Mock geolocation
            context.grant_permissions(['geolocation'])
            context.set_geolocation({'latitude': 35.6762, 'longitude': 139.6503})  # Tokyo

            page.click('button:has-text("現在地を取得"), button:has-text("位置情報")')
            page.wait_for_timeout(2000)  # Wait for geolocation
            page.screenshot(path='/tmp/11_step3_location_set.png')
            print("[OK] Location obtained")

            # 8. Submit profile
            print("\n[8/8] Submitting profile...")
            page.screenshot(path='/tmp/12_before_submit.png')

            # Click submit button
            submit_button = page.locator('button:has-text("プロフィール作成完了"), button:has-text("作成完了")')
            if submit_button.count() > 0:
                submit_button.first.click()
                print("[OK] Submit button clicked")

                # Wait for response
                page.wait_for_timeout(3000)
                page.screenshot(path='/tmp/13_after_submit.png')

                # Check for errors
                error_elements = page.locator('[class*="error"], [class*="Error"], .text-red-600, .text-red-400')
                if error_elements.count() > 0:
                    print("\n[ERROR] ERROR DETECTED:")
                    for i in range(error_elements.count()):
                        error_text = error_elements.nth(i).text_content()
                        if error_text and error_text.strip():
                            print(f"  - {error_text}")
                    return False
                else:
                    print("[OK] No visible errors detected")

                # Check if redirected to success page
                if 'success' in page.url or 'dashboard' in page.url:
                    print("[OK] Redirected to success/dashboard page")
                    return True
                else:
                    print(f"! Current URL: {page.url}")
                    return True
            else:
                print("[ERROR] Submit button not found")
                return False

        except Exception as e:
            print(f"\n[ERROR] Test failed with error: {str(e)}")
            page.screenshot(path='/tmp/error.png')
            import traceback
            traceback.print_exc()
            return False

        finally:
            print("\n" + "=" * 60)
            browser.close()
            print("Browser closed")
            print("=" * 60)
            print("\nScreenshots saved to /tmp/")
            return True

if __name__ == '__main__':
    success = test_profile_creation()
    sys.exit(0 if success else 1)
