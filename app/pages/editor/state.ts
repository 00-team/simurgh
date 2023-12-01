import { createStore } from 'solid-js/store'
import { Block, DEFAULT_BLOCKS } from './models'

type State = {
    blocks_changed: number
    blocks: Block[]
    active: {
        id: number
        type: Block['type']
    }
    show_groups: boolean
}

const [warehouse, setWareHouse] = createStore<State>({
    show_groups: false,
    blocks_changed: 0,
    blocks: [
        DEFAULT_BLOCKS.text,
        DEFAULT_BLOCKS.empty,
        {
            type: 'text',
            data: [
                { content: ['01'] },
                {
                    content: ['2345678abcdefg'],
                    color: '#00ff00',
                },
                { content: ['very cool'] },
                { content: ['this is good stuff'] },
            ],
            active: -1,
            dir: 'ltr',
        },
    ],
    active: {
        id: 2,
        type: 'text',
    },
})

export { warehouse, setWareHouse }
