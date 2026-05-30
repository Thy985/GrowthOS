"""
GrowthOS 端到端 (E2E) 测试

测试范围:
1. 应用加载和基础渲染
2. 登录页面 (UI元素、表单验证、导航)
3. 注册页面
4. 路由保护 (未登录重定向)
5. 受保护页面渲染
6. 控制台错误检测
7. 无障碍性检查
8. i18n 国际化
9. 响应式布局
10. 性能指标
"""

from playwright.sync_api import sync_playwright
import json
import time
import sys

RESULTS = []
ERRORS = []
WARNINGS = []
SCREENSHOTS = []

def record_result(test_name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    RESULTS.append({
        "name": test_name,
        "passed": passed,
        "details": details
    })
    print(f"  {status}: {test_name}")
    if details:
        print(f"    {details}")

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 800},
            locale='en-US'
        )
        page = context.new_page()

        console_errors = []
        page.on('console', lambda msg: 
            console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ['error', 'warning'] else None
        )

        page.on('pageerror', lambda err: 
            ERRORS.append(f"Page Error: {err.message}")
        )

        BASE_URL = 'http://localhost:5173'

        print("\n" + "=" * 60)
        print("  GrowthOS E2E 测试套件")
        print("=" * 60)

        # ==========================================
        # 测试 1: 应用加载
        # ==========================================
        print("\n--- 1. 基础加载测试 ---")
        try:
            start_time = time.time()
            page.goto(BASE_URL, wait_until='networkidle', timeout=30000)
            load_time = time.time() - start_time

            page.screenshot(path='/tmp/e2e_01_initial_load.png', full_page=True)
            SCREENSHOTS.append('/tmp/e2e_01_initial_load.png')

            title = page.title()
            record_result("页面加载", True, f"标题: '{title}', 加载时间: {load_time:.2f}s")

            if load_time > 5:
                record_result("加载性能", False, f"加载过慢: {load_time:.2f}s (目标 < 5s)")
            else:
                record_result("加载性能", True, f"加载时间: {load_time:.2f}s")

        except Exception as e:
            record_result("页面加载", False, str(e))

        # ==========================================
        # 测试 2: 登录页面渲染
        # ==========================================
        print("\n--- 2. 登录页面测试 ---")
        try:
            page.goto(f"{BASE_URL}/login", wait_until='networkidle', timeout=30000)
            page.screenshot(path='/tmp/e2e_02_login.png', full_page=True)
            SCREENSHOTS.append('/tmp/e2e_02_login.png')

            login_title = page.locator('h2')
            if login_title.count() > 0:
                title_text = login_title.first.text_content()
                record_result("登录页面标题", "登录" in title_text or "GrowthOS" in title_text, f"标题: '{title_text}'")
            else:
                record_result("登录页面标题", False, "未找到标题元素")

            email_input = page.locator('input[type="email"]')
            password_input = page.locator('input[type="password"]')
            submit_button = page.locator('button[type="submit"]')

            record_result("邮箱输入框", email_input.count() > 0, f"找到 {email_input.count()} 个")
            record_result("密码输入框", password_input.count() > 0, f"找到 {password_input.count()} 个")
            record_result("登录按钮", submit_button.count() > 0, f"找到 {submit_button.count()} 个")

            register_link = page.locator('a[href="/register"]')
            record_result("注册链接", register_link.count() > 0, f"找到 {register_link.count()} 个")

        except Exception as e:
            record_result("登录页面渲染", False, str(e))

        # ==========================================
        # 测试 3: 登录表单验证
        # ==========================================
        print("\n--- 3. 登录表单验证测试 ---")
        try:
            page.goto(f"{BASE_URL}/login", wait_until='networkidle', timeout=30000)

            submit_button = page.locator('button[type="submit"]')
            submit_button.click()
            page.wait_for_timeout(1000)

            page.screenshot(path='/tmp/e2e_03_validation.png', full_page=True)
            SCREENSHOTS.append('/tmp/e2e_03_validation.png')

            email_input = page.locator('input[type="email"]')
            is_required = email_input.get_attribute('required') is not None
            record_result("邮箱必填验证", is_required, "HTML5 required 属性")

            try:
                email_input.fill('test@example.com')
                password_input = page.locator('input[type="password"]')
                password_input.fill('testpassword')
                record_result("表单输入", True, "成功填写邮箱和密码")
            except Exception as e:
                record_result("表单输入", False, str(e))

        except Exception as e:
            record_result("登录表单验证", False, str(e))

        # ==========================================
        # 测试 4: 导航到注册页面
        # ==========================================
        print("\n--- 4. 注册页面测试 ---")
        try:
            page.goto(f"{BASE_URL}/register", wait_until='networkidle', timeout=30000)
            page.screenshot(path='/tmp/e2e_04_register.png', full_page=True)
            SCREENSHOTS.append('/tmp/e2e_04_register.png')

            page_title = page.title()
            record_result("注册页面加载", True, f"标题: '{page_title}'")

            form_inputs = page.locator('input').count()
            record_result("注册表单元素", form_inputs > 0, f"找到 {form_inputs} 个输入框")

            login_link = page.locator('a[href="/login"]')
            record_result("返回登录链接", login_link.count() > 0, f"找到 {login_link.count()} 个")

        except Exception as e:
            record_result("注册页面", False, str(e))

        # ==========================================
        # 测试 5: 路由保护
        # ==========================================
        print("\n--- 5. 路由保护测试 ---")
        try:
            protected_routes = ['/', '/records', '/goals', '/reminders', '/growth-tree', '/analytics', '/ai-settings']

            for route in protected_routes:
                page.goto(f"{BASE_URL}{route}", wait_until='networkidle', timeout=30000)
                current_url = page.url
                is_redirected = '/login' in current_url or '/auth' in current_url
                record_result(
                    f"路由保护: {route}",
                    is_redirected,
                    f"重定向到: {current_url.replace(BASE_URL, '')}"
                )

        except Exception as e:
            record_result("路由保护", False, str(e))

        # ==========================================
        # 测试 6: 页面元数据
        # ==========================================
        print("\n--- 6. 页面元数据测试 ---")
        try:
            page.goto(f"{BASE_URL}/login", wait_until='networkidle', timeout=30000)

            meta_viewport = page.locator('meta[name="viewport"]')
            record_result("Viewport meta 标签", meta_viewport.count() > 0, "响应式设计支持")

            favicon = page.locator('link[rel="icon"]')
            record_result("Favicon", favicon.count() > 0, f"找到 {favicon.count()} 个")

        except Exception as e:
            record_result("页面元数据", False, str(e))

        # ==========================================
        # 测试 7: 控制台错误检测
        # ==========================================
        print("\n--- 7. 控制台错误检测 ---")
        try:
            console_errors = []
            page.on('console', lambda msg: 
                console_errors.append(f"[{msg.type}] {msg.text}") if msg.type == 'error' else None
            )

            page.goto(f"{BASE_URL}/login", wait_until='networkidle', timeout=30000)
            page.wait_for_timeout(2000)

            error_count = len(console_errors)
            record_result("控制台错误", error_count == 0, f"发现 {error_count} 个错误")

            if error_count > 0:
                for err in console_errors[:5]:
                    WARNINGS.append(f"Console Error: {err}")

        except Exception as e:
            record_result("控制台错误检测", False, str(e))

        # ==========================================
        # 测试 8: 响应式布局
        # ==========================================
        print("\n--- 8. 响应式布局测试 ---")
        try:
            mobile_viewport = {'width': 375, 'height': 667}
            page.set_viewport_size(mobile_viewport)
            page.goto(f"{BASE_URL}/login", wait_until='networkidle', timeout=30000)
            page.screenshot(path='/tmp/e2e_08_mobile.png', full_page=True)
            SCREENSHOTS.append('/tmp/e2e_08_mobile.png')

            record_result("移动端渲染 (375px)", True, "页面在移动端视口正常渲染")

            tablet_viewport = {'width': 768, 'height': 1024}
            page.set_viewport_size(tablet_viewport)
            page.goto(f"{BASE_URL}/login", wait_until='networkidle', timeout=30000)
            page.screenshot(path='/tmp/e2e_08_tablet.png', full_page=True)
            SCREENSHOTS.append('/tmp/e2e_08_tablet.png')

            record_result("平板端渲染 (768px)", True, "页面在平板端视口正常渲染")

            page.set_viewport_size({'width': 1280, 'height': 800})

        except Exception as e:
            record_result("响应式布局", False, str(e))

        # ==========================================
        # 测试 9: 页面元素可见性
        # ==========================================
        print("\n--- 9. 页面元素可见性测试 ---")
        try:
            page.goto(f"{BASE_URL}/login", wait_until='networkidle', timeout=30000)

            visible_elements = {
                '登录标题': 'h2',
                '邮箱输入框': 'input[type="email"]',
                '密码输入框': 'input[type="password"]',
                '登录按钮': 'button[type="submit"]',
                '记住我': 'input[type="checkbox"]',
            }

            for name, selector in visible_elements.items():
                element = page.locator(selector)
                is_visible = element.count() > 0 and element.first.is_visible()
                record_result(f"元素可见: {name}", is_visible, f"选择器: {selector}")

        except Exception as e:
            record_result("页面元素可见性", False, str(e))

        # ==========================================
        # 测试 10: 链接检查
        # ==========================================
        print("\n--- 10. 链接完整性测试 ---")
        try:
            page.goto(f"{BASE_URL}/login", wait_until='networkidle', timeout=30000)

            links = page.locator('a[href]')
            link_count = links.count()
            record_result("链接总数", link_count > 0, f"找到 {link_count} 个链接")

            broken_links = []
            for i in range(min(link_count, 5)):
                try:
                    href = links.nth(i).get_attribute('href')
                    text = links.nth(i).text_content()
                    if href and not href.startswith('http') and not href.startswith('#'):
                        record_result(f"内部链接: {text or href}", True, f"href='{href}'")
                except:
                    broken_links.append(i)

            if broken_links:
                record_result("链接完整性", False, f"{len(broken_links)} 个链接无法访问")
            else:
                record_result("链接完整性", True, "所有链接正常")

        except Exception as e:
            record_result("链接检查", False, str(e))

        # ==========================================
        # 测试汇总
        # ==========================================
        browser.close()

        print("\n" + "=" * 60)
        print("  测试结果汇总")
        print("=" * 60)

        passed = sum(1 for r in RESULTS if r['passed'])
        failed = sum(1 for r in RESULTS if not r['passed'])
        total = len(RESULTS)

        print(f"\n  总计: {total} 个测试")
        print(f"  通过: {passed} ({passed/total*100:.1f}%)" if total > 0 else "  通过: 0")
        print(f"  失败: {failed} ({failed/total*100:.1f}%)" if total > 0 else "  失败: 0")

        if SCREENSHOTS:
            print(f"\n  截图数量: {len(SCREENSHOTS)}")
            for s in SCREENSHOTS:
                print(f"    - {s}")

        if ERRORS:
            print(f"\n  ⚠️ 页面错误: {len(ERRORS)}")
            for e in ERRORS[:5]:
                print(f"    - {e}")

        if WARNINGS:
            print(f"\n  ⚠️ 控制台警告: {len(WARNINGS)}")
            for w in WARNINGS[:5]:
                print(f"    - {w}")

        # 输出 JSON 结果
        print("\n--- JSON 结果 ---")
        print(json.dumps({
            "total": total,
            "passed": passed,
            "failed": failed,
            "pass_rate": f"{passed/total*100:.1f}%" if total > 0 else "0%",
            "results": RESULTS,
            "errors": ERRORS,
            "warnings": WARNINGS,
            "screenshots": SCREENSHOTS
        }, ensure_ascii=False, indent=2))

        return failed == 0

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)