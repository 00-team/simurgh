
PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

drop table users;

CREATE TABLE users (
    id integer primary key not null,
    phone text not null unique,
    name text not null default '',
    token text,
    admin boolean not null default false,
    client boolean not null default false,
    banned boolean not null default false
);

insert into users(phone, name, admin) values ('1', '007', true);
insert into users(phone, name, client) values ('2', 'saied', true);
insert into users(phone, name, admin) values ('3', 'sadra', true);

alter table projects rename column user to owner;
alter table projects add column storage_limit_mg integer not null default 1024;
alter table projects add column subscription_until integer not null default 0;


CREATE TABLE records_new (
    id integer primary key not null,
    project integer not null references projects(id) on delete cascade,
    salt text not null,
    size integer not null,
    kind integer not null,

    tag text not null default 'none',
    duration double not null default 0,
    has_m3u8 boolean not null default false,
    width integer not null default 0,
    height integer not null default 0,

    usage_count integer not null default 0,

    created_at integer not null
);

INSERT INTO records_new (id, project, salt, size, created_at, kind)
    SELECT id, project, salt, size, created_at, 0 FROM records;

DROP TABLE records;
ALTER TABLE records_new RENAME TO records;

create index idx_records_tags on records(tag);
create index idx_records_project on records(project);

create table record_blog_usage (
    record integer not null references records(id) on delete cascade,
    blog integer not null references blogs(id) on delete cascade,
    primary key(blog, record)
) without rowid;

create index idx_blog_tag_tag on blog_tag(tag);

-- Increment when a usage is added
CREATE TRIGGER record_blog_usage_ai
AFTER INSERT ON record_blog_usage
BEGIN
    UPDATE records
    SET usage_count = usage_count + 1
    WHERE id = NEW.record;
END;

-- Decrement when a usage is removed
CREATE TRIGGER record_blog_usage_ad
AFTER DELETE ON record_blog_usage
BEGIN
    UPDATE records
    SET usage_count = usage_count - 1
    WHERE id = OLD.record;
END;

PRAGMA foreign_key_check;

COMMIT;


create table blogs_new (
    id integer primary key not null,
    slug text not null,
    status integer not null default 0,
    category integer references blog_categories(id) on delete set null,
    project integer not null references projects(id) on delete cascade,
    author integer references users(id) on delete set null,
    created_at integer not null,
    updated_at integer not null default 0,
    publish_at integer,
    title text not null default '',
    detail text not null default '',
    html text not null default '',
    data text not null default '[]',
    read_time integer not null default 0,
    thumbnail integer references records(id) on delete set null,
    thumbnail_url text,
    unique(slug, project)
);

delete from blogs where project is null;

INSERT INTO blogs_new (
    id, slug, status, category, project, author, created_at, updated_at,
    publish_at, title, detail, html, data, read_time, thumbnail_url
) SELECT 
    id, slug, status, category, project, author, created_at, updated_at,
    publish_at, title, detail, html, data, read_time, thumbnail
FROM blogs;

DROP TABLE blogs;
ALTER TABLE blogs_new RENAME TO blogs;

PRAGMA foreign_key_check;

CREATE TRIGGER blogs_clear_thumbnail_url
BEFORE DELETE ON records
BEGIN
  UPDATE blogs
  SET thumbnail_url = NULL
  WHERE thumbnail = OLD.id;
END;

begin;

INSERT INTO records (project, salt, size, created_at, kind)
    SELECT project, thumbnail_url, 0, unixepoch(), 0
    FROM blogs
    WHERE thumbnail_url IS NOT NULL AND thumbnail_url <> '';


UPDATE blogs SET
    thumbnail = r.id,
    thumbnail_url = '/simurgh-record/' || blogs.project
        || '/' || substr(r.salt, 1, 2)
        || '/' || r.id || '-' || r.salt || '.webp'
    FROM records r
    WHERE r.project = blogs.project
        AND r.salt = blogs.thumbnail_url
        AND blogs.thumbnail_url IS NOT NULL AND blogs.thumbnail_url <> '';

COMMIT;


