// MobileCard 组件测试
// =======================

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MobileCard from './MobileCard.vue'

describe('MobileCard', () => {
  it('渲染正确的内容', () => {
    const wrapper = mount(MobileCard, {
      props: {
        title: '测试标题',
        content: '测试内容'
      }
    })

    expect(wrapper.find('.text-h6').text()).toBe('测试标题')
    expect(wrapper.find('.text-body1').text()).toBe('测试内容')
  })

  it('响应点击事件', async () => {
    const wrapper = mount(MobileCard)

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('处理加载状态', () => {
    const wrapper = mount(MobileCard, {
      props: { loading: true }
    })

    expect(wrapper.classes()).toContain('mobile-card--loading')
  })

  it('处理禁用状态', () => {
    const wrapper = mount(MobileCard, {
      props: { disabled: true }
    })

    expect(wrapper.classes()).toContain('mobile-card--disabled')
  })
})
