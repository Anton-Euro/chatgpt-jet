create table settings
(
    key   varchar(50) not null,
    value text
);

INSERT INTO settings (key) VALUES ('model');
INSERT INTO settings (key) VALUES ('provider');
INSERT INTO settings (key) VALUES ('web_search');
INSERT INTO settings (key) VALUES ('generated_title');

create table chat_info
(
    chat_id       varchar(50),
    title_name    text,
    creation_date timestamp
);

create table messages
(
    chat_id    varchar(50),
    message_id integer,
    role       varchar(20),
    message    text
);

