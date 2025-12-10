import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// This is a one-time seed endpoint
// Call it once to create demo users, then delete this file
export async function GET(request: Request) {
    try {
        // Check if demo user already exists
        const existingDemo = await prisma.user.findUnique({
            where: { email: 'demo@portfolio-intelligence.co.uk' },
        });

        if (existingDemo) {
            return NextResponse.json({
                message: 'Demo user already exists',
                users: ['demo@portfolio-intelligence.co.uk', 'john@doe.com'],
            });
        }

        // Create demo user
        const hashedPassword1 = await bcrypt.hash('demo123456', 10);
        const demoUser = await prisma.user.create({
            data: {
                email: 'demo@portfolio-intelligence.co.uk',
                password: hashedPassword1,
                name: 'Demo User',
            },
        });

        // Create default portfolio for demo user
        await prisma.portfolio.create({
            data: {
                name: 'Demo Portfolio',
                description: 'Demo portfolio',
                userId: demoUser.id,
            },
        });

        // Create test user
        const hashedPassword2 = await bcrypt.hash('johndoe123', 10);
        const testUser = await prisma.user.create({
            data: {
                email: 'john@doe.com',
                password: hashedPassword2,
                name: 'John Doe',
            },
        });

        // Create default portfolio for test user
        await prisma.portfolio.create({
            data: {
                name: 'My Portfolio',
                description: 'Default portfolio',
                userId: testUser.id,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Database seeded successfully!',
            users: [
                { email: 'demo@portfolio-intelligence.co.uk', password: 'demo123456' },
                { email: 'john@doe.com', password: 'johndoe123' },
            ],
        });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json(
            { error: 'Failed to seed database', details: error },
            { status: 500 }
        );
    }
}
