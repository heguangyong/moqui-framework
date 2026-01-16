# Moqui 认证规范

> **用途**: Moqui认证配置的统一技术规范  
> **适用**: 所有Moqui Service和Screen的认证配置

## 🎯 核心规则

### 规则1: Service使用`authenticate`属性
**Service定义中使用`authenticate`属性，不要使用`require-authentication`**

### 规则2: Screen使用`require-authentication`属性
**Screen定义中使用`require-authentication`属性，不要使用`authenticate`**

## 📝 Service认证规范

### 无需认证的Service

```xml
<service verb="get" noun="PublicData" authenticate="false" allow-remote="true">
    <description>获取公开数据（无需认证）</description>
    <in-parameters>
        <parameter name="dataId" required="false"/>
    </in-parameters>
    <out-parameters>
        <parameter name="dataList" type="List"/>
        <parameter name="success" type="Boolean"/>
    </out-parameters>
    <actions>
        <script><![CDATA[
            try {
                dataList = ec.entity.find("PublicData")
                    .disableAuthz()
                    .list()
                success = true
            } catch (Exception e) {
                ec.logger.error("Failed to get data: ${e.message}", e)
                dataList = []
                success = false
            }
        ]]></script>
    </actions>
</service>
```

### 需要认证的Service

```xml
<service verb="create" noun="PrivateData" authenticate="true" allow-remote="true">
    <description>创建私有数据（需要认证）</description>
    <in-parameters>
        <parameter name="name" required="true"/>
        <parameter name="description"/>
    </in-parameters>
    <out-parameters>
        <parameter name="dataId"/>
        <parameter name="success" type="Boolean"/>
        <parameter name="message"/>
    </out-parameters>
    <actions>
        <script><![CDATA[
            try {
                def newData = ec.entity.makeValue("PrivateData")
                    .setFields([
                        name: name,
                        description: description,
                        userId: ec.user.userId,  // 使用当前用户ID
                        createdDate: ec.user.nowTimestamp
                    ], true, null, false)
                    .setSequencedIdPrimary()
                    .create()
                
                dataId = newData.dataId
                success = true
                message = "Data created successfully"
            } catch (Exception e) {
                ec.logger.error("Failed to create data: ${e.message}", e)
                success = false
                message = "Failed to create data: ${e.message}"
            }
        ]]></script>
    </actions>
</service>
```

## 📝 Screen认证规范

### 无需认证的Screen

```xml
<screen require-authentication="false">
    <transition name="getData">
        <service-call name="your.service.get#PublicData"/>
        <default-response type="screen-last"/>
    </transition>
    
    <actions>
        <service-call name="your.service.get#PublicData" out-map="context"/>
    </actions>
    
    <widgets>
        <container style="q-pa-md">
            <label text="公开页面" type="h5"/>
            <section-iterate name="DataIterate" list="dataList" entry="item">
                <widgets>
                    <label text="${item.name}"/>
                </widgets>
            </section-iterate>
        </container>
    </widgets>
</screen>
```

### 需要认证的Screen

```xml
<screen require-authentication="true">
    <transition name="createData">
        <service-call name="your.service.create#PrivateData"/>
        <default-response url="."/>
    </transition>
    
    <transition name="getData">
        <service-call name="your.service.get#PrivateData"/>
        <default-response type="screen-last"/>
    </transition>
    
    <actions>
        <service-call name="your.service.get#PrivateData" out-map="context"/>
    </actions>
    
    <widgets>
        <container style="q-pa-md">
            <label text="私有页面" type="h5"/>
            <label text="当前用户: ${ec.user.username}"/>
            
            <!-- 创建表单 -->
            <form-single name="CreateForm" transition="createData">
                <field name="name"><default-field><text-line/></default-field></field>
                <field name="description"><default-field><text-area/></default-field></field>
                <field name="submitButton"><default-field><submit text="创建"/></default-field></field>
            </form-single>
            
            <!-- 数据列表 -->
            <section-iterate name="DataIterate" list="dataList" entry="item">
                <widgets>
                    <label text="${item.name}"/>
                </widgets>
            </section-iterate>
        </container>
    </widgets>
</screen>
```

