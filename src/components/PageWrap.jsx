export default function PageWrap({ children, className = "" }) {
  return (
    <div className={`min-h-[100dvh] ${className}`}>
      {children}
    </div>
  );
}
