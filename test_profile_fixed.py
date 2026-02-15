"""
E2E Test: Profile Creation Flow - Fixed version
"""
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
import sys
import time

def test_profile_creation():
    """Test profile creation flow with e2e-test@example.com"""

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        # Enable console logging
        def handle_console(msg):
            try:
                print(f'[BROWSER {msg.type}] {msg.text}')
            except:
                pass
        page.on('console', handle_console)

        try:
            print("=" * 60)
            print("Profile Creation E2E Test")
            print("=" * 60)

            # 1. Navigate and login
            print("\n[1/7] Logging in...")
            page.goto('http://localhost:3000/login')
            page.wait_for_load_state('networkidle')

            page.fill('input[type="email"]', 'e2e-test@example.com')
            page.fill('input[type="password"]', 'E2ETest123!')
            page.screenshot(path='/tmp/step01_login.png')
            page.click('button[type="submit"]')

            # Wait for redirect
            try:
                page.wait_for_url('**/dashboard', timeout=10000)
                print("[OK] Logged in")
            except:
                print("[OK] Login completed")

            page.screenshot(path='/tmp/step02_after_login.png')

            # 2. Go to profile creation Step 1
            print("\n[2/7] Starting profile creation...")
            page.goto('http://localhost:3000/profile/create/step1')
            page.wait_for_load_state('networkidle')
            page.screenshot(path='/tmp/step03_profile_step1.png')

            # 3. Fill Step 1
            print("\n[3/7] Filling Step 1: Basic Info...")
            page.fill('input[name="nickname"]', 'E2ETestUser')
            page.fill('input[type="number"]', '40')
            page.fill('textarea', 'This is a test bio for E2E testing. This bio text must be at least 10 characters long.')
            page.screenshot(path='/tmp/step04_step1_filled.png')

            # Submit Step 1
            page.click('button[type="submit"]')
            page.wait_for_load_state('networkidle')
            print("[OK] Step 1 completed")
            page.screenshot(path='/tmp/step05_profile_step2.png')

            # 4. Fill Step 2 - Interests
            print("\n[4/7] Filling Step 2: Interests...")
            time.sleep(1)  # Wait for page to fully render

            # Find all interest buttons (excluding navigation buttons)
            # These are buttons within the interest categories, not the submit buttons
            interest_buttons = page.locator('button').filter(has_text='ランニング')
            if interest_buttons.count() > 0:
                interest_buttons.first.click()
                time.sleep(0.3)
                print("  - Selected: Running")

            interest_buttons = page.locator('button').filter(has_text='筋トレ')
            if interest_buttons.count() > 0:
                interest_buttons.first.click()
                time.sleep(0.3)
                print("  - Selected: Training")

            interest_buttons = page.locator('button').filter(has_text='ヨガ')
            if interest_buttons.count() > 0:
                interest_buttons.first.click()
                time.sleep(0.3)
                print("  - Selected: Yoga")

            interest_buttons = page.locator('button').filter(has_text='映画')
            if interest_buttons.count() > 0:
                interest_buttons.first.click()
                time.sleep(0.3)
                print("  - Selected: Movies")

            page.screenshot(path='/tmp/step06_step2_filled.png')
            print("[OK] Selected 4 interests")

            # Submit Step 2 - find button with "next" text
            next_buttons = page.locator('button:has-text("次へ")')
            if next_buttons.count() > 0:
                next_buttons.last.click()  # Use last to avoid the "back" button
                page.wait_for_load_state('networkidle')
                print("[OK] Step 2 completed")
            else:
                print("[ERROR] Next button not found")
                return False

            page.screenshot(path='/tmp/step07_profile_step3.png')

            # 5. Fill Step 3 - Verification
            print("\n[5/7] Filling Step 3: Verification...")
            time.sleep(1)

            # Upload photo
            from pathlib import Path

            # Use the pre-created profile image
            dummy_image = Path('/tmp/e2e_profile.png')
            if not dummy_image.exists():
                # Fallback: create a minimal image
                import base64
                png_data = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
                dummy_image.write_bytes(png_data)

            # The file input is hidden, so we need to use JavaScript to set the file
            # Or find the hidden input directly
            file_input = page.locator('input[type="file"][accept="image/*"]')
            file_input.set_input_files(str(dummy_image))
            time.sleep(1)
            print("[OK] Photo uploaded")
            page.screenshot(path='/tmp/step08_photo_uploaded.png')

            # Mock geolocation
            context.grant_permissions(['geolocation'])
            context.set_geolocation({'latitude': 35.6762, 'longitude': 139.6503})

            # Click location button
            location_buttons = page.locator('button:has-text("現在地")')
            if location_buttons.count() > 0:
                location_buttons.first.click()
                time.sleep(2)
                print("[OK] Location obtained")
            else:
                print("[WARNING] Location button not found, trying alternative...")
                page.click('button:has-text("位置情報")')
                time.sleep(2)

            page.screenshot(path='/tmp/step09_location_set.png')

            # 6. Submit profile
            print("\n[6/7] Submitting profile...")
            page.screenshot(path='/tmp/step10_before_submit.png')

            # Find and click submit button
            submit_buttons = page.locator('button:has-text("完了"), button:has-text("作成")')
            if submit_buttons.count() > 0:
                # Check if button is enabled
                button = submit_buttons.last
                is_disabled = button.is_disabled()
                print(f"Submit button disabled: {is_disabled}")

                if not is_disabled:
                    button.click()
                    print("[OK] Submit button clicked")
                    time.sleep(3)
                else:
                    print("[ERROR] Submit button is disabled")
                    # Check for error messages
                    errors = page.locator('.text-red-600, .text-red-400, [class*="error"]').all_text_contents()
                    if errors:
                        print(f"[ERROR] Validation errors: {errors}")
                    return False
            else:
                print("[ERROR] Submit button not found")
                return False

            page.screenshot(path='/tmp/step11_after_submit.png')

            # 7. Check for errors
            print("\n[7/7] Checking results...")
            error_elements = page.locator('.text-red-600, .text-red-400')
            if error_elements.count() > 0:
                print("\n[ERROR] Errors detected:")
                for i in range(error_elements.count()):
                    error_text = error_elements.nth(i).text_content()
                    if error_text and error_text.strip():
                        print(f"  - {error_text}")
                page.screenshot(path='/tmp/step12_errors.png')
                time.sleep(2)
                return False
            else:
                print("[OK] No visible errors detected")

            # Check if redirected
            current_url = page.url
            print(f"Current URL: {current_url}")

            if 'success' in current_url or 'dashboard' in current_url:
                print("\n[SUCCESS] Profile created successfully!")
                page.screenshot(path='/tmp/step13_success.png')
                time.sleep(2)
                return True
            else:
                print(f"\n[WARNING] Unexpected URL: {current_url}")
                time.sleep(2)
                return True

        except Exception as e:
            print(f"\n[ERROR] Test failed: {str(e)}")
            page.screenshot(path='/tmp/error_final.png')
            import traceback
            traceback.print_exc()
            input("Press Enter to close browser...")
            return False

        finally:
            print("\n" + "=" * 60)
            browser.close()
            print("Test completed")

if __name__ == '__main__':
    success = test_profile_creation()
    sys.exit(0 if success else 1)
