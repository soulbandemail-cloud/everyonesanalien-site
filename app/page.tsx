export default function Home() {
  return (
    <main className="min-h-screen bg-black text-green-400 p-8 max-w-xl mx-auto">

      <div className="mb-16">
        <h1 className="text-6xl font-bold">SOUL</h1>

        <p className="mt-2 text-sm tracking-widest">
          EVERYONESANALIEN.COM
        </p>
      </div>

      <section className="mb-16">
        <h2 className="text-2xl mb-4">BECOME A MATE</h2>

        <p className="mb-4">GET YOUR HYPER-FIX!</p>

        <ul className="mb-6 space-y-2">
          <li>1. Free entry to Soul shows*</li>
          <li>2. Discounts on merch and records</li>
          <li>3. Monthly mailing list</li>
        </ul>

        <div className="flex flex-col gap-3 max-w-md">
          <input
            type="text"
            placeholder="NAME"
            className="border border-green-400 bg-black p-2"
          />

          <input
            type="email"
            placeholder="EMAIL"
            className="border border-green-400 bg-black p-2"
          />

          <button className="border border-green-400 p-2">
            SIGN UP
          </button>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl mb-4">UPCOMING SHOWS</h2>

        <ul className="space-y-2">
          <li>LONDON</li>
          <li>BRIGHTON</li>
          <li>MANCHESTER</li>
        </ul>

        <p className="mt-4">FREE FOR MATES.</p>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl mb-4">MERCH</h2>

        <p>COMING SOON</p>
      </section>

      <footer className="border-t border-green-400 pt-6">
        <div className="flex flex-wrap gap-6">
          <a href="#">Instagram</a>
          <a href="#">Spotify</a>
          <a href="#">TikTok</a>
          <a href="#">YouTube</a>
        </div>
      </footer>

    </main>
  );
}