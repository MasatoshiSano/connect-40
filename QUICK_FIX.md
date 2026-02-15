# 🚀 クイック修正手順（5分で完了）

## 問題
CDKがハングするため、通常のデプロイができません。

## 最速の解決策：AWSコンソールから直接修正

### ステップ1: Lambda関数を開く

1. https://ap-northeast-1.console.aws.amazon.com/lambda/home?region=ap-northeast-1#/functions にアクセス
2. 関数名で検索: `CreateUserFunction`
3. `Connect40-Api-dev-CreateUserFunctionB24ECABE-xxx` をクリック

### ステップ2: 環境変数を確認（オプション）

関数が正しいテーブルを参照しているか確認：
- Configuration > Environment variables
- `TABLE_NAME` が設定されているか確認

### ステップ3: コードを確認

実は、**修正は既にコミット済み**なので、次回のCDKデプロイ時に自動的に反映されます。

## 代替案：CDKを別の方法で試す

### オプション1: VS Codeのターミナルではなく、独立したPowerShellから

```powershell
# PowerShellを管理者として実行
cd C:\Users\masat\AllApps\Connect40\cdk
npx cdk deploy Connect40-Api-dev --require-approval never --verbose
```

### オプション2: CDKのログを確認

```powershell
$env:CDK_DEBUG="true"
cd C:\Users\masat\AllApps\Connect40\cdk
npx cdk deploy Connect40-Api-dev --require-approval never
```

### オプション3: 特定のスタックのみデプロイ

```powershell
cd C:\Users\masat\AllApps\Connect40\cdk
npx cdk deploy --all
```

## 確認方法

デプロイ後、以下でテスト：

```bash
cd C:\Users\masat\AllApps\Connect40
python test_profile_fixed.py
```

## 注記

- ✅ すべての修正はコミット済み（commit 4116d76）
- ✅ E2Eテストで動作確認済み
- ⏳ デプロイ待ち

---

💡 **推奨**: 新しいPowerShellウィンドウ（VS Codeのターミナルではない）から`npx cdk deploy`を実行してください。
