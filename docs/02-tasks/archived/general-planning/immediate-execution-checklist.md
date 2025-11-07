# Tab页面整理 - 最终执行清单

## 📋 基于最新规划的立即执行任务

根据Codex更新的规划，现在提供具体的、可立即执行的任务清单：

---

## 🚀 **立即开始: Task T2 - 信息管理页面**

### **目标**: 创建统一的信息管理界面，整合Supply + Demand + Project
### **新文件**: `marketplace/InfoManagement.xml`
### **执行时间**: 立即开始，1天完成

#### **完整实现代码**:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<screen xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/xml-screen-3.xsd"
        default-menu-title="信息管理">

    <parameter name="activeTab" default="supply"/>
    <parameter name="listingType" default="SUPPLY"/>

    <actions>
        <script><![CDATA[
            // 统计数据获取
            supplyCount = ec.entity.find("marketplace.listing.Listing")
                .condition("type", "SUPPLY")
                .condition("status", "ACTIVE")
                .disableAuthz().count()

            demandCount = ec.entity.find("marketplace.listing.Listing")
                .condition("type", "DEMAND")
                .condition("status", "ACTIVE")
                .disableAuthz().count()

            projectCount = ec.entity.find("mantle.work.effort.WorkEffort")
                .condition("workEffortTypeId", "PROJECT")
                .disableAuthz().count()

            // 根据activeTab设置列表数据
            if (activeTab == "supply") {
                listingType = "SUPPLY"
            } else if (activeTab == "demand") {
                listingType = "DEMAND"
            }

            // 获取列表数据
            if (activeTab != "project") {
                ec.service.sync().name("marketplace.MarketplaceServices.search#Listings")
                    .parameters([type: listingType, maxResults: 20])
                    .call()
            }
        ]]></script>
    </actions>

    <widgets>
        <container style="q-page q-pa-md">
            <!-- 统计概览卡片 -->
            <container style="q-card q-mb-md">
                <container style="q-card__section">
                    <label text="信息统计概览" style="text-h5 q-mb-md"/>
                    <container style="row q-gutter-md">
                        <container style="col">
                            <container style="q-card q-pa-md text-center"
                                      style="background: linear-gradient(45deg, #1976d2, #42a5f5);">
                                <label text="${supplyCount ?: 0}" style="text-h4 text-white"/>
                                <label text="供应信息" style="text-subtitle1 text-white"/>
                            </container>
                        </container>
                        <container style="col">
                            <container style="q-card q-pa-md text-center"
                                      style="background: linear-gradient(45deg, #4caf50, #66bb6a);">
                                <label text="${demandCount ?: 0}" style="text-h4 text-white"/>
                                <label text="需求信息" style="text-subtitle1 text-white"/>
                            </container>
                        </container>
                        <container style="col">
                            <container style="q-card q-pa-md text-center"
                                      style="background: linear-gradient(45deg, #ff9800, #ffb74d);">
                                <label text="${projectCount ?: 0}" style="text-h4 text-white"/>
                                <label text="项目信息" style="text-subtitle1 text-white"/>
                            </container>
                        </container>
                    </container>
                </container>
            </container>

            <!-- Tab导航 -->
            <container style="q-tabs q-pa-none q-mb-md">
                <link url="InfoManagement" parameter-map="[activeTab:'supply']"
                      style="q-tab" text="供应信息"
                      condition="${activeTab == 'supply' ? 'q-tab--active' : ''}"/>
                <link url="InfoManagement" parameter-map="[activeTab:'demand']"
                      style="q-tab" text="需求信息"
                      condition="${activeTab == 'demand' ? 'q-tab--active' : ''}"/>
                <link url="InfoManagement" parameter-map="[activeTab:'project']"
                      style="q-tab" text="项目信息"
                      condition="${activeTab == 'project' ? 'q-tab--active' : ''}"/>
            </container>

            <!-- Tab内容面板 -->
            <container style="q-tab-panels">
                <!-- 供应信息面板 -->
                <container condition="${activeTab == 'supply'}" style="q-tab-panel">
                    <container style="q-card">
                        <container style="q-card__section">
                            <container style="row justify-between items-center q-mb-md">
                                <label text="供应信息管理" style="text-h6"/>
                                <link url="../Supply/CreateSupply" text="新增供应"
                                      style="q-btn q-btn--unelevated"
                                      parameter-map="[type:'SUPPLY']"/>
                            </container>

                            <!-- 供应信息列表 -->
                            <section-iterate name="SupplyList" list="listingList" entry="listing">
                                <actions>
                                    <entity-find entity-name="marketplace.listing.Listing" list="listingList">
                                        <econdition field-name="type" value="SUPPLY"/>
                                        <econdition field-name="status" value="ACTIVE"/>
                                        <order-by field-name="-lastUpdatedStamp"/>
                                        <limit>20</limit>
                                    </entity-find>
                                </actions>
                                <widgets>
                                    <container style="q-item q-item--clickable q-py-sm">
                                        <container style="q-item__section">
                                            <label text="${listing.title}" style="text-subtitle1 text-weight-medium"/>
                                            <label text="${listing.description}" style="text-caption text-grey-7"/>
                                            <container style="row q-gutter-xs q-mt-xs">
                                                <label text="价格: ¥${listing.price ?: '面议'}"
                                                       style="text-caption q-chip q-chip--dense"/>
                                                <label text="数量: ${listing.quantity ?: 1}"
                                                       style="text-caption q-chip q-chip--dense"/>
                                                <label text="${listing.category ?: '未分类'}"
                                                       style="text-caption q-chip q-chip--dense q-chip--outline"/>
                                            </container>
                                        </container>
                                        <container style="q-item__section side">
                                            <container style="q-btn-group q-btn-group--flat">
                                                <link url="../Supply/EditSupply" text="编辑"
                                                      parameter-map="[listingId:listing.listingId]"
                                                      style="q-btn q-btn--flat q-btn--dense"/>
                                                <link url="../Matching" text="匹配"
                                                      parameter-map="[listingId:listing.listingId]"
                                                      style="q-btn q-btn--flat q-btn--dense"/>
                                            </container>
                                        </container>
                                    </container>
                                </widgets>
                            </section-iterate>
                        </container>
                    </container>
                </container>

                <!-- 需求信息面板 -->
                <container condition="${activeTab == 'demand'}" style="q-tab-panel">
                    <container style="q-card">
                        <container style="q-card__section">
                            <container style="row justify-between items-center q-mb-md">
                                <label text="需求信息管理" style="text-h6"/>
                                <link url="../Demand/CreateDemand" text="新增需求"
                                      style="q-btn q-btn--unelevated"
                                      parameter-map="[type:'DEMAND']"/>
                            </container>

                            <!-- 需求信息列表 -->
                            <section-iterate name="DemandList" list="demandListingList" entry="listing">
                                <actions>
                                    <entity-find entity-name="marketplace.listing.Listing" list="demandListingList">
                                        <econdition field-name="type" value="DEMAND"/>
                                        <econdition field-name="status" value="ACTIVE"/>
                                        <order-by field-name="-lastUpdatedStamp"/>
                                        <limit>20</limit>
                                    </entity-find>
                                </actions>
                                <widgets>
                                    <container style="q-item q-item--clickable q-py-sm">
                                        <container style="q-item__section">
                                            <label text="${listing.title}" style="text-subtitle1 text-weight-medium"/>
                                            <label text="${listing.description}" style="text-caption text-grey-7"/>
                                            <container style="row q-gutter-xs q-mt-xs">
                                                <label text="预算: ¥${listing.budgetMax ?: '面议'}"
                                                       style="text-caption q-chip q-chip--dense"/>
                                                <label text="需要: ${listing.quantity ?: 1}"
                                                       style="text-caption q-chip q-chip--dense"/>
                                                <label text="${listing.category ?: '未分类'}"
                                                       style="text-caption q-chip q-chip--dense q-chip--outline"/>
                                            </container>
                                        </container>
                                        <container style="q-item__section side">
                                            <container style="q-btn-group q-btn-group--flat">
                                                <link url="../Demand/EditDemand" text="编辑"
                                                      parameter-map="[listingId:listing.listingId]"
                                                      style="q-btn q-btn--flat q-btn--dense"/>
                                                <link url="../Matching" text="匹配"
                                                      parameter-map="[listingId:listing.listingId]"
                                                      style="q-btn q-btn--flat q-btn--dense"/>
                                            </container>
                                        </container>
                                    </container>
                                </widgets>
                            </section-iterate>
                        </container>
                    </container>
                </container>

                <!-- 项目信息面板 -->
                <container condition="${activeTab == 'project'}" style="q-tab-panel">
                    <container style="q-card">
                        <container style="q-card__section">
                            <container style="row justify-between items-center q-mb-md">
                                <label text="项目信息管理" style="text-h6"/>
                                <container style="q-btn q-btn--unelevated" text="新建项目"/>
                            </container>

                            <!-- 项目信息列表 -->
                            <section-iterate name="ProjectList" list="projectList" entry="project">
                                <actions>
                                    <entity-find entity-name="mantle.work.effort.WorkEffort" list="projectList">
                                        <econdition field-name="workEffortTypeId" value="PROJECT"/>
                                        <order-by field-name="-lastUpdatedStamp"/>
                                        <limit>20</limit>
                                    </entity-find>
                                </actions>
                                <widgets>
                                    <container style="q-item q-item--clickable q-py-sm">
                                        <container style="q-item__section avatar">
                                            <container style="q-avatar q-avatar--font-size text-white"
                                                      style="background: ${project.statusId == 'WIP_PROJECT_ACTIVE' ? '#4caf50' : '#ff9800'};">
                                                <label text="${project.workEffortName?.substring(0,1) ?: 'P'}"/>
                                            </container>
                                        </container>
                                        <container style="q-item__section">
                                            <label text="${project.workEffortName}" style="text-subtitle1 text-weight-medium"/>
                                            <label text="${project.description}" style="text-caption text-grey-7"/>
                                            <container style="row q-gutter-xs q-mt-xs">
                                                <label text="状态: ${project.statusId}"
                                                       style="text-caption q-chip q-chip--dense"/>
                                                <label text="预算: ¥${project.estimatedWorkCost ?: '未设定'}"
                                                       style="text-caption q-chip q-chip--dense"/>
                                            </container>
                                        </container>
                                        <container style="q-item__section side">
                                            <container style="q-btn-group q-btn-group--flat">
                                                <container style="q-btn q-btn--flat q-btn--dense" text="详情"/>
                                                <container style="q-btn q-btn--flat q-btn--dense" text="任务"/>
                                            </container>
                                        </container>
                                    </container>
                                </widgets>
                            </section-iterate>
                        </container>
                    </container>
                </container>
            </container>
        </container>
    </widgets>
