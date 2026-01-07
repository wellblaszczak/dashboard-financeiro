import './globals.css';

export const metadata = {
  title: 'Dashboard Financeiro',
  description: 'Seu dashboard financeiro pessoal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-gray-900 text-white">
        {children}
      </body>
    </html>
  );
}
