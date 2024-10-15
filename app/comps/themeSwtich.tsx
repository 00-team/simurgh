import { LogoRaw } from 'icons'
import { Component } from 'solid-js'
import { setTheme, theme } from 'store'

import './style/themeswitch.scss'

export const ThemeSwtich: Component = () => {
    return (
        <div class='theme-switch' classList={{ dark: theme() === 'dark' }}>
            <label for='theme-btn'>
                <input
                    type='checkbox'
                    id='theme-btn'
                    onChange={e => {
                        let checked = e.currentTarget.checked
                        setTheme(checked ? 'dark' : 'light')
                    }}
                />
                <div class='slider-wrapper'>
                    <div
                        class='theme-btn-slider'
                        classList={{ dark: theme() === 'dark' }}
                    >
                        {/* {theme() === 'dark' && <LogoRaw size={100} />} */}
                        <LogoRaw />
                    </div>
                    <span class='star star-1'></span>
                    <span class='star star-2'></span>
                    <span class='star star-3'></span>
                    <span class='star star-4'></span>
                    <span class='star star-5'></span>
                    <span class='star star-6'></span>
                </div>
            </label>
        </div>
    )
}
