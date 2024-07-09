import {
    Component,
    createEffect,
    createMemo,
    on,
    onCleanup,
    onMount,
} from 'solid-js'

import { createStore, produce } from 'solid-js/store'
import './style/color-picker.scss'

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
        alpha: number
        hsv: HSV
    }
    const [state, setState] = createStore<State>({
        x: 0,
        y: 0,
        active: false,
        alpha: 100,
        hsv: {
            h: 0,
            s: 100,
            v: 100,
        },
    })
    let ref: HTMLDivElement

    const rgb = createMemo(() => HSVtoRGB(state.hsv))
    const rgb_str = createMemo(() => RGBToStr(rgb()))
    const hex = createMemo(() => RGBToHex(rgb(), state.alpha))
    const gradient_bg = createMemo(() =>
        RGBToStr(HSVtoRGB({ h: state.hsv.h, s: 100, v: 100 }), state.alpha)
    )

    function inactive() {
        setState({ active: false })
    }

    createEffect(() => {
        console.log(state.alpha)
    })

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

        setState(s => ({ x, y, hsv: { ...s.hsv, s: x, v: 100 - y } }))
    }

    createEffect(() => {
        if (state.active && ref) {
            document.addEventListener('mousemove', move)
        } else {
            document.removeEventListener('mousemove', move)
        }
    })

    createEffect(() => {
        if (!P.default) return

        if (P.default.startsWith('rgb')) {
            let [rgb, alpha] = StrToRGB(P.default)
            if (RGBToHex(rgb, alpha) != hex()) {
                let hsv = RGBtoHSV(rgb)
                setState({ alpha, hsv, x: hsv.s, y: 100 - hsv.v })
            }
            return
        }

        if (P.default.startsWith('#') && P.default != hex()) {
            let [rgb, alpha] = HexToRGB(P.default)
            let hsv = RGBtoHSV(rgb)
            setState({ alpha, hsv, x: hsv.s, y: 100 - hsv.v })
        }
    })

    createEffect(
        on(
            () => hex(),
            () => P.onChange(hex()),
            { defer: true }
        )
    )

    return (
        <div
            class='color-picker'
            onClick={e => e.stopPropagation()}
            style={{ '--rgb': rgb_str() }}
            classList={{ show: P.show }}
        >
            <div
                class='ccp-gradient ccp-checkered'
                ref={ref}
                onClick={move}
                onMouseDown={() => setState({ active: true })}
                style={{
                    '--hue': gradient_bg(),
                    '--a': state.alpha + '%',
                    '--opacity': (100 - state.alpha) / 100,
                }}
            >
                <div
                    class='ccp-dot'
                    style={{
                        '--x': state.x + '%',
                        '--y': state.y + '%',
                    }}
                ></div>
            </div>
            <Silinder
                class='hue'
                value={state.hsv.h / 3.6}
                onChange={h =>
                    setState(s => ({ hsv: { ...s.hsv, h: h * 3.6 } }))
                }
            />
            <Silinder
                class='alpha ccp-checkered'
                value={state.alpha}
                onChange={alpha => setState({ alpha })}
            />
            <SavedColors
                current={hex()}
                setColor={c => {
                    let [rgb, alpha] = HexToRGB(c)
                    let hsv = RGBtoHSV(rgb)
                    setState({ alpha, hsv, x: hsv.s, y: 100 - hsv.v })
                }}
            />
        </div>
    )
}

type SilinderProps = {
    class?: string
    onChange(value: number): void
    value: number
}
const Silinder: Component<SilinderProps> = P => {
    type State = {
        active: boolean
    }
    const [state, setState] = createStore<State>({
        active: false,
    })
    let ref: HTMLDivElement

    onMount(() => document.addEventListener('mouseup', inactive))
    onCleanup(() => document.removeEventListener('mouseup', inactive))

    function inactive() {
        setState({ active: false })
    }

    function move(e: { currentTarget: HTMLDivElement } & MouseEvent) {
        const { left, right } = ref.getBoundingClientRect()
        if (e.clientX < left) return P.onChange(0)
        if (e.clientX > right) return P.onChange(100)
        P.onChange((e.clientX - left) * (100 / (right - left)))
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
            <div class='ccp-dot' style={{ '--v': P.value + '%' }}></div>
        </div>
    )
}

