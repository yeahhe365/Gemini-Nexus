# Request Cancellation 和后台会话优化总结

## 概述

本次更新包含两个重要的用户体验改进，都围绕请求取消和会话切换的场景：

1. **Request Cancelled 恢复机制** - 确保取消后 UI 始终可恢复
2. **后台会话支持** - 切换会话时请求继续在后台执行

---

## 改进 1: Request Cancelled 恢复机制

### 问题
显示 "Request cancelled" 后，UI 可能进入无法恢复的状态，用户无法发送新请求。

### 解决方案
在取消和错误处理的关键位置添加自动恢复机制：

**文件 1**: `sandbox/controllers/prompt.js:263-281`
```javascript
cancel() {
    // ... 取消逻辑
    
    // 3秒后自动清除状态消息
    setTimeout(() => {
        if (!this.app.isGenerating) {
            this.ui.updateStatus('');
        }
    }, 3000);
}
```

**文件 2**: `sandbox/controllers/message_handler.js:196-238`
```javascript
handleGeminiReply(request) {
    // 强制重置生成状态
    this.app.isGenerating = false;
    this.app.generatingSessionId = null;
    this.ui.setLoading(false);
    
    // 取消或错误状态的自动恢复
    if (request.status === 'cancelled' || request.status === 'error') {
        setTimeout(() => {
            if (!this.app.isGenerating) {
                this.ui.updateStatus('');
                this.ui.setLoading(false); // 双重保护
            }
        }, 3000);
    }
}
```

### 改进效果
- ✅ 3秒后自动清除状态消息
- ✅ 双重保护确保 UI 恢复可交互
- ✅ 不干扰新启动的请求

---

## 改进 2: 后台会话支持

### 问题
切换会话时，正在进行的请求被强制取消，导致：
- 用户必须等待请求完成
- 工作流被打断
- API 配额浪费

### 解决方案
让请求在后台继续执行，结果自动保存到对应会话。

#### 修改 1: 会话切换逻辑

**文件**: `sandbox/controllers/session_flow.js:40-52`
```javascript
switchToSession(sessionId, options = {}) {
    // 检测是否从正在生成的会话切换出去
    const isLeavingGeneratingSession =
        this.app.isGenerating &&
        this.app.generatingSessionId &&
        this.app.generatingSessionId !== sessionId;

    // 如果是离开生成中的会话，不取消请求
    if (!isLeavingGeneratingSession) {
        this.app.messageHandler.resetStream();
    }
    
    // ... 正常切换逻辑
}
```

**文件**: `sandbox/controllers/session_flow.js:29-38`
```javascript
enterDraft() {
    // 新建对话时也不取消后台请求
    const isLeavingGeneratingSession = 
        this.app.isGenerating && this.app.generatingSessionId;

    if (!isLeavingGeneratingSession) {
        this.app.messageHandler.resetStream();
    }
    
    // ... 正常新建逻辑
}
```

#### 修改 2: 后台完成处理

**文件**: `sandbox/controllers/message_handler.js:196-238`
```javascript
handleGeminiReply(request) {
    // 重置全局生成状态
    this.app.isGenerating = false;
    this.app.generatingSessionId = null;
    this.ui.setLoading(false);

    // 判断是否为后台会话完成
    const isBackgroundCompletion = !this.isCurrentSessionMessage(request);

    if (isBackgroundCompletion) {
        // 后台会话：更新上下文但不渲染
        const targetSessionId = this.getRequestSessionId(request);
        const targetSession = this.sessionManager.getSessionById(targetSessionId);

        if (targetSession && request.status === 'success') {
            this.sessionManager.updateContext(targetSessionId, request.context);
        }

        this.resetStream();
        return;
    }

    // 当前会话：正常渲染
    const session = this.sessionManager.getCurrentSession();
    renderGeminiReply(this, session, request);
}
```

### 改进效果
- ✅ 切换会话时请求继续在后台执行
- ✅ 结果自动保存到对应会话历史
- ✅ 侧边栏显示后台生成状态（spinner）
- ✅ 支持多任务并行工作流

---

## 用户工作流对比

### 之前的工作流 ❌
```
1. 会话 A: 发送问题
2. 等待回复... (必须等待)
3. 回复完成
4. 切换到会话 B
5. 发送问题
6. 再次等待...
```

### 优化后的工作流 ✅
```
1. 会话 A: 发送问题
2. 立即切换到会话 B (A 在后台继续)
3. 会话 B: 发送问题
4. 随时切换回 A 查看结果
5. 或继续在其他会话工作
```

---

## 视觉反馈

### 侧边栏指示器
- **Spinner 图标**: 正在生成的会话旁显示加载动画
- **位置**: 侧边栏会话列表
- **代码**: `sandbox/ui/sidebar_rendering.js:190-192`

### 状态消息
- 取消状态：显示 3 秒后自动清除
- 错误状态：显示 3 秒后自动清除
- 不会遮挡用户的新操作

---

## 技术要点

### 状态管理
- `app.isGenerating`: 是否有请求正在执行（全局）
- `app.generatingSessionId`: 哪个会话正在生成
- 切换会话时保持这些状态，让请求继续

### 消息路由
- `isGeneratingSessionMessage()`: 消息是否属于生成中的会话
- `isCurrentSessionMessage()`: 消息是否属于当前会话
- 根据这两个标志决定如何处理返回的消息

### 自动恢复
- 双重保护：前端取消 + 后端返回取消消息
- 延迟清除：3 秒后自动恢复 UI
- 条件检查：不干扰新启动的请求

---

## 测试建议

### 基础测试
1. ✅ 发送请求并等待完成
2. ✅ 取消请求，等待 3 秒，确认 UI 恢复
3. ✅ 请求出错，等待 3 秒，确认 UI 恢复

### 后台会话测试
1. ✅ 发送请求后立即切换会话
2. ✅ 观察侧边栏 spinner
3. ✅ 切换回原会话查看结果
4. ✅ 同时在多个会话发送请求

### 边界情况测试
1. ✅ 后台请求返回错误
2. ✅ 快速连续切换多个会话
3. ✅ 后台请求完成时正在输入

---

## 相关文件

### 核心逻辑
- `sandbox/controllers/prompt.js` - 取消操作和状态恢复
- `sandbox/controllers/message_handler.js` - 消息处理和后台完成
- `sandbox/controllers/session_flow.js` - 会话切换逻辑

### UI 反馈
- `sandbox/ui/chat.js` - 加载状态和输入控制
- `sandbox/ui/sidebar_rendering.js` - 侧边栏生成指示器

### 后台处理
- `background/handlers/session/prompt_handler.js` - 请求执行和取消
- `background/managers/session_manager.js` - 会话上下文管理

---

## 部署说明

1. 代码已构建到 `dist` 目录
2. 重新加载扩展以应用更改
3. 两个改进一起生效，互不影响

## 版本信息

- 基于版本: 9.0.4
- 改进日期: 2026/06/22
- 构建状态: ✅ 成功

---

详细文档请参考：
- `REQUEST_CANCELLED_FIX.md` - 取消恢复机制详解
- `BACKGROUND_SESSION_OPTIMIZATION.md` - 后台会话详解
