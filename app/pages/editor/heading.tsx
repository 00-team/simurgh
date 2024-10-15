import { Component, JSX } from 'solid-js'
import { PilcrowLeftIcon, PilcrowRightIcon } from 'icons'
import { BlogHeading, BLOG_ALIGN } from 'models'
import { produce } from 'solid-js/store'
import { setStore } from './store'
import './style/heading.scss'

const HEADERS = [
    'عنوان',
    'سر صفحه',
    'عنوان فرعی',
    'عنوان بند',
    'عنوان کوچک',
    'عنوان کوچک تر',
]

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

    const HEADING: Component<{ children: JSX.Element }>[] = [
        P => <h1 class='section_title'>{P.children}</h1>,
        P => <h2 class='title_hero'>{P.children}</h2>,
        P => <h3 class='title'>{P.children}</h3>,
        P => <h4 class='title'>{P.children}</h4>,
        P => <h5 class='title'>{P.children}</h5>,
        P => <h6 class='title'>{P.children}</h6>,
    ]

    return (
        <div class='block-heading'>
            <div class='heading-actions'>
                <div class='actions-wrapper headings'>
                    {HEADERS.map((t, i) => (
                        <button
                            class='action title_smaller'
                            classList={{ active: P.block.level === i + 1 }}
                            onClick={() => set_attr(_ => ({ level: i + 1 }))}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div class='actions-row'>
                    <div class='actions-wrapper directions'>
                        {['rtl', 'ltr'].map((dir, i) => (
                            <button
                                classList={{ active: P.block.dir === dir }}
                                class='action icon'
                                onClick={() =>
                                    set_attr(_ => ({ dir: dir as 'rtl' }))
                                }
                            >
                                {[<PilcrowRightIcon />, <PilcrowLeftIcon />][i]}
                            </button>
                        ))}
                    </div>
                    <div class='actions-wrapper aligns'>
                        {Object.entries(BLOG_ALIGN).map(([key, val]) => (
                            <button
                                class='action icon'
                                onClick={() => {
                                    set_attr(_ => ({ align: key as 'left' }))
                                }}
                                classList={{ active: P.block.align === key }}
                            >
                                {val[1]()}
                            </button>
                        ))}
                    </div>
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
                {HEADING[P.block.level - 1]({ children: P.block.content })}
            </div>
        </div>
    )
}
