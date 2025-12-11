// MobileCard 组件类型定义
// ==============================

export interface MobileCardProps {
  title?: string
  content?: string
  showFooter?: boolean
  loading?: boolean
  disabled?: boolean
}

export interface MobileCardEmits {
  click: (event: MouseEvent) => void
  change: (value: any) => void
}

export interface MobileCardInstance {
  isActive: Ref<boolean>
  handleClick: (event: MouseEvent) => void
  handleChange: (value: any) => void
}

// 组件状态枚举
export enum MobileCardState {
  IDLE = 'idle',
  LOADING = 'loading',
  ACTIVE = 'active',
  DISABLED = 'disabled'
}
