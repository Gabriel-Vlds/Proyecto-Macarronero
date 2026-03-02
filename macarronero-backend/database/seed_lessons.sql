-- Seed de lecciones para los 6 cursos de El Macarronero
INSERT INTO lessons (course_id, title, content, order_index, duration_min) VALUES
-- Curso 1: curso roles (advanced)
(1,'Ingredientes y mise en place para roles','Conoce cada ingrediente: harina de fuerza, levadura fresca, mantequilla en pomada y azucar invertido. Aprenderemos a pesar con precision y organizar la estacion de trabajo antes de empezar.',1,15),
(1,'Amasado y desarrollo del gluten','Tecnica de amasado frances: plegar, estirar y golpear la masa hasta lograr la prueba de la membrana. Senales para saber cuando la masa esta lista y como evitar sobremasar.',2,25),
(1,'Fermentacion controlada y laminado','Primera fermentacion en bloque, desgasificado y laminado de la masa. Control de temperatura de camara y tiempos optimos para sabor optimo.',3,20),
(1,'Horneado y punto exacto de coccion','Calentado del horno, vapor inicial, temperatura interna y color de costra. Diferencia entre roles tiernos y crujientes segun el proceso.',4,18),
-- Curso 2: curso galletas (intermediate)
(2,'Conociendo tus herramientas y materia prima','Seleccion de mantequilla de calidad, tipos de azucar, huevos a temperatura ambiente y extraccion de vainilla natural vs artificial.',1,12),
(2,'Cremado y estructura del batido','Proceso de cremado correcto: textura esperada, incorporacion de huevos uno a uno, como evitar que la mezcla se corte.',2,20),
(2,'Incorporacion de harina y reposo','Tecnica de la espatula para no desarrollar gluten, el papel del reposo en nevera y como afecta a la textura final de la galleta.',3,15),
(2,'Horneado perfecto y enfriado','Espesor uniforme con guias de madera, papel sulfurizado vs tapete de silicona, la galleta sigue cocinandose fuera del horno.',4,12),
-- Curso 3: Decoracion con fondant (beginner)
(3,'Introduccion al fondant: tipos y herramientas','Fondant estirado vs fondant modelado, diferencias con pasta de azucar. Herramientas esenciales: alisadores, rodillo antiadherente y guias de grosor.',1,10),
(3,'Tenido y amasado del fondant','Como incorporar colorante gel sin manchar las manos. Tecnica de pliegues para color uniforme. Conservacion y cuando cambia de textura.',2,15),
(3,'Forrado de tarta paso a paso','Preparacion de la tarta con ganache o buttercream de base, extension del fondant, tecnica para evitar burbujas y arrugas en los laterales.',3,20),
(3,'Acabados y elementos decorativos','Luster dust, pintura con alcohol alimentario, sellos de textura, corte limpio de los bajos. Presentacion profesional final.',4,15),
-- Curso 4: Galletas decoradas (beginner)
(4,'Materiales y royal icing basico','Diferencia entre merengue suizo, frances e italiano para decorar. Preparacion del royal icing a consistencia de flujo 15s y delineado.',1,12),
(4,'Delineado y relleno de galletas','Orden de capas: primero delineado, luego relleno flooding. Herramientas: mangas, boquillas 1.5 y 2, palillo de burbuja para acabados limpios.',2,20),
(4,'Tecnicas humedo sobre humedo','Crear encaje, marmolados, corazones y flores mientras el icing sigue fresco. Tiempos de secado entre capas y como evitar hundimientos.',3,18),
(4,'Decoracion en seco y presentacion','Pintura sobre icing seco, detalles con pincel fino, laminas de oro comestible y presentacion en caja para regalo.',4,15),
-- Curso 5: Tartas de varios pisos (advanced)
(5,'Estructura interna: buques y pilares','Calculo de peso por piso, tipos de buques (PVC, madera), espaciado de pilares y angulacion para tartas perfectamente niveladas.',1,22),
(5,'Bizcocho profesional y emborrachado','Genovesa, chiffon y red velvet para distintos pisos. Almibares aromatizados, humedad correcta y tecnica de wrap de acetato.',2,25),
(5,'Ganache y buttercream de cobertura','Proporciones de la ganache segun temperatura, cristalizacion controlada, buttercream suizo: pasteurizado, sedoso y sin burbujas de aire.',3,20),
(5,'Montaje en torre y transporte','Orden de montaje in-situ, union entre pisos sin grietas. Como transportar en coche con base antideslizante y sistema de varilla central.',4,20),
(5,'Acabados de lujo: drip, flores y dorado','Drip de chocolate perfectamente temperado, flores frescas certificadas food-grade, aerografia basica y hoja de oro para acabado de boda.',5,25),
-- Curso 6: Macarons profesionales (intermediate)
(6,'La ciencia del macaron: TPT y merengue','Ratio de polvo de almendra y azucar glass (TPT), tamizado obligatorio, tipos de merengue: italiano vs frances y su influencia en el resultado.',1,20),
(6,'Macaronage: el secreto esta en el pliegue','Tecnica correcta del macaronage: cuantos pliegues, la prueba del ribbon y cuando parar. Errores mas comunes y como corregirlos.',2,22),
(6,'Manga y secado (croutage)','Angulo de manga, distancia a la placa, tamano uniforme. Secado al aire o con deshumidificador, la costra que forma el pie del macaron.',3,15),
(6,'Horneado y el famoso pie del macaron','Temperatura por zonas del horno, el doble tapete para mejor pie, como saber cuando estan listos sin abrirlos demasiado pronto.',4,18),
(6,'Ganaches y rellenos de autor','Ganache de chocolate oscuro, caramel beurre sale y cremeux de frambuesa. Cristalizacion, punto de manga y montaje final del macaron.',5,20);
