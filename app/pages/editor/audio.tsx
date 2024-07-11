import { addAlert } from 'comps'
import { AudioIcon, XIcon } from 'icons'
import { BlogAudio, DEFAULT_BLOCKS, RecordModel, RecordUsages } from 'models'
import { httpx } from 'shared'
import { Component, Show } from 'solid-js'
import { produce } from 'solid-js/store'
import { setStore, store } from './store'

import './style/audio.scss'

type Props = {
    idx: number
    block: BlogAudio
}
export const EditorAudioBlock: Component<Props> = P => {
    return (
        <div class='block-audio'>
            <Show when={P.block.url} fallback={<AudioUploader {...P} />}>
                <audio draggable={false} src={P.block.url} controls />
                <button
                    class='styled icon remove'
                    onClick={() => {
                        setStore(
                            produce(s => {
                                s.data[P.idx] = DEFAULT_BLOCKS.audio
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

const AudioUploader: Component<Props> = P => {
    function upload_audio(
        e: Event & {
            currentTarget: HTMLInputElement
            target: HTMLInputElement
        }
    ) {
        if (!e.target.files || !e.target.files[0]) return

        if (!e.target.files[0].type.startsWith('audio/'))
            return addAlert({
                type: 'error',
                subject: 'نوع فایل',
                content: 'نوع فایل به صورت صوت باشد!',
                timeout: 5,
            })
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
                        let b = s.data[P.idx] as BlogAudio
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
                    // if (file.type.match('image.*')) {
                    //     const reader = new FileReader()
                    //     reader.onload = () => {
                    //         // Do something with the image data, e.g. display the image
                    //         if (!files || !files[0]) return
                    //         if (files[0].size > 209715200) {
                    //             addAlert({
                    //                 type: 'error',
                    //                 subject: 'حجم فایل',
                    //                 content:
                    //                     'حجم فایل مورد نظر بیشتر از حد مجاز است\nحداکثر حجم مجاز 200 مگابایت می باشد',
                    //                 timeout: 5,
                    //             })
                    //             return
                    //         }
                    //         let data = new FormData()
                    //         data.set(
                    //             'record',
                    //             files[0],
                    //             store.blog.title || store.blog.slug
                    //         )
                    //         httpx({
                    //             url: `/api/projects/${store.blog.project}/records/`,
                    //             method: 'POST',
                    //             data,
                    //             onLoad(x) {
                    //                 if (x.status != 200) return
                    //                 let r: RecordModel = x.response
                    //                 setStore(
                    //                     produce(s => {
                    //                         let b = s.data[P.idx] as BlogImage
                    //                         b.record_id = r.id
                    //                         b.url = `/simurgh-record/r-${r.id}-${r.salt}`
                    //                     })
                    //                 )
                    //             },
                    //         })
                    //     }
                    //     reader.readAsDataURL(file)
                    // }
                })
            }}
        >
            <div class='upload-area__header'>
                <h1 class='upload-area__title title'>فایل خود را اپلود کنید</h1>
                <p class='upload-area__paragraph description'>
                    فایل به صورت صوت باشد
                </p>
            </div>

            <label
                id='dropZoon'
                class='upload-area__drop-zoon drop-zoon'
                for='img-input'
            >
                <div class='drop-zoon__icon icon'>
                    <AudioIcon />
                </div>
                <p class='drop-zoon__paragraph title_smaller'>
                    فایل خود را اینجا بندازید یا کلیک کنید.
                </p>
                <input
                    type='file'
                    accept='.mp3,audio/*'
                    id='img-input'
                    onchange={e => upload_audio(e)}
                />
            </label>
        </div>
    )
}
