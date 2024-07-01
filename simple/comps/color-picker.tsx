import { Component, createEffect, on, onCleanup, onMount } from 'solid-js'
import { Popup } from './popup'

import './style/color-picker.scss'
import { createStore, produce } from 'solid-js/store'

type Props = {
    default?: string
    onChange(color: string): void
    show: boolean
}
export const ColorPicker: Component<Props> = P => {
    type State = {
        x: number
        y: number
        active: boolean
        hsva: HSVA
        hue: string
        colorna: string
    }
    const [state, setState] = createStore<State>({
        x: 0,
        y: 0,
        active: false,
        hsva: {
            h: 0,
            s: 100,
            v: 100,
            a: 100,
        },
        get hue() {
            return RGBAToStr(
                HSVAtoRGBA({
                    h: this.hsva.h,
                    s: 100,
                    v: 100,
                    a: this.hsva.a,
                })
            )
        },
        get colorna() {
            return RGBAToStr(HSVAtoRGBA({ ...this.hsva, a: 100 }))
        },
    })
    let ref: HTMLDivElement

    function inactive() {
        setState({ active: false })
    }

    onMount(() => document.addEventListener('mouseup', inactive))
    onCleanup(() => document.removeEventListener('mouseup', inactive))

    function move(e: { currentTarget: HTMLDivElement } & MouseEvent) {
        const { left, right, top, bottom } = ref.getBoundingClientRect()
        let x = 0
        let y = 0

        if (e.clientX > right) x = 100
        else if (e.clientX > left) {
            x = (e.clientX - left) * (100 / (right - left))
        }

        if (e.clientY > bottom) y = 100
        else if (e.clientY > top) {
            y = (e.clientY - top) * (100 / (bottom - top))
        }

        setState(s => ({ x, y, hsva: { ...s.hsva, s: x, v: 100 - y } }))
    }

    createEffect(() => {
        if (state.active && ref) {
            document.addEventListener('mousemove', move)
        } else {
            document.removeEventListener('mousemove', move)
        }
    })

    createEffect(() => {
        // if (!P.default || P.default[0] != '#') return
        // console.log(P.default)
        // let [r, g, b, a] = P.default
        //     .slice(1)
        //     .match(/.{2}/g)
        //     .map(h => parseInt(h, 16))
        //
        // a ||= 255
        // a /= 2.55
        //
        // setState(
        //     produce(s => {
        //         s.hsva = RGBAtoHSVA({ r, g, b, a })
        //         s.x = s.hsva.s
        //         s.y = 100 - s.hsva.v
        //     })
        // )
    })

    createEffect(
        on(
            () => state.hsva,
            () => {
                P.onChange(RGBAToHex(HSVAtoRGBA(state.hsva)))
            },
            { defer: true }
        )
    )

    return (
        <Popup show={P.show} background='var(--cd)'>
            <div
                class='cmp-color-picker'
                onClick={e => e.stopPropagation()}
                style={{ '--colorna': state.colorna }}
            >
                <div
                    class='ccp-gradient'
                    ref={ref}
                    onClick={move}
                    onMouseDown={() => setState({ active: true })}
                    style={{ '--hue': state.hue, '--a': state.hsva.a + '%' }}
                >
                    <div
                        class='ccp-dot'
                        style={{ '--x': state.x + '%', '--y': state.y + '%' }}
                    ></div>
                </div>
                <Silinder
                    class='hue'
                    onChange={h =>
                        setState(s => ({ hsva: { ...s.hsva, h: h * 3.6 } }))
                    }
                />
                <Silinder
                    class='alpha'
                    default={state.hsva.a}
                    onChange={a => setState(s => ({ hsva: { ...s.hsva, a } }))}
                />
            </div>
        </Popup>
    )
}

type SilinderProps = {
    class?: string
    onChange(value: number): void
    default?: number
}
const Silinder: Component<SilinderProps> = P => {
    type State = {
        value: number
        active: boolean
    }
    const [state, setState] = createStore<State>({
        value: P.default || 0,
        active: false,
    })
    let ref: HTMLDivElement

    createEffect(() => P.onChange(state.value))
    onMount(() => document.addEventListener('mouseup', inactive))
    onCleanup(() => document.removeEventListener('mouseup', inactive))

    function inactive() {
        setState({ active: false })
    }

    function move(e: { currentTarget: HTMLDivElement } & MouseEvent) {
        const { left, right } = ref.getBoundingClientRect()
        if (e.clientX < left) {
            setState({ value: 0 })
            return
        }
        if (e.clientX > right) {
            setState({ value: 100 })
            return
        }

        let t = 100 / (right - left)
        setState({ value: (e.clientX - left) * t })
    }

    createEffect(() => {
        if (state.active && ref) document.addEventListener('mousemove', move)
        else document.removeEventListener('mousemove', move)
    })

    return (
        <div
            ref={ref}
            classList={{ [P.class]: !!P.class }}
            class='ccp-silinder'
            onClick={move}
            onMouseDown={() => setState({ active: true })}
        >
            <div class='ccp-dot' style={{ '--v': state.value + '%' }}></div>
        </div>
    )
}

type HSVA = {
    s: number
    v: number
    h: number
    a: number
}
function HSVAtoRGBA(hsva: HSVA): RGBA {
    const saturation = hsva.s / 100
    const value = hsva.v / 100
    let chroma = saturation * value
    let hueBy60 = hsva.h / 60
    let x = chroma * (1 - Math.abs((hueBy60 % 2) - 1))
    let m = value - chroma

    chroma = chroma + m
    x = x + m

    const index = Math.floor(hueBy60) % 6
    const red = [chroma, x, m, m, x, chroma][index]
    const green = [x, chroma, chroma, x, m, m][index]
    const blue = [m, m, x, chroma, chroma, x][index]

    return {
        r: Math.round(red * 255),
        g: Math.round(green * 255),
        b: Math.round(blue * 255),
        a: hsva.a,
    }
}

type RGBA = {
    r: number
    g: number
    b: number
    a: number
}
function RGBAtoHSVA(rgba: RGBA): HSVA {
    const red = rgba.r / 255
    const green = rgba.g / 255
    const blue = rgba.b / 255
    const xmax = Math.max(red, green, blue)
    const xmin = Math.min(red, green, blue)
    const chroma = xmax - xmin
    const value = xmax
    let hue = 0
    let saturation = 0

    if (chroma) {
        if (xmax === red) {
            hue = (green - blue) / chroma
        }
        if (xmax === green) {
            hue = 2 + (blue - red) / chroma
        }
        if (xmax === blue) {
            hue = 4 + (red - green) / chroma
        }
        if (xmax) {
            saturation = chroma / xmax
        }
    }

    hue = Math.floor(hue * 60)

    return {
        h: hue < 0 ? hue + 360 : hue,
        s: Math.round(saturation * 100),
        v: Math.round(value * 100),
        a: rgba.a,
    }
}

function RGBAToHex(rgba: RGBA): string {
    let R = rgba.r.toString(16).padStart(2, '0')
    let G = rgba.g.toString(16).padStart(2, '0')
    let B = rgba.b.toString(16).padStart(2, '0')
    let A = ''

    if (rgba.a < 100) {
        const alpha = (rgba.a * 2.55) | 0
        A = alpha.toString(16).padStart(2, '0')
    }

    return '#' + R + G + B + A
}

function RGBAToStr(rgba: RGBA): string {
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a}%)`
}
