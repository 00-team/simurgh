import { useNavigate, useParams } from '@solidjs/router'
import { Action, Confact } from 'comps'
import {
    ArrowLeftIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    DrillIcon,
    EraseIcon,
    EyeIcon,
    EyeOffIcon,
    PlusIcon,
    RotateCcwIcon,
    SaveIcon,
    TrashIcon,
} from 'icons'
import { BlogData } from 'models'
import { httpx } from 'shared'
import { Component, createEffect, Show } from 'solid-js'
import { produce } from 'solid-js/store'
import { EditorEmptyBlock } from './empty'
import { EditorHeadingBlock } from './heading'
import { EditorImageBlock } from './image'
import { pre_save, setStore, store, unwrap_rec } from './store'
import './style/index.scss'
import { EditorTextBlock } from './text'

export default () => {
    const nav = useNavigate()
    const { pid, bid } = useParams()

    createEffect(() => {
        httpx({
            url: `/api/projects/${pid}/blogs/${bid}/`,
            method: 'GET',
            exclude_status: [404],
            onLoad(x) {
                if (x.status == 404) return nav('/projects/')
                if (x.status != 200) return
                setStore({ blog: x.response })
            },
        })
    })

    function blog_update_data() {
        if (!store.blog.id) return

        httpx({
            url: `/api/projects/${pid}/blogs/${bid}/data/`,
            method: 'PUT',
            json: store.data,
            onLoad(x) {
                if (x.status != 200) return
                setStore({ blog: x.response })
            },
        })
    }

    return (
        <div class='editor-fnd'>
            <div class='actions'>
                <div>
                    <button
                        class='styled icon'
                        onClick={() => nav(`/projects/${pid}/blogs/${bid}/`)}
                    >
                        <ArrowLeftIcon />
                    </button>
                </div>
                <div>
                    <Action
                        icon={() => (
                            <Show
                                when={store.show_groups}
                                fallback={<EyeIcon />}
                            >
                                <EyeOffIcon />
                            </Show>
                        )}
                        onAct={() =>
                            setStore(s => ({ show_groups: !s.show_groups }))
                        }
                        title={
                            store.show_groups
                                ? 'مخفی کردن گروه ها'
                                : 'نشان دادن گروه ها'
                        }
                    />
                    <button
                        class='styled icon'
                        style={{ '--color': 'var(--green)' }}
                        onClick={() =>
                            setStore(
                                produce(s => {
                                    s.data.push({ kind: 'empty' })
                                })
                            )
                        }
                    >
                        <PlusIcon />
                    </button>
                    <Confact
                        icon={SaveIcon}
                        color='var(--green)'
                        timer_ms={700}
                        onAct={() => {
                            document.dispatchEvent(pre_save)
                            blog_update_data()
                        }}
                    />

                    <Confact
                        icon={RotateCcwIcon}
                        color='var(--yellow)'
                        timer_ms={1000}
                        onAct={() => {
                            setStore(s => ({
                                data: unwrap_rec(s.blog.data),
                            }))
                        }}
                    />
                    <Confact
                        icon={EraseIcon}
                        color='var(--yellow)'
                        timer_ms={1000}
                        onAct={() => setStore({ data: [] })}
                    />
                </div>
            </div>
            <div class='editor-wrapper'>
                <div class='editor'>
                    <Show when={store.data.length == 0}>
                        <div class='message add-block'>
                            <button
                                class='add-cta title'
                                onClick={() =>
                                    setStore(
                                        produce(s => {
                                            s.data.push({ kind: 'empty' })
                                        })
                                    )
                                }
                            >
                                بلاک اضافه کنید
                            </button>
                        </div>
                    </Show>
                    {store.data.map((block, i, a) => (
                        <>
                            <EditorBlock block={block} idx={i} />
                            {i != a.length - 1 && <div class='line' />}
                        </>
                    ))}
                </div>
            </div>
        </div>
    )
}

type EditorBlockProps = {
    idx: number
    block: BlogData
}

const EditorBlock: Component<EditorBlockProps> = P => {
    const BLOCKS: { [k in BlogData['kind']]: Component<EditorBlockProps> } = {
        heading: EditorHeadingBlock,
        text: EditorTextBlock,
        image: EditorImageBlock,
        empty: EditorEmptyBlock,
        break: () => (
            <div class='block-break title_smaller'>
                خط افقی
                <hr />
            </div>
        ),
    }

    return (
        <div
            class='block'
            classList={{
                last: P.idx == store.data.length - 1,
                active: P.idx == store.active,
            }}
            onMouseDown={() => setStore({ active: P.idx })}
        >
            <div class='content'>
                {BLOCKS[P.block.kind]({ idx: P.idx, block: P.block })}
            </div>
            <div class='block-actions'>
                <button
                    class='styled icon'
                    disabled={P.idx == 0}
                    onClick={e => {
                        e.stopPropagation()
                        e.preventDefault()
                        setStore(
                            produce(s => {
                                let [b] = s.data.splice(P.idx, 1)
                                s.data.splice(P.idx - 1, 0, b)
                                s.active = P.idx - 1
                            })
                        )
                    }}
                >
                    <ChevronUpIcon />
                </button>
                <Confact
                    icon={TrashIcon}
                    color='var(--red)'
                    timer_ms={500}
                    onAct={() => {
                        setStore(
                            produce(s => {
                                s.data.splice(P.idx, 1)
                            })
                        )
                    }}
                />
                <button
                    class='styled icon'
                    disabled={P.idx == store.data.length - 1}
                    onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        setStore(
                            produce(s => {
                                let [b] = s.data.splice(P.idx, 1)
                                s.data.splice(P.idx + 1, 0, b)
                                s.active = P.idx + 1
                            })
                        )
                    }}
                >
                    <ChevronDownIcon />
                </button>
            </div>
        </div>
    )
}
