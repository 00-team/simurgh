import { Component, Show } from 'solid-js'
import {
    BLOG_ALIGN,
    BlogImage,
    DEFAULT_BLOCKS,
    RecordModel,
    RecordUsages,
} from 'models'

import './style/image.scss'
import { ImageIcon, XIcon } from 'icons'
import { addAlert } from 'comps'
import { httpx } from 'shared'
import { setStore, store } from './store'
import { produce } from 'solid-js/store'

type Props = {
    idx: number
    block: BlogImage
}
export const EditorImageBlock: Component<Props> = P => {
    function upload_record() {
        let el = document.createElement('input')
        el.setAttribute('type', 'file')
        el.setAttribute('accept', 'image/*')
        el.onchange = () => {
            if (!el.files || !el.files[0]) return
            if (el.files[0].size > 209715200) {
                addAlert({
                    type: 'error',
                    subject: 'حجم فایل',
                    content:
                        'حجم فایل مورد نظر بیشتر از حد مجاز است\nحداکثر حجم مجاز 200 مگابایت می باشد',
                    timeout: 5,
                })
                return
            }

            let usage: RecordUsages = { kind: 'blog', id: store.blog.id }
            let data = new FormData()
            data.set('record', el.files[0], store.blog.title || store.blog.slug)
            data.set(
                'usage',
                new Blob([JSON.stringify(usage)], {
                    type: 'application/json',
                })
            )

            httpx({
                url: `/api/projects/${store.blog.project}/records/`,
                method: 'POST',
                data,
                onLoad(x) {
                    if (x.status != 200) return
                    let r: RecordModel = x.response
                    setStore(
                        produce(s => {
                            let b = s.data[P.idx] as BlogImage
                            b.record_id = r.id
                            b.url = `/simurgh-record/r-${r.id}-${r.salt}`
                        })
                    )
                },
            })
        }
        el.click()
    }

    return (
        <div class='block-image'>
            <Show
                when={P.block.url}
                fallback={
                    <div class='image-input'>
                        <button class='styled icon' onClick={upload_record}>
                            <ImageIcon />
                        </button>
                        <input
                            class='styled url'
                            placeholder='image url'
                            value={P.block.url}
                            onChange={e => {
                                setStore(
                                    produce(s => {
                                        let b = s.data[P.idx] as BlogImage
                                        b.url = e.currentTarget.value
                                    })
                                )
                            }}
                        />
                    </div>
                }
            >
                <div class='image'>
                    <Show when={!P.block.record_id}>
                        <input
                            class='styled url'
                            placeholder='image url'
                            value={P.block.url}
                            onChange={e => {
                                setStore(
                                    produce(s => {
                                        let b = s.data[P.idx] as BlogImage
                                        b.url = e.currentTarget.value
                                    })
                                )
                            }}
                        />
                    </Show>
                    <img
                        style={{ 'object-position': P.block.align }}
                        decoding='async'
                        alt={P.block.alt}
                        loading='lazy'
                        draggable={false}
                        src={P.block.url}
                    />
                    <input
                        dir='auto'
                        class='styled'
                        placeholder='توصیف تصویر'
                        value={P.block.alt}
                        onInput={e => {
                            setStore(
                                produce(s => {
                                    let b = s.data[P.idx] as BlogImage
                                    b.alt = e.currentTarget.value
                                })
                            )
                        }}
                    />
                </div>
                <div class='image-actions'>
                    <button
                        class='styled icon remove'
                        onClick={() => {
                            setStore(
                                produce(s => {
                                    s.data[P.idx] = DEFAULT_BLOCKS.image
                                })
                            )
                        }}
                    >
                        <XIcon />
                    </button>
                    <button
                        class='styled icon'
                        onClick={() =>
                            setStore(
                                produce(s => {
                                    let b = s.data[P.idx] as BlogImage
                                    b.align = BLOG_ALIGN[b.align][0]
                                })
                            )
                        }
                        title={'align: ' + P.block.align}
                    >
                        {BLOG_ALIGN[P.block.align][1]()}
                    </button>
                </div>
            </Show>
        </div>
    )
}
