// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login', // Redirect users to your custom login page
    // error: '/auth/error', // Optional: Custom error page
    // signOut: '/', // Optional: Redirect after sign out
  },
  // You can add callbacks here if needed, e.g., to add more info to the session
  // callbacks: {
  //   async session({ session, token, user }) {
  //     // Send properties to the client, like an access_token and user id from a provider.
  //     // session.accessToken = token.accessToken
  //     // session.user.id = token.id // if you want to expose user id from db
  //     return session
  //   }
  // }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
