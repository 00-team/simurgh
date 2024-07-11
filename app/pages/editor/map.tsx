import { BlogImage } from 'models'
import { Component, Show } from 'solid-js'

import { addAlert } from 'comps'
import { ImageIcon, XIcon } from 'icons'
import { httpx } from 'shared'
import { produce } from 'solid-js/store'
import { setStore, store } from './store'
import './style/map.scss'

type Props = {
    idx: number
    block: BlogImage
}
export const EditorMapBlock: Component<Props> = P => {
    return (
        <div class='block-map'>
           
        </div>
    )
}

