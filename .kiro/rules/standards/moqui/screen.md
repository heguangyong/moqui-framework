# Moqui 屏幕定义规范

> **用途**: Moqui屏幕定义的统一技术规范  
> **适用**: 所有Moqui Screen定义和实现

## 🎯 核心规则

### 规则1: 使用`require-authentication`属性控制认证
**Screen使用`require-authentication`属性，不要使用`authenticate`**

### 规则2: 提供menuData transition
**主屏幕必须提供menuData transition用于前端菜单渲染**

### 规则3: 双重菜单配置
**应用必须同时配置apps.xml和qapps.xml**

### 规则4: 使用Quasar样式类
**使用Quasar的样式类（q-pa-md等）而不是自定义CSS**

## 📝 基本Screen结构

### 标准Screen模板

```xml
<screen default-menu-title="页面标题" default-menu-index="1"
        require-authentication="false">
    
    <!-- Transition定义 -->
    <transition name="getData">
        <service-call name="your.service.get#Data"/>
        <default-response type="screen-last"/>
    </transition>
    
    <transition name="createData">
        <service-call name="your.service.create#Data"/>
        <default-response url="."/>
    </transition>
    
    <!-- Actions：数据准备 -->
    <actions>
        <service-call name="your.service.get#DataList" out-map="context"/>
    </actions>
    
    <!-- Widgets：UI渲染 -->
    <widgets>
        <container style="q-pa-md">
            <label text="页面内容" type="h5"/>
            <!-- 更多组件 -->
        </container>
    </widgets>
</screen>
```

## 📝 主屏幕定义

### 应用主屏幕

```xml
<!-- runtime/component/your-app/screen/yourapp.xml -->
<screen default-menu-title="应用名称" default-menu-index="1"
        include-child-content="false" require-authentication="false"
        menu-image="fa fa-icon" menu-image-type="icon">

    <!-- 子屏幕定义 -->
    <subscreens default-item="Dashboard">
        <subscreens-item name="Dashboard" menu-title="控制台"
                         menu-image="fa fa-tachometer-alt"
                         location="component://your-app/screen/yourapp/Dashboard.xml"/>
        
        <subscreens-item name="Management" menu-title="管理"
                         menu-image="fa fa-cog"
                         location="component://your-app/screen/yourapp/Management.xml"/>
    </subscreens>

    <!-- menuData transition（必须） -->
    <transition name="menuData" read-only="true" begin-transaction="false">
        <actions><script><![CDATA[
            List menuDataList = []
            
            menuDataList.add([
                title: "控制台",
                url: "/qapps/yourapp/Dashboard",
                image: "fa fa-tachometer-alt",
                imageType: "icon"
            ])
            
            menuDataList.add([
                title: "管理",
                url: "/qapps/yourapp/Management",
                image: "fa fa-cog",
                imageType: "icon"
            ])
            
            ec.web.sendJsonResponse(menuDataList)
        ]]></script></actions>
        <default-response type="none" save-parameters="true"/>
    </transition>

    <widgets>
        <subscreens-active/>
    </widgets>
</screen>
```

### 双重菜单配置

#### apps.xml配置
```xml
<!-- runtime/component/webroot/screen/webroot/apps.xml -->
<subscreens default-item="marketplace">
    <subscreens-item name="yourapp" menu-title="应用名称"
                     menu-image="fa fa-icon"
                     location="component://your-app/screen/yourapp.xml"/>
</subscreens>
```

#### qapps.xml配置
```xml
<!-- runtime/component/webroot/screen/webroot/qapps.xml -->
<subscreens default-item="AppList">
    <subscreens-item name="yourapp" menu-title="应用名称"
                     location="component://your-app/screen/yourapp.xml"/>
</subscreens>
```

## 📝 子屏幕定义

### 列表页面

