import React, { useState, useEffect } from 'react'
import { Input } from 'antd'

interface SyncedInputProps {
  value?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  size?: 'small' | 'middle' | 'large'
  [key: string]: any
}

interface SyncedTextAreaProps {
  value?: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  rows?: number
  maxLength?: number
  showCount?: boolean
  autoSize?: { minRows?: number; maxRows?: number }
  [key: string]: any
}

/**
 * 受控输入框组件 - 解决 Valtio 响应式与受控组件的同步问题
 * 使用本地状态实现即时响应，同时保持与外部状态同步
 */
export const SyncedInput: React.FC<SyncedInputProps> = ({ value = '', onChange, ...props }) => {
  const [localValue, setLocalValue] = useState(value)
  
  useEffect(() => { setLocalValue(value) }, [value])
  
  return (
    <Input 
      {...props} 
      value={localValue} 
      onChange={(e) => {
        setLocalValue(e.target.value)
        onChange(e)
      }} 
    />
  )
}

/**
 * 受控文本域组件 - 解决 Valtio 响应式与受控组件的同步问题
 */
export const SyncedTextArea: React.FC<SyncedTextAreaProps> = ({ value = '', onChange, ...props }) => {
  const [localValue, setLocalValue] = useState(value)
  
  useEffect(() => { setLocalValue(value) }, [value])
  
  return (
    <Input.TextArea 
      {...props} 
      value={localValue} 
      onChange={(e) => {
        setLocalValue(e.target.value)
        onChange(e)
      }} 
    />
  )
}

