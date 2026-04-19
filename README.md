# Group Project SOTS

Domain information lookup application based on RDAP, MySQL, Redis, Express, React and Docker.

---

# EN version

## 1. Architecture Overview

The project is divided into three main layers:

- **Client** – frontend application responsible for user interaction and data presentation
- **API / Server** – Express backend handling domain lookup, cache logic, history logging and refresh jobs
- **Infrastructure layer** – MySQL for persistent storage and Redis for cache

### Data flow

1. The frontend sends a request to the backend endpoint:
   `GET /api/domain/:name`

2. The backend applies the **Cache-Aside** pattern:
   - first checks Redis using the key format `domain:[name]`
   - if data exists in Redis, it returns the cached response
   - if Redis does not contain the data, the backend checks MySQL
   - if MySQL also does not contain the data, the backend fetches fresh data from the RDAP API

3. Freshly retrieved data is:
   - saved in MySQL
   - saved in Redis cache
   - logged in `LookupHistory`

4. The backend returns a normalized JSON response for the frontend.

### Main backend responsibilities

- domain lookup through RDAP
- MySQL persistence
- Redis cache
- lookup history monitoring
- response time logging
- scheduled refresh of popular domains through cron jobs

---

## 2. Tech Stack

### Management
- GitHub
- Jira

### Backend
- Node.js
- Express

### API Integration
- RDAP

### Database
- MySQL

### ORM / DB Access
- Prisma
- Prisma MariaDB Adapter

### Cache
- Redis

### Frontend
- React
- Vite

### Containerization
- Docker
- Docker Compose

---

## 3. Project Structure

.
├── client/
├── server/
│   ├── config/
│   ├── controllers/
│   ├── jobs/
│   ├── prisma/
│   ├── routes/
│   ├── services/
│   ├── test/
│   ├── .env
│   ├── app.js
│   ├── package.json
│   └── Dockerfile
├── DB/
├── docker-compose.yml
└── README.md

---

## 4. Environment Variables Specification

The backend uses variables from `server/.env`.

### Required variables

- `DATABASE_URL` – full MySQL connection string used by Prisma and the backend
- `REDIS_URL` – Redis connection string used by the cache layer
- `PORT` – port used by the Express application inside the container

### Example `.env`

DATABASE_URL="mysql://root:root@db:3306/domain_info_app"
REDIS_URL="redis://redis:6379"
PORT=3000

---

## 5. Docker Orchestration Guide

The project backend stack is containerized with Docker Compose.

### Services

- **api** – Express backend
- **db** – MySQL database
- **redis** – Redis cache

### Start the stack

Run from the project root:

docker compose up --build

### Stop the stack

docker compose down

### Stop and remove volumes

docker compose down -v

### Check running containers

docker ps

### Expected containers

- `sots-api`
- `sots-mysql`
- `sots-redis`

### API test

After the stack starts successfully, test the endpoint in a browser or with curl:

http://localhost:3000/api/domain/google.com

---

## 6. Prisma Workflow

Prisma schema is located in:

server/prisma/schema.prisma

### Generate Prisma client

Run inside the `server` folder:

npx prisma generate

### Push schema to database

npx prisma db push

### Create a migration

npx prisma migrate dev --name your_migration_name

### Reset development database

npx prisma migrate reset

### Important note

When the application is started through Docker Compose, Prisma schema synchronization is executed during container startup.

---

## 7. Cache-Aside Logic

The endpoint `GET /api/domain/:name` uses the following lookup order:

1. Redis
2. MySQL
3. RDAP

### Redis key convention

domain:[name]

Example:

domain:google.com

### Cache behavior

- **Cache hit** → response returned from Redis
- **Cache miss** → backend checks MySQL
- if MySQL has no data → backend fetches data from RDAP
- fresh data is written to MySQL and Redis

---

## 8. Lookup Monitoring

Each request can create a readable entry in `LookupHistory`.

Tracked values include:
- domain name
- source of data (`REDIS`, `MYSQL`, `RDAP`, `CRON_RDAP`)
- response time in milliseconds
- cache miss status
- query type
- response status
- error message if applicable

This allows basic monitoring of:
- cache efficiency
- domain lookup activity
- source distribution
- performance of responses

---

## 9. Automated Refresh Jobs

The backend includes scheduled refresh logic using `node-cron`.

### Schedule
- Tuesday
- Friday
- 03:00

### Purpose

The refresh job:
- selects the most frequently searched domains
- fetches fresh data from RDAP
- updates MySQL
- refreshes Redis cache

### Manual test script

Run inside `server`:

node test/runDomainRefreshJob.js

---

## 10. Local Development Without Docker

If the backend is started locally instead of Docker, make sure the `.env` file uses local hosts, for example:

DATABASE_URL="mysql://root:root@localhost:3306/domain_info_app"
REDIS_URL="redis://127.0.0.1:6379"
PORT=3000

Then start the backend from `server`:

node app.js

---

## 11. Notes

- The frontend and backend are separated into `client` and `server`
- Redis is used as the first read layer for faster responses
- MySQL stores persistent domain data and lookup history
- RDAP is used as the external source of truth when data is not already available in cache or database

---

# PL version

## 1. Opis architektury

Projekt składa się z trzech głównych warstw:

