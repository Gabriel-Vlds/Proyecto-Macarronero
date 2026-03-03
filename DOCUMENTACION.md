# Documentacion del proyecto Macarronero

## Resumen
Este proyecto contiene:
- Un sitio estatico (HTML/CSS) de referencia.
- Un backend en Node.js + Express + MySQL.
- Un frontend en Angular para la experiencia de usuarios.

## Actualizacion Marzo 2026

Cambios relevantes incorporados en la version actual:
- Integracion de Mux para carga de videos desde panel admin.
- Soporte de `playback_id` y URL manual al crear lecciones.
- Reproduccion con token firmado (signed playback) cuando hay signing key configurada.
- Watermark dinamico visible sobre el reproductor para disuasion.
- Robustecimiento de `Mi cuenta` para evitar cargas indefinidas en cursos/kits.
- Endpoints de cursos, enrollments y purchases con mejor manejo de errores y logs.
- Limpieza de redundancias y codigo sin uso.

## Estructura general

### Raiz del repositorio
- ChefJavi.png: Imagen usada en el sitio estatico.
- contacto.html: Pagina estatica de contacto.
- cursos.html: Pagina estatica de cursos.
- Estilos.txt: Notas de paleta, tipografias y estructura.
- index.html: Pagina estatica principal de referencia.
- Logo-Macarronero.jpeg: Logo usado en el sitio estatico.
- macarrokits.html: Pagina estatica de kits.
- styles.css: Estilos del sitio estatico.
- SVG-Icons/: Carpeta de iconos y recursos SVG.

### Backend (macarronero-backend)
- .env: Variables de entorno locales.
- .env.example: Ejemplo de variables de entorno.
- package.json: Scripts y dependencias del backend.
- database/schema.sql: Esquema de tablas.
- database/init.sql: Script completo para crear la BD y tablas.
- src/config.js: Configuracion central (puerto, DB, JWT, CORS).
- src/db.js: Pool de conexiones MySQL.
- src/server.js: Arranque de Express y montaje de rutas.
- src/middleware/auth.js: Middleware de autenticacion/autorizacion.
- src/routes/auth.routes.js: Endpoints de login y registro.
- src/routes/users.routes.js: Endpoints de usuarios.
- src/routes/courses.routes.js: Endpoints de cursos.
- src/routes/kits.routes.js: Endpoints de kits.
- src/routes/enrollments.routes.js: Endpoints de inscripciones.
- src/routes/purchases.routes.js: Endpoints de compras de kits.
- src/utils/jwt.js: Utilidades para firmar/validar JWT.
- src/utils/password.js: Hash y verificacion de contrasenias.

