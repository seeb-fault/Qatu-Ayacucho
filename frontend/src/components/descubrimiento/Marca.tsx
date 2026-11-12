import Link from 'next/link';

export default function Marca() {
  return <Link href="/" className="brand" aria-label="Qatu, inicio"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" width="100%" height="100%"><circle cx="15" cy="14.5" r="7" fill="none" stroke="#fff" strokeWidth="3.4"/><path d="m19.5 19.5 5 5" stroke="#fff" strokeWidth="3.4" strokeLinecap="round"/></svg></span>qatu</Link>;
}
