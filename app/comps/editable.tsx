import { PencilIcon } from 'icons'
import { Component, JSX } from 'solid-js'
import './style/editable.scss'

type Props = {
    children: JSX.Element
    onClick?(): void
}

export const Editable: Component<Props> = P => {
    return (
        <div class='cmp-editable' title='click to edit' onClick={P.onClick}>
            <div class='cmp-editable-icon'>
                <PencilIcon />
            </div>
            {P.children}
        </div>
    )
}
