import { AcademyLogo } from '@/components/icons';
import Link from 'next/link';

export default function ContactUsPage() {
  return (
    <div className="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Header */}
      <header className="w-full max-w-md mb-8 flex flex-col items-center justify-center text-center">
        <div className="mb-4 flex items-center justify-center">
          <AcademyLogo className="w-20 h-20" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Contact Support</h1>
        <p className="text-sm text-gray-600 mt-2">We're here to help. Send us a message.</p>
      </header>

      {/* Form Container */}
      <main className="w-full max-w-md mx-auto bg-white shadow-xl border border-black/10 rounded-2xl p-6 sm:p-10">
        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-900" htmlFor="name">Name</label>
            <input id="name" name="name" type="text" required placeholder="Your name" className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-900" htmlFor="email">Email Address</label>
            <input id="email" name="email" type="email" required placeholder="name@example.com" className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-900" htmlFor="message">Message</label>
            <textarea id="message" name="message" required placeholder="How can we help?" rows={4} className="w-full p-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none"></textarea>
          </div>
          
          <button type="submit" className="mt-4 w-full h-14 bg-black text-white rounded-xl font-semibold text-lg hover:opacity-90 hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center shadow-sm">
            Send Message
          </button>
        </form>
      </main>

      {/* Footer */}
      <footer className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Return to <Link href="/login" className="text-black font-semibold hover:underline">Log In</Link>
        </p>
      </footer>
    </div>
  );
}