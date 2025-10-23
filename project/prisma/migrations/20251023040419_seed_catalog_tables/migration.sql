-- migration.sql

-- Insertar Roles
INSERT INTO "Role" (id, name, description) VALUES
(1, 'admin', 'Administrador con todos los permisos'),
(2, 'user', 'Usuario regular de la app'),
(3, 'vet_owner', 'Usuario dueño de una veterinaria');
SELECT setval(pg_get_serial_sequence('"Role"', 'id'), COALESCE(max(id), 1), max(id) IS NOT null) FROM "Role";

-- Insertar Permisos (Ejemplos, puedes ajustarlos)
INSERT INTO "Permission" (id, name, description) VALUES
(1, 'manage:users', 'Permite gestionar usuarios'),
(2, 'manage:pets', 'Permite gestionar todas las mascotas'),
(3, 'manage:vets', 'Permite gestionar todas las veterinarias'),
(4, 'create:pet', 'Permite crear mascotas para sí mismo'),
(5, 'create:vet', 'Permite registrar una veterinaria');
SELECT setval(pg_get_serial_sequence('"Permission"', 'id'), COALESCE(max(id), 1), max(id) IS NOT null) FROM "Permission";

-- Insertar RolePermission (Conectando Roles con Permisos)
INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES
-- Admin (ID 1) tiene todos los permisos
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
-- User (ID 2) solo puede crear sus mascotas
(2, 4),
-- Vet Owner (ID 3) puede crear sus mascotas y su veterinaria
(3, 4),
(3, 5);

INSERT INTO "PetSize" (id, name) VALUES
(1, 'Pequeño'),
(2, 'Mediano'),
(3, 'Grande');
SELECT setval(pg_get_serial_sequence('"PetSize"', 'id'), COALESCE(max(id), 1), max(id) IS NOT null) FROM "PetSize";

INSERT INTO "EnergyLevel" (id, name) VALUES
(1, 'Bajo'),
(2, 'Mediano'),
(3, 'Alto');
SELECT setval(pg_get_serial_sequence('"EnergyLevel"', 'id'), COALESCE(max(id), 1), max(id) IS NOT null) FROM "EnergyLevel";

INSERT INTO "HomeType" (id, name) VALUES
(1, 'Casa con patio'),
(2, 'Departamento'),
(3, 'Parcela');
SELECT setval(pg_get_serial_sequence('"HomeType"', 'id'), COALESCE(max(id), 1), max(id) IS NOT null) FROM "HomeType";

INSERT INTO "PetCondition" (id, name) VALUES
(1, 'Saludable'),
(2, 'En tratamiento'),
(3, 'Discapacidad');
SELECT setval(pg_get_serial_sequence('"PetCondition"', 'id'), COALESCE(max(id), 1), max(id) IS NOT null) FROM "PetCondition";

INSERT INTO "PetStatus" (id, name) VALUES
(1, 'En adopción'),
(2, 'Adoptado'),
(3, 'Perdido'),
(4, 'Encontrado'),
(5, 'Comunitario');
SELECT setval(pg_get_serial_sequence('"PetStatus"', 'id'), COALESCE(max(id), 1), max(id) IS NOT null) FROM "PetStatus";

INSERT INTO "PetSpecie" (id, name) VALUES
(1, 'Perro'),
(2, 'Gato'),
(3, 'Otro');
SELECT setval(pg_get_serial_sequence('"PetSpecie"', 'id'), COALESCE(max(id), 1), max(id) IS NOT null) FROM "PetSpecie";

INSERT INTO "PetBreed" (id, name) VALUES
-- Perros
(1, 'Mestizo / Quiltro'),
(2, 'Labrador Retriever'),
(3, 'Poodle (Caniche)'),
(4, 'Pastor Alemán'),
(5, 'Bulldog Francés'),
(6, 'Bulldog Inglés'),
(7, 'Golden Retriever'),
(8, 'Yorkshire Terrier'),
(9, 'Beagle'),
(10, 'Boxer'),
(11, 'Schnauzer (Miniatura, Estándar)'),
(12, 'Dachshund (Salchicha)'),
(13, 'Shih Tzu'),
(14, 'Pug (Carlino)'),
(15, 'Chihuahua'),
(16, 'Cocker Spaniel'),
(17, 'Border Collie'),
(18, 'Husky Siberiano'),
-- Gatos
(19, 'Gato Común Europeo (Mestizo)'),
(20, 'Siamés'),
(21, 'Persa'),
(22, 'Maine Coon'),
(23, 'Ragdoll'),
(24, 'Birmano (Sagrado de Birmania)'),
(25, 'Angora'),
(26, 'British Shorthair'),
(27, 'Sphynx (Gato esfinge)'),
(28, 'Otra (especificar en descripción)');
SELECT setval(pg_get_serial_sequence('"PetBreed"', 'id'), COALESCE(max(id), 1), max(id) IS NOT null) FROM "PetBreed";

INSERT INTO "Service" (id, name) VALUES
(1, 'Consulta General / Medicina Preventiva'),
(2, 'Urgencias 24h'),
(3, 'Vacunación'),
(4, 'Desparasitación (Interna y Externa)'),
(5, 'Cirugía General (ej. esterilización)'),
(6, 'Cirugía Especializada / Traumatología'),
(7, 'Hospitalización'),
(8, 'Peluquería Canina / Felina'),
(9, 'Imágenes (Radiografía, Ecografía)'),
(10, 'Laboratorio Clínico (Exámenes de sangre, etc.)'),
(11, 'Odontología Veterinaria'),
(12, 'Consulta a Domicilio'),
(13, 'Farmacia Veterinaria'),
(14, 'Tienda de Accesorios / Alimentos'),
(15, 'Otro (especificar en descripción)');
SELECT setval(pg_get_serial_sequence('"Service"', 'id'), COALESCE(max(id), 1), max(id) IS NOT null) FROM "Service";

-- Insertar PetHairType
INSERT INTO "PetHairType" (id, name) VALUES
(1, 'Corto'),
(2, 'Mediano'),
(3, 'Largo'),
(4, 'Sin pelo');
SELECT setval(pg_get_serial_sequence('"PetHairType"', 'id'), COALESCE(max(id), 1), max(id) IS NOT null) FROM "PetHairType";

-- Insertar ReportType
INSERT INTO "ReportType" (id, name) VALUES
(1, 'Abuso / Maltrato'),
(2, 'Contenido inapropiado'),
(3, 'Estafa / Fraude'),
(4, 'Otro');
SELECT setval(pg_get_serial_sequence('"ReportType"', 'id'), COALESCE(max(id), 1), max(id) IS NOT null) FROM "ReportType";

-- Insertar DayOfWeek
INSERT INTO "DayOfWeek" (id, name) VALUES
(1, 'Lunes'),
(2, 'Martes'),
(3, 'Miércoles'),
(4, 'Jueves'),
(5, 'Viernes'),
(6, 'Sábado'),
(7, 'Domingo');
SELECT setval(pg_get_serial_sequence('"DayOfWeek"', 'id'), COALESCE(max(id), 1), max(id) IS NOT null) FROM "DayOfWeek";