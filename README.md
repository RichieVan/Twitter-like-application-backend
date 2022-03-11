# Twitter-like application (backend)
REST API для клиентской части

Основной стэк: 
- Node.js с express
- БД Postgres
- Sequelize ORM
- Imgur API

Клиент-серверное взаимодействие:
- Для хранения данных используется БД Postgres и ORM Sequelize
- Изображения хранятся на Imgur, получение и загрузка через API используя axios
- Авторизация по access и refresh токенам, передача в формате JWT
- Роутинг происходит на клиенте
