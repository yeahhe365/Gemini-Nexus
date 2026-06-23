# Tab切换侧边栏修复说明

## 问题描述

当用户在一个tab页打开Gemini Nexus侧边栏并进行对话时，切换到其他tab页再切换回来会出现以下问题：

1. 侧边栏界面无法显示
2. 正在进行的对话会中断
3. 对话状态丢失

## 根本原因

Chrome扩展的side panel在tab切换时会触发`pagehide`事件，原有代码会立即发送`SIDE_PANEL_CLOSED`消息，导致：

- 侧边栏被标记为已关闭
- 没有处理页面可见性变化（`visibilitychange`）
- tab切换回来时iframe状态没有恢复

## 修复方案

### 1. 新增 VisibilityManager (`sidepanel/core/visibility_manager.js`)

创建了一个专门的可见性管理器来处理页面可见性变化：

**核心功能：**
- 监听`visibilitychange`事件，区分tab切换和真正的页面关闭
- 监听`pagehide`事件，通过`event.persisted`判断是否进入bfcache（tab切换）
- 监听`pageshow`事件，处理从bfcache恢复的情况
- 只在页面真正关闭时才发送`SIDE_PANEL_CLOSED`消息

**关键逻辑：**
```javascript
window.addEventListener('pagehide', (event) => {
    // persisted=true 表示进入bfcache（tab切换）
    // persisted=false 表示页面真正关闭
    if (!event.persisted) {
        this.handlePageClose();
    }
});
```

### 2. 修改 sidepanel/index.js

将原来直接监听`pagehide`的逻辑替换为使用VisibilityManager：

```javascript
const visibilityManager = new VisibilityManager(frameManager, stateManager);
visibilityManager.init();
```

### 3. 增强 FrameManager (`sidepanel/core/frame.js`)

添加`ensureVisible()`方法，确保iframe在tab切换回来后正确显示：

```javascript
ensureVisible() {
    if (this.iframe) {
        this.iframe.style.display = '';
        this.iframe.style.visibility = 'visible';
    }
}
```

### 4. Sandbox可见性通知 (`sandbox/boot/messaging.js`)

在消息桥接中添加对`VISIBILITY_CHANGED`事件的处理：

```javascript
if (action === 'VISIBILITY_CHANGED') {
    if (typeof this.app.handleVisibilityChange === 'function') {
        this.app.handleVisibilityChange(payload);
    }
    return;
}
```

### 5. AppController支持 (`sandbox/controllers/app_controller.js`)

在AppController中添加可见性状态追踪和处理：

```javascript
this.isVisible = true;

handleVisibilityChange(payload) {
    const visible = payload?.visible === true;
    this.isVisible = visible;
    
    if (visible) {
        console.log('[Gemini Nexus] Sandbox became visible, resuming');
    } else {
        console.log('[Gemini Nexus] Sandbox became hidden (tab switched away)');
    }
}
```

## 技术细节

### bfcache (Back/Forward Cache)

Chrome的bfcache机制会在tab切换时将页面放入缓存，而不是完全卸载。通过检查`pagehide`事件的`persisted`属性可以区分：

- `persisted: true` → 页面进入bfcache（tab切换）
- `persisted: false` → 页面真正卸载（关闭tab）

### 流式对话保护

由于fetch的stream在页面hidden时会继续运行，所以：

1. tab切换时不中断正在进行的对话
2. 对话状态保持在内存中
3. 切换回来时UI自动恢复并显示最新内容

### 状态恢复流程

1. 用户切换到其他tab
   - `visibilitychange` → `document.hidden = true`
   - VisibilityManager通知sandbox隐藏
   - 对话继续在后台运行

2. 用户切换回原tab
   - `pageshow` (如果从bfcache恢复)
   - `visibilitychange` → `document.hidden = false`
   - VisibilityManager调用`frame.ensureVisible()`
   - 通知sandbox恢复可见状态
   - UI重新显示，对话内容完整保留

## 测试建议

1. **基本场景**：在侧边栏开始对话 → 切换到其他tab → 切换回来 → 验证界面显示和对话继续

2. **流式对话**：启动一个较长的AI回复 → 在回复过程中切换tab → 切换回来 → 验证流式输出继续

3. **多次切换**：重复切换多次 → 验证每次都能正常恢复

4. **真正关闭**：关闭tab → 验证`SIDE_PANEL_CLOSED`消息正确发送

## 兼容性

- ✅ Chrome/Edge (Chromium) - 完全支持bfcache
- ✅ Vivaldi - 测试通过
- ⚠️ 其他Chromium浏览器 - 理论支持，需测试

## 文件修改清单

新增文件：
- `sidepanel/core/visibility_manager.js`

修改文件：
- `sidepanel/index.js`
- `sidepanel/core/frame.js`
- `sandbox/boot/messaging.js`
- `sandbox/controllers/app_controller.js`

## 后续优化建议

1. 可以考虑在tab不可见时降低UI更新频率以节省资源
2. 添加可见性状态的telemetry监控
3. 考虑在长时间hidden后自动暂停某些后台任务
