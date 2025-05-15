# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Deployment

This project is ready to be deployed on platforms like Vercel.

### Vercel

1.  Connect your GitHub repository to Vercel.
2.  **Important**: Set the `GOOGLE_API_KEY` environment variable in your Vercel project settings. You can get this key from the Google AI Studio or Google Cloud Console.
3.  Vercel will automatically detect it's a Next.js project and use the `next build` command.

**Note on Build Settings:**
The `next.config.ts` file is currently configured with `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`. This allows the project to build even if there are TypeScript or ESLint errors. For a production-ready application, it's highly recommended to fix these underlying errors and set these options to `false` or remove them.