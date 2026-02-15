# 手動デプロイ手順

CDKがハングする問題のため、以下の手順で手動デプロイしてください：

## 方法A: PowerShellから実行

```powershell
# 新しいPowerShellウィンドウを開く
cd C:\Users\masat\AllApps\Connect40\cdk
Remove-Item -Recurse -Force cdk.out -ErrorAction SilentlyContinue
npx cdk deploy Connect40-Api-dev --require-approval never
```

## 方法B: AWSコンソールから（最も確実）

1. https://console.aws.amazon.com/lambda/ を開く
2. 以下の関数を手動で更新：
   - `Connect40-Api-dev-CreateUserFunctionV2-xxx`
   
3. コードソース:
   - `backend/functions/users/create.ts` の内容をコピー
   - Lambda関数のコードエディタに貼り付け
   - Deploy をクリック

## 修正内容のサマリー

以下のファイルが変更されています：
- ✅ `backend/types/index.ts`: bioフィールド追加
- ✅ `backend/functions/users/create.ts`: bioを保存
- ✅ インポートパス修正

## テスト

デプロイ後、以下のコマンドでE2Eテストを実行：

```bash
cd C:\Users\masat\AllApps\Connect40
python test_profile_fixed.py
```

成功すれば、プロフィール作成が正常に動作します！