</screen>
```

---

## 🔧 **紧接着执行: 更新主导航配置**

### **文件**: `marketplace.xml`
### **执行时间**: InfoManagement.xml创建完成后立即执行

#### **修改subscreens配置**:

```xml
<!-- 替换现有的subscreens节点 -->
<subscreens default-item="Dashboard">
    <!-- 核心功能区 -->
    <subscreens-item name="Dashboard" menu-title="项目总览" menu-index="1"
                     location="component://moqui-marketplace/screen/marketplace/Dashboard.xml"/>
    <subscreens-item name="InfoManagement" menu-title="信息管理" menu-index="2"
                     location="component://moqui-marketplace/screen/marketplace/InfoManagement.xml"/>
    <subscreens-item name="Matching" menu-title="智能匹配" menu-index="3"
                     location="component://moqui-marketplace/screen/marketplace/Matching.xml"/>
    <subscreens-item name="Chat" menu-title="AI项目助手" menu-index="4"
                     location="component://moqui-marketplace/screen/marketplace/Chat.xml"/>

    <!-- 保留原有功能但隐藏 -->
    <subscreens-item name="Supply" menu-include="false"
                     location="component://moqui-marketplace/screen/marketplace/Supply.xml"/>
    <subscreens-item name="Demand" menu-include="false"
                     location="component://moqui-marketplace/screen/marketplace/Demand.xml"/>

    <!-- 管理功能区 (开发模式) -->
    <subscreens-item name="TelegramAdmin" menu-title="Telegram管理" menu-index="5"
                     menu-include="false"
                     location="component://moqui-marketplace/screen/marketplace/TelegramAdmin.xml"/>
    <subscreens-item name="TestDataInit" menu-title="数据管理" menu-index="6"
                     menu-include="false"
                     location="component://moqui-marketplace/screen/marketplace/TestDataInit.xml"/>
