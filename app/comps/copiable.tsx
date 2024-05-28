import { Component } from 'solid-js'
import './style/copiable.scss'

type Props = { text: string }
export const Copiable: Component<Props> = P => {
    return (
        <span
            class='copiable'
            onClick={() => navigator.clipboard.writeText(P.text)}
        >
            {P.text}
        </span>
    )
}
