import { createStore, produce } from 'solid-js/store'
import './style/editor.scss'
import {
    Component,
    Show,
    createEffect,
    createSignal,
    onCleanup,
    onMount,
    untrack,
} from 'solid-js'
import History, { addHistory } from './history'
import {
    BLOCK_COSMETIC,
    Block,
    DEFAULT_BLOCKS,
    EmptyBlock,
    ImageBlock,
    TextBlock,
    TextGroupData,
} from './models'
import {
    AlignCenterIcon,
    AlignLeftIcon,
    AlignRightIcon,
    ArrowLeftLine,
    ArrowRightLine,
    ChevronDown,
    ChevronUp,
    SeparatorVertical,
    TrashIcon,
} from '!/icons/editor'
import BlockConfig from './config'
import { setWareHouse, warehouse } from './state'

const CONTENT_IS_EDITABLE =
    // @ts-ignore checking for firefox
    typeof InstallTrigger !== 'undefined' ? true : 'plaintext-only'

let editor: HTMLDivElement
export default () => {
    createEffect(() => {
        warehouse.blocks_changed
        untrack(() => {
            addHistory(JSON.stringify(warehouse.blocks))
        })
    })

    return (
        <div class='editor-fnd'>
            <div class='header'>Header</div>
            <div class='content'>
                <History
                    change={s => setWareHouse({ blocks: JSON.parse(s) })}
                />
                <div class='editor' ref={editor}>
                    {warehouse.blocks.map((b, i) => (
                        <div
                            class='block'
                            classList={{
                                active: i == warehouse.active.id,
                                [b.type]: true,
                            }}
                            onMouseDown={() =>
                                setWareHouse(
                                    produce(s => {
                                        s.active.id = i
                                        s.active.type = b.type
                                    })
                                )
                            }
                        >
                            {block_map[b.type]({
                                block: b as never,
                                id: i,
                            })}
                        </div>
                    ))}
                    <button
                        onclick={() => {
                            setWareHouse(
                                produce(s => {
                                    let new_id = s.blocks.push({
                                        type: 'empty',
                                    })
                                    s.active.id = new_id - 1
                                    s.active.type = 'empty'
                                    s.blocks_changed = Date.now()
                                })
                            )
                        }}
                    >
                        Add Block
                    </button>
                </div>
                <div class='rightbar'>
                    <div class='config'>
                        <BlockConfig />

                        <div class='grid-actions'>
                            <button>
                                <ChevronUp />
                            </button>
                            <button>C</button>
                            <button>D</button>
                            <button>F</button>
                            <button>
                                <TrashIcon />
                            </button>
                            <button>A</button>
                            <button>B</button>
                            <button>D</button>
                            <button>D</button>
                            <button>
                                <ChevronDown />
                            </button>
                            <button>D</button>
                            <button>D</button>
                            <button>D</button>
                            <button>D</button>
                            <button>
                                <ArrowLeftLine />
                            </button>
                            <button>
                                <AlignLeftIcon />
                            </button>
                            <button>
                                <AlignCenterIcon />
                            </button>
                            <button>
                                <AlignRightIcon />
                            </button>
                            <button>
                                <ArrowRightLine />
                            </button>
                        </div>
                        {config_map[warehouse.active.type]({
                            id: warehouse.active.id,
                            block: warehouse.blocks[
                                warehouse.active.id
                            ] as never,
                        })}
                    </div>
                    <div class='actions'>
                        <button onclick={() => console.log(warehouse.blocks)}>
                            Log
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

type BlockComponent<T extends Block> = Component<{
    block: T
    id: number
}>

type BlockMap = {
    [T in Block as T['type']]: BlockComponent<T>
}

const EmptyComp: BlockComponent<EmptyBlock> = props => {
    return (
        <>
            <span>Select the Block Type:</span>
            <div class='blocks'>
                {Object.entries(BLOCK_COSMETIC).map(([t, c]) => (
                    <button
                        class='select-btn'
                        onclick={() => {
                            setWareHouse(
                                produce(s => {
                                    s.blocks[props.id] = DEFAULT_BLOCKS[t]
                                    s.active.type = t as Block['type']
                                    s.blocks_changed = Date.now()
                                })
                            )
                        }}
                    >
                        {c.icon({})}
                        {c.title}
                    </button>
                ))}
            </div>
        </>
    )
}

const TextComp: BlockComponent<TextBlock> = P => {
    const [placeholder, setPlaceholder] = createSignal(!P.block.data.length)

    function comp_data(group: TextGroupData): string {
        const { content, ...data } = group
        return JSON.stringify(data)
    }

    return (
        <>
            {placeholder() && <span class='placeholder'>Enter Text Here</span>}
            <p
                style={{ direction: P.block.dir }}
                id={`block_paragraph_${P.id}`}
                onMouseDown={() => {
                    setWareHouse(
                        produce(s => {
                            let b = s.blocks[P.id] as TextBlock
                            b.active = -1
                        })
                    )
                }}
                onInput={e => {
                    if (warehouse.active.id != P.id) {
                        setWareHouse({
                            active: { id: P.id, type: P.block.type },
                        })
                    }
                    setPlaceholder(!e.currentTarget.innerHTML)
                }}
                onFocus={() => {
                    if (warehouse.active.id != P.id) {
                        setWareHouse({
                            active: { id: P.id, type: P.block.type },
                        })
                    }
                }}
                contenteditable={CONTENT_IS_EDITABLE}
            >
                {P.block.data.map((g, i) => (
                    <span
                        data-comp={comp_data(g)}
                        style={{
                            color: g.color,
                            'font-size': g.font_size && g.font_size + 'px',
                            '--bc': 'var(--c' + (i % 3) + ')',
                        }}
                        classList={{
                            active: P.block.active == i,
                            show_border: warehouse.show_groups,
                        }}
                        onMouseDown={e => {
                            e.stopPropagation()
                            setWareHouse(
                                produce(s => {
                                    let b = s.blocks[P.id] as TextBlock
                                    b.active = i
                                })
                            )
                        }}
                    >
                        {g.content.map((line, i1, a) => (
                            <>
                                {line}
                                {i1 != a.length - 1 ? <br /> : <></>}
                            </>
                        ))}
                    </span>
                ))}
            </p>
        </>
    )
}

const ImageComp: BlockComponent<ImageBlock> = props => {
    return <>IMAGE - {props.id}</>
}

const block_map: BlockMap = {
    empty: EmptyComp,
    text: TextComp,
    image: ImageComp,
}

const ImageConf: BlockComponent<ImageBlock> = props => {
    return <>{props.block.type}</>
}

const TextConf: BlockComponent<TextBlock> = P => {
    let id = warehouse.active.id

    const [show, setShow] = createStore({ show_grouper: false })

    function selection_change() {
        let show_grouper = false
        let selection = document.getSelection()

        if (!selection.isCollapsed && selection.rangeCount) {
            let range = selection.getRangeAt(0)
            let sc = range.startContainer
            let ec = range.endContainer
            let p = editor.querySelector<HTMLParagraphElement>(
                '.block.text p#block_paragraph_' + id
            )
            if ((sc == p || p.contains(sc)) && (ec == p || p.contains(ec))) {
                show_grouper = true
            }
        }

        if (show.show_grouper != show_grouper) {
            setShow({ show_grouper })
        }
    }

    onMount(() => {
        document.addEventListener('selectionchange', selection_change)
    })

    onCleanup(() => {
        document.removeEventListener('selectionchange', selection_change)

        setWareHouse(
            produce(s => {
                let b = s.blocks[P.id] as TextBlock
                b.active = -1
            })
        )
    })

    function new_group(): TextGroupData[] | null {
        let p = editor.querySelector<HTMLParagraphElement>(
            '.block.text p#block_paragraph_' + id
        )
        let selection = document.getSelection()
        if (!selection.rangeCount) return null
        let range = selection.getRangeAt(0)
        if (range.collapsed) return null

        let sc = range.startContainer
        let ec = range.endContainer

        let soff = range.startOffset
        let eoff = range.endOffset

        if (sc.childNodes.length > soff) {
            sc = sc.childNodes[soff]
            soff = 0
        }
        if (ec.childNodes.length > eoff) {
            ec = ec.childNodes[eoff]
            eoff = 0
        }

        let content = ''
        let groups: number[] = []
        let data: Map<number, TextGroupData> = new Map()
        let outrange = -1

        for (let n of p.childNodes) {
            if (n == sc) {
                groups.push(content.length + soff)
                outrange = 0
            }

            if (!outrange && n == ec) {
                groups.push(content.length + eoff)
                outrange = 1
            }

            if (n.nodeType == Node.TEXT_NODE) {
                content += n.textContent
            } else if (n.nodeName == 'BR') {
                content += '\n'
            } else if (n instanceof HTMLSpanElement) {
                let tgd: TextGroupData = {
                    ...JSON.parse(n.getAttribute('data-comp') || '{}'),
                    content: [],
                }
                if (outrange) {
                    groups.push(content.length)
                    data.set(content.length, tgd)
                }

                for (let e of n.childNodes) {
                    if (e == sc) {
                        groups.push(content.length + soff)
                        data.set(content.length + soff, tgd)
                        outrange = 0
                    }

                    if (!outrange && e == ec) {
                        groups.push(content.length + eoff)
                        data.set(content.length + eoff, tgd)
                        outrange = 1
                    }

                    if (e.nodeType == Node.TEXT_NODE) {
                        content += e.textContent
                    } else if (e.nodeName == 'BR') {
                        content += '\n'
                    } else {
                        content += e.textContent
                    }
                }
                if (outrange) groups.push(content.length)
            } else {
                content += n.textContent
            }
        }

        let grouped_content: TextGroupData[] = []

        let last_g = 0
        for (let [i, g] of groups.entries()) {
            let cstr = content.slice(last_g, g)
            if (!cstr) continue
            let c = cstr.split('\n')
            let d = data.get(last_g)

            if (d) {
                grouped_content.push({ ...d, content: c })
            } else {
                grouped_content.push({ content: c })
            }

            last_g = g
            if (i == groups.length - 1) {
                let cstr = content.slice(last_g)
                if (!cstr) continue
                let c = cstr.split('\n')
                let d = data.get(last_g)

                if (d) {
                    grouped_content.push({ ...d, content: c })
                } else {
                    grouped_content.push({ content: c })
                }
            }
        }

        return grouped_content

        // p.innerHTML = ''
        // grouped_content.forEach(g => {
        //     console.log(g)
        //     if (!g.content.length || (g.content.length == 1 && !g.content[0]))
        //         return
        //
        //     let span = document.createElement('span')
        //     span.id = 'g' + p.childNodes.length
        //     span.setAttribute('style', g.style)
        //     g.content.forEach((t, i, a) => {
        //         span.append(t)
        //         if (i === a.length - 1) return
        //         span.append(document.createElement('br'))
        //     })
        //     p.append(span)
        // })
    }

    return (
        <div class='text'>
            {show.show_grouper && (
                <button
                    onmousedown={e => e.preventDefault()}
                    onClick={() => {
                        let res = new_group()
                        if (res == null) return

                        setWareHouse(
                            produce(s => {
                                let b = s.blocks[P.id] as TextBlock
                                b.data = res
                                s.blocks_changed = Date.now()
                            })
                        )
                    }}
                >
                    <SeparatorVertical />
                </button>
            )}
            <button
                onmousedown={e => e.preventDefault()}
                onClick={() => {
                    setWareHouse(
                        produce(s => {
                            // @ts-ignore
                            let cd = s.blocks[P.id].dir
                            // @ts-ignore
                            s.blocks[P.id].dir = cd == 'ltr' ? 'rtl' : 'ltr'
                            s.blocks_changed = Date.now()
                        })
                    )
                }}
            >
                Toggle Dir
            </button>
            <Show when={P.block.data[P.block.active]}>
                <TextGroupStyleConfig
                    data={P.block.data[P.block.active]}
                    change={() => setWareHouse({ blocks_changed: Date.now() })}
                    update={values => {
                        delete values['content']
                        setWareHouse(
                            produce(s => {
                                // @ts-ignore
                                let data = s.blocks[P.id].data[P.block.active]
                                // @ts-ignore
                                s.blocks[P.id].data[P.block.active] = {
                                    ...data,
                                    ...values,
                                }
                            })
                        )
                    }}
                />
            </Show>
        </div>
    )
}

type TGCProps = {
    data: TextGroupData
    update: (data: Partial<TextGroupData>) => void
    change: () => void
}
const TextGroupStyleConfig: Component<TGCProps> = P => {
    return (
        <>
            <input
                name='group_color'
                type='color'
                value={P.data.color || '#ffffff'}
                onInput={e => {
                    let color = e.currentTarget.value
                    P.update({ color })
                }}
                onChange={P.change}
            />
            <input
                name='font_size'
                type='number'
                min={0}
                max={720}
                value={P.data.font_size || 18}
                onChange={P.change}
                onInput={e => {
                    let value = e.currentTarget.value
                    if (!value) return
                    let size = parseInt(value)
                    if (size < 0 || size > 720) return
                    P.update({ font_size: size })
                }}
            />
        </>
    )
}

const config_map: BlockMap = {
    empty: () => <></>,
    image: ImageConf,
    text: TextConf,
}
