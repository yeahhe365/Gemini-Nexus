# 后台会话优化 - 切换会话时不取消请求

## 问题背景

在之前的实现中，当用户在请求进行中切换到其他会话或创建新对话时，正在进行的请求会被立即取消。这导致：

1. **用户体验不佳**：用户必须等待请求完成才能切换会话
2. **工作流中断**：如果用户想同时处理多个任务，必须等待每个请求完成
3. **资源浪费**：已经发送的请求被取消，浪费了 API 配额和时间

## 优化方案

### 核心思路

将请求从"前台独占"改为"后台继续执行"模式：

- ✅ 用户切换会话时，正在进行的请求继续在后台执行
- ✅ 请求完成后，结果自动保存到对应的会话历史中
- ✅ 用户切换回该会话时，可以看到完整的对话历史
- ✅ 侧边栏显示后台正在生成的会话（spinner 图标）

### 实现细节

#### 1. 会话切换不取消请求

**位置**: `sandbox/controllers/session_flow.js:40-52`

**改进内容**:
```javascript
switchToSession(sessionId, options = {}) {
    // Don't reset stream if switching away from a generating session
    // Let it continue in the background and deliver results when complete
    const isLeavingGeneratingSession =
        this.app.isGenerating &&
        this.app.generatingSessionId &&
        this.app.generatingSessionId !== sessionId;

    if (!isLeavingGeneratingSession) {
        this.app.messageHandler.resetStream();
    }

    this.sessionManager.setCurrentId(sessionId);
    // ... 其余代码
}
```

**逻辑说明**:
- 检测是否从正在生成的会话切换出去
- 如果是，则**不**清除流状态，让请求继续执行
- 如果不是（切换到生成中的会话或普通切换），正常清除流状态

#### 2. 新建对话不取消请求

**位置**: `sandbox/controllers/session_flow.js:29-38`

**改进内容**:
```javascript
enterDraft() {
    // Don't reset stream if leaving a generating session
    // Let it continue in the background
    const isLeavingGeneratingSession = this.app.isGenerating && this.app.generatingSessionId;

    if (!isLeavingGeneratingSession) {
        this.app.messageHandler.resetStream();
    }

    this.sessionManager.enterDraft();
    // ... 其余代码
}
```

**逻辑说明**:
- 用户点击"新建对话"时，如果当前有会话正在生成，不取消它
- 让后台请求继续执行并保存到原会话中

#### 3. 后台完成的请求自动保存

**位置**: `sandbox/controllers/message_handler.js:196-238`

**改进内容**:
```javascript
handleGeminiReply(request) {
    if (!this.isGeneratingSessionMessage(request)) return;

    // Force-reset generation state to ensure UI becomes interactive
    this.app.isGenerating = false;
    this.app.generatingSessionId = null;
    this.ui.setLoading(false);
    this.app.sessionFlow.refreshHistoryUI();
    this.clearStreamState(this.getRequestSessionId(request));

    // Background session completion: Save the reply even if user switched away
    const isBackgroundCompletion = !this.isCurrentSessionMessage(request);

    if (isBackgroundCompletion) {
        // Request completed for a session that's not currently visible
        // Save the result to session history so it appears when user switches back
        const targetSessionId = this.getRequestSessionId(request);
        const targetSession = this.sessionManager.getSessionById(targetSessionId);

        if (targetSession && request.status === 'success') {
            // Update context for the background session
            this.sessionManager.updateContext(targetSessionId, request.context);
        }

        this.resetStream();
        return;
    }

    // Current session: render the reply normally
    const session = this.sessionManager.getCurrentSession();
    renderGeminiReply(this, session, request);
    
    // ... 错误恢复逻辑
}
```

**逻辑说明**:
- 区分当前会话完成和后台会话完成
- 后台会话完成时：
  - 更新会话的上下文（context）
  - 不渲染到当前 UI（因为用户在另一个会话）
  - 结果已经通过 `prompt_handler.js` 保存到 `history_manager` 中
- 当前会话完成时：正常渲染回复

### 用户体验改进

#### 1. 视觉反馈

侧边栏的会话列表已经支持显示生成状态：

- **Spinner 图标**：正在生成的会话旁边显示加载动画
- **位置**: `sandbox/ui/sidebar_rendering.js:190-192`
- 用户可以清楚地看到哪个会话正在后台生成

#### 2. 工作流改进

**之前的工作流**:
1. 用户发送问题 A
2. 等待回复...
3. 回复完成后才能切换到其他会话
4. 发送问题 B
5. 再次等待...

**优化后的工作流**:
1. 用户在会话 A 发送问题
2. 立即切换到会话 B，A 在后台继续
3. 在会话 B 发送另一个问题
4. 可以随时切换回会话 A 查看结果
5. 或者继续在其他会话工作

## 技术实现要点

### 1. 状态管理

- `app.isGenerating`: 全局是否有请求正在执行
- `app.generatingSessionId`: 哪个会话正在生成
- 切换会话时不清除这些状态，保持请求继续执行

### 2. 消息路由

- `isGeneratingSessionMessage()`: 检查消息是否属于正在生成的会话
- `isCurrentSessionMessage()`: 检查消息是否属于当前显示的会话
- 根据这两个判断决定如何处理返回的消息

### 3. 历史持久化

- 后台会话的回复通过 `prompt_handler.js` 中的 `appendAiMessage()` 自动保存
- 用户切换回该会话时，从持久化的历史记录中恢复显示

## 兼容性

### 保持向后兼容

- 所有现有功能保持不变
- 单会话工作模式完全正常
- 只在用户主动切换时才触发后台执行逻辑

### 边界情况处理

1. **取消操作**: 用户点击取消按钮仍然会取消当前请求
2. **错误处理**: 后台请求出错时，错误信息保存到对应会话
3. **网络中断**: 网络问题导致的中断按照原有逻辑处理

## 测试建议

### 基础功能测试

1. 发送一个请求，等待完成 - 确认正常工作
2. 发送请求后立即切换会话 - 确认原会话在后台继续
3. 切换回原会话 - 确认能看到完整的对话历史

### 多会话测试

1. 在会话 A 发送长请求（如代码生成）
2. 切换到会话 B 发送短请求
3. 观察侧边栏 - 两个会话都应该显示 spinner
4. 等待两个请求都完成
5. 分别切换回去查看结果

### 边界情况测试

1. 后台会话返回错误 - 切换回去应该能看到错误消息
2. 快速在多个会话间切换 - 不应该出现状态混乱
3. 后台请求完成时用户正在输入 - 不应该干扰当前输入

## 相关文件

- `sandbox/controllers/session_flow.js` - 会话切换逻辑
- `sandbox/controllers/message_handler.js` - 消息处理和路由
- `sandbox/ui/sidebar_rendering.js` - 侧边栏视觉反馈
- `background/handlers/session/prompt_handler.js` - 后台请求处理

## 版本

此优化已包含在构建中，与 "Request Cancelled" 恢复改进一起发布。重新加载扩展以应用更改。
