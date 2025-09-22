export default function Footer() {
  return (
    <footer className="bg-content1 border-t border-divider py-3">
      <div className="container mx-auto text-center text-small text-default-500">
        Silksong Dialogue Subtitle Editor &copy; {new Date().getFullYear()}
      </div>
    </footer>
  );
}