type SavedColorsProps = {
    setColor(hex: string): void
    current: string
}
const SavedColors: Component<SavedColorsProps> = P => {
    type State = {
        colors: string[]
        active: number
    }
    const [state, setState] = createStore<State>({
        colors: get_colors(),
        active: -1,
    })

    createEffect(() => {
        localStorage.setItem('ccp-saved-colors', JSON.stringify(state.colors))
    })

    function get_colors(): string[] {
        let fst = localStorage.getItem('ccp-saved-colors')
        let colors: string[] = []
        if (fst) colors = JSON.parse(fst) || []

        if (colors.length > 5) colors = colors.slice(0, 5)
        if (colors.length < 5) {
            let empty = Array.from(Array(5 - colors.length), () => '')
            colors = colors.concat(empty)
        }

        return colors
    }

    createEffect(
        on(
            () => P.current,
            () => {
                if (state.active == -1) return
                setState(
                    produce(s => {
                        if (s.colors.find(c => c == P.current)) return
                        s.colors[state.active] = P.current
                    })
                )
            }
        )
    )

    createEffect(
        on(
            () => state.active,
            () => {
                if (state.active == -1) return
                if (!state.colors[state.active]) return
                P.setColor(state.colors[state.active])
            }
        )
    )

    return (
        <div class='ccp-saved-colors'>
            {state.colors.map((c, i) => (
                <div
                    class='ccp-checkered'
                    classList={{ active: state.active == i }}
                    style={{ '--color': c }}
                    onContextMenu={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        setState(produce(s => (s.colors[i] = '')))
                    }}
                    onClick={() => {
                        setState(s => ({ active: s.active == i ? -1 : i }))
                    }}
                >
                    <div class='color'></div>
                    <div class='background-svg'></div>
                </div>
            ))}
        </div>
    )
}

type HSV = {
    s: number
    v: number
    h: number
}
function HSVtoRGB({ h, s, v }: HSV): RGB {
    const saturation = s / 100
    const value = v / 100
    let chroma = saturation * value
    let hueBy60 = h / 60
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
    }
}

type RGB = {
    r: number
    g: number
    b: number
}
function RGBtoHSV({ r, g, b }: RGB): HSV {
    const red = r / 255
    const green = g / 255
    const blue = b / 255
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
    }
}

function RGBToHex({ r, g, b }: RGB, alpha?: number): string {
    let V =
        '#' +
        r.toString(16).padStart(2, '0') +
        g.toString(16).padStart(2, '0') +
        b.toString(16).padStart(2, '0')

    if (alpha != undefined && alpha < 100) {
        V += ((alpha * 2.55) | 0).toString(16).padStart(2, '0')
    }

    return V
}

function HexToRGB(hex: string): [RGB, number] {
    let rgb = { r: 0, g: 0, b: 0 }
    let alpha = 100

    if (hex.length < 3 || hex.length > 9) return [rgb, alpha]
    if (hex.startsWith('#')) hex = hex.slice(1)
    if (hex.length == 5 || hex.length == 7) return [rgb, alpha]

    if (hex.length < 6) {
        let [r, g, b, a] = hex.match(/.{1}/g).map(c => parseInt(c + c, 16))
        rgb = { r, g, b }
        alpha = a || 255
    } else {
        let [r, g, b, a] = hex.match(/.{2}/g).map(c => parseInt(c, 16))
        rgb = { r, g, b }
        alpha = a || 255
    }
    return [rgb, alpha / 2.55]
}

function RGBToStr({ r, g, b }: RGB, alpha?: number): string {
    if (alpha != undefined && alpha < 100)
        return `rgba(${r}, ${g}, ${b}, ${alpha}%)`
    else return `rgb(${r}, ${g}, ${b})`
}

function StrToRGB(str: string): [RGB, number] {
    str = str.trim()
    let rgb = { r: 0, g: 0, b: 0 }
    let alpha = 100

    if (!str.startsWith('rgb')) return [rgb, alpha]

    let [kind, r, g, b, a] = str
        .slice(3)
        .replace(/\(|\)|,/g, '|')
        .split('|')
    rgb.r = parseInt(r) || 0
    rgb.g = parseInt(g) || 0
    rgb.b = parseInt(b) || 0

    if (kind.startsWith('a') && a) {
        if (a.includes('%')) {
            alpha = parseFloat(a.replace('%', '')) || 100
        } else {
            alpha = (parseFloat(a) || 1) * 100
        }
    }

    return [rgb, alpha]
}
