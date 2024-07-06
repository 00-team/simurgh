import { Component } from 'solid-js'

import './style/popup.scss'

type popupTypes = 'success' | 'info' | 'error'

interface PopupProps {
    type: popupTypes
    content: string
    title: string
}

export const Popup: Component = () => {
    return (
        <div class='popup'>
            <div class='popup-wrapper'></div>
        </div>
    )
}
