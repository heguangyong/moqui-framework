# 多模态AI 测试脚本

## 概述
本目录包含多模态AI功能(语音识别、图像识别)的所有测试脚本和验证工具。

## 目录结构
- `tools/setup/` - 多模态AI设置和配置脚本
- `integration/` - 多模态AI集成测试
- `e2e/` - 端到端多模态测试

## 快速开始
1. 环境准备: `./tools/setup/image_recognition_setup.sh`
2. 语音设置: `./tools/setup/speech_to_text_setup.sh`
3. 集成测试: `./integration/test_image_recognition.sh`
4. 端到端测试: `./e2e/test_multimodal_complete.sh`

## 测试脚本索引

### 设置工具
- `tools/setup/image_recognition_setup.sh` - 图像识别设置
- `tools/setup/speech_to_text_setup.sh` - 语音转文字设置

### 集成测试
- `integration/test_demo_image_recognition.sh` - 图像识别演示测试
- `integration/test_demo_speech_recognition.sh` - 语音识别演示测试
- `integration/test_image_recognition.sh` - 图像识别集成测试
- `integration/test_multilingual_speech.sh` - 多语言语音测试
- `integration/test_speech_to_text.sh` - 语音转文字测试

### 端到端测试
- `e2e/test_multimodal_complete.sh` - 完整多模态测试
- `e2e/test_multimodal_telegram.sh` - Telegram多模态测试

## 使用说明
1. 多模态AI是项目的核心特性，支持语音、图像、文本交互
2. 图像识别基于智谱AI GLM-4V模型
3. 语音识别支持多语言处理
4. 端到端测试验证完整的多模态交互流程

## 维护信息
- 负责人: 多模态AI团队
- 最后更新: 2025年1月13日
- 相关文档: [多模态AI架构设计](../../design.md)