## 🔧 JWT认证配置

### MoquiDevConf.xml配置

```xml
<!-- JWT纯认证模式配置 -->
<default-property name="moqui.session.auth.disabled" value="true"/>
<default-property name="moqui.webapp.auth.mode" value="jwt_only"/>
<default-property name="moqui.jwt.force.mode" value="true"/>
<default-property name="moqui.jwt.webapp.auth.enabled" value="true"/>

<!-- JWT密钥配置 -->
<default-property name="moqui.jwt.secret" value="your-secret-key"/>
<default-property name="moqui.jwt.expire.hours" value="24"/>
```

### JWT验证逻辑

```xml
<!-- qapps.xml中的JWT验证 -->
<if condition="jwtToken">
    <script><![CDATA[
        boolean isValid = org.moqui.jwt.JwtUtil.validateToken(ec, jwtToken)
        if (isValid) {
            Map<String, Object> claims = org.moqui.jwt.JwtUtil.parseClaims(ec, jwtToken)
            String userId = claims.get("sub")
            if (userId) {
                ec.user.loginUser(userId, false)
            }
        }
    ]]></script>
</if>
```

## ⚠️ 常见错误

### 错误1: Service使用错误的属性

```xml
<!-- ❌ 错误：Service不能使用require-authentication -->
<service verb="get" noun="Data" require-authentication="false">
    <!-- 这会导致"User must be logged in to call service"错误 -->
</service>

<!-- ✅ 正确：Service使用authenticate -->
<service verb="get" noun="Data" authenticate="false" allow-remote="true">
    <description>正确的Service认证配置</description>
</service>
```

### 错误2: Screen使用错误的属性

```xml
<!-- ❌ 错误：Screen不能使用authenticate -->
<screen authenticate="false">
    <!-- 这个属性对Screen无效 -->
</screen>

<!-- ✅ 正确：Screen使用require-authentication -->
<screen require-authentication="false">
    <widgets><!-- 正确的Screen认证配置 --></widgets>
</screen>
```

## 🎓 最佳实践

### 1. 统一认证方式
- 项目内统一使用JWT或Session认证
- 不要混合使用多种认证方式
- 在MoquiDevConf.xml中明确配置

### 2. 合理设置认证要求
- 公开API使用`authenticate="false"`
- 私有API使用`authenticate="true"`
- 管理页面使用`require-authentication="true"`

### 3. 错误处理
- 认证失败时返回明确的错误信息
- 记录认证失败的日志
- 提供友好的用户提示

### 4. 安全考虑
- JWT密钥使用强随机字符串
- 设置合理的过期时间
- 定期更新JWT密钥
- 使用HTTPS传输JWT

## 📚 相关规范

- **实体操作**: `.kiro/rules/standards/moqui/entity.md`
- **服务定义**: `.kiro/rules/standards/moqui/service.md`
- **屏幕定义**: `.kiro/rules/standards/moqui/screen.md`

## 🔍 验证检查清单

### Service认证检查
- [ ] 使用`authenticate`属性（不是`require-authentication`）
- [ ] `authenticate="false"`用于公开API
- [ ] `authenticate="true"`用于私有API
- [ ] 设置`allow-remote="true"`允许远程调用

### Screen认证检查
- [ ] 使用`require-authentication`属性（不是`authenticate`）
- [ ] `require-authentication="false"`用于公开页面
- [ ] `require-authentication="true"`用于私有页面
- [ ] 认证页面可以访问`ec.user`对象

### JWT配置检查
- [ ] MoquiDevConf.xml中配置JWT参数
- [ ] JWT密钥足够强
- [ ] 过期时间合理
- [ ] 验证逻辑正确

---

**版本**: v1.0  
**创建日期**: 2025-01-16  
**适用范围**: 所有Moqui认证配置
