import multiprocessing

chdir = '/simurgh/'
# workers = multiprocessing.cpu_count() * 2 + 1
threads = multiprocessing.cpu_count() * 2 + 1
wsgi_app = 'main:app'
proc_name = 'simurgh gun'
worker_class = 'uvicorn.workers.UvicornWorker'
venv = '/simurgh/.env/bin/activate'
bind = 'unix:///usr/share/nginx/sockets/simurgh.sock'
loglevel = 'info'
accesslog = '/var/log/simurgh/access.log'
acceslogformat = '%(h)s %(l)s %(u)s %(t)s %(r)s %(s)s %(b)s %(f)s %(a)s'
errorlog = '/var/log/simurgh/error.log'
