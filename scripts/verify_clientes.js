const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const { loadEnvConfig } = require('@next/env')

// Cargar .env usando Next.js helper
const projectDir = process.cwd()
loadEnvConfig(projectDir)
console.log('✅ .env cargado via @next/env')

const prisma = new PrismaClient()


async function main() {
    console.log('--- Iniciando prueba de DB (Clientes) ---')

    // 1. Verificar conexión y obtener Empresa (Tenant)
    console.log('1. Buscando empresa activa...')
    let empresa = await prisma.empresa.findFirst({
        where: { activa: true }
    })

    if (!empresa) {
        console.log('⚠️ No se encontró empresa. Creando una de prueba...')
        empresa = await prisma.empresa.create({
            data: {
                nombre: 'Empresa Test Script',
                rfc: 'TEST010101000',
                razonSocial: 'Empresa de Prueba S.A. de C.V.',
                activa: true
            }
        })
        console.log(`✅ Empresa de prueba creada: ${empresa.id}`)
    } else {
        console.log(`✅ Empresa encontrada: ${empresa.nombre} (${empresa.id})`)
    }

    // 2. Crear Cliente de prueba
    const rfcPrueba = 'XEXX010101000'
    console.log(`2. Creando cliente de prueba (${rfcPrueba})...`)

    // Limpiar si existe previo de una prueba fallida
    await prisma.cliente.deleteMany({
        where: {
            rfc: rfcPrueba,
            empresaId: empresa.id
        }
    })

    const nuevoCliente = await prisma.cliente.create({
        data: {
            empresaId: empresa.id,
            rfc: rfcPrueba,
            razonSocial: 'Cliente de Prueba Script',
            nombreComercial: 'Test Inc',
            email: 'test@example.com',
            activo: true
        }
    })
    console.log(`✅ Cliente creado: ${nuevoCliente.id}`)

    // 3. Leer Cliente
    console.log('3. Verificando lectura...')
    const clienteLeido = await prisma.cliente.findUnique({
        where: { id: nuevoCliente.id }
    })
    if (clienteLeido && clienteLeido.rfc === rfcPrueba) {
        console.log('✅ Lectura correcta')
    } else {
        console.error('❌ Error en lectura')
    }

    // 4. Actualizar Cliente
    console.log('4. Probando actualización...')
    const clienteActualizado = await prisma.cliente.update({
        where: { id: nuevoCliente.id },
        data: { nombreComercial: 'Test Inc Updated' }
    })
    if (clienteActualizado.nombreComercial === 'Test Inc Updated') {
        console.log('✅ Actualización correcta')
    }

    // 5. Eliminar (Soft Delete)
    console.log('5. Probando soft delete...')
    await prisma.cliente.update({
        where: { id: nuevoCliente.id },
        data: { activo: false }
    })
    const clienteBorrado = await prisma.cliente.findUnique({
        where: { id: nuevoCliente.id }
    })
    if (clienteBorrado.activo === false) {
        console.log('✅ Soft delete correcto')
    }

    // Limpieza final (Hard delete para no ensuciar BD de pruebas?? O dejalo soft delete?)
    // Mejor lo borramos físicamente para que el script sea idempotente sin acumular basura
    console.log('6. Limpieza final (Hard delete)...')
    await prisma.cliente.delete({
        where: { id: nuevoCliente.id }
    })
    console.log('✅ Limpieza completada')

    console.log('--- Pruebas finalizadas con ÉXITO ---')
}

main()
    .catch((e) => {
        const errorLogPath = path.resolve(__dirname, 'error.log')
        fs.writeFileSync(errorLogPath, `Error:\n${e.stack || e.message}\n${JSON.stringify(e, null, 2)}`)
        console.error('❌ Error en el script (ver scripts/error.log)')
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
