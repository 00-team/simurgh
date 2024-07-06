import { createSignal } from 'solid-js'

export const [theme, setTheme] = createSignal<'light' | 'dark'>('dark')
