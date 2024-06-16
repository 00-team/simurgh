import { PencilIcon } from 'icons'
import { Component, JSX } from 'solid-js'
import './style/editable.scss'

type Props = {
    children: JSX.Element
}

export const Editable: Component<Props> = P => {
    return (
        <div class='cmp-editable' title='click to edit'>
            <div class='cmp-editable-icon'>
                <PencilIcon />
            </div>
            {P.children}
        </div>
    )
}
