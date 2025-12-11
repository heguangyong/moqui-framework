/**
 * Form Validation Composable
 * Provides reactive form validation with error highlighting
 * 
 * Requirements: 7.2
 */

import { ref, computed, reactive } from 'vue'

export interface ValidationRule {
  validate: (value: any) => boolean
  message: string
}

export interface FieldConfig {
  value: any
  rules: ValidationRule[]
  touched?: boolean
}

export interface FieldState {
  error: string
  touched: boolean
  valid: boolean
}

export function useFormValidation(fields: Record<string, FieldConfig>) {
  // Create reactive state for each field
  const fieldStates = reactive<Record<string, FieldState>>(
    Object.keys(fields).reduce((acc, key) => {
      acc[key] = {
        error: '',
        touched: false,
        valid: true
      }
      return acc
    }, {} as Record<string, FieldState>)
  )

  /**
   * Validate a single field
   */
  const validateField = (fieldName: string): boolean => {
    const field = fields[fieldName]
    const state = fieldStates[fieldName]
    
    if (!field || !state) return true
    
    state.touched = true
    
    for (const rule of field.rules) {
      if (!rule.validate(field.value)) {
        state.error = rule.message
        state.valid = false
        return false
      }
    }
    
    state.error = ''
    state.valid = true
    return true
  }

  /**
   * Validate all fields
   */
  const validateAll = (): boolean => {
    let allValid = true
    
    for (const fieldName of Object.keys(fields)) {
      const isValid = validateField(fieldName)
      if (!isValid) allValid = false
    }
    
    return allValid
  }

  /**
   * Reset validation state
   */
  const resetValidation = () => {
    for (const fieldName of Object.keys(fields)) {
      const state = fieldStates[fieldName]
      if (state) {
        state.error = ''
        state.touched = false
        state.valid = true
      }
    }
  }

  /**
   * Get error for a field
   */
  const getError = (fieldName: string): string => {
    return fieldStates[fieldName]?.error || ''
  }

  /**
   * Check if field has error
   */
  const hasError = (fieldName: string): boolean => {
    const state = fieldStates[fieldName]
    return state ? state.touched && !state.valid : false
  }

  /**
   * Check if form is valid
   */
  const isFormValid = computed(() => {
    return Object.values(fieldStates).every((state) => (state as FieldState).valid)
  })

  /**
   * Get all errors
   */
  const getAllErrors = computed(() => {
    const errors: Record<string, string> = {}
    for (const [key, state] of Object.entries(fieldStates)) {
      if ((state as FieldState).error) {
        errors[key] = (state as FieldState).error
      }
    }
    return errors
  })

  return {
    fieldStates,
    validateField,
    validateAll,
    resetValidation,
    getError,
    hasError,
    isFormValid,
    getAllErrors
  }
}

// Common validation rules
export const ValidationRules = {
  required: (message = '此字段为必填项'): ValidationRule => ({
    validate: (value: any) => {
      if (value === null || value === undefined) return false
      if (typeof value === 'string') return value.trim().length > 0
      if (Array.isArray(value)) return value.length > 0
      return true
    },
    message
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value: string) => !value || value.length >= min,
    message: message || `最少需要 ${min} 个字符`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value: string) => !value || value.length <= max,
    message: message || `最多允许 ${max} 个字符`
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value: string) => !value || regex.test(value),
    message
  }),

  phone: (message = '请输入有效的手机号'): ValidationRule => ({
    validate: (value: string) => !value || /^1[3-9]\d{9}$/.test(value),
    message
  }),

  containerNumber: (message = '集装箱号格式错误（4位字母+7位数字）'): ValidationRule => ({
    validate: (value: string) => !value || /^[A-Z]{4}\d{7}$/.test(value.toUpperCase()),
    message
  }),

  email: (message = '请输入有效的邮箱地址'): ValidationRule => ({
    validate: (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message
  }),

  numeric: (message = '请输入数字'): ValidationRule => ({
    validate: (value: string) => !value || /^\d+$/.test(value),
    message
  }),

  min: (minValue: number, message?: string): ValidationRule => ({
    validate: (value: number) => value === undefined || value === null || value >= minValue,
    message: message || `最小值为 ${minValue}`
  }),

  max: (maxValue: number, message?: string): ValidationRule => ({
    validate: (value: number) => value === undefined || value === null || value <= maxValue,
    message: message || `最大值为 ${maxValue}`
  })
}
