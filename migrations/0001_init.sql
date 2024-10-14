
create table if not exists users (
    id integer primary key not null,
    email text not null,
    name text,
    photo text,
    token text,
    admin boolean not null default false,
    client boolean not null default false,
    banned boolean not null default false
);

create table if not exists projects (
    id integer primary key not null,
    user integer references users(id) on delete set null,
    name text not null,
    storage integer not null default 0,
    blog_count integer not null default 0,
    blog_category_count integer not null default 0,
    blog_tag_count integer not null default 0,
    record_count integer not null default 0,
    created_at integer not null,
    updated_at integer not null default 0,
    api_key text
);

create table if not exists records (
    id integer primary key not null,
    project integer references projects(id) on delete set null,
    name text not null,
    salt text not null,
    size integer not null,
    created_at integer not null,
    mime text,
    usages text not null default '[]'
);

create table if not exists blogs (
    id integer primary key not null,
    slug text not null,
    status integer not null default 0,
    category integer references blog_categories(id) on delete set null,
    project integer references projects(id) on delete set null,
    author integer references users(id) on delete set null,
    created_at integer not null,
    updated_at integer not null default 0,
    title text not null default '',
    detail text not null default '',
    html text not null default '',
    data text not null default '[]',
    read_time integer not null default 0,
    thumbnail text,
    unique(slug, project)
);

create table if not exists blog_categories (
    id integer primary key not null,
    slug text not null,
    project integer not null references projects(id) on delete cascade,
    label text not null,
    detail text not null default '',
    count integer not null default 0,
    unique(slug, project)
);

create table if not exists blog_tags (
    id integer primary key not null,
    slug text not null,
    project integer not null references projects(id) on delete cascade,
    label text not null,
    detail text not null default '',
    count integer not null default 0,
    unique(slug, project)
);

create table if not exists blog_tag (
    blog integer not null references blogs(id) on delete cascade,
    tag integer not null references blog_tags(id) on delete cascade,
    unique(blog, tag),
    primary key(blog, tag)
);
