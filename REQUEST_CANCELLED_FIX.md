# Request Cancelled 恢复改进

## 问题描述

当用户取消请求后出现 "Request cancelled" 消息，UI 可能会进入无法恢复的状态，导致用户无法发送新的请求。

## 根本原因

1. **状态同步问题**：前端取消和后端返回取消响应之间存在时序竞争
2. **缺少错误恢复机制**：取消或错误状态后，UI 状态没有确保完全重置
3. **状态显示残留**：取消消息可能一直显示，给用户造成困惑

## 解决方案

### 1. 改进 `message_handler.js`

**位置**: `sandbox/controllers/message_handler.js:196-230`

**改进内容**:
- 强制重置生成状态 (`isGenerating = false`)
- 确保 UI 加载状态被清除 (`setLoading(false)`)
- 对于取消或错误状态，添加延迟恢复机制：
  - 3 秒后自动清除状态消息
  - 双重检查并重置加载状态，确保 UI 完全可交互

```javascript
// Recovery: If this was a cancellation or error, ensure UI is in a fully recoverable state
if (request.status === 'cancelled' || request.status === 'error') {
    setTimeout(() => {
        if (!this.app.isGenerating) {
            this.ui.updateStatus('');
            // Double-check that loading state is cleared (safety measure)
            this.ui.setLoading(false);
        }
    }, 3000);
}
```

### 2. 改进 `prompt.js`

**位置**: `sandbox/controllers/prompt.js:263-281`

**改进内容**:
- 在取消操作中添加自动清除机制
- 3 秒后自动清除 "cancelled" 状态消息
- 确保不会干扰新启动的请求

```javascript
// Clear the cancelled status after a delay to ensure UI is fully recoverable
setTimeout(() => {
    if (!this.app.isGenerating) {
        this.ui.updateStatus('');
    }
}, 3000);
```

## 改进效果

1. **自动恢复**: 取消后 3 秒自动清除状态，UI 恢复到可用状态
2. **双重保护**: 两处关键位置都添加了恢复逻辑，确保无论哪种情况都能恢复
3. **不干扰新请求**: 恢复逻辑检查 `isGenerating` 标志，不会影响用户已经启动的新请求

## 测试建议

1. 发送一个请求，然后立即取消
2. 等待 3 秒，确认状态消息自动清除
3. 尝试发送新的请求，确认可以正常工作
4. 测试快速取消-重新发送的场景
5. 测试网络错误后的恢复

## 相关文件

- `sandbox/controllers/message_handler.js` - 处理后端返回的回复消息
- `sandbox/controllers/prompt.js` - 处理用户发起的取消操作
- `sandbox/ui/chat.js` - UI 控制器，管理加载状态和输入框

## 版本

此修复已包含在构建中，需要重新加载扩展以应用更改。