```xml
<!-- runtime/component/your-app/screen/yourapp/EntityList.xml -->
<screen default-menu-title="实体列表" require-authentication="false">
    
    <!-- Transition定义 -->
    <transition name="getEntityList">
        <service-call name="your.service.get#EntityList"/>
        <default-response type="screen-last"/>
    </transition>
    
    <transition name="createEntity">
        <service-call name="your.service.create#Entity"/>
        <default-response url="."/>
    </transition>
    
    <transition name="updateEntity">
        <service-call name="your.service.update#Entity"/>
        <default-response url="."/>
    </transition>
    
    <transition name="deleteEntity">
        <service-call name="your.service.delete#Entity"/>
        <default-response url="."/>
    </transition>
    
    <!-- Actions：数据准备 -->
    <actions>
        <set field="pageIndex" from="pageIndex ?: 0"/>
        <set field="pageSize" from="pageSize ?: 20"/>
        
        <service-call name="your.service.get#EntityList" out-map="context">
            <field-map field-name="pageIndex" from="pageIndex"/>
            <field-map field-name="pageSize" from="pageSize"/>
        </service-call>
    </actions>
    
    <!-- Widgets：UI渲染 -->
    <widgets>
        <container style="q-pa-md">
            <!-- 标题 -->
            <container style="row justify-between items-center q-mb-md">
                <label text="实体列表" type="h5"/>
                <container>
                    <link url="createEntity" text="创建" 
                          btn-type="primary" icon="add"/>
                </container>
            </container>
            
            <!-- 搜索表单 -->
            <form-single name="SearchForm" transition="getEntityList">
                <field name="searchTerm">
                    <default-field title="搜索">
                        <text-line/>
                    </default-field>
                </field>
                <field name="status">
                    <default-field title="状态">
                        <drop-down allow-empty="true">
                            <option key="ACTIVE" text="活跃"/>
                            <option key="INACTIVE" text="非活跃"/>
                        </drop-down>
                    </default-field>
                </field>
                <field name="submitButton">
                    <default-field>
                        <submit text="搜索" icon="search"/>
                    </default-field>
                </field>
            </form-single>
            
            <!-- 数据表格 -->
            <form-list name="EntityListForm" list="entityList" 
                       transition="updateEntity">
                <field name="entityId">
                    <default-field title="ID">
                        <display/>
                    </default-field>
                </field>
                <field name="name">
                    <default-field title="名称">
                        <display/>
                    </default-field>
                </field>
                <field name="status">
                    <default-field title="状态">
                        <display/>
                    </default-field>
                </field>
                <field name="createdDate">
                    <default-field title="创建时间">
                        <display format="yyyy-MM-dd HH:mm"/>
                    </default-field>
                </field>
                <field name="actions">
                    <default-field title="操作">
                        <link url="updateEntity" text="编辑" 
                              parameter-map="[entityId: entityId]"
                              btn-type="info" icon="edit"/>
                        <link url="deleteEntity" text="删除"
                              parameter-map="[entityId: entityId]"
                              btn-type="negative" icon="delete"
                              confirmation="确认删除？"/>
                    </default-field>
                </field>
            </form-list>
            
            <!-- 分页 -->
            <container style="row justify-center q-mt-md">
                <label text="共 ${totalCount} 条记录"/>
            </container>
        </container>
    </widgets>
</screen>
```

### 详情页面

```xml
<!-- runtime/component/your-app/screen/yourapp/EntityDetail.xml -->
<screen default-menu-title="实体详情" require-authentication="false">
    
    <transition name="getEntity">
        <service-call name="your.service.get#Entity"/>
        <default-response type="screen-last"/>
    </transition>
    
    <transition name="updateEntity">
        <service-call name="your.service.update#Entity"/>
        <default-response url="."/>
    </transition>
    
    <actions>
        <service-call name="your.service.get#Entity" out-map="context">
            <field-map field-name="entityId" from="entityId"/>
        </service-call>
    </actions>
    
    <widgets>
        <container style="q-pa-md">
            <label text="实体详情" type="h5"/>
            
            <form-single name="EntityForm" transition="updateEntity"
                         map="entity">
                <field name="entityId">
                    <default-field>
                        <hidden/>
                    </default-field>
                </field>
                
                <field name="name">
                    <default-field title="名称">
                        <text-line/>
                    </default-field>
                </field>
                
                <field name="description">
                    <default-field title="描述">
                        <text-area rows="3"/>
                    </default-field>
                </field>
                
                <field name="type">
                    <default-field title="类型">
                        <drop-down>
                            <option key="TYPE1" text="类型1"/>
                            <option key="TYPE2" text="类型2"/>
                        </drop-down>
                    </default-field>
                </field>
                
                <field name="status">
                    <default-field title="状态">
                        <drop-down>
                            <option key="ACTIVE" text="活跃"/>
                            <option key="INACTIVE" text="非活跃"/>
                        </drop-down>
                    </default-field>
                </field>
                
                <field name="submitButton">
                    <default-field>
                        <submit text="保存" icon="save"/>
                    </default-field>
                </field>
            </form-single>
        </container>
    </widgets>
</screen>
```

