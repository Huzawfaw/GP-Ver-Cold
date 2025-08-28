import '@/styles/globals.css';
import { ThemeProvider } from 'next-themes'
import Nav from '@/components/nav'


export const metadata = { title: 'Connectiv Dialer', description: 'Multi-company softphone' }


export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
<html suppressHydrationWarning>
<body>
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
<Nav />
<main className="max-w-6xl mx-auto p-4">{children}</main>
</ThemeProvider>
</body>
</html>
)

}
