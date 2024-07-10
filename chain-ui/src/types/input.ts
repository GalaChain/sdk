export interface IFieldProps {
  errors?: string[]
  hint?: string
  label: string
  labelStyle?: 'hidden' | 'floating'
  labelSize?: 'sm' | 'lg' | 'xl'
  prefix?: string
}

export interface IInputProps {
  ariaDescribedby?: string | string[]
  autocomplete?: string
  disabled?: boolean
  inputClass?: string | Record<string, boolean>
  name: string
  placeholder?: string
  readonly?: boolean
  required?: boolean
  type: string
}

export interface INumberInputProps extends IInputProps {
  controls?: boolean
  max?: number
  min?: number
  type: 'number'
  step?: string
}

export interface IPasswordInputProps extends IInputProps {
  feedback?: boolean
  toggleMask?: boolean
  type: 'password'
}

export interface ITextAreaInputProps extends IInputProps {
  type: 'textarea'
  autoResize?: boolean
  rows?: number
}
