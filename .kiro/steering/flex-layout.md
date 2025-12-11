# Flex 布局指南

基于阮一峰 Flex 布局教程的核心要点，用于前端 CSS 布局开发。

## 容器属性（父元素）

```css
.container {
  display: flex;
  
  /* 主轴方向 */
  flex-direction: row | row-reverse | column | column-reverse;
  
  /* 换行 */
  flex-wrap: nowrap | wrap | wrap-reverse;
  
  /* 主轴对齐 */
  justify-content: flex-start | flex-end | center | space-between | space-around;
  
  /* 交叉轴对齐 */
  align-items: flex-start | flex-end | center | baseline | stretch;
  
  /* 多行对齐 */
  align-content: flex-start | flex-end | center | space-between | space-around | stretch;
}
```

## 项目属性（子元素）

```css
.item {
  /* 排列顺序，数值越小越靠前 */
  order: 0;
  
  /* 放大比例，0不放大 */
  flex-grow: 0;
  
  /* 缩小比例，1可缩小 */
  flex-shrink: 1;
  
  /* 初始大小 */
  flex-basis: auto;
  
  /* 简写: flex-grow flex-shrink flex-basis */
  flex: 0 1 auto;
  
  /* 单独对齐，覆盖容器的align-items */
  align-self: auto | flex-start | flex-end | center | baseline | stretch;
}
```

## 常用布局模式

### 水平垂直居中
```css
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

### 两端对齐
```css
.space-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

### 等分布局
```css
.equal {
  display: flex;
}
.equal > * {
  flex: 1;
}
```

### 固定+自适应
```css
.fixed-flex {
  display: flex;
}
.fixed-flex .fixed {
  flex: 0 0 100px; /* 固定宽度 */
}
.fixed-flex .flexible {
  flex: 1; /* 自适应剩余空间 */
}
```

### 底部固定
```css
.sticky-footer {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.sticky-footer .content {
  flex: 1;
}
.sticky-footer .footer {
  flex-shrink: 0;
}
```

## 常用简写

| 简写 | 等价于 | 说明 |
|------|--------|------|
| `flex: 1` | `flex: 1 1 0%` | 等分剩余空间 |
| `flex: auto` | `flex: 1 1 auto` | 基于内容自适应 |
| `flex: none` | `flex: 0 0 auto` | 不伸缩 |
| `flex: 0 0 100px` | - | 固定宽度 |

## 注意事项

1. 设置 `display: flex` 后，子元素的 `float`、`clear`、`vertical-align` 失效
2. `flex-basis` 优先级高于 `width`/`height`
3. `margin: auto` 在 flex 容器中可实现自动分配空间
4. 使用 `gap` 属性设置项目间距（现代浏览器支持）

```css
.container {
  display: flex;
  gap: 16px; /* 项目间距 */
}
```
