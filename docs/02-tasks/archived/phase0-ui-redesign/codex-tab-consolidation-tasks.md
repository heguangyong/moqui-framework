# Tab页面整理 - Codex立即执行任务清单

## 🚀 立即执行优先级 (本周内完成)

基于会展搭建项目管理系统转型目标，按照影响程度和技术复杂度排序：

### 🔴 **优先级P0: 立即执行 (1-2天)**

#### **Task P0-1: 主导航简化配置**
**目标**: 将6个Tab精简为4个核心Tab + 1个管理Tab
**文件**: `/Users/demo/Workspace/moqui/runtime/component/moqui-marketplace/screen/marketplace.xml`

**具体修改**:
```xml
<!-- 替换现有subscreens配置 -->
<subscreens default-item="Dashboard">
    <!-- 核心功能区 (4个主要Tab) -->
    <subscreens-item name="Dashboard" menu-title="项目总览" menu-index="1"
                     location="component://moqui-marketplace/screen/marketplace/Dashboard.xml"/>
    <subscreens-item name="Chat" menu-title="AI项目助手" menu-index="2"
                     location="component://moqui-marketplace/screen/marketplace/Chat.xml"/>
    <subscreens-item name="Matching" menu-title="智能匹配" menu-index="3"
                     location="component://moqui-marketplace/screen/marketplace/Matching.xml"/>
    <subscreens-item name="InfoManagement" menu-title="信息管理" menu-index="4"
                     location="component://moqui-marketplace/screen/marketplace/InfoManagement.xml"/>

    <!-- 管理功能区 (开发模式可见) -->
    <subscreens-item name="SystemAdmin" menu-title="系统管理" menu-index="5"
                     menu-include="false"
                     location="component://moqui-marketplace/screen/marketplace/SystemAdmin.xml"/>
</subscreens>
```

**隐藏原有页面**:
- Supply → 保留文件但从导航移除
- Demand → 保留文件但从导航移除
- TelegramAdmin → 合并到SystemAdmin
- TestDataInit → 合并到SystemAdmin

---

### 🟡 **优先级P1: 核心合并 (2-3天)**

#### **Task P1-1: 创建信息管理合并页面**
**目标**: 将Supply + Demand合并为统一的信息管理界面
**新文件**: `/Users/demo/Workspace/moqui/runtime/component/moqui-marketplace/screen/marketplace/InfoManagement.xml`

**完整实现**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<screen xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/xml-screen-3.xsd"
        default-menu-title="信息管理">

    <parameter name="activeTab" default="supply"/>

    <actions>
        <script><![CDATA[
            // 获取统计数据
            supplyCount = ec.entity.find("marketplace.listing.Listing")
                .condition("type", "SUPPLY")
                .disableAuthz().count()

            demandCount = ec.entity.find("marketplace.listing.Listing")
                .condition("type", "DEMAND")
                .disableAuthz().count()

            projectCount = ec.entity.find("mantle.work.effort.WorkEffort")
                .condition("workEffortTypeId", "PROJECT")
                .disableAuthz().count()
        ]]></script>
    </actions>

    <widgets>
        <!-- 统计概览 -->
        <container style="q-card q-ma-md">
            <container style="q-card__section">
                <label text="信息统计" style="text-h5"/>
                <container style="row q-gutter-md q-mt-sm">
                    <container style="col">
                        <label text="供应信息: ${supplyCount ?: 0}" style="text-subtitle1"/>
                    </container>
                    <container style="col">
                        <label text="需求信息: ${demandCount ?: 0}" style="text-subtitle1"/>
                    </container>
                    <container style="col">
                        <label text="项目信息: ${projectCount ?: 0}" style="text-subtitle1"/>
                    </container>
                </container>
            </container>
        </container>

        <!-- Tab导航 -->
        <container style="q-tabs q-px-md">
            <container style="q-tab" data-tab="supply">
                <label text="供应信息"/>
            </container>
            <container style="q-tab" data-tab="demand">
                <label text="需求信息"/>
            </container>
            <container style="q-tab" data-tab="project">
                <label text="项目信息"/>
            </container>
        </container>

        <!-- Tab内容区 -->
        <container style="q-tab-panels q-px-md">
            <!-- 供应信息面板 -->
            <container style="q-tab-panel" data-panel="supply">
                <container style="q-card">
                    <container style="q-card__section">
                        <label text="供应信息管理" style="text-h6"/>
                        <!-- 集成原Supply.xml的核心功能 -->
                        <section-include location="component://moqui-marketplace/screen/marketplace/Supply.xml#SupplyListSection"/>
                    </container>
                </container>
            </container>

            <!-- 需求信息面板 -->
            <container style="q-tab-panel" data-panel="demand">
                <container style="q-card">
                    <container style="q-card__section">
                        <label text="需求信息管理" style="text-h6"/>
                        <!-- 集成原Demand.xml的核心功能 -->
                        <section-include location="component://moqui-marketplace/screen/marketplace/Demand.xml#DemandListSection"/>
                    </container>
                </container>
            </container>

            <!-- 项目信息面板 -->
            <container style="q-tab-panel" data-panel="project">
                <container style="q-card">
                    <container style="q-card__section">
                        <label text="项目信息管理" style="text-h6"/>

                        <!-- 项目列表 -->
                        <section-iterate name="ProjectList" list="projectList" entry="project">
                            <actions>
                                <entity-find entity-name="mantle.work.effort.WorkEffort" list="projectList">
                                    <econdition field-name="workEffortTypeId" value="PROJECT"/>
                                    <order-by field-name="-lastUpdatedStamp"/>
                                    <limit>20</limit>
                                </entity-find>
                            </actions>
                            <widgets>
                                <container style="q-item q-item--clickable">
                                    <container style="q-item__section">
                                        <label text="${project.workEffortName}" style="text-subtitle1"/>
                                        <label text="类型: ${project.description}" style="text-caption"/>
                                        <label text="状态: ${project.statusId}" style="text-caption"/>
                                    </container>
                                </container>
                            </widgets>
                        </section-iterate>
                    </container>
                </container>
            </container>
        </container>
    </widgets>
