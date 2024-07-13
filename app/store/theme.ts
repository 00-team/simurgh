import { createEffect, createRoot, createSignal } from 'solid-js'

const ALLOWD_THEMES = ['light', 'dark'] as const
type Theme = (typeof ALLOWD_THEMES)[number]

function default_theme(): Theme {
    let theme = localStorage.getItem('default_theme') as Theme
    if (ALLOWD_THEMES.includes(theme)) {
        return theme
    }

    if (matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
    } else {
        return 'light'
    }
}

export const [theme, setTheme] = createSignal<Theme>(default_theme())

createRoot(() => {
    createEffect(() => {
        localStorage.setItem('default_theme', theme())
        document.documentElement.setAttribute('data-theme', theme())
    })
})
