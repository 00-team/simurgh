import { Component, JSX } from 'solid-js'

import { PilcrowLeftIcon, PilcrowRightIcon } from 'icons'
import { BlogHeading, BLOG_ALIGN } from 'models'
import { produce } from 'solid-js/store'
import { setStore } from './store'
import './style/heading.scss'

type Props = {
    idx: number
    block: BlogHeading
}
export const EditorHeadingBlock: Component<Props> = P => {
    function set_attr(cb: (b: BlogHeading) => Partial<BlogHeading>) {
        setStore(
            produce(s => {
                let b = s.data[P.idx] as BlogHeading
                let v = cb(b)
                s.data[P.idx] = { ...b, ...v }
            })
        )
    }

    const HEADING: {
        [k in 1 | 2 | 3 | 4 | 5 | 6]: Component<{ children: JSX.Element }>
    } = {
        1: P => <h1 class='section_title'>{P.children}</h1>,
        2: P => <h2 class='title_hero'>{P.children}</h2>,
        3: P => <h3 class='title'>{P.children}</h3>,
        4: P => <h4 class='title'>{P.children}</h4>,
        5: P => <h5 class='title'>{P.children}</h5>,
        6: P => <h6 class='title'>{P.children}</h6>,
    }

    return (
        <div class='block-heading'>
            <div class='heading-actions'>
                <button
                    class='styled icon'
                    onClick={() => {
                        set_attr(b => {
                            let level = b.level + 1
                            if (level > 6) level = 1
                            if (level < 1) level = 6
                            return { level }
                        })
                    }}
                >
                    H{P.block.level}
                </button>
                <div class='actions-wrapper directions'>
                    <button
                        classList={{ active: P.block.dir === 'rtl' }}
                        class='action icon'
                        onClick={() => {
                            set_attr(b => ({
                                dir: 'rtl',
                            }))
                        }}
                    >
                        <PilcrowRightIcon />
                    </button>
                    <button
                        classList={{ active: P.block.dir === 'ltr' }}
                        class='action icon'
                        onClick={() => {
                            set_attr(b => ({
                                dir: 'ltr',
                            }))
                        }}
                    >
                        <PilcrowLeftIcon />
                    </button>
                </div>
                <div class='actions-wrapper aligns'>
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
            </div>
            <div
                class='heading'
                style={{
                    'text-align': P.block.align,
                    direction: P.block.dir,
                }}
            >
                <input
                    class='styled title_small'
                    value={P.block.content}
                    style={{
                        'text-align': P.block.align,
                        direction: P.block.dir,
                    }}
                    onInput={e =>
                        setStore(
                            produce(s => {
                                let b = s.data[P.idx] as BlogHeading
                                b.content = e.currentTarget.value
                            })
                        )
                    }
                />
                {HEADING[P.block.level]({ children: P.block.content })}
            </div>
        </div>
    )
}