### 创建页面

```xml
<!-- runtime/component/your-app/screen/yourapp/EntityCreate.xml -->
<screen default-menu-title="创建实体" require-authentication="false">
    
    <transition name="createEntity">
        <service-call name="your.service.create#Entity"/>
        <default-response url="../EntityList"/>
    </transition>
    
    <widgets>
        <container style="q-pa-md">
            <label text="创建实体" type="h5"/>
            
            <form-single name="CreateForm" transition="createEntity">
                <field name="name">
                    <default-field title="名称">
                        <text-line/>
                    </default-field>
                </field>
                
                <field name="description">
                    <default-field title="描述">
                        <text-area rows="3"/>
                    </default-field>
                </field>
                
                <field name="type">
                    <default-field title="类型">
                        <drop-down>
                            <option key="TYPE1" text="类型1"/>
                            <option key="TYPE2" text="类型2"/>
                        </drop-down>
                    </default-field>
                </field>
                
                <field name="submitButton">
                    <default-field>
                        <submit text="创建" icon="add"/>
                    </default-field>
                </field>
                
                <field name="cancelButton">
                    <default-field>
                        <link url="../EntityList" text="取消" 
                              btn-type="flat"/>
                    </default-field>
                </field>
            </form-single>
        </container>
    </widgets>
</screen>
```

## 📝 Quasar样式类

### 布局类

```xml
<!-- 容器 -->
<container style="q-pa-md">内容</container>
<container style="q-pa-sm">小间距</container>
<container style="q-pa-lg">大间距</container>

<!-- 网格布局 -->
<container style="row q-col-gutter-md">
    <container style="col-12 col-md-6">左侧</container>
    <container style="col-12 col-md-6">右侧</container>
</container>

<!-- Flex布局 -->
<container style="row justify-between items-center">
    <label text="左侧"/>
    <label text="右侧"/>
</container>

<container style="column items-center">
    <label text="居中内容"/>
</container>
```

### 间距类

```xml
<!-- Padding -->
<container style="q-pa-md">全部padding</container>
<container style="q-pt-md">顶部padding</container>
<container style="q-pb-md">底部padding</container>
<container style="q-pl-md">左侧padding</container>
<container style="q-pr-md">右侧padding</container>
<container style="q-px-md">水平padding</container>
<container style="q-py-md">垂直padding</container>

<!-- Margin -->
<container style="q-ma-md">全部margin</container>
<container style="q-mt-md">顶部margin</container>
<container style="q-mb-md">底部margin</container>
<container style="q-ml-md">左侧margin</container>
<container style="q-mr-md">右侧margin</container>
<container style="q-mx-md">水平margin</container>
<container style="q-my-md">垂直margin</container>

<!-- 间距大小 -->
<!-- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 48px -->
```

### 文本类

