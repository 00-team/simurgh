import { BlogMap } from 'models'
import { Component, createEffect, onCleanup, onMount } from 'solid-js'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { DEFAULT_BLOCKS } from 'models'

import { createStore, produce } from 'solid-js/store'
import { setStore } from './store'
import './style/map.scss'

type Props = {
    idx: number
    block: BlogMap
}

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
})

export const EditorMapBlock: Component<Props> = P => {
    const [marker, setMarker] = createStore({
        lat: P.block.latitude || DEFAULT_BLOCKS['map'].latitude,
        lng: P.block.longitude || DEFAULT_BLOCKS['map'].longitude,
    })

    let map
    let oldMarker

    onMount(() => {
        map = L.map('map').setView([marker.lat, marker.lng], 15)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)

        update_map()

        map.on('click', function (e) {
            if (oldMarker) {
                map.removeLayer(oldMarker)
            }
            setMarker(e.latlng)

            update_map()
        })

        createEffect(() => {
            if (oldMarker) {
                map.removeLayer(oldMarker)
            }
            oldMarker = L.marker(marker).addTo(map)
        })

        onCleanup(() => {
            map.remove()
        })
    })

    function update_map() {
        setStore(
            produce(s => {
                let b = s.data[P.idx] as BlogMap
                b.latitude = marker.lat
                b.longitude = marker.lng
            })
        )
    }

    return (
        <div class='block-map'>
            <h3 class='title'>نقطه روی نقشه رو انتخاب کنید</h3>
            <p class='title_smaller'>با کلیک کردن میتونید نقطه رو عوض کنید.</p>
            <div
                id='map'
                style={{ height: '500px', width: 'clamp(0px,100%,1500px)' }}
            ></div>
        </div>
    )
}
