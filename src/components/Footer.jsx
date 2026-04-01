export default function Footer({ dark }) {
  return (
    <footer className={`py-6 text-center text-xs ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
      © {new Date().getFullYear()} Deluxe Holiday Homes™ · Dubai, UAE
    </footer>
  )
}
