import { BlogVideo } from 'models'
import { Component } from 'solid-js'

import './style/video.scss'

type Props = {
    idx: number
    block: BlogVideo
}
export const EditorVideoBlock: Component<Props> = P => {
    return <div class='block-map'></div>
}
