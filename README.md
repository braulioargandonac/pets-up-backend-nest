# Pets Üp\! - API Backend

**Sitio Web Oficial:** [**https://www.petsup.cl**](https://www.petsup.cl)

[![NestJS](https://img.shields.io/badge/built%20with-NestJS-red.svg)](http://nestjs.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-blue.svg)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/container-Docker-blue.svg)](https://www.docker.com/)

Este repositorio contiene el backend oficial de la plataforma Pets Üp\!. Es una API RESTful robusta construida con NestJS, diseñada para manejar adopciones de mascotas, reportes de mascotas perdidas, un sistema avanzado de cuidado de mascotas comunitarias y un directorio de veterinarias con búsqueda geoespacial.

-----

## Features

El backend está construido sobre una arquitectura modular siguiendo los principios SOLID.

  * **Autenticación y Roles (RBAC):** Sistema completo de registro y login con JWT. Los roles (`ADMIN`, `USER`, `VET_OWNER`) protegen endpoints específicos.
  * **Módulo de Adopción (`PetModule`):** CRUD completo para perfiles de mascotas, incluyendo borrado lógico (`isActive`), gestión de fotos (subir 1-10 fotos, borrar, reordenar) y autorización por dueño.
  * **Módulo de Mascotas Perdidas (`LostPetModule`):** Flujo completo para reportar mascotas como perdidas, listarlas (paginado), reportar un avistamiento (con foto y GPS) y marcarlas como encontradas.
  * **Módulo de Mascotas Comunitarias (Avanzado):**
      * **Perfiles:** CRUD completo para perfiles de mascotas comunitarias (crear, editar, desactivar/restaurar) con gestión de fotos y autorización del creador.
      * **Muro Social (`Posts`):** CRUD completo para posts del "muro" (con fotos, likes) y gestión de fotos del post.
      * **Foro (`Comments`):** CRUD completo para comentarios (respuestas) en los posts.
      * **Bitácora (`Logs`):** CRUD completo para un historial de cuidado (Salud, Comida, etc.) con moderación del creador.
      * **Tareas (`Tasks`):** Sistema completo de tareas (crear, listar, editar, borrar, asignar y completar).
  * **Módulo de Veterinarias (`VetModule`):**
      * **Registro (`VET_OWNER`):** Endpoint para registrar clínicas, incluyendo servicios y horarios en una sola transacción.
      * **Gestión:** CRUD completo para perfiles de Vets, gestión de fotos (logo y galería), y actualización de servicios/horarios.
      * **Búsqueda Geoespacial (PostGIS):** Endpoint `GET /api/v1/vets/nearby` que filtra por radio (km), servicios y si están **abiertas ahora**.
  * **Módulo de Moderación (`ReportModule`):**
      * `POST /api/v1/reports`: Endpoint para que los usuarios reporten `Pets`, `CommunityPets`, `Posts`, `Comments` o `Users`.
      * `GET /api/v1/reports`: Endpoint (protegido para `ADMIN`) para revisar los reportes.
  * **Catálogos (`CatalogModule`):** Endpoints (`GET /api/v1/catalog/...`) altamente cacheados para todos los datos estáticos (Regiones, Comunas, Especies, Razas, Tipos de Log, etc.).

-----

## 🏛️ Arquitectura y Principios Aplicados

  * **Contenedorización:** Todo el entorno (API + Base de Datos) está 100% dockerizado con **Docker Compose**.
  * **Base de Datos:** **PostgreSQL** con la extensión **PostGIS** para consultas geoespaciales eficientes (usando `ST_DWithin` y `ST_MakePoint`).
  * **ORM:** **Prisma** para una interacción segura y tipada con la base de datos.
  * **Principios SOLID:**
      * **SRP (Responsabilidad Única):** Separación estricta entre `Controllers` (API), `Services` (Lógica de Negocio) y `Repositories` (Prisma).
      * **DIP (Inversión de Dependencias):** Uso extensivo de Inyección de Dependencias (DI) de NestJS.
  * **Borrado Lógico (Soft Delete):** Los perfiles de `Pet` y `CommunityPet` usan un flag `isActive` para no perder datos históricos para analítica o IA.

-----

## 🛠️ Stack Tecnológico

  * [NestJS](https://nestjs.com/) (Framework de Backend)
  * [TypeScript](https://www.typescriptlang.org/)
  * [Prisma](https://www.prisma.io/) (ORM)
  * [PostgreSQL](https://www.postgresql.org/)
  * [PostGIS](https://postgis.net/) (Extensión Geoespacial)
  * [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
  * [JWT](https://jwt.io/) (Autenticación)
  * `class-validator` & `class-transformer` (Validación de DTOs)
  * `multer` (Subida de archivos)

-----

## 🚀 Cómo Empezar

### Prerrequisitos

  * [Docker](https://www.docker.com/products/docker-desktop/)
  * [Node.js](https://nodejs.org/) (para `npx`)

### 1\. Clonar el Repositorio

```bash
git clone https://github.com/braulioargandonac/pets-up-backend-nest.git
cd pets-up-backend-nest
```

### 2\. Configurar Variables de Entorno

Este proyecto usa un archivo `.env.development` para la configuración. Crea este archivo en la raíz del proyecto.

```bash
touch .env.development
```

Abre `.env.development` y pega el siguiente contenido:

```env
# Configuración de la Base de Datos PostgreSQL
# Estos valores deben coincidir con docker-compose.yml
POSTGRES_USER=admin
POSTGRES_PASSWORD=adminpass
POSTGRES_DB=pet_app_db

# Puerto de la App NestJS
APP_PORT=3000

# Puerto expuesto por Docker para la DB
DB_PORT=5432

# URL de conexión para Prisma (usa el nombre del servicio de Docker)
DATABASE_URL="postgresql://admin:adminpass@postgres-db:5432/pet_app_db?schema=public"

# Clave secreta para firmar los tokens JWT
JWT_SECRET=este-es-un-secreto-muy-largo-y-seguro-cambiame

# URL pública del servidor (para las URLs de imágenes)
APP_URL=http://localhost:3000
```

### 3\. Levantar los Contenedores

La primera vez, debes destruir cualquier volumen antiguo y aplicar todas las migraciones para configurar la base de datos con PostGIS.

```bash
# 1. Destruye contenedores y volúmenes antiguos (si existen)
docker-compose down -v

# 2. Levanta la API y la Base de Datos PostGIS
docker-compose up -d --build

# 3. Aplica TODAS las migraciones (esto crea las tablas y puebla los catálogos)
docker-compose exec app npx prisma migrate dev
```

La API ahora estará corriendo en `http://localhost:3000`.

### 4\. Regenerar el Cliente de Prisma

Si haces cambios en el `schema.prisma`, recuerda siempre regenerar el cliente localmente (para tu editor) y en el contenedor (para la app).

```bash
# Local (para VS Code/ESLint)
npx prisma generate --schema=./project/prisma/schema.prisma

# Contenedor (para la app)
docker-compose exec app npx prisma generate
```

-----

## 📚 Comandos Útiles de Docker

```bash
# Levantar contenedores en segundo plano
docker-compose up -d

# Detener contenedores
docker-compose down

# Detener y BORRAR volúmenes de datos (Hard Reset)
docker-compose down -v

# Ver logs de la API en vivo
docker-compose logs -f app

# Entrar al shell del contenedor de la API
docker-compose exec -it app sh

# Entrar al shell de la base de datos
docker-compose exec -it postgres-db psql -U admin -d pet_app_db
```