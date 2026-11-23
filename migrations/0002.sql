
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


CREATE TABLE records_new (
    id integer primary key not null,
    project integer not null references projects(id) on delete cascade,
    salt text not null,
    size integer not null,
    created_at integer not null,
    kind integer not null,
    usages text not null default '[]'
);

INSERT INTO records_new (id, project, salt, size, created_at, kind, usages)
    SELECT id, project, salt, size, created_at, 0, usages FROM records;

DROP TABLE records;
ALTER TABLE records_new RENAME TO records;

PRAGMA foreign_key_check;

COMMIT;

alter table blogs rename column thumbnail to thumbnail_url;
alter table blogs add column thumbnail integer references records(id) on delete set null;

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


