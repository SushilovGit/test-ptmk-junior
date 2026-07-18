

Здравствуйте, Вячеслав Александрович,

Ваше резюме нас заинтересовало и мы предлагаем Вам выполнить тестовое задание.
Мы рассмотрим результаты, которые выполнены в течении недели.

Результаты присылайте на адрес office@ptmk.ru
В теме письма прошу указать "Junior - младший разработчик: Фамилию Имя Отчество".
Мы рассмотрим ответы сделанные в течении недели.

С уважением,
Иванов Юрий

==============================
Разработать приложение (консольное или веб) для учёта заявок сотрудников.

Бизнес-процесс
Заявка проходит следующие этапы:

Новая → В работе → Выполнена

Переход между статусами должен соответствовать бизнес-правилам. Например, заявка не может быть переведена из статуса «Новая» сразу в статус «Выполнена».

# Функциональные требования
1. Сотрудники
Реализовать справочник сотрудников:
ФИО;
подразделение;
должность.

2. Заявки
Реализовать создание заявок со следующими полями:
номер;
дата создания;
автор;
исполнитель;
описание;
срок выполнения;
статус.

3. Работа с заявками
Реализовать возможность:
изменить статус заявки с проверкой допустимости перехода;
изменить исполнителя;
вывести список заявок с фильтрацией:
    по статусу;
    по исполнителю;
    по подразделению;
    по просроченным заявкам.
4. Отчётность

Сформировать отчёт:
    количество заявок по каждому статусу;
    количество просроченных заявок;
    количество выполненных заявок по исполнителям.


Требования к базе данных

Спроектировать структуру базы данных таким образом, чтобы:
отсутствовало необоснованное дублирование данных;
использовались связи между сущностями;
соблюдались принципы нормализации.

Необходимо кратко объяснить принятые решения по структуре базы данных.
Производительность

Заполнить базу тестовыми данными:
не менее 1 000 000 заявок;
не менее 1000 сотрудников.

Выполнить запрос:
вывести все просроченные заявки конкретного исполнителя, находящиеся в статусе «В работе», отсортированные по сроку выполнения.
![alt text](image-1.png)



Замерить время выполнения запроса.
После этого выполнить оптимизацию предложив и описав методы оптимизации, повторить замер и кратко описать:
какие изменения были внесены;
почему они ускоряют выполнение;
результаты измерений до и после оптимизации.

Технические требования
Использовать любой объектно-ориентированный язык программирования.
Использовать SQL СУБД или MongoDB.
Обязательно реализовать объектную модель предметной области.
Код должен быть структурирован и легко расширяем.
Результат выполнения

Предоставить:
исходный код;
инструкцию по запуску;
краткое описание реализованного бизнес-процесса;
описание реализованных бизнес-правил;
описание выполненной оптимизации базы данных и результатов замеров производительности.

Дополнительное задание (по желанию)

Опишите в письме, какие изменения потребуется внести в систему, если:

заявка должна проходить согласование руководителем;
у заявки может быть несколько исполнителей;
необходимо хранить историю изменения статусов;
сроки выполнения зависят от типа заявки;
требуется разграничение прав доступа (сотрудник, руководитель, администратор).
==============================






GET http://127.0.0.1:8000/tickets?limit=24&offset=24



http://127.0.0.1:8000/tickets/filtered?limit=10&is_overdue=true&status=IN_PROGRESS&assignee_id=1&offset=0&department_id=2





log:

Главная страница:
backend   | Запрос /tickets/filtered выполнен за 0.4496 сек.
backend   | INFO:     172.21.0.1:40518 - "GET /tickets/filtered?sorted_by=deadline&sorted_order=asc&limit=10&offset=0 HTTP/1.1" 200 OK
backend   | Запрос /tickets/filtered выполнен за 0.4483 сек.
backend   | INFO:     172.21.0.1:40534 - "GET /tickets/filtered?sorted_by=deadline&sorted_order=asc&limit=10&offset=0 HTTP/1.1" 200 OK






GET http://127.0.0.1:8000/tickets?limit=24&offset=24



http://127.0.0.1:8000/tickets/filtered?limit=10&is_overdue=true&status=IN_PROGRESS&assignee_id=1&offset=0&department_id=2




user@starlight:~$ curl -w "\nВремя выполнения: %{time_total} сек.\n" -o /dev/null -s "http://localhost:8000/tickets/filtered?sorted_by=deadline&sorted_order=asc&limit=10&status=IN_PROGRESS&assignee_id=622&is_overdue=true"

Время выполнения: 0.371045 сек.




user@starlight:~$ curl -w "\nВремя: %{time_total} сек.\n" -o /dev/null -s "http://localhost:8000/tickets/filtered?sorted_by=deadline&sorted_order=asc&limit=10&status=IN_PROGRESS&assignee_id=622&is_overdue=true"

