import './globals.css';

export const metadata = {
  title: 'Dashboard Financeiro',
  description: 'Seu dashboard financeiro pessoal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
