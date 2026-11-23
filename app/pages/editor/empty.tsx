import {
    AudioIcon,
    HeadingIcon,
    ImageIcon,
    LineIcon,
    MapIcon,
    TextIcon,
    VideoIcon,
} from 'icons'

import { Component, JSXElement } from 'solid-js'
import { produce } from 'solid-js/store'
import { setStore } from './store'

import * as a from 'abi'

import './style/empty.scss'
import { DEFAULT_BLOCKS } from 'shared/def'

type BlogEmpty = Extract<a.BlogData, { kind: 'empty' }>

type Props = {
    idx: number
    block: BlogEmpty
}
export const EditorEmptyBlock: Component<Props> = P => {
    function update(kind: a.BlogData['kind']) {
        setStore(
            produce(s => {
                s.data[P.idx] = { ...DEFAULT_BLOCKS[kind] }
            })
        )
    }

    const BLOCKS: {
        [k in Exclude<a.BlogData['kind'], 'empty'>]: {
            Component: () => JSXElement
            label: string
        }
    } = {
        check_list: { Component: () => 'todo', label: 'چک لیست' },
        list: { Component: () => 'todo', label: 'لیست' },
        heading: { Component: HeadingIcon, label: 'عنوان' },
        text: { Component: TextIcon, label: 'متن' },
        image: { Component: ImageIcon, label: 'عکس' },
        audio: { Component: AudioIcon, label: 'صوت' },
        video: { Component: VideoIcon, label: 'ویدیو' },
        map: { Component: MapIcon, label: 'نقشه' },
        break: { Component: LineIcon, label: 'خط افقی' },
    }

    return (
        <div class='block-empty'>
            <div class='row'>
                {Object.entries(BLOCKS)
                    .splice(0, 3)
                    .map(([k, V]) => (
                        <button
                            class='cta title_smaller'
                            onClick={() => update(k as a.BlogData['kind'])}
                        >
                            <V.Component />
                            {V.label}
                        </button>
                    ))}
            </div>
            <div class='row'>
                {Object.entries(BLOCKS)
                    .splice(3, 7)
                    .map(([k, V]) => (
                        <button
                            class='cta title_smaller'
                            onClick={() => update(k as a.BlogData['kind'])}
                        >
                            <V.Component />
                            {V.label}
                        </button>
                    ))}
            </div>
            <div class='row'>
                {Object.entries(BLOCKS)
                    .splice(7, 11)
                    .map(([k, V]) => (
                        <button
                            class='cta title_smaller'
                            onClick={() => update(k as a.BlogData['kind'])}
                        >
                            <V.Component />
                            {V.label}
                        </button>
                    ))}
            </div>
        </div>
    )
}