```xml
<!-- 文本对齐 -->
<label text="左对齐" style="text-left"/>
<label text="居中" style="text-center"/>
<label text="右对齐" style="text-right"/>

<!-- 文本颜色 -->
<label text="主色" style="text-primary"/>
<label text="次色" style="text-secondary"/>
<label text="成功" style="text-positive"/>
<label text="警告" style="text-warning"/>
<label text="错误" style="text-negative"/>

<!-- 文本大小 -->
<label text="标题1" type="h1"/>
<label text="标题2" type="h2"/>
<label text="标题3" type="h3"/>
<label text="标题4" type="h4"/>
<label text="标题5" type="h5"/>
<label text="标题6" type="h6"/>
```

## ⚠️ 常见错误

### 错误1: 使用错误的认证属性

```xml
<!-- ❌ 错误：Screen不能使用authenticate -->
<screen authenticate="false">
    <!-- 这个属性对Screen无效 -->
</screen>

<!-- ✅ 正确：Screen使用require-authentication -->
<screen require-authentication="false">
    <widgets><!-- 正确的认证配置 --></widgets>
</screen>
```

### 错误2: 缺少menuData transition

```xml
<!-- ❌ 错误：主屏幕缺少menuData -->
<screen default-menu-title="应用">
    <subscreens>
        <subscreens-item name="Dashboard" .../>
    </subscreens>
    <widgets>
        <subscreens-active/>
    </widgets>
</screen>

<!-- ✅ 正确：提供menuData transition -->
<screen default-menu-title="应用">
    <subscreens>
        <subscreens-item name="Dashboard" .../>
    </subscreens>
    
    <transition name="menuData" read-only="true">
        <actions><script><![CDATA[
            List menuDataList = []
            menuDataList.add([
                title: "控制台",
                url: "/qapps/yourapp/Dashboard",
                image: "fa fa-tachometer-alt",
                imageType: "icon"
            ])
            ec.web.sendJsonResponse(menuDataList)
        ]]></script></actions>
        <default-response type="none"/>
    </transition>
    
    <widgets>
        <subscreens-active/>
    </widgets>
</screen>
```

### 错误3: 只配置一个菜单文件

```xml
<!-- ❌ 错误：只配置qapps.xml -->
<!-- 应用不会显示在主菜单 -->

<!-- ✅ 正确：同时配置apps.xml和qapps.xml -->
<!-- apps.xml -->
<subscreens-item name="yourapp" menu-title="应用"
                 location="component://your-app/screen/yourapp.xml"/>

<!-- qapps.xml -->
<subscreens-item name="yourapp" menu-title="应用"
                 location="component://your-app/screen/yourapp.xml"/>
```

## 🎓 最佳实践

### 1. 统一的认证配置
- 公开页面使用`require-authentication="false"`
- 私有页面使用`require-authentication="true"`
- 不要使用`authenticate`属性

### 2. 完整的菜单配置
- 主屏幕提供menuData transition
- 同时配置apps.xml和qapps.xml
- 菜单数据包含title、url、image

### 3. 使用Quasar样式类
- 使用q-pa-md等Quasar类
- 避免自定义CSS
- 保持样式一致性

### 4. 合理的Transition定义
- 每个操作定义一个transition
- 使用service-call调用服务
- 设置合适的response类型

### 5. 清晰的表单结构
- 使用form-single创建单条记录
- 使用form-list显示列表
- 提供清晰的字段标题

## 📚 相关规范

- **认证配置**: `.kiro/rules/standards/moqui/authentication.md`
- **实体操作**: `.kiro/rules/standards/moqui/entity.md`
- **服务定义**: `.kiro/rules/standards/moqui/service.md`

## 🔍 验证检查清单

### Screen定义
- [ ] 使用`require-authentication`属性
- [ ] 提供default-menu-title
- [ ] 主屏幕提供menuData transition

### 菜单配置
- [ ] 配置apps.xml
- [ ] 配置qapps.xml
- [ ] 菜单数据完整

### Transition定义
- [ ] 每个操作有对应transition
- [ ] 使用service-call调用服务
- [ ] 设置合适的response类型

### 样式使用
- [ ] 使用Quasar样式类
- [ ] 避免自定义CSS
- [ ] 保持样式一致性

---

**版本**: v1.0  
**创建日期**: 2025-01-16  
**适用范围**: 所有Moqui Screen定义
