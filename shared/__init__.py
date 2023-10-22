

import sqlite3
from pathlib import Path
from string import ascii_letters, digits

from databases import Database
from pydantic_settings import BaseSettings
from redis.asyncio import Redis


class Connection(sqlite3.Connection):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.execute('pragma foreign_keys=1')


class Settings(BaseSettings):
    base_dir: Path = Path(__file__).parent.parent
    debug: bool = False

    version: str = '0.0.1-beta'

    sql_dir: Path = base_dir / 'db/files/'
    record_dir: Path = base_dir / 'records/'
    user_picture_dir: Path = record_dir / 'users/'

    redis_pass: str

    verification_expire: int = 2 * 60
    verification_code_len: int = 5

    token_len: int = 69
    token_abc: str = ascii_letters + digits + ('!@#$%^&*_+' * 2)

    page_size: int = 10


settings = Settings(_env_file='.secrets')
settings.sql_dir.mkdir(parents=True, exist_ok=True)
settings.record_dir.mkdir(parents=True, exist_ok=True)
settings.user_picture_dir.mkdir(parents=True, exist_ok=True)
(settings.base_dir / 'db/versions').mkdir(parents=True, exist_ok=True)


SQL_URL = 'sqlite:///'
if settings.debug:
    SQL_URL += str(settings.sql_dir / 'debug.db')
else:
    SQL_URL += str(settings.sql_dir / 'main.db')


redis = Redis(
    password=settings.redis_pass,
    unix_socket_path='/run/redis/simurgh.sock'
)

sqlx = Database(SQL_URL, factory=Connection)
