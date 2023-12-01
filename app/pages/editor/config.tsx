import { Component } from 'solid-js'

import './style/config.scss'
import { EyeIcon, EyeOffIcon, TrashIcon } from '!/icons/editor'
import { setWareHouse, warehouse } from './state'

const BlockConfig: Component = () => {
    return (
        <div class='base-conf'>
            <button>A</button>
            <button>B</button>
            <button disabled>
                <TrashIcon />
            </button>
            <button
                onClick={() =>
                    setWareHouse(s => ({
                        show_groups: !s.show_groups,
                    }))
                }
            >
                {warehouse.show_groups ? <EyeOffIcon /> : <EyeIcon />}
            </button>

            <button>D</button>
        </div>
    )
}

export default BlockConfig
