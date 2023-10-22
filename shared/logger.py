import logging
import logging.config
from datetime import date
from logging import FileHandler

from shared import settings


class WeeklyRotating(FileHandler):
    def __init__(self):
        self.path = settings.base_dir / 'logs'
        self.path.mkdir(parents=True, exist_ok=True)

        self.week = self.get_week()
        filename = str(self.path / f'{self.week}.log')

        super().__init__(filename, 'a', 'utf-8')

    def get_week(self):
        today = date.today()
        return (today.month * 4) + (today.day // 7)

    def emit(self, record):
        try:
            week = self.get_week()

            if week != self.week:
                if self.stream:
                    self.stream.close()
                    self.stream = None

                self.path.mkdir(parents=True, exist_ok=True)
                self.baseFilename = str(self.path / f'{week}.log')

                self.week = week
                if not self.delay:
                    self.stream = self._open()

            super().emit(record)

        except Exception:
            self.handleError(record)


logging.config.dictConfig({
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'term': {
            'format': (
                '\033[90m%(asctime)s.%(msecs)03d\033[0m '
                '\033[32m<\033[0m%(levelname)s\033[32m>\033[0m '
                '[\033[33m%(module)s\033[0m]: %(message)s'
            ),
            'datefmt': '%H:%M:%S'
        },
        'file': {
            'format': (
                '%(asctime)s.%(msecs)03d <%(levelname)s> '
                '[%(module)s]: %(message)s'
            ),
            'datefmt': '%Y/%m/%d %H:%M:%S'
        },
    },
    'handlers': {
        'term': {
            'class': 'logging.StreamHandler',
            'formatter': 'term',
        },
        'file': {
            '()': WeeklyRotating,
            'formatter': 'file',
        }
    },
    'root': {
        'handlers': ['term', 'file'],
        'level': 'INFO'
    },
})
