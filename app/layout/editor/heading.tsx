import { Component } from 'solid-js'

import './style/heading.scss'
import { BlogHeading } from 'models'

type Props = {
    idx: number
    block: BlogHeading
}
export const EditorHeadingBlock: Component<Props> = P => {
    return <div class='block-heading'>heading...</div>
}
