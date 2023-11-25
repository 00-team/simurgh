import { Component, createUniqueId } from 'solid-js'

import './style/components.scss'

type CheckBoxProps = {
    checked: boolean
    update: (value: boolean) => void
    label: string
}

const CheckBox: Component<CheckBoxProps> = P => {
    const id = 'editor_checkbox_' + createUniqueId()

    return (
        <div class='editor-checkbox'>
            <input
                type='checkbox'
                id={id}
                checked={P.checked}
                onchange={e => P.update(e.currentTarget.checked)}
            />
            <label for={id}>{P.label}</label>
        </div>
    )
}

export { CheckBox }
