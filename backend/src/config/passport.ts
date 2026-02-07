
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../db/prisma';
import { env } from '../utils/env';

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || 'your-client-id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-client-secret',
            callbackURL: '/api/auth/google/callback',
            scope: ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0].value;
                const googleId = profile.id;
                const name = profile.displayName;
                const avatar = profile.photos?.[0].value;

                if (!email) {
                    return done(new Error('No email found from Google profile'), undefined);
                }

                // Find or create user
                let user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user) {
                    // Create new user (password is optional now)
                    user = await prisma.user.create({
                        data: {
                            email,
                            name,
                            googleId,
                            avatar,
                            // password field is optional in schema? Need to check schema.
                        }
                    });
                } else {
                    // Update existing user with googleId if missing
                    if (!user.googleId) {
                        user = await prisma.user.update({
                            where: { id: user.id },
                            data: { googleId, avatar }
                        });
                    }
                }

                return done(null, user);
            } catch (error) {
                return done(error as Error, undefined);
            }
        }
    )
);

export { passport };
