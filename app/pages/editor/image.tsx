import {
    BLOG_ALIGN,
    BlogImage,
    DEFAULT_BLOCKS,
    RecordModel,
    RecordUsages,
} from 'models'
import { Component, Show } from 'solid-js'

import { addAlert } from 'comps'
import { ImageIcon, XIcon } from 'icons'
import { httpx } from 'shared'
import { produce } from 'solid-js/store'
import { setStore, store } from './store'
import './style/image.scss'

type Props = {
    idx: number
    block: BlogImage
}
export const EditorImageBlock: Component<Props> = P => {
    function set_attr(
        cb: (b: BlogImage) => Partial<Omit<BlogImage, 'kind' | 'groups'>>
    ) {
        setStore(
            produce(s => {
                let b = s.data[P.idx] as BlogImage
                let v = cb(b)
                s.data[P.idx] = { ...b, ...v }
            })
        )
    }

    return (
        <div class='block-image'>
            <Show when={P.block.url} fallback={<ImageUploader {...P} />}>
                <div class='image-actions'>
                    <div class='actions-wrapper'>
                        <button
                            class='action icon'
                            onClick={() => {
                                set_attr(b => ({
                                    align: 'left',
                                }))
                            }}
                            classList={{ active: P.block.align === 'left' }}
                        >
                            {BLOG_ALIGN['left'][1]()}
                        </button>
                        <button
                            class='action icon'
                            onClick={() => {
                                set_attr(b => ({
                                    align: 'center',
                                }))
                            }}
                            classList={{ active: P.block.align === 'center' }}
                        >
                            {BLOG_ALIGN['center'][1]()}
                        </button>
                        <button
                            class='action icon'
                            onClick={() => {
                                set_attr(b => ({
                                    align: 'right',
                                }))
                            }}
                            classList={{ active: P.block.align === 'right' }}
                        >
                            {BLOG_ALIGN['right'][1]()}
                        </button>
                    </div>
                    <button
                        class='delete-image title_smaller'
                        onclick={() => {
                            setStore(
                                produce(s => {
                                    s.data[P.idx] = DEFAULT_BLOCKS.image
                                })
                            )
                        }}
                    >
                        حذف عکس
                        <XIcon />
                    </button>
                </div>
                <div
                    class='image-section'
                    style={{ 'text-align': P.block.align }}
                >
                    <input
                        type='text'
                        placeholder='alt...'
                        class='title_smaller'
                        style={{
                            padding: '1em',
                            background: 'transparent',
                            border: 'none',
                            'border-bottom': '1px solid var(--accent-color)',
                        }}
                        value={P.block.alt || null}
                        oninput={e => set_attr(b => ({ alt: e.target.value }))}
                    />
                    <img draggable={false} src={P.block.url} />
                </div>
            </Show>
        </div>
    )
}

const ImageUploader: Component<Props> = P => {
    function upload_record(
        e: Event & {
            currentTarget: HTMLInputElement
            target: HTMLInputElement
        }
    ) {
        if (!e.target.files || !e.target.files[0]) return
        if (e.target.files[0].size > 209715200) {
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
        data.set(
            'record',
            e.target.files[0],
            store.blog.title || store.blog.slug
        )
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

    return (
        <div
            id='uploadArea'
            class='upload-area'
            ondragover={e => e.preventDefault()}
            ondrop={e => {
                e.preventDefault()
                const files = e.dataTransfer.files

                Array.from(files).forEach(file => {
                    if (file.type.match('image.*')) {
                        const reader = new FileReader()
                        reader.onload = () => {
                            // Do something with the image data, e.g. display the image
                            if (!files || !files[0]) return
                            if (files[0].size > 209715200) {
                                addAlert({
                                    type: 'error',
                                    subject: 'حجم فایل',
                                    content:
                                        'حجم فایل مورد نظر بیشتر از حد مجاز است\nحداکثر حجم مجاز 200 مگابایت می باشد',
                                    timeout: 5,
                                })
                                return
                            }

                            let data = new FormData()
                            data.set(
                                'record',
                                files[0],
                                store.blog.title || store.blog.slug
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
                        reader.readAsDataURL(file)
                    }
                })
            }}
        >
            <div class='upload-area__header'>
                <h1 class='upload-area__title title'>فایل خود را اپلود کنید</h1>
                <p class='upload-area__paragraph description'>
                    فایل به صورت عکس باشد
                </p>
            </div>

            <label
                id='dropZoon'
                class='upload-area__drop-zoon drop-zoon'
                for='img-input'
            >
                <div class='drop-zoon__icon icon'>
                    <ImageIcon />
                </div>
                <p class='drop-zoon__paragraph title_smaller'>
                    فایل خود را اینجا بندازید یا کلیک کنید.
                </p>
                <img
                    src=''
                    alt='Preview Image'
                    id='previewImage'
                    class='drop-zoon__preview-image'
                    draggable='false'
                />
                <input
                    type='file'
                    accept='image/*'
                    id='img-input'
                    onchange={e => upload_record(e)}
                />
            </label>
        </div>
    )
}
