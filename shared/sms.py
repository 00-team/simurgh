
# import httpx

from shared import settings

# BASE_API = 'https://console.melipayamak.com/api'


async def sms_send_code(phone: str, code: str):
    if True or settings.debug:
        print(
            '--------------------\n'
            f'phone: {phone}\ncode: {code}\n'
            '--------------------'
        )
        return

    # httpx.post(
    #     f'{BASE_API}/send/simple/{settings.meilisms_tokne}',
    #     json={
    #         'from': 'xxxx',
    #         'to': phone,
    #         'text': f'کد ورود شما به حیدری: {code}'
    #     }
    # )
