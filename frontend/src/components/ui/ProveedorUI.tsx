'use client';
import { PrimeReactProvider } from 'primereact/api';
export default function ProveedorUI({ children }: { children: React.ReactNode }) {
  return <PrimeReactProvider value={{ unstyled: true }}>{children}</PrimeReactProvider>;
}
