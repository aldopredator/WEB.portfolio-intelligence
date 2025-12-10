import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Diagnostic endpoint to check database connection
export async function GET(request: Request) {
    try {
        // Try to connect to database
        await prisma.$connect();

        // Try a simple query
        const userCount = await prisma.user.count();

        return NextResponse.json({
            status: 'success',
            message: 'Database connection successful',
            userCount,
            databaseUrl: process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET',
            nextauthSecret: process.env.NEXTAUTH_SECRET ? 'Set (hidden)' : 'NOT SET',
            nextauthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: 'Database connection failed',
            error: error.message,
            databaseUrl: process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET',
            nextauthSecret: process.env.NEXTAUTH_SECRET ? 'Set (hidden)' : 'NOT SET',
            nextauthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