Время: 0.017862 сек.
user@starlight:~$ curl -w "\nВремя: %{time_total} сек.\n" -o /dev/null -s "http://localhost:8000/tickets/filtered?sorted_by=deadline&sorted_order=asc&limit=10&status=IN_PROGRESS&assignee_id=622&is_overdue=true"

Время: 0.015587 сек.
user@starlight:~$ curl -w "\nВремя: %{time_total} сек.\n" -o /dev/null -s "http://localhost:8000/tickets/filtered?sorted_by=deadline&sorted_order=asc&limit=10&status=IN_PROGRESS&assignee_id=622&is_overdue=true"

Время: 0.016303 сек.









Запрос /tickets/filtered выполнен за 0.2240 сек.
backend   | INFO:     172.21.0.1:60704 - "GET /tickets/filtered?sorted_by=deadline&sorted_order=asc&limit=10&offset=0 HTTP/1.1" 200 OK
backend   | Запрос /tickets/filtered выполнен за 0.2632 сек.
backend   | INFO:     172.21.0.1:60692 - "GET /tickets/filtered?sorted_by=deadline&sorted_order=asc&limit=10&offset=0 HTTP/1.1" 200 OK
backend   | Запрос /employee/ выполнен за 0.0588 сек.
backend   | INFO:     172.21.0.1:60714 - "GET /employee/?sorted_by=id&sorted_order=asc&limit=24&offset=0 HTTP/1.1" 200 OK
backend   | Запрос /employee/ выполнен за 0.0379 сек.
backend   | INFO:     172.21.0.1:60718 - "GET /employee/?sorted_by=id&sorted_order=asc&limit=24&offset=0 HTTP/1.1" 200 OK
backend   | Запрос /stats/general выполнен за 0.4778 сек.
backend   | INFO:     172.21.0.1:60714 - "GET /stats/general HTTP/1.1" 200 OK
backend   | Запрос /stats/assignees выполнен за 0.5572 сек.
backend   | INFO:     172.21.0.1:60718 - "GET /stats/assignees HTTP/1.1" 200 OK
backend   | Запрос /stats/general выполнен за 0.5701 сек.
backend   | INFO:     172.21.0.1:41098 - "GET /stats/general HTTP/1.1" 200 OK
backend   | Запрос /stats/assignees выполнен за 0.6597 сек.
backend   | INFO:     172.21.0.1:41112 - "GET /stats/assignees HTTP/1.1" 200 OK
backend   | Запрос /tickets/filtered выполнен за 0.0880 сек.
backend   | INFO:     172.21.0.1:41122 - "GET /tickets/filtered?sorted_by=deadline&sorted_order=asc&limit=10&offset=0 HTTP/1.1" 200 OK
backend   | Запрос /tickets/filtered выполнен за 0.0864 сек.
backend   | INFO:     172.21.0.1:41132 - "GET /tickets/filtered?sorted_by=deadline&sorted_order=asc&limit=10&offset=0 HTTP/1.1" 200 OK
backend   | Запрос /tickets/filtered выполнен за 0.1513 сек.
backend   | INFO:     172.21.0.1:50910 - "GET /tickets/filtered?sorted_by=deadline&sorted_order=asc&limit=10&offset=0&status=IN_PROGRESS HTTP/1.1" 200 OK
backend   | Запрос /tickets/filtered выполнен за 0.0237 сек.
backend   | INFO:     172.21.0.1:50910 - "GET /tickets/filtered?sorted_by=deadline&sorted_order=asc&limit=10&offset=0&status=IN_PROGRESS&assignee_id=6 HTTP/1.1" 200 OK
backend   | Запрос /tickets/filtered выполнен за 0.0078 сек.
backend   | INFO:     172.21.0.1:50910 - "GET /tickets/filtered?sorted_by=deadline&sorted_order=asc&limit=10&offset=0&status=IN_PROGRESS&assignee_id=62 HTTP/1.1" 200 OK
backend   | Запрос /tickets/filtered выполнен за 0.0171 сек.
backend   | INFO:     172.21.0.1:50910 - "GET /tickets/filtered?sorted_by=deadline&sorted_order=asc&limit=10&offset=0&status=IN_PROGRESS&assignee_id=622 HTTP/1.1" 200 OK
backend   | Запрос /tickets/filtered выполнен за 0.0229 сек.
backend   | INFO:     172.21.0.1:50910 - "GET /tickets/filtered?sorted_by=deadline&sorted_order=asc&limit=10&offset=0&status=IN_PROGRESS&assignee_id=622&is_overdue=true HTTP/1.1" 200 OK