import { BlogAudio } from 'models'
import { Component } from 'solid-js'

import './style/audio.scss'

type Props = {
    idx: number
    block: BlogAudio
}
export const EditorAudioBlock: Component<Props> = P => {
    return <div class='block-map'></div>
}
