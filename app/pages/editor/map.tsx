import { BlogImage } from 'models'
import { Component } from 'solid-js'

import './style/map.scss'

type Props = {
    idx: number
    block: BlogImage
}
export const EditorMapBlock: Component<Props> = P => {
    return <div class='block-map'></div>
}
