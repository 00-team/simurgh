import { createStore } from 'solid-js/store'

import { JSX } from 'solid-js'

type popupTypes = 'success' | 'info' | 'error' | 'warning'

type PopupProps = {
    show: boolean

    type: popupTypes
    Icon: () => JSX.Element | null
    title: string
    content: string

    onSubmit: () => void
    onReject: () => void
}

const DEFAULT_POPUP: PopupProps = {
    show: false,
    type: 'info',
    Icon: null,
    title: '',
    content: '',
    onReject: () => {},
    onSubmit: () => {},
}

const [popup, setPopup] = createStore<PopupProps>({ ...DEFAULT_POPUP })

export { popup, setPopup, type PopupProps, type popupTypes, DEFAULT_POPUP }
