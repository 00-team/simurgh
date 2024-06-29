import { PencilIcon } from 'icons'
import { Component, JSX } from 'solid-js'
import './style/editable.scss'

type Props = {
    children: JSX.Element
    onClick?(): void
    img?: boolean
}

export const Editable: Component<Props> = P => {
    return (
        <div
            class='cmp-editable'
            style={{ padding: P.img ? 0 : '1em' }}
            title='click to edit'
            onClick={P.onClick}
        >
            <div class='cmp-editable-icon'>
                <PencilIcon />
            </div>
            {P.children}
        </div>
    )
}