</subscreens>
```

---

## 📊 **验证步骤**

### **完成InfoManagement.xml后立即验证**:

1. **Chrome MCP验证**:
```bash
testing-tools/chrome_mcp_auth_proxy_v2.sh
# 检查页面是否正常渲染，Tab切换是否工作
```

2. **功能验证**:
```bash
# 检查统计数据
curl -s -b /tmp/test_session.txt "http://localhost:8080/qapps/marketplace/InfoManagement?activeTab=supply"

# 检查Tab切换
curl -s -b /tmp/test_session.txt "http://localhost:8080/qapps/marketplace/InfoManagement?activeTab=demand"
```

3. **导航验证**:
```bash
# 检查导航是否从6个Tab减少到4个核心Tab
curl -s -b /tmp/test_session.txt "http://localhost:8080/qapps/marketplace" | grep -o "menu-title.*" | wc -l
```

---

## 🎯 **立即行动**

1. **现在就开始**: 创建`InfoManagement.xml`文件
2. **预期时间**: 2-4小时完成基础版本
3. **验证标准**: Tab切换正常，数据显示正确，无JavaScript错误

完成后立即通知我进行核验，我将验证效果并指导下一步Task T3(智能匹配升级)的执行。

---

*立即执行清单版本: v1.0*
*创建时间: 2025-11-03 22:30*
*状态: 等待Codex立即开始*