- **Client** – frontend odpowiedzialny za interakcję z użytkownikiem i prezentację danych
- **API / Server** – backend w Expressie obsługujący wyszukiwanie domen, cache, historię lookupów i zadania cykliczne
- **Warstwa infrastruktury** – MySQL jako trwała baza danych oraz Redis jako pamięć podręczna

### Przepływ danych

1. Frontend wysyła zapytanie do endpointu:
   `GET /api/domain/:name`

2. Backend działa według wzorca **Cache-Aside**:
   - najpierw sprawdza Redis pod kluczem `domain:[name]`
   - jeśli dane są w Redisie, zwraca wynik z cache
   - jeśli w Redisie ich nie ma, sprawdza MySQL
   - jeśli w MySQL też ich nie ma, pobiera świeże dane z RDAP

3. Świeżo pobrane dane są:
   - zapisywane do MySQL
   - zapisywane do Redis
   - logowane w `LookupHistory`

4. Backend odsyła ujednolicony JSON do frontendu.

---

## 2. Stack technologiczny

### Zarządzanie
- GitHub
- Jira

### Backend
- Node.js
- Express

### Integracja API
- RDAP

### Baza danych
- MySQL

### ORM / dostęp do bazy
- Prisma
- Prisma MariaDB Adapter

### Cache
- Redis

### Frontend
- React
- Vite

### Konteneryzacja
- Docker
- Docker Compose

---

## 3. Struktura projektu

.
├── client/
├── server/
│   ├── config/
│   ├── controllers/
│   ├── jobs/
│   ├── prisma/
│   ├── routes/
│   ├── services/
│   ├── test/
│   ├── .env
│   ├── app.js
│   ├── package.json
│   └── Dockerfile
├── DB/
├── docker-compose.yml
└── README.md

---

## 4. Zmienne środowiskowe

Backend korzysta ze zmiennych z pliku `server/.env`.

### Wymagane zmienne

- `DATABASE_URL` – pełny connection string do MySQL używany przez Prismę i backend
- `REDIS_URL` – connection string do Redisa używany przez warstwę cache
- `PORT` – port aplikacji Express wewnątrz kontenera

### Przykład `.env`

DATABASE_URL="mysql://root:root@db:3306/domain_info_app"
REDIS_URL="redis://redis:6379"
PORT=3000

---

## 5. Instrukcja Docker Compose

### Usługi

- **api** – backend Express
- **db** – baza MySQL
- **redis** – cache Redis

### Start całego stacka

Z głównego folderu projektu:

docker compose up --build

### Zatrzymanie stacka

docker compose down

### Zatrzymanie i usunięcie wolumenów

docker compose down -v

### Sprawdzenie działających kontenerów

docker ps

### Test endpointu

Po poprawnym uruchomieniu stacka:

http://localhost:3000/api/domain/google.com

---

## 6. Workflow Prismy

Schema znajduje się w:

server/prisma/schema.prisma

### Generowanie klienta

W folderze `server`:

npx prisma generate

### Synchronizacja schemy z bazą

npx prisma db push

### Tworzenie migracji

npx prisma migrate dev --name nazwa_migracji

### Reset bazy developerskiej

npx prisma migrate reset

### Uwaga

Przy starcie aplikacji przez Docker Compose synchronizacja schemy jest wykonywana automatycznie przy starcie kontenera.

---

## 7. Logika Cache-Aside

Endpoint `GET /api/domain/:name` działa w kolejności:

1. Redis
2. MySQL
3. RDAP

### Konwencja klucza Redis

domain:[name]

Przykład:

domain:google.com

### Zachowanie cache

- **Cache hit** → odpowiedź z Redisa
- **Cache miss** → backend sprawdza MySQL
- jeśli MySQL nie ma danych → backend pobiera je z RDAP
- nowe dane trafiają do MySQL i Redisa

---

## 8. Monitoring lookupów

Każde zapytanie może tworzyć czytelny wpis w `LookupHistory`.

Zapisywane są między innymi:
- nazwa domeny
- źródło danych (`REDIS`, `MYSQL`, `RDAP`, `CRON_RDAP`)
- czas odpowiedzi w milisekundach
- informacja o cache miss
- typ zapytania
- status odpowiedzi
- komunikat błędu, jeśli wystąpi

Dzięki temu można śledzić:
- skuteczność cache
- aktywność wyszukiwań
- źródło danych
- wydajność odpowiedzi

---

## 9. Automatyczne odświeżanie danych

Backend ma zaplanowane odświeżanie danych przy użyciu `node-cron`.

### Harmonogram
- wtorek
- piątek
- 03:00

### Cel

Job:
- pobiera najczęściej wyszukiwane domeny
- pobiera świeże dane z RDAP
- aktualizuje MySQL
- odświeża Redis

### Test ręczny

W folderze `server`:

node test/runDomainRefreshJob.js

---

## 10. Local bez Dockera

Jeśli backend ma działać lokalnie bez Dockera, w `server/.env` trzeba ustawić lokalne hosty, np.:

DATABASE_URL="mysql://root:root@localhost:3306/domain_info_app"
REDIS_URL="redis://127.0.0.1:6379"
PORT=3000

Potem w `server`:

node app.js

---

## 11. Uwagi

- frontend i backend są rozdzielone na `client` i `server`
- Redis jest pierwszą warstwą odczytu dla szybszej odpowiedzi
- MySQL przechowuje trwałe dane domenowe i historię lookupów
- RDAP jest zewnętrznym źródłem prawdy, gdy danych nie ma jeszcze w cache ani w bazie