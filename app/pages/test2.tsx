import { onMount } from 'solid-js'

var canvas: HTMLCanvasElement
var context: CanvasRenderingContext2D

const BOX = 1024
var angle = 0

function draw() {
    const r = 200
    let x = r * Math.sin((Math.PI * 2 * angle) / 360)
    let y = r * Math.cos((Math.PI * 2 * angle) / 360)

    context.beginPath()
    context.rect(x + BOX / 2, y + BOX / 2, 20, 20)
    // context.arc(x + BOX / 2, y + BOX / 2, 20, 0, 2 * Math.PI)
    context.fillStyle = 'red'
    context.fill()
    context.closePath()

    context.fillStyle = 'rgb(0, 0, 0, 0.05)'
    context.fillRect(0, 0, BOX, BOX)

    angle++
}

export default () => {
    onMount(() => {
        // draw()
        setInterval(draw, 40)
    })

    return (
        <div class='test-container'>
            <canvas
                style={{ border: '2px solid red', height: '90vh' }}
                width={BOX}
                height={BOX}
                ref={c => {
                    canvas = c
                    context = c.getContext('2d')!
                }}
            />
        </div>
    )
}
