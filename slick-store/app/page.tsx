export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold text-center">
          Welcome to Slick Store
        </h1>
      </div>
      
      <div className="relative flex place-items-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Your Modern E-commerce Solution
          </h2>
          <p className="text-lg text-gray-600">
            Built with Next.js, TypeScript, and Tailwind CSS
          </p>
        </div>
      </div>
    </main>
  )
}
