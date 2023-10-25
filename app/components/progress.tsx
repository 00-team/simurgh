import { createStore, produce } from 'solid-js/store'
import './style/progress.scss'

type PUID = number

type Progress = {
    total: number
    loaded: number
    uid: number
}

type ProgressState = {
    list: Progress[]
    total: number
}

const [progress, setProgress] = createStore<ProgressState>({
    list: [],
    total: 0,
})

function addProgress(total: number): PUID {
    let uid: PUID = -1

    setProgress(
        produce(s => {
            s.total++
            uid = s.total
            s.list.push({ total: total || 1, loaded: 0, uid })
        })
    )

    return uid
}

function delProgress(uid: PUID) {
    setProgress(
        produce(s => {
            s.list = s.list.filter(i => i.uid != uid)
        })
    )
}

function updateProgress(uid: PUID, loaded: number, total?: number) {
    setProgress(
        produce(s => {
            s.list.forEach(i => {
                if (i.uid == uid) {
                    i.loaded = loaded
                    if (total) i.total = total
                }
            })
        })
    )
}

export default () => {
    return (
        <div class='progress-fnd'>
            {progress.list.map(({ loaded, total }) => (
                <div class='progress'>
                    {Math.round((100 / total) * loaded)}%
                </div>
            ))}
        </div>
    )
}

export { progress, setProgress, addProgress, delProgress, updateProgress }
