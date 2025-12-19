const { loadEnvConfig } = require('@next/env')

console.log('--- Debugging Environment ---')
const projectDir = process.cwd()
loadEnvConfig(projectDir)

const urlStr = process.env.DATABASE_URL
const directUrlStr = process.env.DIRECT_URL

if (!urlStr) {
    console.log('❌ DATABASE_URL is undefined')
} else {
    inspectUrl('DATABASE_URL', urlStr)
}

if (directUrlStr) {
    inspectUrl('DIRECT_URL', directUrlStr)
}

function inspectUrl(name, str) {
    try {
        console.log(`\nInspecting ${name}...`)

        // Check for wrapping quotes which often break things
        if (str.startsWith('"') || str.startsWith("'")) {
            console.log(`⚠️  Warning: ${name} starts with a quote character. This might be part of the value if not parsed correctly.`)
        }

        const url = new URL(str)
        console.log(`✅ Format: Valid URL`)
        console.log(`   Protocol: ${url.protocol}`)
        console.log(`   Hostname: ${url.hostname}`)
        console.log(`   Port: '${url.port}' (Length: ${url.port.length})`)
        console.log(`   Path: ${url.pathname}`)

        if (!url.port) {
            console.log('⚠️  Warning: Port is empty. Default PG port is 5432, but Prisma might expect it explicit or connection string is malformed.')
        }

        // Special char check in password (heuristic)
        if (url.password && url.password.includes('@')) {
            console.log('⚠️  Warning: Password contains "@". This breaks parsing if not URL-encoded.')
        }
        if (url.password && url.password.includes('#')) {
            console.log('⚠️  Warning: Password contains "#". This often marks comments in .env files.')
        }

    } catch (e) {
        console.log(`❌ Error parsing ${name}: ${e.message}`)
        console.log(`   First 20 chars: ${str.substring(0, 20)}...`)
    }
}
