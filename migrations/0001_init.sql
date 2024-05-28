
create table if not exists users (
    id integer primary key not null,
    email text not null,
    name text,
    photo text,
    token text not null,
    admin boolean not null default false,
    client boolean not null default false,
    banned boolean not null default false
);

create table if not exists languages (
    id text primary key not null,
    label text not null,
    emoji text not null
);

create table if not exists orders (
    id integer primary key not null,
    user integer not null references users(id) on delete cascade,
    name text not null,
    storage integer not null default 0,
    blog_count integer not null default 0,
    record_count integer not null default 0,
    timestamp integer not null default 0,
    api_key text
);

create table if not exists records (
    id integer primary key not null,
    project integer references projects(id) on delete set null,
    salt text not null,
    size integer not null,
    timestamp integer not null,
    mime text,
    ext text
);

create table if not exists blogs (
    id integer primary key not null,
    slug text not null,
    project integer not null references projects(id) on delete cascade,
    author integer not null references users(id) on delete cascade,
    created integer not null,
    updated integer not null default 0,
    thumbnail text,
    read_time integer,
    unique(slug, project)
);


create table if not exists blog_contents (
    id integer primary key not null,
    blog integer not null references blogs(id) on delete cascade,
    lang integer not null references languages(id) on delete cascade,
    title text not null,
    description text not null,
    html text not null,
    data text not null default '{}',
    unique(blog, lang)
);