</screen>
```

#### **Task P1-2: 创建系统管理合并页面**
**目标**: 将TelegramAdmin + TestDataInit合并
**新文件**: `/Users/demo/Workspace/moqui/runtime/component/moqui-marketplace/screen/marketplace/SystemAdmin.xml`

**简化实现**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<screen xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/xml-screen-3.xsd"
        default-menu-title="系统管理"
        require-authentication="true">

    <widgets>
        <container style="q-page q-pa-md">
            <!-- Telegram管理区域 -->
            <container style="q-card q-mb-md">
                <container style="q-card__section">
                    <label text="Telegram机器人管理" style="text-h6"/>
                    <!-- 集成TelegramAdmin核心功能 -->
                    <section-include location="component://moqui-marketplace/screen/marketplace/TelegramAdmin.xml#TelegramConfigSection"/>
                </container>
            </container>

            <!-- 数据管理区域 -->
            <container style="q-card">
                <container style="q-card__section">
                    <label text="测试数据管理" style="text-h6"/>
                    <!-- 集成TestDataInit核心功能 -->
                    <section-include location="component://moqui-marketplace/screen/marketplace/TestDataInit.xml#DataManagementSection"/>
                </container>
            </container>
        </container>
    </widgets>
</screen>
```

---

### 🟢 **优先级P2: 功能升级 (3-4天)**

#### **Task P2-1: Dashboard项目总览升级**
**目标**: 从传统统计升级为项目管理仪表板
**文件**: 修改现有`Dashboard.xml`

**关键升级点**:
1. **新增项目统计卡片**
2. **项目进度看板**
3. **HiveMind集成状态**
4. **会展/装修项目分类统计**

#### **Task P2-2: Chat AI项目助手升级**
**目标**: 专业化项目助手功能
**文件**: 修改现有`Chat.xml`

**关键升级点**:
1. **项目化提示词优化**
2. **多模态输入集成** (语音+图像)
3. **项目自动创建功能**
4. **会展搭建专业知识库**

#### **Task P2-3: Matching智能匹配升级**
**目标**: 项目导向的智能匹配
**文件**: 修改现有`Matching.xml`

**关键升级点**:
1. **项目检测集成**
2. **HiveMind项目创建联动**
3. **供应商能力匹配算法**
4. **项目模板匹配**

---

## 🔧 技术实施要点

### **文件操作安全**
1. **备份原文件**: 修改前备份Supply.xml, Demand.xml等
2. **渐进式替换**: 先创建新文件，再修改导航配置
3. **功能验证**: 每个Tab完成后立即验证

### **兼容性保证**
1. **保留原有API**: 确保现有服务调用不中断
2. **数据完整性**: 统计数据和列表查询保持一致
3. **权限继承**: 保持原有的访问控制设置

### **测试验证**
1. **Chrome MCP验证**: 每个Tab修改后运行验证
2. **导航测试**: 确保Tab切换正常工作
3. **数据显示**: 验证统计数据和列表正确显示

---

## 📊 执行时间线

### **Week 1: 基础整理 (立即开始)**
- **Day 1**: P0-1 主导航简化 (2小时)
- **Day 2**: P1-1 信息管理合并页面 (6小时)
- **Day 3**: P1-2 系统管理合并页面 (4小时)
- **Day 4-5**: 基础功能验证和调试

### **Week 2: 功能升级**
- **Day 1-2**: P2-1 Dashboard升级
- **Day 3-4**: P2-2 Chat升级
- **Day 5**: P2-3 Matching升级

### **验收里程碑**
- **Week 1结束**: 4个主要Tab可正常访问，基础功能完整
- **Week 2结束**: 项目管理功能完整，端到端流程可用

---

## 🎯 成功标准

### **用户体验标准**
- ✅ Tab数量从6个减少到4个核心Tab
- ✅ 导航逻辑清晰，符合项目管理直觉
- ✅ 页面加载无错误，Chrome MCP验证通过

### **功能完整性标准**
- ✅ 原有供需管理功能完全保留
- ✅ 新增项目管理功能可用
- ✅ AI助手和智能匹配功能正常

### **技术质量标准**
- ✅ 无JavaScript错误和Vue警告
- ✅ API调用响应正常
- ✅ 数据显示准确完整

---

**立即开始执行**: Task P0-1 主导航简化配置
**预期完成时间**: 2周
**技术支持**: 我将持续监控进度并提供技术指导

*执行指导版本: v1.0*
*创建时间: 2025-11-03*
*状态: 等待Codex执行*