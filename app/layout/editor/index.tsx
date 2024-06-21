import {
    ArrowLeftIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    DrillIcon,
    PlusIcon,
    RotateCcwIcon,
    SaveIcon,
    TrashIcon,
} from 'icons'
import './style/index.scss'
import { useNavigate, useParams } from '@solidjs/router'
import { Component, Match, Show, Switch, createEffect } from 'solid-js'
import { httpx } from 'shared'
import { EditorEmptyBlock } from './empty'
import { setStore, store, unwrap_rec } from './store'
import { produce } from 'solid-js/store'
import { Confact } from 'comps'
import { EditorImageBlock } from './image'
import { BlogData, BlogEmpty, BlogImage } from 'models'

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
                        onAct={blog_update_data}
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
                        icon={DrillIcon}
                        color='var(--yellow)'
                        timer_ms={1000}
                        onAct={() => setStore({ data: [] })}
                    />
                </div>
            </div>
            <div class='editor-wrapper'>
                <div class='editor'>
                    <Show when={store.data.length == 0}>
                        <div class='message'>Add a Block</div>
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
    return (
        <div
            class='block'
            classList={{
                last: P.idx == store.data.length - 1,
                active: P.idx == store.active,
            }}
            onClick={() => setStore({ active: P.idx })}
        >
            <div class='content'>
                <Switch>
                    <Match when={P.block.kind == 'empty'}>
                        <EditorEmptyBlock
                            idx={P.idx}
                            block={P.block as BlogEmpty}
                        />
                    </Match>
                    <Match when={P.block.kind == 'text'}>Text</Match>
                    <Match when={P.block.kind == 'image'}>
                        <EditorImageBlock
                            idx={P.idx}
                            block={P.block as BlogImage}
                        />
                    </Match>
                </Switch>
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
