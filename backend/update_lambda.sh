#!/bin/bash
# Lambda関数を直接更新するスクリプト

# CreateUser関数を更新
FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'CreateUserFunction')].FunctionName" --output text | head -1)

echo "Updating Lambda function: $FUNCTION_NAME"

# 一時ディレクトリを作成
TMP_DIR=$(mktemp -d)
mkdir -p $TMP_DIR/nodejs

# 必要なファイルをコピー
cp -r functions/users/create.ts $TMP_DIR/
cp -r types $TMP_DIR/
cp -r layers/common/nodejs/* $TMP_DIR/nodejs/

# TypeScriptをJavaScriptにコンパイル（esbuildを使用）
cd $TMP_DIR
npx esbuild create.ts --bundle --platform=node --target=node20 --outfile=index.js --external:@aws-sdk/*

# Zipファイルを作成
zip -r function.zip index.js nodejs/

# Lambda関数を更新
aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --zip-file fileb://function.zip

# クリーンアップ
rm -rf $TMP_DIR

echo "Lambda function updated successfully!"
