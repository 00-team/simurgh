import { createStore, produce } from 'solid-js/store'
import './style/progress.scss'

type Progress = {
    total: number
    loaded: number
}

type ProgressState = {
    list: Progress[]
}

const [progress, setProgress] = createStore<ProgressState>({ list: [] })

function addProgress(total: number): number {
    let index = -10
    setProgress(
        produce(s => {
            index =
                s.list.push({
                    total,
                    loaded: 0,
                }) - 1
        })
    )
    return index
}

function delProgress(index: number) {
    if (index < 0) return

    setProgress(
        produce(s => {
            if (index < s.list.length) {
                s.list.splice(index, 1)
            }
        })
    )
}

function updateProgress(index: number, loaded: number, total?: number) {
    if (index < 0) return

    setProgress(
        produce(s => {
            let p = s.list[index]
            if (!p) return

            p.loaded = loaded
            if (typeof total == 'number') p.total = total
        })
    )
}

export { progress, setProgress, addProgress, delProgress, updateProgress }

export default () => {
    return <div class='progress-fnd'>hi</div>
}
