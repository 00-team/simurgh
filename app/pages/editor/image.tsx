import { BlogImage } from 'models'
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
    return (
        <div class='block-image'>
            <Show
                when={P.block.record_salt}
                fallback={
                    // <button class='styled icon' onClick={upload_record}>
                    //     <ImageIcon />
                    // </button>
                    <ImageUploader {...P} />
                }
            >
                <img
                    decoding='async'
                    loading='lazy'
                    draggable={false}
                    src={`/simurgh-record/r-${P.block.record_id}-${P.block.record_salt}`}
                />
                <button
                    class='styled icon remove'
                    onClick={() => {
                        setStore(
                            produce(s => {
                                let b = s.data[P.idx] as BlogImage
                                b.record_salt = ''
                                b.record_id = 0
                            })
                        )
                    }}
                >
                    <XIcon />
                </button>
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
        const el = e.target
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

        let data = new FormData()
        data.set('record', el.files[0], store.blog.title || store.blog.slug)

        httpx({
            url: `/api/projects/${store.blog.project}/records/`,
            method: 'POST',
            data,
            onLoad(x) {
                if (x.status != 200) return
                setStore(
                    produce(s => {
                        let b = s.data[P.idx] as BlogImage
                        b.record_salt = x.response.salt
                        b.record_id = x.response.id
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
                                    setStore(
                                        produce(s => {
                                            let b = s.data[P.idx] as BlogImage
                                            b.record_salt = x.response.salt
                                            b.record_id = x.response.id
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
                    <ImageIcon size={60} />
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