### Frontend Angular (macarronero-frontend)
- angular.json: Configuracion del proyecto Angular.
- package.json: Scripts y dependencias del frontend.
- public/: Recursos estaticos.
- src/index.html: HTML base que carga la app.
- src/main.ts: Bootstrap de Angular.
- src/styles.css: Estilos globales y variables de tema.
- src/app/app.ts: Componente raiz.
- src/app/app.html: Layout principal (header, router, footer).
- src/app/app.css: Estilos del layout principal.
- src/app/app.routes.ts: Rutas de la aplicacion.
- src/app/app.config.ts: Configuracion de providers.
- src/app/app.spec.ts: Pruebas del componente raiz.
- src/app/core/auth/auth.service.ts: Gestion de sesion y usuario actual.
- src/app/core/auth/auth.guard.ts: Proteccion de rutas.
- src/app/core/auth/auth.interceptor.ts: Inyeccion de token en requests.
- src/app/core/models/*.ts: Interfaces de datos (User, Course, Kit, etc.).
- src/app/core/services/*.ts: Servicios HTTP por entidad.
- src/app/features/home/*: Vista principal (home).
- src/app/features/courses/*: Vista de cursos.
- src/app/features/kits/*: Vista de kits.
- src/app/features/auth/*: Login y registro.
- src/app/features/account/*: Perfil y datos del usuario.
- src/app/features/dashboard/*: Vista de panel general.

## Flujo general
1) El backend expone la API REST (auth, cursos, kits, compras, inscripciones).
2) El frontend consume la API y muestra la informacion en vistas.
3) El sitio estatico sirve como referencia de contenido y estilos.

## Como levantar en localhost

### Backend (API)
1) Entrar a la carpeta:
	- `cd macarronero-backend`
2) Instalar dependencias:
	- `npm install`
3) Configurar variables de entorno:
	- Copiar `.env.example` a `.env` y completar los valores de MySQL y JWT.
4) Iniciar servidor:
	- `npm run dev`

#### Variables de entorno del backend
- `PORT`: Puerto donde corre la API (por defecto 3000).
- `FRONTEND_URL`: URL base del frontend para redirects de pago.
- `DB_HOST`: Host de MySQL (ej. localhost).
- `DB_PORT`: Puerto de MySQL.
- `DB_USER`: Usuario de MySQL.
- `DB_PASSWORD`: Contrasenia de MySQL.
- `DB_NAME`: Nombre de la base de datos.
- `JWT_SECRET`: Clave para firmar tokens.
- `JWT_EXPIRES_IN`: Duracion del token (ej. 7d).
- `CORS_ORIGIN`: Origen permitido (ej. http://localhost:4200).
- `STRIPE_SECRET_KEY`: Clave secreta de Stripe.
- `STRIPE_WEBHOOK_SECRET`: Secreto de webhook Stripe.
- `STRIPE_SUCCESS_URL`: URL de retorno en pago exitoso.
- `STRIPE_CANCEL_URL`: URL de retorno en cancelacion.
- `MUX_TOKEN_ID`: Token ID de Mux para API de video.
- `MUX_TOKEN_SECRET`: Token Secret de Mux para API de video.
- `MUX_SIGNING_KEY_ID`: Key ID para playback firmado de Mux.
- `MUX_SIGNING_KEY_PRIVATE`: Private key PEM para playback firmado.

### Frontend (Angular)
1) Entrar a la carpeta:
	- `cd macarronero-frontend`
2) Instalar dependencias:
	- `npm install`
3) Iniciar app:
	- `npm start`

Comandos rapidos:
	- `cd macarronero-frontend`
	- `npm install`
	- `npm start`

### Sitio estatico (opcional)
- Abrir `index.html` directamente en el navegador o usar un servidor estatico.

## Casos de prueba

### CP-HOME-001 - Carga y navegacion de la pagina principal
- Objetivo: validar que la pagina principal muestre el hero, los destacados y permita navegar a Cursos y Kits.
- Precondiciones:
	- Backend y frontend en ejecucion, con la API disponible.
	- Existen al menos 3 cursos y 3 kits activos en la base de datos.
- Datos de prueba: no aplica.
- Pasos:
	1) Abrir la aplicacion en la ruta raiz (/).
	2) Verificar que se muestre el bloque hero con titulo, texto descriptivo y dos botones de accion.
	3) Mientras cargan los datos, comprobar que aparecen placeholders (skeletons) en ambas grillas.
	4) Al finalizar la carga, validar que se rendericen hasta 3 cursos destacados con titulo, descripcion, nivel y precio.
	5) Validar que se rendericen hasta 3 kits destacados con nombre, descripcion, stock y precio.
	6) Hacer clic en "Ver cursos" y confirmar la navegacion a /courses.
	7) Volver y hacer clic en "Explorar kits" o "Ver kits" y confirmar la navegacion a /kits.
- Resultado esperado:
	- El hero muestra su contenido y los botones son visibles.
	- Se muestran skeletons durante la carga y luego tarjetas reales.
	- Las grillas de cursos y kits se limitan a un maximo de 3 elementos cada una.
	- Los enlaces de navegacion redirigen correctamente a /courses y /kits.
- Postcondiciones: no aplica.

## Funcionalidad de Cursos - Documentacion Completa

### Descripcion General
El modulo de cursos permite a los usuarios explorar, comprar y acceder a contenido educativo protegido sobre tecnicas de cocina y reposteria. Los cursos incluyen:
- Listado publico de cursos disponibles con informacion basica.
- Sistema de compra integrado con Stripe.
- Proteccion de contenido mediante autenticacion y verificacion de compra.
- Bloqueo automatico del contenido cuando la pantalla pierde foco (anti-captura).
- Panel de administracion CRUD completo para gestionar cursos.

### Modelo de Datos

#### Tabla `courses`
```sql
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  level ENUM('beginner', 'intermediate', 'advanced') NOT NULL DEFAULT 'beginner',
  cover_url VARCHAR(512),
  stripe_price_id VARCHAR(128),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Relaciones
- Un curso puede tener multiples inscripciones (enrollments).
- Las inscripciones vinculan usuarios con cursos comprados.
- Los pagos se registran en la tabla course_payments.

### Endpoints del Backend

#### GET /api/courses
- **Descripcion**: Lista todos los cursos disponibles.
- **Autenticacion**: No requerida.
- **Retorna**: Array de cursos con informacion basica.

#### GET /api/courses/:id
- **Descripcion**: Obtiene metadatos publicos de un curso especifico.
- **Autenticacion**: No requerida.
- **Retorna**: Objeto curso o 404 si no existe.

#### GET /api/courses/:id/lessons
- **Descripcion**: Obtiene lecciones de un curso.
- **Autenticacion**: Requerida.
- **Autorizacion**: Usuario inscrito en el curso o admin.
- **Retorna**: Lecciones con estado de Mux y datos de playback.

#### POST /api/courses
- **Descripcion**: Crea un nuevo curso.
- **Autenticacion**: Requerida.
- **Autorizacion**: Solo admin.
- **Payload**: { title, description, price, level, coverUrl, stripePriceId }
- **Retorna**: Objeto del curso creado.

#### PATCH /api/courses/:id
- **Descripcion**: Actualiza un curso existente.
- **Autenticacion**: Requerida.
- **Autorizacion**: Solo admin.
- **Payload**: Campos a actualizar (title, description, price, level, coverUrl, stripePriceId).
- **Retorna**: Objeto del curso actualizado.

#### DELETE /api/courses/:id
- **Descripcion**: Elimina un curso.
- **Autenticacion**: Requerida.
- **Autorizacion**: Solo admin.
- **Retorna**: 204 No Content.

### Componentes del Frontend

#### CoursesComponent (/courses)
- **Descripcion**: Vista principal que lista todos los cursos disponibles.
- **Funcionalidad**:
	- Muestra grid de cursos con titulo, descripcion, nivel y precio.
	- Indica si el usuario ya tiene acceso al curso (boton "Ver curso").
	- Permite comprar acceso mediante integracion con Stripe.
	- Muestra skeletons durante la carga.

#### CourseDetailComponent (/courses/:id)
- **Descripcion**: Vista de detalle de un curso con contenido protegido.
- **Funcionalidad**:
	- Verifica autenticacion mediante authGuard.
	- Verifica compra del curso mediante el backend.
	- Muestra contenido completo del curso.
	- Implementa bloqueo automatico cuando la ventana pierde foco.
	- Muestra overlay de proteccion cuando la pantalla esta bloqueada.
- **Medidas de seguridad**:
	- Event listeners en blur/focus de ventana.
	- Event listener en visibilitychange del documento.
	- Filtro blur en el contenido cuando esta bloqueado.
	- Backdrop semi-transparente sobre el contenido protegido.

#### DashboardComponent (/admin)
- **Descripcion**: Panel de administracion para gestionar cursos.
- **Funcionalidad**:
	- Formulario para crear nuevos cursos.
	- Lista de cursos existentes con edicion inline.
	- Botones para actualizar y eliminar cursos.
	- Validacion de permisos mediante authGuard con role:admin.

### Flujo de Compra de Cursos

1. **Exploracion**: Usuario navega a /courses y ve todos los cursos disponibles.
2. **Seleccion**: Usuario hace clic en "Comprar acceso" en un curso deseado.
3. **Verificacion**: Sistema verifica que el usuario este autenticado.
4. **Checkout**: Se crea una sesion de Stripe y se redirige al usuario.
5. **Pago**: Usuario completa el pago en Stripe.
6. **Webhook**: Stripe notifica al backend sobre el pago exitoso.
7. **Inscripcion**: El backend crea un enrollment vinculando usuario y curso.
8. **Acceso**: Usuario puede acceder al contenido del curso desde /courses/:id.

### Casos de Prueba

#### CP-COURSES-001 - Listado de cursos
- **Objetivo**: Validar que la vista de cursos muestre todos los cursos disponibles.
- **Precondiciones**: 
	- Backend y frontend en ejecucion.
	- Existen al menos 3 cursos en la base de datos.
- **Pasos**:
	1. Navegar a /courses.
	2. Verificar que se muestren skeletons durante la carga.
	3. Verificar que se rendericen todas las tarjetas de cursos.
	4. Verificar que cada tarjeta muestre: titulo, descripcion, nivel y precio.
	5. Verificar que aparezca el boton "Comprar acceso" para cursos sin acceso.
- **Resultado esperado**: Grid responsive con todos los cursos disponibles.

#### CP-COURSES-002 - Acceso sin autenticacion
- **Objetivo**: Validar que usuarios sin autenticacion no puedan acceder al detalle.
- **Precondiciones**: Usuario no autenticado.
- **Pasos**:
	1. Intentar acceder directamente a /courses/1.
	2. Verificar que authGuard redirija a /login.
- **Resultado esperado**: Redireccion automatica a la pagina de login.

#### CP-COURSES-003 - Acceso sin compra
- **Objetivo**: Validar que usuarios autenticados sin compra no accedan al contenido.
- **Precondiciones**: 
	- Usuario autenticado.
	- Usuario NO tiene enrollment para el curso ID 1.
- **Pasos**:
	1. Navegar a /courses/1.
	2. Verificar que se muestre error 403.
	3. Verificar mensaje: "Necesitas comprar acceso para ver este curso."
- **Resultado esperado**: Mensaje de error indicando que debe comprar el curso.

#### CP-COURSES-004 - Acceso con compra exitosa
- **Objetivo**: Validar que usuarios con enrollment accedan al contenido completo.
- **Precondiciones**:
	- Usuario autenticado.
	- Usuario tiene enrollment activo para el curso ID 1.
- **Pasos**:
	1. Navegar a /courses/1.
	2. Verificar que se muestre el contenido del curso.
	3. Verificar que se muestren las lecciones del material protegido.
- **Resultado esperado**: Contenido completo del curso visible.

#### CP-COURSES-005 - Bloqueo por perdida de foco
- **Objetivo**: Validar el mecanismo de proteccion anti-captura.
- **Precondiciones**: Usuario en vista de detalle de un curso (/courses/1).
- **Pasos**:
	1. Verificar que el contenido este visible inicialmente.
	2. Cambiar a otra ventana o pestania.
	3. Verificar que aparezca el overlay de proteccion.
	4. Verificar que el contenido tenga filtro blur aplicado.
	5. Regresar a la pestania del curso.
	6. Verificar que el overlay desaparezca y el contenido sea visible.
- **Resultado esperado**: 
	- Overlay visible y contenido bloqueado al perder foco.
	- Overlay oculto y contenido visible al recuperar foco.

#### CP-COURSES-006 - Creacion de curso (Admin)
- **Objetivo**: Validar que administradores puedan crear cursos.
- **Precondiciones**: Usuario autenticado con role='admin'.
- **Pasos**:
	1. Navegar a /admin.
	2. Completar formulario de nuevo curso:
		- Titulo: "Test Course"
		- Descripcion: "Test description"
		- Precio: 19.99
		- Nivel: "beginner"
	3. Hacer clic en "Crear".
	4. Verificar mensaje de exito.
	5. Verificar que el curso aparezca en la lista de cursos existentes.
- **Resultado esperado**: Curso creado exitosamente y visible en la lista.

#### CP-COURSES-007 - Actualizacion de curso (Admin)
- **Objetivo**: Validar que administradores puedan actualizar cursos.
- **Precondiciones**: 
	- Usuario autenticado con role='admin'.
	- Existe un curso con ID 1.
- **Pasos**:
	1. Navegar a /admin.
	2. En la lista de cursos existentes, modificar el titulo del curso ID 1.
	3. Hacer clic en "Guardar".
	4. Verificar mensaje de exito.
	5. Refrescar la pagina y verificar que el cambio persista.
- **Resultado esperado**: Curso actualizado exitosamente.

#### CP-COURSES-008 - Eliminacion de curso (Admin)
- **Objetivo**: Validar que administradores puedan eliminar cursos.
- **Precondiciones**:
	- Usuario autenticado con role='admin'.
	- Existe un curso con ID especifico.
- **Pasos**:
	1. Navegar a /admin.
	2. En la lista de cursos existentes, hacer clic en "Eliminar" para un curso.
	3. Verificar mensaje de exito.
	4. Verificar que el curso ya no aparezca en la lista.
- **Resultado esperado**: Curso eliminado exitosamente de la base de datos.

#### CP-COURSES-009 - Indicador de acceso en listado
- **Objetivo**: Validar que el sistema indique correctamente si el usuario tiene acceso.
- **Precondiciones**:
	- Usuario autenticado.
	- Usuario tiene enrollment para curso ID 1.
	- Usuario NO tiene enrollment para curso ID 2.
- **Pasos**:
	1. Navegar a /courses.
	2. Para curso ID 1, verificar que aparezca boton "Ver curso".
	3. Para curso ID 2, verificar que aparezca boton "Comprar acceso".
- **Resultado esperado**: 
	- Cursos con acceso muestran "Ver curso".
	- Cursos sin acceso muestran "Comprar acceso".

### Datos de Ejemplo

El archivo database.sql incluye 3 cursos de ejemplo:

1. **Pasta Fresca Tradicional** - Nivel: Principiante - $29.99
2. **Rellenos y Salsas Especiales** - Nivel: Intermedio - $39.99
3. **Pasta Gourmet y Presentacion** - Nivel: Avanzado - $49.99

### Integracion con Stripe

Para el flujo de pagos de cursos:
1. El frontend llama a POST /api/payments/checkout con el courseId.
2. El backend crea una sesion de checkout de Stripe.
3. El usuario completa el pago en Stripe.
4. Stripe envia webhook a POST /api/payments/webhook.
5. El backend procesa el evento y crea el enrollment.
6. El usuario automaticamente tiene acceso al curso.

### Seguridad y Proteccion

- **Autenticacion**: JWT requerido para acceder a detalles de cursos.
- **Autorizacion**: Verificacion de enrollment o role admin en backend.
- **Anti-captura**: Bloqueo automatico de pantalla al perder foco.
- **Mux signed playback**: Token temporal por usuario/sesion cuando hay signing key.
- **Watermark dinamico**: Identificador visible en el reproductor de lecciones.
- **CORS**: Restriccion de origen configurada en el backend.
- **SQL Injection**: Uso de consultas parametrizadas en todas las queries.

### Estado Actual

✅ **Backend completo**:
- Todas las rutas CRUD implementadas.
- Middleware de autenticacion y autorizacion funcionando.
- Integracion con base de datos MySQL.

✅ **Frontend completo**:
- Componente de listado de cursos.
- Componente de detalle con proteccion anti-captura.
- Panel de administracion para gestionar cursos.
- Servicios HTTP y modelos de datos.
- Guards y interceptors configurados.

✅ **Base de datos**:
- Esquema completo con todas las relaciones.
- Datos de ejemplo para probar la funcionalidad.

✅ **Integracion**:
- Rutas configuradas en app.routes.ts.
- Navegacion funcional desde el header.
- Flujo completo de compra y acceso a cursos.

## Pendiente conocido

- `npm run test` en frontend presenta fallo base de `app.spec.ts` por provider de routing en entorno de prueba (preexistente, no bloquea build ni funcionamiento en runtime).


