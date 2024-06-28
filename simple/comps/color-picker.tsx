import { Component } from 'solid-js'

type Props = {
    x: number
    y: number
    default?: string
    onChange(color: string): void
}
export const ColorPicker: Component<Props> = P => {
    return <div class='cmp-color-picker'></div>
}
