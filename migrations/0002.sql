

alter table users drop column email;
alter table users drop column photo;
alter table users add column phone text not null default '';

alter table users alter column phone text not null;
