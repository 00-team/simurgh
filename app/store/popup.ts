import { createStore } from 'solid-js/store'

import { JSX } from 'solid-js'

type popupTypes = 'success' | 'info' | 'error'

type PopupProps = {
    show: boolean

    type: popupTypes
    Icon: () => JSX.Element | null
    title: string
    content: string

    onSubmit: () => void
    onReject: () => void
}

const defualt_popup: PopupProps = {
    show: false,
    type: 'info',
    content: '',
    Icon: null,
    onReject: () => {},
    onSubmit: () => {},
    title: '',
}

const [popup, setPopup] = createStore<PopupProps>(defualt_popup)

export { popup, setPopup, type PopupProps, type popupTypes }
