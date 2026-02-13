export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="font-bold text-white mb-4">Connect40について</h3>
            <p className="text-sm">
              40代男性向けの孤独解消マッチングプラットフォーム。
              第3の居場所を見つけましょう。
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold text-white mb-4">リンク</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/about" className="hover:text-primary transition">
                  コンセプト
                </a>
              </li>
              <li>
                <a href="/activities" className="hover:text-primary transition">
                  アクティビティ
                </a>
              </li>
              <li>
                <a href="/pricing" className="hover:text-primary transition">
                  料金プラン
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-white mb-4">サポート</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/contact" className="hover:text-primary transition">
                  お問い合わせ
                </a>
              </li>
              <li>
                <a href="/faq" className="hover:text-primary transition">
                  よくある質問
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold text-white mb-4">法的情報</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/terms" className="hover:text-primary transition">
                  利用規約
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-primary transition">
                  プライバシーポリシー
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {currentYear} Connect40. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
