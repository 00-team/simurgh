import { Component, JSX, Show } from 'solid-js'
import { Tooltip } from './tooltip'

type IconProps = {
    icon: () => JSX.Element
}

type TextProps = {
    text: JSX.Element
}

type Props = (IconProps | TextProps) & {
    onAct(): void
    title?: JSX.Element
    color?: string
    active?: boolean
}

export const Action: Component<Props> = P => {
    return (
        <button
            class='styled ttle_small'
            classList={{
                icon: 'icon' in P,
                active: P.active,
            }}
            style={{ '--color': P.color }}
            onClick={P.onAct}
        >
            <Show when={P.title}>
                <Tooltip>{P.title}</Tooltip>
            </Show>
            {'icon' in P ? P.icon() : P.text}
        </button>
    )
}
