# Backend API para POS Móvil

Este es el backend de la aplicación móvil de Punto de Venta (POS), construida con Node.js, Express y PostgreSQL. Proporciona una API RESTful para gestionar usuarios, productos, proveedores y ventas.

## Características

- Autenticación de usuarios con JWT.
- Gestión CRUD de productos.
- Gestión CRUD de proveedores.
- Registro de ventas con actualización automática de stock.

## Configuración del Proyecto

### Requisitos

- Node.js (v14 o superior)
- npm o Yarn
- PostgreSQL (v12 o superior)

### Instalación

1.  Clona el repositorio:
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd backend
    ```

2.  Instala las dependencias:
    ```bash
    npm install
    ```

### Base de Datos

1.  Asegúrate de tener una instancia de PostgreSQL corriendo localmente.
2.  Crea una base de datos y un usuario para el proyecto (ej. `pos_db`, `pos_user`).
3.  Aplica el esquema de la base de datos:
    ```bash
    psql -h localhost -U pos_user -d pos_db -f schema.sql
    ```
4.  (Opcional) Inserta datos de ejemplo:
    ```bash
    psql -h localhost -U pos_user -d pos_db -f seed.sql
    ```

### Variables de Entorno

Crea un archivo `.env` en la raíz del directorio `backend` con las siguientes variables:

```env
PORT=3000
DB_USER=pos_user
DB_HOST=localhost
DB_NAME=pos_db
DB_PASSWORD=mypassword # Reemplaza con tu contraseña real
DB_PORT=5432
JWT_SECRET=your_jwt_secret_key # Una clave secreta fuerte para JWT
```

### Ejecutar el Servidor

```bash
npm start
```

El servidor se ejecutará en `http://localhost:3000`.

## Endpoints de la API

Todos los endpoints protegidos requieren un token JWT válido en el encabezado `Authorization: Bearer <token>`.

### Autenticación

-   **`POST /api/auth/register`**
    -   Registra un nuevo usuario.
    -   **Body:** `{ "username": "string", "password": "string", "role": "employee" | "admin" }`
    -   **Respuesta:** `{ "id": "uuid", "username": "string", "role": "string" }`

-   **`POST /api/auth/login`**
    -   Inicia sesión y obtiene un token JWT.
    -   **Body:** `{ "username": "string", "password": "string" }`
    -   **Respuesta:** `{ "token": "string" }`

### Productos (Requiere autenticación)

-   **`GET /api/products`**
    -   Obtiene todos los productos.
    -   **Respuesta:** `[ { id, name, code, purchase_price, sale_price, stock, provider_id, category, image_url }, ... ]`

-   **`GET /api/products/:id`**
    -   Obtiene un producto por ID.
    -   **Respuesta:** `{ id, name, code, purchase_price, sale_price, stock, provider_id, category, image_url }`

-   **`POST /api/products`** (Solo administradores)
    -   Crea un nuevo producto.
    -   **Body:** `{ "name": "string", "code": "string", "purchase_price": "number", "sale_price": "number", "stock": "number", "provider_id": "uuid", "category": "string", "image_url": "string" }`
    -   **Respuesta:** `{ id, name, ... }`

-   **`PUT /api/products/:id`** (Solo administradores)
    -   Actualiza un producto existente.
    -   **Body:** `{ "name": "string", ... }` (campos a actualizar)
    -   **Respuesta:** `{ id, name, ... }`

-   **`DELETE /api/products/:id`** (Solo administradores)
    -   Elimina un producto.
    -   **Respuesta:** `{ "message": "Product deleted successfully", "product": { id, ... } }`

### Proveedores (Requiere autenticación)

-   **`GET /api/providers`**
    -   Obtiene todos los proveedores.
    -   **Respuesta:** `[ { id, name, contact_info }, ... ]`

-   **`GET /api/providers/:id`**
    -   Obtiene un proveedor por ID.
    -   **Respuesta:** `{ id, name, contact_info }`

-   **`POST /api/providers`** (Solo administradores)
    -   Crea un nuevo proveedor.
    -   **Body:** `{ "name": "string", "contact_info": "string" }`
    -   **Respuesta:** `{ id, name, ... }`

-   **`PUT /api/providers/:id`** (Solo administradores)
    -   Actualiza un proveedor existente.
    -   **Body:** `{ "name": "string", "contact_info": "string" }`
    -   **Respuesta:** `{ id, name, ... }`

-   **`DELETE /api/providers/:id`** (Solo administradores)
    -   Elimina un proveedor.
    -   **Respuesta:** `{ "message": "Provider deleted successfully", "provider": { id, ... } }`

### Ventas (Requiere autenticación)

-   **`POST /api/sales`**
    -   Registra una nueva venta y actualiza el stock.
    -   **Body:** `{ "payment_method": "string", "items": [ { "product_id": "uuid", "quantity": "number" }, ... ] }`
    -   **Respuesta:** `{ "message": "Sale registered successfully", "saleId": "uuid", "total_amount": "number" }`
