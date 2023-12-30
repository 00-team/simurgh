

from .langs import MessageModel, Messages, all_langs


def message(key: str):
    messages = Messages()

    for k, lang in all_langs.items():
        messages[k] = MessageModel(
            subject=lang.messages[key][0],
            content='\n'.join(lang.messages[key][1:])
        )

    return messages


msg_verification_code_ok = message('verification_code_ok')
msg_verification_code_sent = message('verification_code_sent')
