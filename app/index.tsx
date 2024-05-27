import { render } from 'solid-js/web'

const Root = () => {
    return (
        <div>
            <h1>Simurgh Verification</h1>
            <p>
                your verification code:{' '}
                <code style='font-size: 18px'>12345</code>
            </p>
        </div>
    )
}

render(Root, document.getElementById('root'))
