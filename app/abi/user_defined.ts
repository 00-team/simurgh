import * as cbor from 'cbor-x'
import { httpx, HttpxProps } from './httpx'
import { AppErr } from './gen'

export type { HttpxProps }
export { httpx }

export type Ok<T> = { status: 200; body: T }
export type Err = { status: number; body: AppErr }
export type Base<T> = {
    r: Response
    p: HttpxProps
    ok(): this is Ok<T>
    err(): this is Err
}

export type Result<T> = Base<T> & (Ok<T> | Err)

export function binjin_decode<T>(bytes: Uint8Array): T {
    bytes = bytes.map(v => v ^ 153 ^ 97)
    return cbor.decode(bytes)
}
